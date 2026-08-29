const fs = require('fs');
let code = fs.readFileSync('src/store.ts', 'utf8');

const replacement = `
      switchPlan: async (planId) => {
        const state = get();
        if (!state.firebaseUser || state.activePlanId === planId) return;
        
        try {
          const { loadPlanData } = await import('./lib/db');
          const planData = await loadPlanData(state.firebaseUser.uid, planId);
          
          set({
            activePlanId: planId,
            v2Subjects: planData.subjects,
            v2Topics: planData.topics,
            v2Activities: planData.activities,
            sessions: planData.sessions.map((s: any) => ({
              id: s.id,
              subjectId: s.subjectId,
              topicId: s.topicId,
              subject: planData.subjects.find((sub: any) => sub.id === s.subjectId)?.name || '',
              topic: planData.topics.find((t: any) => t.id === s.topicId)?.name || '',
              activityType: s.activityType,
              source: s.source,
              durationSeconds: s.durationSeconds,
              questionsTotal: s.questionsTotal,
              questionsCorrect: s.questionsCorrect,
              errorReason: s.errorReason,
              date: s.date
            })),
            cycleQueue: []
          });
          
          get().syncCycleWithSubjects();
          get().recalculateRoute();
          
          import('./lib/db').then(({ saveUserConfig }) => {
            saveUserConfig(state.firebaseUser!.uid, { activePlanId: planId }).catch(console.error);
          });
          
        } catch (e) {
          console.error("Error switching plan:", e);
        }
      },
      
      createPlan: async (planData) => {
        const state = get();
        if (!state.firebaseUser) return;
        
        const newPlanId = 'plan_' + crypto.randomUUID().split('-')[0];
        const newPlan = {
          id: newPlanId,
          userId: state.firebaseUser.uid,
          name: planData.name,
          objective: planData.objective,
          examDate: planData.examDate,
          availableTimePerDay: planData.availableTimePerDay,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        try {
          const { savePlan, saveUserConfig } = await import('./lib/db');
          await savePlan(state.firebaseUser.uid, newPlan);
          await saveUserConfig(state.firebaseUser.uid, { activePlanId: newPlanId });
          
          set(state => ({
            plans: [...state.plans, newPlan],
            activePlanId: newPlanId,
            v2Subjects: [],
            v2Topics: [],
            v2Activities: [],
            sessions: [],
            cycleQueue: []
          }));
          
          get().syncCycleWithSubjects();
          get().recalculateRoute();
          
        } catch (e) {
          console.error("Error creating plan:", e);
        }
      },
`;

code = code.replace(/      switchPlan: async \(planId\) => \{[\s\S]*?console\.error\("Error switching plan:", e\);\n        \}\n      \},/, replacement);

const typesReplacement = `  switchPlan: (planId: string) => Promise<void>;
  createPlan: (planData: { name: string, objective: string, examDate: string, availableTimePerDay: Record<number, number> }) => Promise<void>;`;

code = code.replace(/  switchPlan: \(planId: string\) => Promise<void>;/, typesReplacement);

fs.writeFileSync('src/store.ts', code);

const fs = require('fs');
let content = fs.readFileSync('src/store.ts', 'utf-8');

const target = `createPlan: async (planData) => {
        const state = get();
        if (!state.firebaseUser) {
          throw new Error("Você precisa estar autenticado para criar um plano.");
        }
        const { doc, writeBatch } = await import('firebase/firestore');
        const { db } = await import('./lib/firebase');`;

const replacement = `createPlan: async (planData) => {
        const state = get();
        // Permite rodar no preview local mockando o userId se nulo
        const userId = state.firebaseUser?.uid || 'local_user';
        
        const newPlanId = 'plan_' + crypto.randomUUID().split('-')[0];
        
        const newPlan = {
          id: newPlanId,
          userId: userId,
          name: planData.name,
          type: (planData as any).type || 'concurso',
          objective: planData.objective,
          examDate: planData.examDate,
          availableTimePerDay: planData.availableTimePerDay,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const bridgedProfile = {
          objective: newPlan.objective,
          examName: newPlan.name,
          examDate: newPlan.examDate,
          availableTimePerDay: newPlan.availableTimePerDay,
          subjects: []
        };

        const weeklyGoalHours = Object.values(newPlan.availableTimePerDay).reduce((a, b) => (a as number) + (b as number), 0);

        // Handle initial subjects if provided
        const initialSubjects: any[] = [];
        const initialTopics: any[] = [];
        
        if (planData.initialSubjects && planData.initialSubjects.length > 0) {
          planData.initialSubjects.forEach((sub) => {
            const subjectId = 'sub_' + crypto.randomUUID().split('-')[0];
            const newSub = {
              id: subjectId,
              planId: newPlanId,
              name: sub.name,
              importance: sub.importance || 3,
              difficulty: sub.difficulty || 3,
              professor: sub.professor || null,
              semester: sub.semester || null,
              maxAbsences: sub.maxAbsences || null,
              currentAbsences: sub.currentAbsences || 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            initialSubjects.push(newSub);
            
            if (sub.topics && sub.topics.length > 0) {
              sub.topics.forEach((topicName: string) => {
                const topicId = 'topic_' + crypto.randomUUID().split('-')[0];
                const newTopic = {
                  id: topicId,
                  planId: newPlanId,
                  subjectId: subjectId,
                  name: topicName,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                };
                initialTopics.push(newTopic);
              });
            }
          });
        }

        if (state.firebaseUser) {
          try {
            const { doc, writeBatch } = await import('firebase/firestore');
            const { db } = await import('./lib/firebase');
            
            const batch = writeBatch(db);
            batch.set(doc(db, 'users', userId, 'plans', newPlanId), newPlan);
            batch.set(doc(db, 'users', userId), { 
              activePlanId: newPlanId,
              hasCompletedOnboarding: true,
              weeklyGoalHours: weeklyGoalHours
            }, { merge: true });
            
            initialSubjects.forEach(sub => {
              batch.set(doc(db, 'users', userId, 'plans', newPlanId, 'subjects', sub.id), sub);
            });
            
            initialTopics.forEach(topic => {
              batch.set(doc(db, 'users', userId, 'plans', newPlanId, 'topics', topic.id), topic);
            });
            
            await batch.commit();
          } catch(e) {
            console.error("Firebase falhou", e);
          }
        }

        set({
          plans: [...(state.plans || []), newPlan],
          activePlanId: newPlanId,
          v2Subjects: initialSubjects,
          v2Topics: initialTopics,
          v2Activities: [],
          sessions: [],
          cycleQueue: [],
          userProfile: bridgedProfile,
          weeklyGoalHours: weeklyGoalHours as number,
          hasCompletedOnboarding: true,
          activeTab: 'today'
        });
      },`;

const fullOriginal = content.substring(content.indexOf('createPlan: async (planData) => {'), content.indexOf('switchPlan: async (planId) => {'));

if (content.includes('createPlan: async (planData) => {') && fullOriginal) {
    content = content.replace(fullOriginal, replacement + '\n      ');
    fs.writeFileSync('src/store.ts', content);
    console.log("Patched store createPlan");
} else {
    console.log("Could not patch store");
}

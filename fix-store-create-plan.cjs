const fs = require('fs');
let code = fs.readFileSync('src/store.ts', 'utf8');

const replacement = `
      createPlan: async (planData) => {
        const state = get();
        if (!state.firebaseUser) {
          throw new Error("Você precisa estar autenticado para criar um plano.");
        }
        const { doc, writeBatch } = await import('firebase/firestore');
        const { db } = await import('./lib/firebase');

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

        const batch = writeBatch(db);
        batch.set(doc(db, 'users', state.firebaseUser.uid, 'plans', newPlanId), newPlan);
        batch.update(doc(db, 'users', state.firebaseUser.uid), { activePlanId: newPlanId });
        
        await batch.commit();

        const bridgedProfile = {
          objective: newPlan.objective,
          examName: newPlan.name,
          examDate: newPlan.examDate,
          availableTimePerDay: newPlan.availableTimePerDay,
          subjects: []
        };

        const weeklyGoalHours = Object.values(newPlan.availableTimePerDay).reduce((a, b) => a + b, 0);

        set({
          plans: [...(state.plans || []), newPlan],
          activePlanId: newPlanId,
          v2Subjects: [],
          v2Topics: [],
          v2Activities: [],
          sessions: [],
          cycleQueue: [],
          userProfile: bridgedProfile,
          weeklyGoalHours: weeklyGoalHours
        });
      },
`;

code = code.replace(/      createPlan: async \(\) => \{\},/, replacement.trim());

// Block 3: Fix switchPlan fallback
code = code.replace(/        \} catch \(error\) \{\n          console\.error\("Failed to switch plan:", error\);\n          \/\/ Fallback just state change\n          set\(\{ activePlanId: planId \}\);\n        \}/, `        } catch (error) {
          console.error("Failed to switch plan:", error);
          alert("Não foi possível carregar o plano. Verifique sua conexão e tente novamente.");
          throw error;
        }`);

fs.writeFileSync('src/store.ts', code);

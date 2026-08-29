const fs = require('fs');
let code = fs.readFileSync('src/store.ts', 'utf8');

const createPlanReplacement = `
        const weeklyGoalHours = Object.values(newPlan.availableTimePerDay).reduce((a, b) => a + b, 0);

        const batch = writeBatch(db);
        batch.set(doc(db, 'users', state.firebaseUser.uid, 'plans', newPlanId), newPlan);
        batch.set(doc(db, 'users', state.firebaseUser.uid), { 
          activePlanId: newPlanId,
          hasCompletedOnboarding: true,
          weeklyGoalHours: weeklyGoalHours
        }, { merge: true });
        
        await batch.commit();
`;

code = code.replace(/        const batch = writeBatch\(db\);\n        batch\.set\(doc\(db, 'users', state\.firebaseUser\.uid, 'plans', newPlanId\), newPlan\);\n        batch\.update\(doc\(db, 'users', state\.firebaseUser\.uid\), \{ activePlanId: newPlanId \}\);\n        \n        await batch\.commit\(\);\n\n        const bridgedProfile = \{\n          objective: newPlan\.objective,\n          examName: newPlan\.name,\n          examDate: newPlan\.examDate,\n          availableTimePerDay: newPlan\.availableTimePerDay,\n          subjects: \[\]\n        \};\n\n        const weeklyGoalHours = Object\.values\(newPlan\.availableTimePerDay\)\.reduce\(\(a, b\) => a \+ b, 0\);/,
`        const bridgedProfile = {
          objective: newPlan.objective,
          examName: newPlan.name,
          examDate: newPlan.examDate,
          availableTimePerDay: newPlan.availableTimePerDay,
          subjects: []
        };
${createPlanReplacement}`);

fs.writeFileSync('src/store.ts', code);

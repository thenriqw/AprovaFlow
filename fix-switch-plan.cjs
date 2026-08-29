const fs = require('fs');
let code = fs.readFileSync('src/store.ts', 'utf8');

const switchPlanReplacement = `
          // Update active plan in user doc
          const batch = writeBatch(db);
          const weeklyGoalHours = bridgedProfile ? Object.values(bridgedProfile.availableTimePerDay).reduce((a, b) => a + b, 0) : 0;
          batch.set(doc(db, 'users', state.firebaseUser.uid), { activePlanId: planId, weeklyGoalHours }, { merge: true });
          await batch.commit();

          set({
            activePlanId: planId,
            weeklyGoalHours,
`;

code = code.replace(/          \/\/ Update active plan in user doc\n          const batch = writeBatch\(db\);\n          batch\.update\(doc\(db, 'users', state\.firebaseUser\.uid\), \{ activePlanId: planId \}\);\n          await batch\.commit\(\);\n\n          set\(\{\n            activePlanId: planId,/, switchPlanReplacement.trim());

fs.writeFileSync('src/store.ts', code);

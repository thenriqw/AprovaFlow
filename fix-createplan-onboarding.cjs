const fs = require('fs');
let code = fs.readFileSync('src/store.ts', 'utf8');

code = code.replace(/          userProfile: bridgedProfile,\n          weeklyGoalHours: weeklyGoalHours\n        \}\);/, `          userProfile: bridgedProfile,
          weeklyGoalHours: weeklyGoalHours,
          hasCompletedOnboarding: true
        });`);

fs.writeFileSync('src/store.ts', code);

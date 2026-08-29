const fs = require('fs');
let code = fs.readFileSync('src/store.ts', 'utf8');

code = code.replace(/      switchPlan: async \(planId\) => \{/, "      createPlan: async () => {},\n      switchPlan: async (planId) => {");

fs.writeFileSync('src/store.ts', code);

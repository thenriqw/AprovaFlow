const fs = require('fs');
let code = fs.readFileSync('src/components/CreatePlan.tsx', 'utf8');

code = code.replace(/      useStore\.getState\(\)\.completeOnboarding\(\{[\s\S]*?subjects: \[\]\n      \}\);/, '');

fs.writeFileSync('src/components/CreatePlan.tsx', code);

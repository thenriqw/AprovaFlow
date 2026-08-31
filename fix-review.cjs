const fs = require('fs');
let code = fs.readFileSync('src/components/ReviewDialog.tsx', 'utf8');

code = code.replace(/if \(!user \|\| !activePlanId\) return;/g, 'if (!firebaseUser || !activePlanId) return;');
code = code.replace(/filteredJob, subjects, topics/g, 'filteredJob, v2Subjects, v2Topics');

fs.writeFileSync('src/components/ReviewDialog.tsx', code);

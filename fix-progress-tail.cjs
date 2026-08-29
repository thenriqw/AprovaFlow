const fs = require('fs');
let code = fs.readFileSync('src/components/Progress.tsx', 'utf8');

const lines = code.split('\n');
// We want to remove line 118 (index 117)
lines.splice(117, 1);

fs.writeFileSync('src/components/Progress.tsx', lines.join('\n'));

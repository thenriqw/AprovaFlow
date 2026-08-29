const fs = require('fs');
let code = fs.readFileSync('src/components/Today.tsx', 'utf8');

code = code.replace(/queueWithScores\.slice\(1, 4\)/g, 'queueWithScores.slice(0, 3)');

fs.writeFileSync('src/components/Today.tsx', code);

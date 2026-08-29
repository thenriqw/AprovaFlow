const fs = require('fs');
let code = fs.readFileSync('src/components/Today.tsx', 'utf8');
code = code.replace(/source: recommendedActivity\.title,/, "source: recommendedActivity.source,");
fs.writeFileSync('src/components/Today.tsx', code);

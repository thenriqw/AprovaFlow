const fs = require('fs');
let content = fs.readFileSync('src/store.ts', 'utf8');
content = content.replace(/date: string; \/\/ ISO string/, "date: string; // ISO string\n  activityId?: string;");
content = content.replace(/resource\?: Resource;/, "resource?: Resource;\n  activityId?: string;");
fs.writeFileSync('src/store.ts', content);

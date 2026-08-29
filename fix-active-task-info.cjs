const fs = require('fs');
let code = fs.readFileSync('src/store.ts', 'utf8');
code = code.replace(/interface ActiveTaskInfo \{\n  id\?: string;\n  subject: string;/, "interface ActiveTaskInfo {\n  id?: string;\n  activityId?: string;\n  subject: string;");
fs.writeFileSync('src/store.ts', code);

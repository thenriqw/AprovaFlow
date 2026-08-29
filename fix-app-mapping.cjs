const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/subject: planFullData\.subjects\.find\(sub => sub\.id === s\.subjectId\)\?\.name \|\| '',/g, "activityId: s.activityId,\n                    subject: planFullData.subjects.find(sub => sub.id === s.subjectId)?.name || '',");
// Fix formatting if double replaced
code = code.replace(/activityId: s\.activityId,\n\s*activityId: s\.activityId,/g, "activityId: s.activityId,");
fs.writeFileSync('src/App.tsx', code);

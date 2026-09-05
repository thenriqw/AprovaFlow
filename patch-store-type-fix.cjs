const fs = require('fs');
let content = fs.readFileSync('src/store.ts', 'utf-8');

// There might be multiple definitions or we need to replace the `name: planData.name` type
const regex = /name: planData\.name,\n\s*type: planData\.type \|\| 'concurso'/g;
const repl = `name: planData.name,
          type: (planData as any).type || 'concurso'`;

content = content.replace(regex, repl);
fs.writeFileSync('src/store.ts', content);

const fs = require('fs');
let code = fs.readFileSync('src/store.ts', 'utf8');

code = code.replace(/name: 'Meu Plano Principal',/, "name: profile.examName || 'Meu Plano Principal',");

fs.writeFileSync('src/store.ts', code);

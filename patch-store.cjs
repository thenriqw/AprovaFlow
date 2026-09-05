const fs = require('fs');

let content = fs.readFileSync('src/store.ts', 'utf-8');

content = content.replace(
  "userId: state.firebaseUser.uid,\n          name: planData.name,",
  "userId: state.firebaseUser.uid,\n          name: planData.name,\n          type: planData.type || 'concurso',"
);

fs.writeFileSync('src/store.ts', content);

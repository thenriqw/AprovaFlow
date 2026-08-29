const fs = require('fs');
let code = fs.readFileSync('src/store.ts', 'utf8');
code = code.replace(/savePlanDocument\(state\.firebaseUser\.uid, state\.activePlanId, 'activities', updated\)/, "savePlanDocument(state.firebaseUser!.uid, state.activePlanId!, 'activities', updated)");
fs.writeFileSync('src/store.ts', code);

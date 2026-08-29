const fs = require('fs');
let code = fs.readFileSync('src/lib/firebase.ts', 'utf8');

code = code.replace(
  /export const db = initializeFirestore\(app, \{\n  localCache: persistentLocalCache\(\{ tabManager: persistentMultipleTabManager\(\) \}\)\n\}\);/,
  `export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
}, firebaseConfig.firestoreDatabaseId);`
);

fs.writeFileSync('src/lib/firebase.ts', code);

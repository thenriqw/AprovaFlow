const fs = require('fs');

let content = fs.readFileSync('src/lib/firebase.ts', 'utf-8');

const target = `export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
}, (firebaseConfig as any).firestoreDatabaseId);`;

const replacement = `export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  experimentalForceLongPolling: true
}, (firebaseConfig as any).firestoreDatabaseId);`;

if (content.includes('experimentalForceLongPolling')) {
  console.log("Already has experimentalForceLongPolling");
} else if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('src/lib/firebase.ts', content);
  console.log("Patched firebase.ts successfully");
} else {
  console.log("Target not found");
}

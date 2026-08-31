const fs = require('fs');

let content = fs.readFileSync('src/lib/db.ts', 'utf-8');

if (!content.includes('const sanitizeForFirestore')) {
  const sanitizeHelper = `
const sanitizeForFirestore = (data: any) => JSON.parse(JSON.stringify(data));
`;
  content = content.replace('export const saveUserConfig', sanitizeHelper + '\nexport const saveUserConfig');
  
  content = content.replace('await setDoc(userRef, data, { merge: true });', 'await setDoc(userRef, sanitizeForFirestore(data), { merge: true });');
  content = content.replace('await setDoc(ref, item);', 'await setDoc(ref, sanitizeForFirestore(item));');
  content = content.replace('await setDoc(planRef, plan);', 'await setDoc(planRef, sanitizeForFirestore(plan));');
  content = content.replace("await setDoc(userRef, { baseData: data }, { merge: true });", "await setDoc(userRef, { baseData: sanitizeForFirestore(data) }, { merge: true });");
  content = content.replace('await setDoc(sessionRef, session);', 'await setDoc(sessionRef, sanitizeForFirestore(session));');
  
  fs.writeFileSync('src/lib/db.ts', content);
}

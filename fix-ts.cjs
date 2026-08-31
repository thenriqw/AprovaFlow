const fs = require('fs');

// Fix Inbox.tsx
let inbox = fs.readFileSync('src/components/Inbox.tsx', 'utf8');
inbox = inbox.replace(/user/g, 'firebaseUser');
inbox = inbox.replace(/firebaseUserUid/g, 'userUid'); // Avoid double replacing in case
inbox = inbox.replace(/const \{ imports, firebaseUser \} = useStore\(\);/, 'const { imports, firebaseUser } = useStore();');
inbox = inbox.replace(/firebaseUser\.uid/g, 'firebaseUser.uid');
inbox = inbox.replace(/sourceType: 'file'/g, "sourceType: 'text'"); // Just default to text for now
inbox = inbox.replace(/job\.sourceType === 'file'/g, "job.sourceType === 'pdf'"); 
fs.writeFileSync('src/components/Inbox.tsx', inbox);

// Fix ReviewDialog.tsx
let review = fs.readFileSync('src/components/ReviewDialog.tsx', 'utf8');
review = review.replace(/currentPlanId, subjects, topics, user/g, 'activePlanId, v2Subjects, v2Topics, firebaseUser');
review = review.replace(/subjects\.find/g, 'v2Subjects.find');
review = review.replace(/topics\.find/g, 'v2Topics.find');
review = review.replace(/user\.uid/g, 'firebaseUser.uid');
review = review.replace(/currentPlanId/g, 'activePlanId');
fs.writeFileSync('src/components/ReviewDialog.tsx', review);

// Fix store.ts (imports missing in initial state)
let store = fs.readFileSync('src/store.ts', 'utf8');
// Find the persist block
store = store.replace(
  /isSyncingFromDb: false,/,
  `isSyncingFromDb: false,\n      imports: [],`
);
fs.writeFileSync('src/store.ts', store);


const fs = require('fs');
let code = fs.readFileSync('src/store.ts', 'utf8');

const subjectDelete = `
      deleteV2Subject: (id) => set(state => {
        const v2Subjects = state.v2Subjects.filter(s => s.id !== id);
        const relatedTopics = state.v2Topics.filter(t => t.subjectId === id);
        const v2Topics = state.v2Topics.filter(t => t.subjectId !== id);
        const v2Activities = state.v2Activities.filter(a => a.subjectId !== id);
        const cycleQueue = state.cycleQueue.filter(c => c.subjectId !== id);

        if (state.firebaseUser && state.activePlanId) {
          import('./lib/db').then(async ({ deletePlanDocument }) => {
            const uid = state.firebaseUser.uid;
            const pid = state.activePlanId;
            await deletePlanDocument(uid, pid, 'subjects', id);
            for (const t of relatedTopics) {
              await deletePlanDocument(uid, pid, 'topics', t.id);
            }
            const relatedActivities = state.v2Activities.filter(a => a.subjectId === id);
            for (const a of relatedActivities) {
              await deletePlanDocument(uid, pid, 'activities', a.id);
            }
          }).catch(console.error);
        }
        return { v2Subjects, v2Topics, v2Activities, cycleQueue };
      }),
`;

code = code.replace(/      deleteV2Subject: \(id\) => set\(state => \{\n        const v2Subjects = state\.v2Subjects\.filter\(s => s\.id !== id\);\n        if \(state\.firebaseUser && state\.activePlanId\) \{\n          import\('\.\/lib\/db'\)\.then\(\(\{ deletePlanDocument \}\) => \n            deletePlanDocument\(state\.firebaseUser!\.uid, state\.activePlanId!, 'subjects', id\)\n          \)\.catch\(console\.error\);\n        \}\n        return \{ v2Subjects \};\n      \}\),/, subjectDelete.trim());


const topicDelete = `
      deleteV2Topic: (id) => set(state => {
        const v2Topics = state.v2Topics.filter(t => t.id !== id);
        const v2Activities = state.v2Activities.filter(a => a.topicId !== id);
        const cycleQueue = state.cycleQueue.filter(c => c.topicId !== id);

        if (state.firebaseUser && state.activePlanId) {
          import('./lib/db').then(async ({ deletePlanDocument }) => {
            const uid = state.firebaseUser.uid;
            const pid = state.activePlanId;
            await deletePlanDocument(uid, pid, 'topics', id);
            const relatedActivities = state.v2Activities.filter(a => a.topicId === id);
            for (const a of relatedActivities) {
              await deletePlanDocument(uid, pid, 'activities', a.id);
            }
          }).catch(console.error);
        }
        return { v2Topics, v2Activities, cycleQueue };
      }),
`;

code = code.replace(/      deleteV2Topic: \(id\) => set\(state => \{\n        const v2Topics = state\.v2Topics\.filter\(t => t\.id !== id\);\n        if \(state\.firebaseUser && state\.activePlanId\) \{\n          import\('\.\/lib\/db'\)\.then\(\(\{ deletePlanDocument \}\) => \n            deletePlanDocument\(state\.firebaseUser!\.uid, state\.activePlanId!, 'topics', id\)\n          \)\.catch\(console\.error\);\n        \}\n        return \{ v2Topics \};\n      \}\),/, topicDelete.trim());

fs.writeFileSync('src/store.ts', code);

const fs = require('fs');
let code = fs.readFileSync('src/store.ts', 'utf8');

// 1. Fix addSession
const addSessionReplacement = `
      addSession: (session) => set((state) => {
        const newSession = { ...session, id: crypto.randomUUID(), date: new Date().toISOString() };
        let newActivities = state.v2Activities || [];
        if (session.activityId) {
          newActivities = newActivities.map(a => {
            if (a.id === session.activityId) {
              const updated = { ...a, status: 'completed' as const, updatedAt: new Date().toISOString() };
              
              if (state.firebaseUser && state.activePlanId) {
                import('./lib/db').then(({ savePlanDocument }) => 
                  savePlanDocument(state.firebaseUser.uid, state.activePlanId, 'activities', updated)
                ).catch(console.error);
              }
              
              return updated;
            }
            return a;
          });
        }
        return {
          sessions: [...state.sessions, newSession],
          v2Activities: newActivities
        };
      }),
`;
code = code.replace(/      addSession: \(session\) => set\(\(state\) => \{[\s\S]*?return \{\n          sessions: \[\.\.\.state\.sessions, newSession\],\n          v2Activities: newActivities\n        \};\n      \}\),/, addSessionReplacement.trim());

// 2. Fix switchPlan sessions mapping
code = code.replace(/subject: planFullData\.subjects\.find\(sub => sub\.id === s\.subjectId\)\?\.name \|\| '',/g, "activityId: s.activityId,\n              subject: planFullData.subjects.find(sub => sub.id === s.subjectId)?.name || '',");

// 3. Fix deleteV2Topic
const deleteTopicReplacement = `
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
code = code.replace(/      deleteV2Topic: \(id\) => set\(state => \{\n        const v2Topics = state\.v2Topics\.filter\(t => t\.id !== id\);\n        if \(state\.firebaseUser && state\.activePlanId\) \{\n          import\('\.\/lib\/db'\)\.then\(\(\{ deletePlanDocument \}\) => \n            deletePlanDocument\(state\.firebaseUser\.uid, state\.activePlanId, 'topics', id\)\n          \)\.catch\(console\.error\);\n        \}\n        return \{ v2Topics \};\n      \}\),/, deleteTopicReplacement.trim());

fs.writeFileSync('src/store.ts', code);

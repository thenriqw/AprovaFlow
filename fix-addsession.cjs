const fs = require('fs');
let code = fs.readFileSync('src/store.ts', 'utf8');

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
                  savePlanDocument(state.firebaseUser!.uid, state.activePlanId!, 'activities', updated)
                ).catch((err) => console.error("Failed to persist completed StudyActivity:", err));
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

code = code.replace(/addSession: \(session\) => set\(\(state\) => \{[\s\S]*?v2Activities: newActivities\s*};\s*}\),/, addSessionReplacement.trim() + ',');

fs.writeFileSync('src/store.ts', code);

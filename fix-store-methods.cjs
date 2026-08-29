const fs = require('fs');
let code = fs.readFileSync('src/store.ts', 'utf8');

const addSessionReplacement = `
      addSession: (session) => set((state) => {
        const newSession = { ...session, id: crypto.randomUUID(), date: new Date().toISOString() };
        let newActivities = state.v2Activities || [];
        if (session.activityId) {
          newActivities = newActivities.map(a => 
            a.id === session.activityId ? { ...a, status: 'completed' } : a
          );
        }
        return {
          sessions: [...state.sessions, newSession],
          v2Activities: newActivities
        };
      }),
`;

code = code.replace(/      addSession: \(session\) => set\(\(state\) => \(\{\n        sessions: \[\n          \.\.\.state\.sessions,\n          \{ \.\.\.session, id: crypto\.randomUUID\(\), date: new Date\(\)\.toISOString\(\) \}\n        \]\n      \}\)\),/, addSessionReplacement.trim());

const completeCycleReplacement = `
      completeCycleItem: (id) => set((state) => {
        const itemToComplete = state.cycleQueue.find(i => i.id === id);
        if (!itemToComplete) return state;

        const hasMoreActivities = state.v2Activities?.some(a => 
          a.topicId === itemToComplete.topicId && a.status !== 'completed'
        );

        let newQueue;
        if (hasMoreActivities) {
          // Keep it in the queue for the next activity, move to back
          newQueue = state.cycleQueue.filter(i => i.id !== id);
          newQueue.push({ ...itemToComplete, status: 'pending' });
        } else {
          // Topic fully completed
          newQueue = state.cycleQueue.map(item => 
            (item.id === id) ? { ...item, status: 'done' } : item
          );
        }

        const nextPendingIdx = newQueue.findIndex(i => i.status === 'pending');
        if (nextPendingIdx !== -1 && !newQueue.some(i => i.status === 'next')) {
          newQueue[nextPendingIdx].status = 'next';
        }
        return { cycleQueue: newQueue };
      }),
`;

code = code.replace(/      completeCycleItem: \(id\) => set\(\(state\) => \{\n        const newQueue: CycleItem\[\] = state\.cycleQueue\.map\(item => \n          \(item\.id === id\) \n            \? \{ \.\.\.item, status: 'done' \} \n            : item\n        \);\n        const nextPendingIdx = newQueue\.findIndex\(i => i\.status === 'pending'\);\n        if \(nextPendingIdx !== -1 && !newQueue\.some\(i => i\.status === 'next'\)\) \{\n          newQueue\[nextPendingIdx\]\.status = 'next';\n        \}\n        return \{ cycleQueue: newQueue \};\n      \}\),/, completeCycleReplacement.trim());

fs.writeFileSync('src/store.ts', code);

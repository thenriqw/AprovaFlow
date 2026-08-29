const fs = require('fs');
let code = fs.readFileSync('src/store.ts', 'utf8');

const replacement = `
      syncCycleWithSubjects: () => set((state) => {
        // We only care about V2 now
        const activeSubjects = state.v2Subjects.filter(s => !s.isArchived);
        const validSubjectIds = new Set(activeSubjects.map(s => s.id));
        
        let newQueue = state.cycleQueue.filter(item => {
          if (item.status === 'done') return true;
          if (!item.subjectId || !validSubjectIds.has(item.subjectId)) return false;
          const topicExists = state.v2Topics.some(t => t.id === item.topicId);
          if (!topicExists) return false;
          return true;
        });
        
        const existingMap = new Set(newQueue.map(i => \`\${i.subjectId}-\${i.topicId}\`));
        
        activeSubjects.forEach(subject => {
          const topics = state.v2Topics.filter(t => t.subjectId === subject.id);
          
          topics.forEach(topic => {
            const key = \`\${subject.id}-\${topic.id}\`;
            if (!existingMap.has(key)) {
              newQueue.push({
                id: 'cq_' + crypto.randomUUID().split('-')[0],
                subjectId: subject.id,
                subject: subject.name,
                topicId: topic.id,
                topic: topic.name,
                weight: subject.importance || 3,
                status: 'pending'
              });
              existingMap.add(key);
            }
          });
        });
        
        // Ensure there's a next item
        const hasNext = newQueue.some(i => i.status === 'next');
        if (!hasNext) {
          const firstPending = newQueue.find(i => i.status === 'pending');
          if (firstPending) firstPending.status = 'next';
        }
        
        return { cycleQueue: newQueue };
      }),
`;

code = code.replace(/      syncCycleWithSubjects: \(\) => set\(\(state\) => \{[\s\S]*?return \{ cycleQueue: newQueue \};\n      \}\),/, replacement);

fs.writeFileSync('src/store.ts', code);

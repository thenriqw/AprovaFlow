const fs = require('fs');
let content = fs.readFileSync('src/store.ts', 'utf-8');

const importStr = `import { calculatePriorityScore } from './lib/priorityEngine';`;
const newImportStr = `import { calculatePriorityScore } from './lib/priorityEngine';
import { calculateNextReview } from './lib/srsEngine';`;

if(content.includes(importStr) && !content.includes('srsEngine')) {
    content = content.replace(importStr, newImportStr);
}

const addSessionStr = `addSession: (session) => set((state) => {
        const newSession = { ...session, id: crypto.randomUUID(), date: new Date().toISOString() };
        let newActivities = state.v2Activities || [];
        if (session.activityId) {
          newActivities = newActivities.map(a => {
            if (a.id === session.activityId) {
              const updated = { ...a, status: 'completed' as const, updatedAt: new Date().toISOString() };
              
              if (state.firebaseUser && state.activePlanId) {
                syncManager.enqueue(\`\${state.firebaseUser!.uid}/\${state.activePlanId!}/activities/\${updated.id}\`, async () => {
                  const { savePlanDocument } = await import('./lib/db');
                  await savePlanDocument(state.firebaseUser!.uid, state.activePlanId!, 'activities', updated);
                });
              }
              
              return updated;
            }
            return a;
          });
        }`;

const newAddSessionStr = `addSession: (session) => set((state) => {
        const newSession = { ...session, id: crypto.randomUUID(), date: new Date().toISOString() };
        let newActivities = state.v2Activities || [];
        
        if (session.activityId) {
          newActivities = newActivities.map(a => {
            if (a.id === session.activityId) {
              const updated = { ...a, status: 'completed' as const, updatedAt: new Date().toISOString() };
              
              if (state.firebaseUser && state.activePlanId) {
                syncManager.enqueue(\`\${state.firebaseUser!.uid}/\${state.activePlanId!}/activities/\${updated.id}\`, async () => {
                  const { savePlanDocument } = await import('./lib/db');
                  await savePlanDocument(state.firebaseUser!.uid, state.activePlanId!, 'activities', updated);
                });
              }
              
              return updated;
            }
            return a;
          });
        }
        
        // SRS: Generate next review if applicable
        if (state.activePlanId && session.subjectId && session.topicId && ['Videoaula', 'Leitura', 'Questões', 'Revisão'].includes(session.activityType)) {
           // Provide a default title based on session
           const topicName = session.topic || state.v2Topics?.find(t => t.id === session.topicId)?.name || 'Tópico';
           const newReviewActivity = calculateNextReview(
              session.subjectId,
              session.topicId,
              state.activePlanId,
              topicName,
              session.difficulty || 'medium',
              [...state.sessions, newSession]
           );
           
           if (newReviewActivity) {
              // check if we don't already have a pending review for this topic
              const hasPendingReview = newActivities.some(a => a.topicId === session.topicId && a.type === 'Revisão' && a.status === 'pending');
              if (!hasPendingReview) {
                  newActivities.push(newReviewActivity as any);
                  
                  if (state.firebaseUser && state.activePlanId) {
                    syncManager.enqueue(\`\${state.firebaseUser!.uid}/\${state.activePlanId!}/activities/\${newReviewActivity.id}\`, async () => {
                      const { savePlanDocument } = await import('./lib/db');
                      await savePlanDocument(state.firebaseUser!.uid, state.activePlanId!, 'activities', newReviewActivity);
                    });
                  }
              }
           }
        }`;

if(content.includes(addSessionStr)) {
    content = content.replace(addSessionStr, newAddSessionStr);
    fs.writeFileSync('src/store.ts', content);
    console.log("Patched store.ts for SRS successfully.");
} else {
    console.log("Failed to patch store.ts for SRS.");
}

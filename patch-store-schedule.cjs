const fs = require('fs');

let content = fs.readFileSync('src/store.ts', 'utf-8');

// We need to import generateWeeklySchedule at the top of the createPlan function
const targetImportStr = `const { doc, writeBatch } = await import('firebase/firestore');
            const { db } = await import('./lib/firebase');`;

const engineImport = `const { generateWeeklySchedule } = await import('./lib/scheduleEngine');`;

// Let's modify the place where activities are generated
// Inside createPlan, before if (state.firebaseUser)

const replacementLogic = `
        const { generateWeeklySchedule } = await import('./lib/scheduleEngine');
        const generatedActivities = generateWeeklySchedule(newPlan as any, initialSubjects, initialTopics);

        if (state.firebaseUser) {
          try {
            const { doc, writeBatch } = await import('firebase/firestore');
            const { db } = await import('./lib/firebase');
            
            const batch = writeBatch(db);
            batch.set(doc(db, 'users', userId, 'plans', newPlanId), newPlan);
            batch.set(doc(db, 'users', userId), { 
              activePlanId: newPlanId,
              hasCompletedOnboarding: true,
              weeklyGoalHours: weeklyGoalHours
            }, { merge: true });
            
            initialSubjects.forEach(sub => {
              batch.set(doc(db, 'users', userId, 'plans', newPlanId, 'subjects', sub.id), sub);
            });
            
            initialTopics.forEach(topic => {
              batch.set(doc(db, 'users', userId, 'plans', newPlanId, 'topics', topic.id), topic);
            });
            
            generatedActivities.forEach(act => {
              batch.set(doc(db, 'users', userId, 'plans', newPlanId, 'activities', act.id), act);
            });
            
            await batch.commit();
          } catch(e) {
            console.error("Firebase falhou", e);
          }
        }

        set({
          plans: [...(state.plans || []), newPlan],
          activePlanId: newPlanId,
          v2Subjects: initialSubjects,
          v2Topics: initialTopics,
          v2Activities: generatedActivities,
          sessions: [],
          cycleQueue: [],
          userProfile: bridgedProfile,
          weeklyGoalHours: weeklyGoalHours as number,
          hasCompletedOnboarding: true,
          activeTab: 'today'
        });
`;

const oldLogic = `if (state.firebaseUser) {
          try {
            const { doc, writeBatch } = await import('firebase/firestore');
            const { db } = await import('./lib/firebase');
            
            const batch = writeBatch(db);
            batch.set(doc(db, 'users', userId, 'plans', newPlanId), newPlan);
            batch.set(doc(db, 'users', userId), { 
              activePlanId: newPlanId,
              hasCompletedOnboarding: true,
              weeklyGoalHours: weeklyGoalHours
            }, { merge: true });
            
            initialSubjects.forEach(sub => {
              batch.set(doc(db, 'users', userId, 'plans', newPlanId, 'subjects', sub.id), sub);
            });
            
            initialTopics.forEach(topic => {
              batch.set(doc(db, 'users', userId, 'plans', newPlanId, 'topics', topic.id), topic);
            });
            
            await batch.commit();
          } catch(e) {
            console.error("Firebase falhou", e);
          }
        }

        set({
          plans: [...(state.plans || []), newPlan],
          activePlanId: newPlanId,
          v2Subjects: initialSubjects,
          v2Topics: initialTopics,
          v2Activities: [],
          sessions: [],
          cycleQueue: [],
          userProfile: bridgedProfile,
          weeklyGoalHours: weeklyGoalHours as number,
          hasCompletedOnboarding: true,
          activeTab: 'today'
        });`;

if (content.includes(oldLogic)) {
  content = content.replace(oldLogic, replacementLogic);
  fs.writeFileSync('src/store.ts', content);
  console.log("Patched store with scheduleEngine successfully.");
} else {
  console.log("Target not found in store.");
}


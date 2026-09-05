const fs = require('fs');

let content = fs.readFileSync('src/store.ts', 'utf-8');

const target = `        await batch.commit();

        set({
          plans: [...state.plans, newPlan as Plan],
          activePlanId: newPlanId,
          v2Subjects: [],
          v2Topics: [],
          activities: [],
          sessions: [],
          cycleQueue: [],
          weeklyGoalHours,
          hasCompletedOnboarding: true,
          userProfile: bridgedProfile as any
        });
      },`;

const replacement = `        // Handle initial subjects if provided
        const initialSubjects = [];
        if (planData.initialSubjects && planData.initialSubjects.length > 0) {
          planData.initialSubjects.forEach((sub) => {
            const subjectId = 'sub_' + crypto.randomUUID().split('-')[0];
            const newSub = {
              id: subjectId,
              planId: newPlanId,
              name: sub.name,
              importance: sub.importance || 3,
              difficulty: sub.difficulty || 3,
              professor: sub.professor,
              semester: sub.semester,
              maxAbsences: sub.maxAbsences,
              currentAbsences: sub.currentAbsences || 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            batch.set(doc(db, 'users', state.firebaseUser.uid, 'plans', newPlanId, 'subjects', subjectId), newSub);
            initialSubjects.push(newSub);
          });
        }

        await batch.commit();

        set({
          plans: [...state.plans, newPlan as Plan],
          activePlanId: newPlanId,
          v2Subjects: initialSubjects,
          v2Topics: [],
          activities: [],
          sessions: [],
          cycleQueue: [],
          weeklyGoalHours,
          hasCompletedOnboarding: true,
          userProfile: bridgedProfile as any
        });
      },`;

content = content.replace(target, replacement);

fs.writeFileSync('src/store.ts', content);

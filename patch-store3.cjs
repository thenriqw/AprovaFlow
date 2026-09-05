const fs = require('fs');
let content = fs.readFileSync('src/store.ts', 'utf-8');

const regex = /await batch\.commit\(\);\s*set\(\{\s*plans: \[\.\.\.\(state\.plans \|\| \[\]\), newPlan\],\s*activePlanId: newPlanId,\s*v2Subjects: \[\],/;

const replacement = `
        // Handle initial subjects if provided
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
              professor: sub.professor || null,
              semester: sub.semester || null,
              maxAbsences: sub.maxAbsences || null,
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
          plans: [...(state.plans || []), newPlan],
          activePlanId: newPlanId,
          v2Subjects: initialSubjects,
`;

if(regex.test(content)) {
  content = content.replace(regex, replacement.trim());
  fs.writeFileSync('src/store.ts', content);
  console.log("Patched successfully");
} else {
  console.log("Regex didn't match");
}

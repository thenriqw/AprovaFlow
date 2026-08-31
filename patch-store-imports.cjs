const fs = require('fs');
let code = fs.readFileSync('src/store.ts', 'utf8');

if (!code.includes('imports: ImportJob[]')) {
  // Add state definition
  code = code.replace(
    /interface AppState \{/,
    `import { ImportJob } from './domain/types';\n\ninterface AppState {\n  imports: ImportJob[];`
  );

  // Add initial state
  code = code.replace(
    /userConfig: \{[\s\S]*?\},/,
    `userConfig: { hasCompletedOnboarding: false, weeklyGoalHours: 25 },\n  imports: [],`
  );

  // Add sync hook for imports
  code = code.replace(
    /const plansQuery = query\(collection\(db, 'users', uid, 'plans'\)\);/,
    `const importsQuery = query(collection(db, 'imports'), where('userId', '==', uid));
          const unsubImports = onSnapshot(importsQuery, (snap) => {
            const importsData = snap.docs.map(d => d.data() as ImportJob);
            set({ imports: importsData.sort((a,b) => b.createdAt.localeCompare(a.createdAt)) });
          });\n          const plansQuery = query(collection(db, 'users', uid, 'plans'));`
  );

  // Add unsubImports
  code = code.replace(
    /unsubPlans\(\);/,
    `unsubImports();\n          unsubPlans();`
  );

  fs.writeFileSync('src/store.ts', code);
}

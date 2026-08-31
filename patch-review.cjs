const fs = require('fs');
let code = fs.readFileSync('src/components/ReviewDialog.tsx', 'utf8');

code = code.replace(
  /const \{ activePlanId, v2Subjects, v2Topics, firebaseUser \} = useStore\(\);/,
  `const { activePlanId, v2Subjects, v2Topics, firebaseUser, syncCycleWithSubjects } = useStore();`
);

code = code.replace(
  /await applyImportProposal.*?;\n\s*onClose\(\);/s,
  `await applyImportProposal(firebaseUser.uid, activePlanId, filteredJob, v2Subjects, v2Topics);
      syncCycleWithSubjects();
      onClose();`
);

fs.writeFileSync('src/components/ReviewDialog.tsx', code);

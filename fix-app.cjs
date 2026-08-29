const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/  if \(\!hasCompletedOnboarding\) \{\n    return <Onboarding \/>;\n  \}/, `  if (!hasCompletedOnboarding && activeTab !== 'create-plan') {
    return <Onboarding />;
  }`);

fs.writeFileSync('src/App.tsx', code);

const fs = require('fs');
let code = fs.readFileSync('src/components/Layout.tsx', 'utf8');

code = code.replace(/      \{\/\* Global FAB Mobile \*\/\}\n      <div className="md:hidden fixed bottom-20 right-4 z-50">\n        <div className="relative">/, 
`      {/* Global FAB Mobile */}
      {(!['settings', 'create-plan', 'onboarding'].includes(activeTab)) && (
      <div className="md:hidden fixed bottom-20 right-4 z-50">
        <div className="relative">`);

code = code.replace(/        <\/div>\n      <\/div>\n      \)\}/, '        </div>\n      </div>\n      )}');

fs.writeFileSync('src/components/Layout.tsx', code);

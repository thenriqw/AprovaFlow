const fs = require('fs');
let code = fs.readFileSync('src/components/Layout.tsx', 'utf8');

const replacement = `
      {/* Floating Action Button */}
      {(!['settings', 'create-plan', 'onboarding'].includes(activeTab)) && (
        <div className="md:hidden fixed bottom-20 right-4 z-50">
          <div className="relative">
`;

code = code.replace(/      \{\/\* Floating Action Button \*\/\}\n      <div className="md:hidden fixed bottom-20 right-4 z-50">\n        <div className="relative">/, replacement);

code = code.replace(/            <Plus size=\{24\} className=\{cn\("transition-transform duration-300", showFabMenu && "rotate-45"\)\} \/>\n          <\/button>\n        <\/div>\n      <\/div>/, '            <Plus size={24} className={cn("transition-transform duration-300", showFabMenu && "rotate-45")} />\n          </button>\n        </div>\n      </div>\n      )}');

fs.writeFileSync('src/components/Layout.tsx', code);

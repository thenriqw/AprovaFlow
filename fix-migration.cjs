const fs = require('fs');
let code = fs.readFileSync('src/store.ts', 'utf8');

const replacement = `
if (typeof window !== 'undefined') {
  try {
    if (!localStorage.getItem('efederal-storage')) {
      const aprovaflowStr = localStorage.getItem('aprovaflow-storage');
      if (aprovaflowStr) {
        localStorage.setItem('efederal-storage', aprovaflowStr);
      } else {
        const estudeiStr = localStorage.getItem('estudei-storage');
        if (estudeiStr) {
          localStorage.setItem('efederal-storage', estudeiStr);
        }
      }
    }
  } catch(e) {}
}
`;

code = code.replace(/if \(typeof window !== 'undefined'\) \{\n  try \{\n    const oldStorageStr = localStorage\.getItem\('estudei-storage'\);\n    if \(oldStorageStr && !localStorage\.getItem\('efederal-storage'\)\) \{\n       localStorage\.setItem\('efederal-storage', oldStorageStr\);\n    \}\n  \} catch\(e\) \{\}\n\}/, replacement.trim());

fs.writeFileSync('src/store.ts', code);

const fs = require('fs');

let content = fs.readFileSync('src/components/Today.tsx', 'utf-8');

const regex = /\{\/\* Secondary Modules \*\/\}/;

const replacement = `
      {activePlan?.type === 'academico' && (
        <AcademicTodayWidget />
      )}

      {/* Secondary Modules */}`;

if(regex.test(content) && !content.includes('<AcademicTodayWidget />')) {
  content = content.replace(regex, replacement.trim());
  fs.writeFileSync('src/components/Today.tsx', content);
  console.log("Patched Today.tsx successfully");
} else {
  console.log("Regex didn't match or already injected");
}

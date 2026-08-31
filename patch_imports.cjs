const fs = require('fs');

function patchFile(filename, oldImport, newImport) {
    let content = fs.readFileSync(filename, 'utf-8');
    content = content.replace(oldImport, newImport);
    fs.writeFileSync(filename, content);
}

// App.tsx
patchFile('src/App.tsx', 
    "import { isQaVisualEnabled, bootstrapQaVisualMode } from './qa/qaVisualAdapter';", 
    "import { isQaVisualEnabled } from './qa/qaFlags';\nimport { bootstrapQaVisualMode } from './qa/qaVisualAdapter';");

// Layout.tsx
patchFile('src/components/Layout.tsx', 
    "import { isQaVisualEnabled } from '../qa/qaVisualAdapter';", 
    "import { isQaVisualEnabled } from '../qa/qaFlags';");

// db.ts
patchFile('src/lib/db.ts', 
    "import { isQaVisualEnabled } from '../qa/qaVisualAdapter';", 
    "import { isQaVisualEnabled } from '../qa/qaFlags';");

// Add clearUserData protection to db.ts
let dbContent = fs.readFileSync('src/lib/db.ts', 'utf-8');
dbContent = dbContent.replace(
  "export const clearUserData = async (uid: string) => {",
  "export const clearUserData = async (uid: string) => {\n  if (isQaVisualEnabled()) return;"
);
fs.writeFileSync('src/lib/db.ts', dbContent);

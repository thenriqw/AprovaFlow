const fs = require('fs');

let content = fs.readFileSync('src/lib/migration.ts', 'utf-8');

const importStatement = "import { isQaVisualEnabled } from '../qa/qaFlags';\n";
if (!content.includes(importStatement)) {
    content = importStatement + content;
}

content = content.replace(
  "export const migrateLegacyToV2 = async (uid: string, legacyData: any) => {",
  "export const migrateLegacyToV2 = async (uid: string, legacyData: any) => {\n  if (isQaVisualEnabled()) return false;"
);

fs.writeFileSync('src/lib/migration.ts', content);

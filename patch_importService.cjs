const fs = require('fs');

let content = fs.readFileSync('src/lib/importService.ts', 'utf-8');

const importStatement = "import { isQaVisualEnabled } from '../qa/qaFlags';\n";
if (!content.includes(importStatement)) {
    content = importStatement + content;
}

content = content.replace(
  "export const createImportJob = async (uid: string, fileName: string, originalContent: string) => {",
  "export const createImportJob = async (uid: string, fileName: string, originalContent: string) => {\n  if (isQaVisualEnabled()) throw new Error('Importação desativada no QA Visual.');"
);

content = content.replace(
  "export const updateImportJob = async (jobId: string, updates: Partial<ImportJob>) => {",
  "export const updateImportJob = async (jobId: string, updates: Partial<ImportJob>) => {\n  if (isQaVisualEnabled()) return;"
);

fs.writeFileSync('src/lib/importService.ts', content);

const fs = require('fs');

let content = fs.readFileSync('src/lib/applyService.ts', 'utf-8');

const importStatement = "import { isQaVisualEnabled } from '../qa/qaFlags';\n";
if (!content.includes(importStatement)) {
    content = importStatement + content;
}

content = content.replace(
  "export const applyImportProposal = async (jobId: string, planId: string, selectedTasks: string[]) => {",
  "export const applyImportProposal = async (jobId: string, planId: string, selectedTasks: string[]) => {\n  if (isQaVisualEnabled()) throw new Error('Importação desativada no QA Visual.');"
);

fs.writeFileSync('src/lib/applyService.ts', content);

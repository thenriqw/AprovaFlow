const fs = require('fs');

let content = fs.readFileSync('src/qa/qaVisualAdapter.ts', 'utf-8');

// Remove the old inline function
content = content.replace(
/export const isQaVisualEnabled = \(\) => \{\n  return \(import.meta as any\).env.VITE_QA_VISUAL === 'true' &&\n         new URLSearchParams\(window.location.search\).get\('qaVisual'\) === '1';\n\};\n/g,
  ""
);

// Add the import
content = "import { isQaVisualEnabled } from './qaFlags';\n" + content;

// Fix sessions mapping
const sessionsReplacement = `  const sessions = dataset.sessions.map((s: any) => ({
    id: s.key.replace('_', '-'),
    subjectId: s.subjectKey.replace('_', '-'),
    topicId: s.topicKey.replace('_', '-'),
    subject: dataset.subjects.find((sub: any) => sub.key === s.subjectKey)?.name || 'Desconhecido',
    topic: dataset.topics.find((top: any) => top.key === s.topicKey)?.name || 'Desconhecido',
    activityId: s.activityKey ? s.activityKey.replace('_', '-') : null,
    activityType: s.activityType,
    date: s.date,
    durationSeconds: s.durationSeconds,
    questionsTotal: s.questionsTotal ?? 0,
    questionsCorrect: s.questionsCorrect ?? 0,
    errorReason: s.errorReason ?? '',
    planId
  }));`;

content = content.replace(/  const sessions = dataset\.sessions\.map\(\(s: any\) => \(\{\n[\s\S]*?    planId\n  \}\)\);/, sessionsReplacement);

// Add limitation comment
content = content.replace(
  "console.log('Bootstrapping QA Visual Mode...');",
  "console.log('Bootstrapping QA Visual Mode...');\n  // Known QA limitation:\n  // priority calculations use the runtime system clock.\n"
);

fs.writeFileSync('src/qa/qaVisualAdapter.ts', content);

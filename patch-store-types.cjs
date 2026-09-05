const fs = require('fs');

let content = fs.readFileSync('src/store.ts', 'utf-8');

const regex = /createPlan: \(planData: \{ name: string, objective: string, examDate: string, availableTimePerDay: Record<number, number> \}\) => Promise<void>;/;

const replacement = `createPlan: (planData: { name: string, objective: string, type?: 'concurso' | 'vestibular' | 'academico', examDate: string, availableTimePerDay: Record<number, number>, initialSubjects?: any[] }) => Promise<void>;`;

if(regex.test(content)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync('src/store.ts', content);
  console.log("Patched store.ts successfully");
} else {
  console.log("Regex didn't match");
}

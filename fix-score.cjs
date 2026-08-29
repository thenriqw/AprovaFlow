const fs = require('fs');
let code = fs.readFileSync('src/store.ts', 'utf8');

const replacement = `
export function calculatePriorityScore(item: CycleItem, state: AppState): { score: number, reasons: string[], duration?: number } {
  let score = 0;
  const reasons: string[] = [];
  
  if (item.status === 'next') {
    score += 1000;
  }
  
  // 1. Importance and Difficulty (from V2)
  const sub = state.v2Subjects.find(s => s.id === item.subjectId);
  if (sub) {
    score += sub.importance * 10;
    reasons.push(\`importância \${sub.importance}/5\`);
    if (sub.difficulty > 3) {
      score += 30;
      reasons.push('dificuldade alta');
    } else if (sub.difficulty === 3) {
      score += 15;
      reasons.push('dificuldade média');
    }
  }
  
  // 2. Base weight
  if (item.weight) {
    score += item.weight * 5;
  }
  
  // 3. Exam Proximity (if any)
  const activePlan = state.plans.find(p => p.id === state.activePlanId);
  let isCloseToExam = false;
  if (activePlan?.examDate) {
    const daysToExam = (new Date(activePlan.examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (daysToExam > 0 && daysToExam < 30) {
      isCloseToExam = true;
    }
  }
`;

code = code.replace(/export function calculatePriorityScore[\s\S]*?if \(daysToExam > 0 && daysToExam < 30\) \{\n      isCloseToExam = true;\n    \}\n  \}/, replacement);

fs.writeFileSync('src/store.ts', code);

const fs = require('fs');

let content = fs.readFileSync('src/domain/types.ts', 'utf-8');

// Update Plan
content = content.replace(
  "  name: string;\n  objective?: string;",
  "  name: string;\n  type?: 'concurso' | 'vestibular' | 'academico';\n  objective?: string;"
);

// Update Subject
const subjectTarget = `  importance: number; // e.g., 1-5
  difficulty: number; // e.g., 1-5
  isArchived?: boolean;`;

const subjectReplacement = `  importance: number; // e.g., 1-5
  difficulty: number; // e.g., 1-5
  isArchived?: boolean;
  professor?: string;
  semester?: string;
  maxAbsences?: number;
  currentAbsences?: number;
  classroomCourseId?: string;
  grades?: Array<{ name: string; weight: number; score?: number; maxScore: number }>;`;
content = content.replace(subjectTarget, subjectReplacement);

// Update Topic
const topicTarget = `  name: string;
  createdAt: string;`;

const topicReplacement = `  name: string;
  preAulaDone?: boolean;
  posAulaDone?: boolean;
  bibRef?: string;
  createdAt: string;`;
content = content.replace(topicTarget, topicReplacement);

fs.writeFileSync('src/domain/types.ts', content);

const fs = require('fs');
let code = fs.readFileSync('src/domain/types.ts', 'utf8');

code = code.replace(
  /export interface StudyInboxItem \{[\s\S]*?\}/,
  `export interface ActivityProposal {
  title: string;
  type?: ActivityType;
  source?: string;
  expectedDurationSeconds?: number;
  expectedQuestions?: number;
}

export interface TopicProposal {
  name: string;
  activities: ActivityProposal[];
}

export interface SubjectProposal {
  name: string;
  topics: TopicProposal[];
}

export interface ImportJob {
  id: string;
  userId: string;
  planId?: string;
  filename?: string;
  title: string;
  sourceType: 'text' | 'pdf' | 'docx' | 'xlsx' | 'csv' | 'catalog';
  status: 'queued' | 'extracting' | 'processing' | 'needs_review' | 'applying' | 'applied' | 'ignored' | 'failed' | 'partial';
  contentHash?: string;
  proposal?: {
    title: string;
    detectedType: string;
    subjects: SubjectProposal[];
    metadata?: any;
  };
  warnings: string[];
  error?: string;
  createdAt: string;
  updatedAt: string;
}`
);

fs.writeFileSync('src/domain/types.ts', code);

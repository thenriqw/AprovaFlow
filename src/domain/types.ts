export interface UserConfig {
  hasCompletedOnboarding: boolean;
  weeklyGoalHours: number;
}

export interface Plan {
  id: string;
  userId: string;
  name: string;
  objective?: string;
  examDate?: string;
  availableTimePerDay: Record<number, number>; // 0=Sunday, 6=Saturday
  syllabusId?: string; // Optional link to a template syllabus
  createdAt: string;
  updatedAt: string;
  // Configuration options for the plan
}

export interface Syllabus {
  id: string;
  name: string;
  description?: string;
  type: 'personal' | 'template'; // Represents a curriculum, could be a template or personal
  category?: 'ENEM' | 'Vestibular' | 'Concurso' | 'OAB' | 'Outro';
  institution?: string; // e.g., 'FUVEST', 'CESPE', 'INEP'
  year?: number;
  version: number;
  tags?: string[];
  isPublic: boolean;
  authorId?: string; // If created by a user
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: string;
  planId: string;
  name: string;
  importance: number; // e.g., 1-5
  difficulty: number; // e.g., 1-5
  isArchived?: boolean;
  syllabusSubjectId?: string; // Link to the original syllabus subject if applicable
  createdAt: string;
  updatedAt: string;
}

export interface Topic {
  planId?: string;
  id: string;
  subjectId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export type ActivityType = 'Videoaula' | 'Leitura' | 'Questões' | 'Revisão' | 'Simulado' | 'Redação' | 'Aula presencial' | 'Flashcards' | 'Outro';

export interface StudyActivity {
  id: string;
  planId: string;
  subjectId: string;
  topicId?: string;
  subtopicId?: string;
  type: ActivityType;
  title: string;
  source?: string; // e.g. "Aprova Total", "QConcursos"
  resourceId?: string;
  expectedDurationSeconds: number;
  expectedQuestions?: number;
  dueDate?: string;
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface Resource {
  id: string;
  planId: string;
  name: string;
  type: 'PDF' | 'Video' | 'Link' | 'Spreadsheet' | 'Document' | 'Other';
  source?: string;
  url?: string;
  pages?: number;
  nominalDuration?: number;
  createdAt: string;
  updatedAt: string;
}

export interface StudySession {
  id: string;
  planId: string;
  subjectId: string; // Keep for convenience and migration
  topicId?: string;
  activityId?: string; // Link to the activity that was done
  subjectName?: string; // Legacy
  topicName?: string; // Legacy
  date: string; // ISO string
  durationSeconds: number;
  performance?: {
    correct: number;
    total: number;
  };
  errorReasons?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Connection {
  id: string;
  provider: 'google_drive' | 'google_calendar' | 'google_sheets' | 'google_docs' | 'google_tasks';
  status: 'connected' | 'not_connected' | 'available';
  connectedAt?: string;
}

export interface ActivityProposal {
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
}
export interface UserConfig {
  hasCompletedOnboarding: boolean;
  weeklyGoalHours: number;
}

export interface Plan {
  id: string;
  userId: string;
  name: string;
  objective?: string;
  examDate?: string;
  availableTimePerDay: Record<number, number>; // 0=Sunday, 6=Saturday
  syllabusId?: string; // Optional link to a template syllabus
  createdAt: string;
  updatedAt: string;
  // Configuration options for the plan
}

export interface Syllabus {
  id: string;
  name: string;
  description?: string;
  type: 'personal' | 'template'; // Represents a curriculum, could be a template or personal
  category?: 'ENEM' | 'Vestibular' | 'Concurso' | 'OAB' | 'Outro';
  institution?: string; // e.g., 'FUVEST', 'CESPE', 'INEP'
  year?: number;
  version: number;
  tags?: string[];
  isPublic: boolean;
  authorId?: string; // If created by a user
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: string;
  planId: string;
  name: string;
  importance: number; // e.g., 1-5
  difficulty: number; // e.g., 1-5
  isArchived?: boolean;
  syllabusSubjectId?: string; // Link to the original syllabus subject if applicable
  createdAt: string;
  updatedAt: string;
}

export interface Topic {
  planId?: string;
  id: string;
  subjectId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export type ActivityType = 'Videoaula' | 'Leitura' | 'Questões' | 'Revisão' | 'Simulado' | 'Redação' | 'Aula presencial' | 'Flashcards' | 'Outro';

export interface StudyActivity {
  id: string;
  planId: string;
  subjectId: string;
  topicId?: string;
  subtopicId?: string;
  type: ActivityType;
  title: string;
  source?: string; // e.g. "Aprova Total", "QConcursos"
  resourceId?: string;
  expectedDurationSeconds: number;
  expectedQuestions?: number;
  dueDate?: string;
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface Resource {
  id: string;
  planId: string;
  name: string;
  type: 'PDF' | 'Video' | 'Link' | 'Spreadsheet' | 'Document' | 'Other';
  source?: string;
  url?: string;
  pages?: number;
  nominalDuration?: number;
  createdAt: string;
  updatedAt: string;
}

export interface StudySession {
  id: string;
  planId: string;
  subjectId: string; // Keep for convenience and migration
  topicId?: string;
  activityId?: string; // Link to the activity that was done
  subjectName?: string; // Legacy
  topicName?: string; // Legacy
  date: string; // ISO string
  durationSeconds: number;
  performance?: {
    correct: number;
    total: number;
  };
  errorReasons?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Connection {
  id: string;
  provider: 'google_drive' | 'google_calendar' | 'google_sheets' | 'google_docs' | 'google_tasks';
  status: 'connected' | 'not_connected' | 'available';
  connectedAt?: string;
}

export interface ActivityProposal {
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
}

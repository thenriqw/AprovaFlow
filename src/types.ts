export type ErrorReason = 
  | 'teoria' 
  | 'interpretacao' 
  | 'tempo' 
  | 'pegadinha' 
  | 'calculo' 
  | 'nenhum';

export type TopicStatus = 'pendente' | 'teoria' | 'resumo' | 'questoes' | 'revisado';

export interface Topic {
  id: string;
  title: string;
  estimatedHours: number;
  importance: 'ALTA' | 'MEDIA' | 'BAIXA';
  status: TopicStatus;
  notes?: string;
  completedAt?: string;
}

export interface Subject {
  id: string;
  name: string;
  weight: number; // 1 to 5
  color: string;
  category?: string;
  topics: Topic[];
}

export interface StudyLog {
  id: string;
  subjectId: string;
  subjectName: string;
  topicId?: string;
  topicTitle?: string;
  durationSeconds: number;
  questionsTotal: number;
  questionsCorrect: number;
  errorReason?: ErrorReason;
  notes?: string;
  timestamp: string; // ISO date
  mode: 'cronometro' | 'pomodoro' | 'manual';
  retested?: boolean;
}

export interface ErrorItem {
  id: string;
  logId: string;
  subjectName: string;
  topicTitle?: string;
  errorReason: ErrorReason;
  timestamp: string;
  notes?: string;
  retestDue: string; // ISO date for 7 or 14 days later
  retested: boolean;
  retestSuccess?: boolean;
}

export interface CycleItem {
  id: string;
  subjectId: string;
  subjectName: string;
  topicId: string;
  topicTitle: string;
  weight: number;
  color: string;
  estimatedMinutes: number;
  priorityScore: number;
  status: 'next' | 'queue' | 'done';
}

export interface Simulado {
  id: string;
  title: string;
  examBoard: string; // e.g. ENEM, FGV, Cebraspe, Vunesp, Fuvest
  date: string;
  totalQuestions: number;
  correctQuestions: number;
  timeSpentMinutes: number;
  essayScore?: number; // Redação 0-1000 or 0-100
  estimatedTRI?: number; // e.g. 785.4
  notes?: string;
}

export interface UserPreferences {
  targetExam: string;
  weeklyGoalHours: number;
  scheduledRestDays: number[]; // 0=Sunday, 6=Saturday
  pomodoroWorkMinutes: number;
  pomodoroBreakMinutes: number;
  soundEffects: boolean;
  theme: 'dark' | 'light';
  freezeDaysUsedThisWeek: number;
}

export interface FocusParticipant {
  id: string;
  name: string;
  avatar: string;
  target: string;
  minutesFocused: number;
  status: 'focado' | 'pausa';
}

export interface FocusRoom {
  id: string;
  name: string;
  description: string;
  category: 'Medicina & Vestibulares' | 'Concursos Públicos' | 'Direito & OAB' | 'Geral & Acadêmico';
  participantsCount: number;
  ambientType: 'rain' | 'whitenoise' | 'lofi' | 'library' | 'silence';
}

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { addDays, startOfWeek, format } from 'date-fns';
import type { User as FirebaseUser } from 'firebase/auth';

export type ErrorReason = 'teoria' | 'interpretacao' | 'tempo' | 'calculo' | 'atencao' | 'outro' | '';

export type ActivityType = 'Videoaula' | 'Aula presencial' | 'Teoria' | 'Apostila/Leitura' | 'Questões' | 'Revisão' | 'Simulado' | 'Redação' | 'Flashcards' | 'Estudo livre' | 'Outro';

export interface Resource {
  name: string;
  type: string;
  source?: string;
  url?: string;
  pages?: number;
}

export interface SubjectConfig {
  id: string;
  name: string;
  difficulty: 'low' | 'medium' | 'high';
  importance: number; // 1 to 5
  isArchived?: boolean;
  topics: TopicConfig[];
}

export interface TopicConfig {
  id: string;
  name: string;
}

export interface UserProfile {
  objective: string;
  examName: string;
  examDate: string;
  availableTimePerDay: Record<number, number>; // 0 = Sunday, 1 = Monday. Value is hours.
  subjects: SubjectConfig[];
}

export interface StudySession {
  id: string;
  subjectId?: string;
  topicId?: string;
  subject: string; // Keep as string for compatibility
  topic: string; // Optional or empty if none
  activityType?: ActivityType;
  source?: string;
  durationSeconds: number;
  questionsTotal: number;
  questionsCorrect: number;
  errorReason: ErrorReason;
  difficulty?: 'low' | 'medium' | 'high';
  observation?: string;
  date: string; // ISO string
}

export interface CycleItem {
  id: string;
  subjectId?: string;
  topicId?: string;
  subject: string;
  topic: string;
  activityType?: ActivityType;
  source?: string;
  resource?: Resource;
  expectedDurationSeconds?: number;
  weight: number; // For manual priority or calculated
  status: 'next' | 'pending' | 'done';
  recommendationReasons?: string[];
}

interface ActiveTaskInfo {
  subject: string;
  topic: string;
  subjectId?: string;
  topicId?: string;
  activityType?: ActivityType;
  source?: string;
  resource?: Resource;
  expectedDurationSeconds?: number;
}

interface AppState {
  firebaseUser: FirebaseUser | null;
  workspaceToken: string | null;
  needsAuth: boolean;
  authReady: boolean;
  setFirebaseUser: (user: FirebaseUser | null) => void;
  setWorkspaceToken: (token: string | null) => void;
  setNeedsAuth: (needsAuth: boolean) => void;
  setAuthReady: (authReady: boolean) => void;
  
  sessions: StudySession[];
  cycleQueue: CycleItem[];
  activeTask: ActiveTaskInfo | null;
  weeklyGoalHours: number;
  hasCompletedOnboarding: boolean;
  userProfile: UserProfile | null;
  addSession: (session: Omit<StudySession, 'id' | 'date'>) => void;
  removeSession: (id: string) => void;
  setCycleQueue: (queue: CycleItem[]) => void;
  recalculateRoute: () => void;
  syncCycleWithSubjects: () => void;
  setActiveTask: (task: ActiveTaskInfo | null) => void;
  completeCycleItem: (subject: string, topic: string) => void;
  setWeeklyGoalHours: (hours: number) => void;
  resetAllData: () => void;
  completeOnboarding: (profile: UserProfile) => void;
  skipOnboarding: () => void;
  updateUserProfile: (profile: UserProfile) => void;
  // Subject Management
  addSubject: (subject: Omit<SubjectConfig, 'id' | 'topics'>) => void;
  updateSubject: (id: string, updates: Partial<SubjectConfig>) => void;
  deleteSubject: (id: string) => void;
  archiveSubject: (id: string) => void;
  addTopic: (subjectId: string, topicName: string) => void;
  updateTopic: (subjectId: string, topicId: string, name: string) => void;
  deleteTopic: (subjectId: string, topicId: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

// Storage Migration
if (typeof window !== 'undefined') {
  try {
    const oldStorageStr = localStorage.getItem('estudei-storage');
    if (oldStorageStr && !localStorage.getItem('aprovaflow-storage')) {
       localStorage.setItem('aprovaflow-storage', oldStorageStr);
    }
  } catch(e) {}
}

// Pure function for priority score
export function calculatePriorityScore(item: CycleItem, state: AppState): { score: number, reasons: string[], duration?: number } {
  let score = 0;
  const reasons: string[] = [];
  
  // 1. Importance and Difficulty (from UserProfile)
  const sub = state.userProfile?.subjects?.find(s => s.id === item.subjectId || s.name === item.subject);
  if (sub) {
    score += sub.importance * 10;
    reasons.push(`importância ${sub.importance}/5`);
    if (sub.difficulty === 'high') {
      score += 30;
      reasons.push('dificuldade alta');
    } else if (sub.difficulty === 'medium') {
      score += 15;
      reasons.push('dificuldade média');
    }
  }
  
  // 2. Base weight
  if (item.weight) {
    score += item.weight * 5;
  }
  
  // 3. Exam Proximity (if any)
  if (state.userProfile?.examDate) {
    const daysToExam = (new Date(state.userProfile.examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (daysToExam > 0 && daysToExam < 30) {
      score += 30; // High boost if exam is very close
      reasons.push('prova próxima (menos de 30 dias)');
    } else if (daysToExam > 0 && daysToExam < 90) {
      score += 15;
    }
  }
  
  // 4. Session History (Performance & Time)
  const subjectSessions = state.sessions.filter(s => 
    (s.subjectId === item.subjectId || s.subject === item.subject) && 
    (s.topicId === item.topicId || s.topic === item.topic)
  );
  
  if (subjectSessions.length === 0) {
    score += 20;
    reasons.push('nunca estudado');
  } else {
    subjectSessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const lastSession = subjectSessions[0];
    
    // Proximity
    const daysSinceLastStudy = Math.floor((Date.now() - new Date(lastSession.date).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceLastStudy > 0) {
      score += Math.min(daysSinceLastStudy * 2, 40);
      reasons.push(`${daysSinceLastStudy} dias sem estudar`);
    }
    
    // Performance
    let totalQ = 0, totalC = 0;
    subjectSessions.slice(0, 5).forEach(s => {
      totalQ += s.questionsTotal || 0;
      totalC += s.questionsCorrect || 0;
    });
    if (totalQ > 0) {
      const accuracy = totalC / totalQ;
      if (accuracy < 0.6) {
        score += 25;
        reasons.push(`desempenho fraco (${Math.round(accuracy*100)}% de acertos)`);
      } else if (accuracy < 0.8) {
        score += 10;
        reasons.push(`revisão recomendada (${Math.round(accuracy*100)}% de acertos)`);
      }
    }
  }

  // Cap expected duration based on daily availability
  let duration = item.expectedDurationSeconds || (60 * 60); // Default 1 hour
  const todayDayOfWeek = new Date().getDay(); // 0 = Sunday
  const todayAvailabilityHours = state.userProfile?.availableTimePerDay?.[todayDayOfWeek];
  if (todayAvailabilityHours !== undefined && todayAvailabilityHours > 0) {
    const availableSeconds = todayAvailabilityHours * 60 * 60;
    if (duration > availableSeconds) {
      duration = availableSeconds; // Cap it
      reasons.push('ajustado à disponibilidade de hoje');
    }
  }
  
  return { score, reasons, duration };
}

const defaultCycle: CycleItem[] = [];

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      firebaseUser: null,
      workspaceToken: null,
      needsAuth: true,
      authReady: false,
      setFirebaseUser: (user) => set({ firebaseUser: user }),
      setWorkspaceToken: (token) => set({ workspaceToken: token }),
      setNeedsAuth: (needsAuth) => set({ needsAuth }),
      setAuthReady: (authReady) => set({ authReady }),
      
      sessions: [],
      cycleQueue: defaultCycle,
      activeTask: null,
      weeklyGoalHours: 25,
      hasCompletedOnboarding: false,
      userProfile: null,
      activeTab: 'dashboard',
      setActiveTab: (tab) => set({ activeTab: tab }),
      addSession: (session) => set((state) => ({
        sessions: [
          ...state.sessions,
          { ...session, id: crypto.randomUUID(), date: new Date().toISOString() }
        ]
      })),
      removeSession: (id) => set((state) => ({
        sessions: state.sessions.filter(s => s.id !== id)
      })),
      setCycleQueue: (queue) => set({ cycleQueue: queue }),
      recalculateRoute: () => set((state) => {
        const pending = state.cycleQueue.filter(item => item.status !== 'done');
        
        // Use external pure function
        const sorted = [...pending].map(item => {
          const res = calculatePriorityScore(item, state);
          return { ...item, score: res.score, recommendationReasons: res.reasons, expectedDurationSeconds: res.duration };
        }).sort((a, b) => (b.score || 0) - (a.score || 0));
        
        // Remove transient score field and set status
        const next: CycleItem[] = sorted.map((item, index) => {
          const { score, ...rest } = item;
          return {
            ...rest,
            status: index === 0 ? 'next' : 'pending'
          };
        });
        
        return { cycleQueue: [...state.cycleQueue.filter(i => i.status === 'done'), ...next] };
      }),
      syncCycleWithSubjects: () => set((state) => {
        if (!state.userProfile) return state;
        
        const newQueue = [...state.cycleQueue];
        const existingMap = new Set(newQueue.map(i => `${i.subjectId}-${i.topicId}`));
        
        // Remove deleted/archived subjects from pending
        const activeSubjects = state.userProfile.subjects.filter(s => !s.isArchived);
        const validSubjectIds = new Set(activeSubjects.map(s => s.id));
        
        for (let i = newQueue.length - 1; i >= 0; i--) {
          const item = newQueue[i];
          if (item.status === 'done') continue;
          
          if (item.subjectId && !validSubjectIds.has(item.subjectId)) {
            newQueue.splice(i, 1);
            continue;
          }
          
          const subject = activeSubjects.find(s => s.id === item.subjectId);
          if (subject && item.topicId) {
            const hasTopic = subject.topics.some(t => t.id === item.topicId);
            if (!hasTopic) {
              newQueue.splice(i, 1);
            }
          }
        }
        
        // Add new subjects/topics
        activeSubjects.forEach(subject => {
          if (subject.topics.length === 0) {
            const key = `${subject.id}-undefined`;
            if (!existingMap.has(key) && !newQueue.some(i => i.subjectId === subject.id && !i.topicId)) {
              newQueue.push({
                id: crypto.randomUUID(),
                subjectId: subject.id,
                subject: subject.name,
                topic: 'Geral', // Fallback for no topics
                weight: subject.importance,
                status: 'pending'
              });
            }
          } else {
            subject.topics.forEach(topic => {
              const key = `${subject.id}-${topic.id}`;
              if (!existingMap.has(key) && !newQueue.some(i => i.subjectId === subject.id && i.topicId === topic.id)) {
                newQueue.push({
                  id: crypto.randomUUID(),
                  subjectId: subject.id,
                  topicId: topic.id,
                  subject: subject.name,
                  topic: topic.name,
                  weight: subject.importance,
                  status: 'pending'
                });
              }
            });
          }
        });
        
        return { cycleQueue: newQueue };
      }),
      setActiveTask: (task) => set({ activeTask: task }),
      completeCycleItem: (subject, topic) => set((state) => {
        const newQueue: CycleItem[] = state.cycleQueue.map(item => 
          (item.subject === subject && item.topic === topic) 
            ? { ...item, status: 'done' } 
            : item
        );
        const nextPendingIdx = newQueue.findIndex(i => i.status === 'pending');
        if (nextPendingIdx !== -1 && !newQueue.some(i => i.status === 'next')) {
          newQueue[nextPendingIdx].status = 'next';
        }
        return { cycleQueue: newQueue };
      }),
      setWeeklyGoalHours: (hours) => set({ weeklyGoalHours: hours }),
      resetAllData: () => set({ sessions: [], cycleQueue: defaultCycle, activeTask: null, hasCompletedOnboarding: false, userProfile: null }),
      completeOnboarding: (profile) => set((state) => {
        // Build initial cycle instantly based on the subjects
        const initialQueue: CycleItem[] = [];
        profile.subjects.forEach(subject => {
          if (!subject.isArchived) {
            if (subject.topics.length === 0) {
              initialQueue.push({
                id: crypto.randomUUID(),
                subjectId: subject.id,
                subject: subject.name,
                topic: 'Geral',
                weight: subject.importance,
                status: 'pending'
              });
            } else {
              subject.topics.forEach(topic => {
                initialQueue.push({
                  id: crypto.randomUUID(),
                  subjectId: subject.id,
                  topicId: topic.id,
                  subject: subject.name,
                  topic: topic.name,
                  weight: subject.importance,
                  status: 'pending'
                });
              });
            }
          }
        });
        
        return { 
          hasCompletedOnboarding: true, 
          userProfile: profile, 
          cycleQueue: initialQueue,
          weeklyGoalHours: Object.values(profile.availableTimePerDay).reduce((a, b) => a + b, 0)
        };
      }),
      skipOnboarding: () => set({ hasCompletedOnboarding: true }),
      updateUserProfile: (profile) => set({ userProfile: profile, weeklyGoalHours: Object.values(profile.availableTimePerDay).reduce((a, b) => a + b, 0) }),
      
      addSubject: (subject) => set((state) => {
        if (!state.userProfile) return state;
        return {
          userProfile: {
            ...state.userProfile,
            subjects: [
              ...state.userProfile.subjects,
              { ...subject, id: crypto.randomUUID(), topics: [] }
            ]
          }
        };
      }),
      updateSubject: (id, updates) => set((state) => {
        if (!state.userProfile) return state;
        return {
          userProfile: {
            ...state.userProfile,
            subjects: state.userProfile.subjects.map(sub => 
              sub.id === id ? { ...sub, ...updates } : sub
            )
          }
        };
      }),
      deleteSubject: (id) => set((state) => {
        if (!state.userProfile) return state;
        return {
          userProfile: {
            ...state.userProfile,
            subjects: state.userProfile.subjects.filter(sub => sub.id !== id)
          }
        };
      }),
      archiveSubject: (id) => set((state) => {
        if (!state.userProfile) return state;
        return {
          userProfile: {
            ...state.userProfile,
            subjects: state.userProfile.subjects.map(sub => 
              sub.id === id ? { ...sub, isArchived: true } : sub
            )
          }
        };
      }),
      addTopic: (subjectId, topicName) => set((state) => {
        if (!state.userProfile) return state;
        return {
          userProfile: {
            ...state.userProfile,
            subjects: state.userProfile.subjects.map(sub => 
              sub.id === subjectId 
                ? { ...sub, topics: [...sub.topics, { id: crypto.randomUUID(), name: topicName }] }
                : sub
            )
          }
        };
      }),
      updateTopic: (subjectId, topicId, name) => set((state) => {
        if (!state.userProfile) return state;
        return {
          userProfile: {
            ...state.userProfile,
            subjects: state.userProfile.subjects.map(sub => 
              sub.id === subjectId 
                ? { ...sub, topics: sub.topics.map(t => t.id === topicId ? { ...t, name } : t) }
                : sub
            )
          }
        };
      }),
      deleteTopic: (subjectId, topicId) => set((state) => {
        if (!state.userProfile) return state;
        return {
          userProfile: {
            ...state.userProfile,
            subjects: state.userProfile.subjects.map(sub => 
              sub.id === subjectId 
                ? { ...sub, topics: sub.topics.filter(t => t.id !== topicId) }
                : sub
            )
          }
        };
      }),
    }),
    {
      name: 'aprovaflow-storage', // Migrated storage key
    }
  )
);

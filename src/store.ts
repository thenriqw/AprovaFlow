import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { addDays, startOfWeek, format } from 'date-fns';
import type { User as FirebaseUser } from 'firebase/auth';
import type { Plan, Subject, Topic, StudyActivity, Resource as DomainResource, StudySession as DomainSession } from './domain/types';

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
  authReady: boolean;
  dbLoaded: boolean;
  isSyncingFromDb: boolean;
  setFirebaseUser: (user: FirebaseUser | null) => void;
  setAuthReady: (authReady: boolean) => void;
  loadFromDb: (data: any) => void;
  setSyncingFromDb: (val: boolean) => void;
  
  // V2 Domain Architecture State
  plans: Plan[];
  activePlanId: string | null;
  v2Subjects: Subject[];
  v2Topics: Topic[];
  v2Activities: StudyActivity[];
  
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

// (Block removed from here, moving down)
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
  let isCloseToExam = false;
  if (state.userProfile?.examDate) {
    const daysToExam = (new Date(state.userProfile.examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (daysToExam > 0 && daysToExam < 30) {
      isCloseToExam = true;
    }
  }
  
  // 4. Session History (Performance & Time)
  const subjectSessions = state.sessions.filter(s => 
    (s.subjectId === item.subjectId || s.subject === item.subject) && 
    (s.topicId === item.topicId || s.topic === item.topic)
  );
  
  let isWeak = false;
  let isUnstudied = false;
  let isOverdue = false;

  if (subjectSessions.length === 0) {
    score += 20;
    isUnstudied = true;
    reasons.push('nunca estudado');
  } else {
    subjectSessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const lastSession = subjectSessions[0];
    
    // Proximity
    const daysSinceLastStudy = Math.floor((Date.now() - new Date(lastSession.date).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceLastStudy > 7) {
      isOverdue = true;
    }
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
        isWeak = true;
        reasons.push(`desempenho fraco (${Math.round(accuracy*100)}% de acertos)`);
      } else if (accuracy < 0.8) {
        score += 10;
        reasons.push(`revisão recomendada (${Math.round(accuracy*100)}% de acertos)`);
      }
    }
  }

  // Boost for exam proximity + high importance + (weak, unstudied, or overdue)
  if (isCloseToExam && sub && sub.importance >= 4) {
    if (isWeak || isUnstudied || isOverdue) {
      score += 40;
      reasons.push('urgência para a prova (alta importância pendente)');
    } else {
      score += 15; // Just close to exam but performing ok
    }
  }

  // Cap expected duration based on daily availability and what was studied today
  let duration = item.expectedDurationSeconds || (60 * 60); // Default 1 hour
  const todayDayOfWeek = new Date().getDay(); // 0 = Sunday
  const todayAvailabilityHours = state.userProfile?.availableTimePerDay?.[todayDayOfWeek];
  
  if (todayAvailabilityHours !== undefined && todayAvailabilityHours >= 0) {
    const todayStr = new Date().toISOString().split('T')[0];
    const studiedTodaySecs = state.sessions
      .filter(s => s.date.startsWith(todayStr))
      .reduce((acc, s) => acc + s.durationSeconds, 0);
      
    const availableSecondsToday = Math.max(0, (todayAvailabilityHours * 60 * 60) - studiedTodaySecs);
    
    if (availableSecondsToday === 0) {
      duration = 0;
      reasons.push('meta diária atingida ou folga (0h)');
    } else if (duration > availableSecondsToday) {
      duration = availableSecondsToday;
      reasons.push(`ajustado para ${Math.round(duration/60)}m (restante hoje)`);
    }
  }
  
  return { score, reasons, duration };
}

const defaultCycle: CycleItem[] = [];

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      firebaseUser: null,
      authReady: false,
      dbLoaded: false,
      isSyncingFromDb: false,
      setFirebaseUser: (user) => set({ firebaseUser: user }),
      setAuthReady: (authReady) => set({ authReady }),
      setSyncingFromDb: (val) => set({ isSyncingFromDb: val }),
      
      // V2
      plans: [],
      activePlanId: null,
      v2Subjects: [],
      v2Topics: [],
      v2Activities: [],
      
      loadFromDb: (data) => set((state) => {
        // Here we could inject the migration logic if we loaded legacy data
        // For now, just load what we have
        return {
          hasCompletedOnboarding: data.hasCompletedOnboarding ?? false,
          weeklyGoalHours: data.weeklyGoalHours ?? 25,
          userProfile: data.userProfile ?? null,
          cycleQueue: data.cycleQueue ?? [],
          activeTask: data.activeTask ?? null,
          sessions: data.sessions ?? [],
          plans: data.plans ?? [],
          activePlanId: data.activePlanId ?? null,
          v2Subjects: data.v2Subjects ?? [],
          v2Topics: data.v2Topics ?? [],
          v2Activities: data.v2Activities ?? [],
          dbLoaded: true,
        };
      }),
      
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
      version: 1,
      migrate: (persistedState: any, version: number) => {
        return persistedState;
      },
      partialize: (state) => {
        const { firebaseUser, authReady, dbLoaded, isSyncingFromDb, ...persistedState } = state;
        return persistedState;
      },
    }
  )
);

// Db Sync Logic
let saveTimeout: any = null;

useStore.subscribe((state, prevState) => {
  if (!state.firebaseUser || !state.dbLoaded || state.isSyncingFromDb) return;
  
  const baseDataChanged = 
    state.hasCompletedOnboarding !== prevState.hasCompletedOnboarding ||
    state.weeklyGoalHours !== prevState.weeklyGoalHours ||
    state.userProfile !== prevState.userProfile ||
    state.cycleQueue !== prevState.cycleQueue ||
    state.activeTask !== prevState.activeTask;
    
  if (baseDataChanged) {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
      try {
        const { saveUserBaseData } = await import('./lib/db');
        await saveUserBaseData(state.firebaseUser!.uid, {
          hasCompletedOnboarding: state.hasCompletedOnboarding,
          weeklyGoalHours: state.weeklyGoalHours,
          userProfile: state.userProfile,
          cycleQueue: state.cycleQueue,
          activeTask: state.activeTask,
        });
      } catch (e) {
        console.error("Failed to sync base data to DB", e);
      }
    }, 1000);
  }

  const sessionsChanged = state.sessions !== prevState.sessions;
  if (sessionsChanged) {
    const newSessions = state.sessions.filter(s => !prevState.sessions.find(p => p.id === s.id));
    const removedSessions = prevState.sessions.filter(s => !state.sessions.find(p => p.id === s.id));
    
    if (newSessions.length > 0 || removedSessions.length > 0) {
      import('./lib/db').then(({ saveSessionToDb, deleteSessionFromDb }) => {
        newSessions.forEach(s => saveSessionToDb(state.firebaseUser!.uid, s));
        removedSessions.forEach(s => deleteSessionFromDb(state.firebaseUser!.uid, s.id));
      }).catch(e => console.error("Failed to sync sessions to DB", e));
    }
  }
});

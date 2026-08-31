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
  activityId?: string;
}

export interface CycleItem {
  reasons?: string[];
  id: string;
  subjectId?: string;
  topicId?: string;
  subject: string;
  topic: string;
  activityType?: ActivityType;
  source?: string;
  resource?: Resource;
  activityId?: string;
  expectedDurationSeconds?: number;
  weight: number; // For manual priority or calculated
  status: 'next' | 'pending' | 'done';
  recommendationReasons?: string[];
}

interface ActiveTaskInfo {
  id?: string;
  activityId?: string;
  subject: string;
  topic: string;
  subjectId?: string;
  topicId?: string;
  activityType?: ActivityType;
  source?: string;
  resource?: Resource;
  expectedDurationSeconds?: number;
}

import { ImportJob } from './domain/types';

interface AppState {
  imports: ImportJob[];
  setImports: (imports: ImportJob[]) => void;
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
  refreshActivePlanData: () => Promise<void>;
  addV2Subject: (subject: Subject) => void;
  updateV2Subject: (subject: Subject) => void;
  deleteV2Subject: (id: string) => void;
  addV2Topic: (topic: Topic) => void;
  updateV2Topic: (topic: Topic) => void;
  deleteV2Topic: (id: string) => void;
  addV2Activity: (activity: StudyActivity) => void;
  updateV2Activity: (activity: StudyActivity) => void;
  deleteV2Activity: (id: string) => void;
  setActiveTask: (task: ActiveTaskInfo | null) => void;
  completeCycleItem: (id: string) => void;
  setWeeklyGoalHours: (hours: number) => void;
  resetAllData: () => void;
  completeOnboarding: (profile: UserProfile) => Promise<void> | void;
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
  setActivePlan: (planId: string) => void;
  switchPlan: (planId: string) => Promise<void>;
  createPlan: (planData: { name: string, objective: string, examDate: string, availableTimePerDay: Record<number, number> }) => Promise<void>;
}

// (Block removed from here, moving down)
if (typeof window !== 'undefined') {
  try {
    if (!localStorage.getItem('efederal-storage')) {
      const aprovaflowStr = localStorage.getItem('aprovaflow-storage');
      if (aprovaflowStr) {
        localStorage.setItem('efederal-storage', aprovaflowStr);
      } else {
        const estudeiStr = localStorage.getItem('estudei-storage');
        if (estudeiStr) {
          localStorage.setItem('efederal-storage', estudeiStr);
        }
      }
    }
  } catch(e) {}
}

// Pure function for priority score

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
    reasons.push(`importância ${sub.importance}/5`);
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
    (set, get) => ({
      firebaseUser: null,
      authReady: false,
      dbLoaded: false,
      isSyncingFromDb: false,
      imports: [],
      setImports: (imports) => set({ imports }),
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
          cycleQueue: [], // Force regenerate queue to be plan-specific
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
      activeTab: 'today',
      setActiveTab: (tab) => set({ activeTab: tab }),
      setActivePlan: (planId) => set({ activePlanId: planId }),
createPlan: async (planData) => {
        const state = get();
        if (!state.firebaseUser) {
          throw new Error("Você precisa estar autenticado para criar um plano.");
        }
        const { doc, writeBatch } = await import('firebase/firestore');
        const { db } = await import('./lib/firebase');

        const newPlanId = 'plan_' + crypto.randomUUID().split('-')[0];
        
        const newPlan = {
          id: newPlanId,
          userId: state.firebaseUser.uid,
          name: planData.name,
          objective: planData.objective,
          examDate: planData.examDate,
          availableTimePerDay: planData.availableTimePerDay,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const bridgedProfile = {
          objective: newPlan.objective,
          examName: newPlan.name,
          examDate: newPlan.examDate,
          availableTimePerDay: newPlan.availableTimePerDay,
          subjects: []
        };

        const weeklyGoalHours = Object.values(newPlan.availableTimePerDay).reduce((a, b) => a + b, 0);

        const batch = writeBatch(db);
        batch.set(doc(db, 'users', state.firebaseUser.uid, 'plans', newPlanId), newPlan);
        batch.set(doc(db, 'users', state.firebaseUser.uid), { 
          activePlanId: newPlanId,
          hasCompletedOnboarding: true,
          weeklyGoalHours: weeklyGoalHours
        }, { merge: true });
        
        await batch.commit();


        set({
          plans: [...(state.plans || []), newPlan],
          activePlanId: newPlanId,
          v2Subjects: [],
          v2Topics: [],
          v2Activities: [],
          sessions: [],
          cycleQueue: [],
          userProfile: bridgedProfile,
          weeklyGoalHours: weeklyGoalHours,
          hasCompletedOnboarding: true
        });
      },
      switchPlan: async (planId) => {
        const state = get();
        if (!state.firebaseUser) {
          set({ activePlanId: planId });
          return;
        }
        
        try {
          const { loadPlanData } = await import('./lib/db');
          const { doc, writeBatch } = await import('firebase/firestore');
          const { db } = await import('./lib/firebase');
          
          const planFullData = await loadPlanData(state.firebaseUser.uid, planId);
          const activePlan = state.plans.find(p => p.id === planId);
          
          const bridgedProfile = activePlan ? {
            objective: activePlan.objective, examName: "",
            examDate: activePlan.examDate,
            availableTimePerDay: activePlan.availableTimePerDay,
            subjects: planFullData.subjects.map(s => ({
              id: s.id,
              name: s.name,
              difficulty: (s.difficulty >= 4 ? 'high' : (s.difficulty >= 3 ? 'medium' : 'low')) as 'high' | 'medium' | 'low',
              importance: s.importance,
              isArchived: s.isArchived,
              topics: planFullData.topics.filter(t => t.subjectId === s.id).map(t => ({ id: t.id, name: t.name }))
            }))
          } : null;

// Update active plan in user doc
          const batch = writeBatch(db);
          const weeklyGoalHours = bridgedProfile ? Object.values(bridgedProfile.availableTimePerDay).reduce((a, b) => a + b, 0) : 0;
          batch.set(doc(db, 'users', state.firebaseUser.uid), { activePlanId: planId, weeklyGoalHours }, { merge: true });
          await batch.commit();

          set({
            activePlanId: planId,
            weeklyGoalHours,
            v2Subjects: planFullData.subjects,
            v2Topics: planFullData.topics,
            v2Activities: planFullData.activities,
            sessions: planFullData.sessions.map((s: any) => ({
              id: s.id,
              subjectId: s.subjectId,
              topicId: s.topicId,
              activityId: s.activityId,
              subject: planFullData.subjects.find(sub => sub.id === s.subjectId)?.name || '',
              topic: planFullData.topics.find(t => t.id === s.topicId)?.name || '',
              activityType: s.activityType,
              source: s.source,
              durationSeconds: s.durationSeconds,
              questionsTotal: s.questionsTotal || 0,
              questionsCorrect: s.questionsCorrect || 0,
              errorReason: s.errorReason || '',
              date: s.date
            })),
            ...(bridgedProfile ? { userProfile: bridgedProfile } : {}),
            cycleQueue: [] // Clear so syncCycle can rebuild it
          });
          
          state.syncCycleWithSubjects();
          state.recalculateRoute();
        } catch (error) {
          console.error("Failed to switch plan:", error);
          alert("Não foi possível carregar o plano. Verifique sua conexão e tente novamente.");
          throw error;
        }
      },
      refreshActivePlanData: async () => {
        const state = get();
        if (!state.firebaseUser || !state.activePlanId) return;
        
        try {
          const { loadPlanData } = await import('./lib/db');
          const planFullData = await loadPlanData(state.firebaseUser.uid, state.activePlanId);
          const activePlan = state.plans.find(p => p.id === state.activePlanId);
          
          const bridgedProfile = activePlan ? {
            objective: activePlan.objective, examName: "",
            examDate: activePlan.examDate,
            availableTimePerDay: activePlan.availableTimePerDay,
            subjects: planFullData.subjects.map(s => ({
              id: s.id,
              name: s.name,
              difficulty: (s.difficulty >= 4 ? 'high' : (s.difficulty >= 3 ? 'medium' : 'low')) as 'high' | 'medium' | 'low',
              importance: s.importance,
              isArchived: s.isArchived,
              topics: planFullData.topics.filter(t => t.subjectId === s.id).map(t => ({ id: t.id, name: t.name }))
            }))
          } : null;

          set({
            v2Subjects: planFullData.subjects,
            v2Topics: planFullData.topics,
            v2Activities: planFullData.activities,
            sessions: planFullData.sessions.map((s: any) => ({
              id: s.id,
              subjectId: s.subjectId,
              topicId: s.topicId,
              activityId: s.activityId,
              subject: planFullData.subjects.find(sub => sub.id === s.subjectId)?.name || '',
              topic: planFullData.topics.find(t => t.id === s.topicId)?.name || '',
              activityType: s.activityType,
              source: s.source,
              durationSeconds: s.durationSeconds,
              questionsTotal: s.questionsTotal || 0,
              questionsCorrect: s.questionsCorrect || 0,
              errorReason: s.errorReason || '',
              date: s.date
            })),
            ...(bridgedProfile ? { userProfile: bridgedProfile } : {}),
            cycleQueue: [] // Clear so syncCycle can rebuild it
          });
          
          // Rebuild everything using fresh state
          get().syncCycleWithSubjects();
          get().recalculateRoute();
        } catch (error) {
          console.error("Failed to refresh plan data:", error);
        }
      },
      addSession: (session) => set((state) => {
        const newSession = { ...session, id: crypto.randomUUID(), date: new Date().toISOString() };
        let newActivities = state.v2Activities || [];
        if (session.activityId) {
          newActivities = newActivities.map(a => {
            if (a.id === session.activityId) {
              const updated = { ...a, status: 'completed' as const, updatedAt: new Date().toISOString() };
              
              if (state.firebaseUser && state.activePlanId) {
                import('./lib/db').then(({ savePlanDocument }) => 
                  savePlanDocument(state.firebaseUser!.uid, state.activePlanId!, 'activities', updated)
                ).catch((err) => console.error("Failed to persist completed StudyActivity:", err));
              }
              
              return updated;
            }
            return a;
          });
        }
        return {
          sessions: [...state.sessions, newSession],
          v2Activities: newActivities
        };
      }),
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
        // We only care about V2 now
        const activeSubjects = state.v2Subjects.filter(s => !s.isArchived);
        const validSubjectIds = new Set(activeSubjects.map(s => s.id));
        
        let newQueue = state.cycleQueue.filter(item => {
          if (!item.subjectId || !validSubjectIds.has(item.subjectId)) return false;
          const topicExists = state.v2Topics.some(t => t.id === item.topicId);
          if (!topicExists) return false;
          return true;
        });
        
        const existingMap = new Set(newQueue.map(i => `${i.subjectId}-${i.topicId}`));
        
        activeSubjects.forEach(subject => {
          const topics = state.v2Topics.filter(t => t.subjectId === subject.id);
          
          topics.forEach(topic => {
            const key = `${subject.id}-${topic.id}`;
            if (!existingMap.has(key)) {
              newQueue.push({
                id: 'cq_' + crypto.randomUUID().split('-')[0],
                subjectId: subject.id,
                subject: subject.name,
                topicId: topic.id,
                topic: topic.name,
                weight: subject.importance || 3,
                status: 'pending'
              });
              existingMap.add(key);
            }
          });
        });
        
        // Ensure there's a next item
        const hasNext = newQueue.some(i => i.status === 'next');
        if (!hasNext) {
          const firstPending = newQueue.find(i => i.status === 'pending');
          if (firstPending) firstPending.status = 'next';
        }
        
        return { cycleQueue: newQueue };
      }),



      addV2Subject: (subject) => set(state => {
        const v2Subjects = [...state.v2Subjects, subject];
        if (state.firebaseUser && state.activePlanId) {
          import('./lib/db').then(({ savePlanDocument }) => 
            savePlanDocument(state.firebaseUser!.uid, state.activePlanId!, 'subjects', subject)
          ).catch(console.error);
        }
        return { v2Subjects };
      }),
      updateV2Subject: (subject) => set(state => {
        const v2Subjects = state.v2Subjects.map(s => s.id === subject.id ? subject : s);
        if (state.firebaseUser && state.activePlanId) {
          import('./lib/db').then(({ savePlanDocument }) => 
            savePlanDocument(state.firebaseUser!.uid, state.activePlanId!, 'subjects', subject)
          ).catch(console.error);
        }
        return { v2Subjects };
      }),
deleteV2Subject: (id) => set(state => {
        const v2Subjects = state.v2Subjects.filter(s => s.id !== id);
        const relatedTopics = state.v2Topics.filter(t => t.subjectId === id);
        const v2Topics = state.v2Topics.filter(t => t.subjectId !== id);
        const v2Activities = state.v2Activities.filter(a => a.subjectId !== id);
        const cycleQueue = state.cycleQueue.filter(c => c.subjectId !== id);

        if (state.firebaseUser && state.activePlanId) {
          import('./lib/db').then(async ({ deletePlanDocument }) => {
            const uid = state.firebaseUser.uid;
            const pid = state.activePlanId;
            await deletePlanDocument(uid, pid, 'subjects', id);
            for (const t of relatedTopics) {
              await deletePlanDocument(uid, pid, 'topics', t.id);
            }
            const relatedActivities = state.v2Activities.filter(a => a.subjectId === id);
            for (const a of relatedActivities) {
              await deletePlanDocument(uid, pid, 'activities', a.id);
            }
          }).catch(console.error);
        }
        return { v2Subjects, v2Topics, v2Activities, cycleQueue };
      }),
      addV2Topic: (topic) => set(state => {
        const v2Topics = [...state.v2Topics, topic];
        if (state.firebaseUser && state.activePlanId) {
          import('./lib/db').then(({ savePlanDocument }) => 
            savePlanDocument(state.firebaseUser!.uid, state.activePlanId!, 'topics', topic)
          ).catch(console.error);
        }
        return { v2Topics };
      }),
      updateV2Topic: (topic) => set(state => {
        const v2Topics = state.v2Topics.map(t => t.id === topic.id ? topic : t);
        if (state.firebaseUser && state.activePlanId) {
          import('./lib/db').then(({ savePlanDocument }) => 
            savePlanDocument(state.firebaseUser!.uid, state.activePlanId!, 'topics', topic)
          ).catch(console.error);
        }
        return { v2Topics };
      }),

deleteV2Topic: (id) => set(state => {
        const v2Topics = state.v2Topics.filter(t => t.id !== id);
        const v2Activities = state.v2Activities.filter(a => a.topicId !== id);
        const cycleQueue = state.cycleQueue.filter(c => c.topicId !== id);

        if (state.firebaseUser && state.activePlanId) {
          import('./lib/db').then(async ({ deletePlanDocument }) => {
            const uid = state.firebaseUser.uid;
            const pid = state.activePlanId;
            await deletePlanDocument(uid, pid, 'topics', id);
            const relatedActivities = state.v2Activities.filter(a => a.topicId === id);
            for (const a of relatedActivities) {
              await deletePlanDocument(uid, pid, 'activities', a.id);
            }
          }).catch(console.error);
        }
        return { v2Topics, v2Activities, cycleQueue };
      }),
      addV2Activity: (activity) => set(state => {
        const v2Activities = [...state.v2Activities, activity];
        if (state.firebaseUser && state.activePlanId) {
          import('./lib/db').then(({ savePlanDocument }) => 
            savePlanDocument(state.firebaseUser.uid, state.activePlanId, 'activities', activity)
          ).catch(console.error);
        }
        return { v2Activities };
      }),
      updateV2Activity: (activity) => set(state => {
        const v2Activities = state.v2Activities.map(a => a.id === activity.id ? activity : a);
        if (state.firebaseUser && state.activePlanId) {
          import('./lib/db').then(({ savePlanDocument }) => 
            savePlanDocument(state.firebaseUser.uid, state.activePlanId, 'activities', activity)
          ).catch(console.error);
        }
        return { v2Activities };
      }),
      deleteV2Activity: (id) => set(state => {
        const v2Activities = state.v2Activities.filter(a => a.id !== id);
        if (state.firebaseUser && state.activePlanId) {
          import('./lib/db').then(({ deletePlanDocument }) => 
            deletePlanDocument(state.firebaseUser.uid, state.activePlanId, 'activities', id)
          ).catch(console.error);
        }
        return { v2Activities };
      }),


      setActiveTask: (task) => set({ activeTask: task }),
completeCycleItem: (id) => set((state) => {
        const itemToComplete = state.cycleQueue.find(i => i.id === id);
        if (!itemToComplete) return state;

        const hasMoreActivities = state.v2Activities?.some(a => 
          a.topicId === itemToComplete.topicId && a.status !== 'completed'
        );

        let newQueue;
        if (hasMoreActivities) {
          // Keep it in the queue for the next activity, move to back
          newQueue = state.cycleQueue.filter(i => i.id !== id);
          newQueue.push({ ...itemToComplete, status: 'pending' });
        } else {
          // Topic fully completed
          newQueue = state.cycleQueue.map(item => 
            (item.id === id) ? { ...item, status: 'done' } : item
          );
        }

        const nextPendingIdx = newQueue.findIndex(i => i.status === 'pending');
        if (nextPendingIdx !== -1 && !newQueue.some(i => i.status === 'next')) {
          newQueue[nextPendingIdx].status = 'next';
        }
        return { cycleQueue: newQueue };
      }),
      setWeeklyGoalHours: (hours) => set({ weeklyGoalHours: hours }),
      resetAllData: () => set({ sessions: [], cycleQueue: defaultCycle, activeTask: null, hasCompletedOnboarding: false, userProfile: null }),
      completeOnboarding: async (profile) => {
        const state = useStore.getState();
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
        
        let newPlanId: string | null = null;
        let newPlanObj: Plan | null = null;
        let v2Subjects: Subject[] = [];
        let v2Topics: Topic[] = [];

        // If user is authenticated, create a V2 plan directly
        if (state.firebaseUser) {
          const uid = state.firebaseUser.uid;
          newPlanId = 'plan_' + crypto.randomUUID().split('-')[0];
          
          const newPlan: Plan = {
            id: newPlanId,
            userId: uid,
            name: profile.examName || 'Meu Plano Principal',
            objective: profile.objective || '',
            examDate: profile.examDate || '',
            availableTimePerDay: profile.availableTimePerDay || {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          newPlanObj = newPlan;

          profile.subjects.forEach(sub => {
            const newSub: Subject = {
              id: sub.id,
              planId: newPlanId!,
              name: sub.name,
              importance: sub.importance,
              difficulty: sub.difficulty === 'high' ? 5 : (sub.difficulty === 'medium' ? 3 : 1),
              isArchived: sub.isArchived || false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            v2Subjects.push(newSub);
            
            sub.topics.forEach(t => {
              v2Topics.push({
                id: t.id,
                subjectId: sub.id,
                name: t.name,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              });
            });
          });

          // Save everything to DB immediately via batch
          try {
            const { db } = await import('./lib/firebase');
            const { writeBatch, doc } = await import('firebase/firestore');
            
            const batch = writeBatch(db);
            batch.set(doc(db, 'users', uid, 'plans', newPlanId!), newPlan);
            v2Subjects.forEach(s => batch.set(doc(db, 'users', uid, 'plans', newPlanId!, 'subjects', s.id), s));
            v2Topics.forEach(t => batch.set(doc(db, 'users', uid, 'plans', newPlanId!, 'topics', t.id), t));
            
            const weeklyGoal = Object.values(profile.availableTimePerDay).reduce((a, b) => a + b, 0);
            batch.set(doc(db, 'users', uid), { 
              hasCompletedOnboarding: true,
              activePlanId: newPlanId,
              weeklyGoalHours: weeklyGoal
            }, { merge: true });
            
            await batch.commit();
          } catch (e) {
            console.error("Failed to persist onboarding data", e);
            throw new Error("Não foi possível salvar seu plano. Tente novamente.");
          }
        }
        
        set({ 
          hasCompletedOnboarding: true, 
          userProfile: profile, 
          cycleQueue: initialQueue,
          weeklyGoalHours: Object.values(profile.availableTimePerDay).reduce((a, b) => a + b, 0),
          ...(newPlanObj ? { activePlanId: newPlanId, plans: [newPlanObj], v2Subjects, v2Topics } : {})
        });
      },
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
      name: 'efederal-storage', // Migrated storage key
      version: 2,
      migrate: (persistedState: any, version: number) => {
        if (version === 1) {
          // Migrate V1 to V2
          persistedState.plans = persistedState.plans || [];
          persistedState.activePlanId = persistedState.activePlanId || null;
          persistedState.v2Subjects = persistedState.v2Subjects || [];
          persistedState.v2Topics = persistedState.v2Topics || [];
          persistedState.v2Activities = persistedState.v2Activities || [];
        }
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
    state.activeTask !== prevState.activeTask ||
    state.activePlanId !== prevState.activePlanId;
    
  if (baseDataChanged) {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
      try {
        const { saveUserConfig, saveLegacyUserBaseData } = await import('./lib/db');
        
        if (state.activePlanId) {
          // V2 user
          await saveUserConfig(state.firebaseUser!.uid, {
            hasCompletedOnboarding: state.hasCompletedOnboarding,
            activePlanId: state.activePlanId,
            weeklyGoalHours: state.weeklyGoalHours, // We can store this at config level or plan level
            cycleQueue: state.cycleQueue,
            activeTask: state.activeTask,
          });
          
          if (state.userProfile !== prevState.userProfile) {
            import('./lib/db').then(async ({ savePlanDocument, deletePlanDocument }) => {
              const uid = state.firebaseUser!.uid;
              const planId = state.activePlanId!;
              
              const prevSubs = prevState.userProfile?.subjects || [];
              const nextSubs = state.userProfile?.subjects || [];
              
              // Diff subjects
              for (const sub of nextSubs) {
                const prevSub = prevSubs.find(s => s.id === sub.id);
                if (!prevSub || JSON.stringify(prevSub) !== JSON.stringify(sub)) {
                  // Created or updated
                  await savePlanDocument(uid, planId, 'subjects', {
                    id: sub.id,
                    planId,
                    name: sub.name,
                    importance: sub.importance,
                    difficulty: sub.difficulty === 'high' ? 5 : (sub.difficulty === 'medium' ? 3 : 1),
                    isArchived: sub.isArchived || false,
                    createdAt: prevSub?.id ? new Date().toISOString() : new Date().toISOString(), // In a real app we'd fetch or preserve, but this satisfies types
                    updatedAt: new Date().toISOString(),
                  });
                  
                  // Diff topics for this subject
                  const prevTopics = prevSub?.topics || [];
                  for (const top of sub.topics) {
                    const prevTop = prevTopics.find(t => t.id === top.id);
                    if (!prevTop || prevTop.name !== top.name) {
                      await savePlanDocument(uid, planId, 'topics', {
                        id: top.id,
                        subjectId: sub.id,
                        name: top.name,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                      });
                    }
                  }
                  
                  // Deleted topics
                  for (const prevTop of prevTopics) {
                    if (!sub.topics.find(t => t.id === prevTop.id)) {
                      await deletePlanDocument(uid, planId, 'topics', prevTop.id);
                    }
                  }
                }
              }
              
              // Deleted subjects
              for (const prevSub of prevSubs) {
                if (!nextSubs.find(s => s.id === prevSub.id)) {
                  await deletePlanDocument(uid, planId, 'subjects', prevSub.id);
                  // Also delete topics theoretically (handled in DB rules/cascade usually, or manually)
                  for (const t of prevSub.topics) {
                    await deletePlanDocument(uid, planId, 'topics', t.id);
                  }
                }
              }
            });
          }
        } else {
          // Legacy user fallback
          await saveLegacyUserBaseData(state.firebaseUser!.uid, {
            hasCompletedOnboarding: state.hasCompletedOnboarding,
            weeklyGoalHours: state.weeklyGoalHours,
            userProfile: state.userProfile,
            cycleQueue: state.cycleQueue,
            activeTask: state.activeTask,
          });
        }
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
      import('./lib/db').then(async ({ saveLegacySessionToDb, savePlanDocument, deletePlanDocument }) => {
        if (state.activePlanId) {
          // V2
          for (const s of newSessions) {
            await savePlanDocument(state.firebaseUser!.uid, state.activePlanId, 'sessions', s);
          }
          for (const s of removedSessions) {
            await deletePlanDocument(state.firebaseUser!.uid, state.activePlanId, 'sessions', s.id);
          }
        } else {
          // Legacy
          for (const s of newSessions) {
            await saveLegacySessionToDb(state.firebaseUser!.uid, s);
          }
          // Assuming deleteLegacySessionFromDb exists or we skip for now
        }
      }).catch(e => console.error("Failed to sync sessions to DB", e));
    }
  }
});

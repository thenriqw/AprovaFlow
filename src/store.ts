import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { addDays, startOfWeek, format } from 'date-fns';

export type ErrorReason = 'teoria' | 'interpretacao' | 'tempo' | 'calculo' | 'atencao' | 'outro' | '';

export type ActivityType = 'Videoaula' | 'Aula presencial' | 'Teoria' | 'Apostila/Leitura' | 'Questões' | 'Revisão' | 'Simulado' | 'Redação' | 'Flashcards' | 'Estudo livre' | 'Outro';

export interface SubjectConfig {
  id: string;
  name: string;
  difficulty: 'low' | 'medium' | 'high';
  importance: number; // 1 to 5
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
  subject: string; // Keep as string for compatibility, eventually map to ID
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
  subject: string;
  topic: string;
  activityType?: ActivityType;
  expectedDurationSeconds?: number;
  weight: number; // For manual priority or calculated
  status: 'next' | 'pending' | 'done';
}

interface AppState {
  sessions: StudySession[];
  cycleQueue: CycleItem[];
  activeTask: { subject: string; topic: string; activityType?: ActivityType; source?: string } | null;
  weeklyGoalHours: number;
  hasCompletedOnboarding: boolean;
  userProfile: UserProfile | null;
  addSession: (session: Omit<StudySession, 'id' | 'date'>) => void;
  removeSession: (id: string) => void;
  setCycleQueue: (queue: CycleItem[]) => void;
  recalculateRoute: () => void;
  setActiveTask: (task: { subject: string; topic: string; activityType?: ActivityType; source?: string } | null) => void;
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
  addTopic: (subjectId: string, topicName: string) => void;
  deleteTopic: (subjectId: string, topicId: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const defaultCycle: CycleItem[] = [];

export const useStore = create<AppState>()(
  persist(
    (set) => ({
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
        // Algoritmo de Recálculo Adaptativo (AprovaFlow)
        const pending = state.cycleQueue.filter(item => item.status !== 'done');
        
        // Função pura para calcular o score de prioridade de um item
        const getPriorityScore = (item: CycleItem) => {
          let score = 0;
          
          // 1. Importância e Dificuldade (vem do UserProfile)
          const sub = state.userProfile?.subjects?.find(s => s.name === item.subject);
          if (sub) {
            score += sub.importance * 10; // Peso 10 para importância (10 a 50)
            score += (sub.difficulty === 'high' ? 30 : sub.difficulty === 'medium' ? 15 : 0); // Peso para dificuldade
          }
          
          // 2. Peso original do cronograma externo (se houver)
          score += (item.weight || 0) * 5;
          
          // 3. Histórico de sessões (Desempenho e Tempo)
          const subjectSessions = state.sessions.filter(s => s.subject === item.subject && s.topic === item.topic);
          
          if (subjectSessions.length === 0) {
            // Nunca estudado -> Prioridade extra para iniciar
            score += 20;
          } else {
            // Ordenar da mais recente para mais antiga
            subjectSessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            const lastSession = subjectSessions[0];
            
            // Proximidade: quanto mais dias sem estudar, maior a prioridade
            const daysSinceLastStudy = (Date.now() - new Date(lastSession.date).getTime()) / (1000 * 60 * 60 * 24);
            score += Math.min(daysSinceLastStudy * 2, 40); // Cap em 40 pontos (20 dias)
            
            // Desempenho: Baixa taxa de acerto aumenta prioridade de revisão
            let totalQ = 0, totalC = 0;
            subjectSessions.slice(0, 5).forEach(s => { // Últimas 5 sessões
              totalQ += s.questionsTotal || 0;
              totalC += s.questionsCorrect || 0;
            });
            if (totalQ > 0) {
              const accuracy = totalC / totalQ;
              if (accuracy < 0.6) score += 25; // Abaixo de 60% = alta prioridade
              else if (accuracy < 0.8) score += 10;
            }
          }
          
          return score;
        };
        
        // 4. Ordenação determinística baseada no score
        const sorted = [...pending].sort((a, b) => getPriorityScore(b) - getPriorityScore(a));
        
        // 5. Atualiza status (primeiro é a recomendação)
        const next: CycleItem[] = sorted.map((item, index) => ({
          ...item,
          status: index === 0 ? 'next' : 'pending'
        }));
        
        return { cycleQueue: [...state.cycleQueue.filter(i => i.status === 'done'), ...next] };
      }),
      setActiveTask: (task) => set({ activeTask: task }),
      completeCycleItem: (subject, topic) => set((state) => {
        const newQueue: CycleItem[] = state.cycleQueue.map(item => 
          (item.subject === subject && item.topic === topic) 
            ? { ...item, status: 'done' } 
            : item
        );
        // Find next pending and set it to 'next'
        const nextPendingIdx = newQueue.findIndex(i => i.status === 'pending');
        if (nextPendingIdx !== -1 && !newQueue.some(i => i.status === 'next')) {
          newQueue[nextPendingIdx].status = 'next';
        }
        return { cycleQueue: newQueue };
      }),
      setWeeklyGoalHours: (hours) => set({ weeklyGoalHours: hours }),
      resetAllData: () => set({ sessions: [], cycleQueue: defaultCycle, activeTask: null, hasCompletedOnboarding: false, userProfile: null }),
      completeOnboarding: (profile) => set({ hasCompletedOnboarding: true, userProfile: profile, weeklyGoalHours: Object.values(profile.availableTimePerDay).reduce((a, b) => a + b, 0) }),
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
      name: 'estudei-storage',
    }
  )
);

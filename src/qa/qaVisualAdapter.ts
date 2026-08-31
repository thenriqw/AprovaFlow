import { isQaVisualEnabled } from './qaFlags';
import { buildEnemQaDataset } from './enemSeed';
import { useStore } from '../store';


export const bootstrapQaVisualMode = () => {
  if (!isQaVisualEnabled()) return;
  console.log('Bootstrapping QA Visual Mode...');
  // Known QA limitation:
  // priority calculations use the runtime system clock.


  const dataset = buildEnemQaDataset();

  const planId = 'qa-plan-1';
  const plans = [{
    id: planId,
    userId: 'qa-user',
    name: dataset.plan.name,
    objective: dataset.plan.objective,
    examName: 'ENEM',
    examDate: dataset.plan.examDate,
    qaSeedId: dataset.plan.qaSeedId,
    availableTimePerDay: dataset.plan.availableTimePerDay,
    createdAt: new Date('2026-08-30').toISOString(),
    updatedAt: new Date('2026-08-30').toISOString(),
  }];

  const v2Subjects = dataset.subjects.map((s: any) => ({
    id: s.key.replace('_', '-'),
    name: s.name,
    importance: s.importance,
    difficulty: s.difficulty,
    isArchived: s.isArchived,
    planId
  }));

  const v2Topics = dataset.topics.map((t: any) => ({
    id: t.key.replace('_', '-'),
    name: t.name,
    subjectId: t.subjectKey.replace('_', '-'),
    planId
  }));

  const v2Activities = dataset.activities.map((a: any) => ({
    id: a.key.replace('_', '-'),
    title: a.title,
    subjectId: a.subjectKey.replace('_', '-'),
    topicId: a.topicKey.replace('_', '-'),
    type: a.type,
    status: a.status,
    expectedDurationSeconds: a.expectedDurationSeconds,
    expectedQuestions: a.expectedQuestions,
    planId
  }));

  const sessions = dataset.sessions.map((s: any) => ({
    id: s.key.replace('_', '-'),
    subjectId: s.subjectKey.replace('_', '-'),
    topicId: s.topicKey.replace('_', '-'),
    subject: dataset.subjects.find((sub: any) => sub.key === s.subjectKey)?.name || 'Desconhecido',
    topic: dataset.topics.find((top: any) => top.key === s.topicKey)?.name || 'Desconhecido',
    activityId: s.activityKey ? s.activityKey.replace('_', '-') : null,
    activityType: s.activityType,
    date: s.date,
    durationSeconds: s.durationSeconds,
    questionsTotal: s.questionsTotal ?? 0,
    questionsCorrect: s.questionsCorrect ?? 0,
    errorReason: s.errorReason ?? '',
    planId
  }));

  const userProfile = {
    examName: 'ENEM',
    objective: dataset.plan.objective,
    examDate: dataset.plan.examDate,
    availableTimePerDay: dataset.plan.availableTimePerDay,
    subjects: v2Subjects.map(s => ({
       id: s.id,
       name: s.name,
       difficulty: s.difficulty >= 4 ? 'high' : s.difficulty >= 3 ? 'medium' : 'low',
       importance: s.importance,
       topics: v2Topics.filter(t => t.subjectId === s.id).map(t => ({ id: t.id, name: t.name }))
    }))
  };

  useStore.setState({
    firebaseUser: { uid: 'qa-user', email: 'qa@local', displayName: 'QA Visual' } as any,
    plans,
    activePlanId: planId,
    v2Subjects,
    v2Topics,
    v2Activities,
    sessions,
    userProfile,
    weeklyGoalHours: 21,
    hasCompletedOnboarding: true,
    dbLoaded: true,
    isQaVisualMode: true,
  });

  const store = useStore.getState();
  store.syncCycleWithSubjects();
  store.recalculateRoute();
};

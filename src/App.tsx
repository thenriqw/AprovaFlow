import React, { useEffect, useState } from 'react';
import Layout from './components/Layout';
import Today from './components/Today';
import Timer from './components/Timer';
import PlanOverview from './components/PlanOverview';
import Inbox from './components/Inbox';
import Progress from './components/Progress';
import Settings from './components/Settings';
import Onboarding from './components/Onboarding';
import Content from './components/Content';
import CreatePlan from './components/CreatePlan';
import { useStore } from './store';
import { APP_NAME } from './config/constants';
import { initAuth, googleSignIn } from './lib/firebase';
import { getUserConfig, loadPlanData, getPlans, getLegacyUserData, saveLegacyUserBaseData, saveLegacySessionToDb } from './lib/db';
import { migrateLegacyToV2 } from './lib/migration';

function App() {
  const { activeTab, setActiveTab, setActiveTask, hasCompletedOnboarding, authReady, setAuthReady, firebaseUser, setFirebaseUser, setSyncingFromDb, loadFromDb } = useStore();
  const [showMigration, setShowMigration] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);

  useEffect(() => {
    const unsubscribe = initAuth(
      async (user) => {
        setFirebaseUser(user);
        if (user) {
          try {
            // First check if it's a V2 user
            let config = await getUserConfig(user.uid);
            
            if (config && config.userProfile && !config.migratedToV2) {
              // Legacy data exists in DB, needs migration
              const legacyData = await getLegacyUserData(user.uid);
              const migrated = await migrateLegacyToV2(user.uid, legacyData);
              if (migrated) {
                config = await getUserConfig(user.uid);
              }
            }
            
            const state = useStore.getState();
            
            if (!config) {
              // No remote data. Check if we have local data worth migrating.
              if (state.hasCompletedOnboarding || state.sessions.length > 0) {
                setShowMigration(true);
              } else {
                // New user! Load empty state so dbLoaded becomes true.
                loadFromDb({
                  hasCompletedOnboarding: false,
                  weeklyGoalHours: 25,
                  userProfile: null,
                  cycleQueue: [],
                  activeTask: null,
                  sessions: [],
                  plans: [],
                  activePlanId: null,
                  v2Subjects: [],
                  v2Topics: [],
                  v2Activities: []
                });
              }
            } else {
              setSyncingFromDb(true);
              
              // Load V2 data if available
              let plansData = {};
              if (config.activePlanId) {
                const planFullData = await loadPlanData(user.uid, config.activePlanId);
                const plans = await getPlans(user.uid);
                
                // Bridge V2 -> Legacy UI
                const activePlan = plans.find(p => p.id === config.activePlanId);
                const bridgedProfile = activePlan ? {
                  objective: activePlan.objective,
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
                
                plansData = {
                  activePlanId: config.activePlanId,
                  plans: plans,
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
                  userProfile: bridgedProfile,
                  // We could recalculate cycleQueue here, but store handles it if we syncCycleWithSubjects
                };
              } else if (config.userProfile) {
                // Legacy fallback
                const legacyData = await getLegacyUserData(user.uid);
                plansData = {
                  sessions: legacyData?.sessions || []
                };
              }
              
              loadFromDb({ ...config, ...plansData });
              useStore.getState().syncCycleWithSubjects();
              useStore.getState().recalculateRoute();
              setTimeout(() => setSyncingFromDb(false), 100);
            }
          } catch (e: any) {
            if (e.message?.includes('offline')) {
              console.warn("Client is offline. Using local cached data.");
            } else {
              console.error("Failed to fetch user data", e);
            }
          }
        } else {
          setShowMigration(false);
        }
        setAuthReady(true);
      }
    );
    return () => unsubscribe();
  }, [setFirebaseUser, setAuthReady, loadFromDb, setSyncingFromDb]);

  const handleMigration = async (shouldMigrate: boolean) => {
    if (!firebaseUser) return;
    setIsMigrating(true);
    
    try {
      if (shouldMigrate) {
        const state = useStore.getState();
        await saveLegacyUserBaseData(firebaseUser.uid, {
          hasCompletedOnboarding: state.hasCompletedOnboarding,
          weeklyGoalHours: state.weeklyGoalHours,
          userProfile: state.userProfile,
          cycleQueue: state.cycleQueue,
          activeTask: state.activeTask,
        });
        
        for (const session of state.sessions) {
          await saveLegacySessionToDb(firebaseUser.uid, session);
        }
        
        const legacyData = await getLegacyUserData(firebaseUser.uid);
        await migrateLegacyToV2(firebaseUser.uid, legacyData);
        
        const config = await getUserConfig(firebaseUser.uid);
        if (config && config.activePlanId) {
          const planFullData = await loadPlanData(firebaseUser.uid, config.activePlanId);
          const plans = await getPlans(firebaseUser.uid);
          
          const activePlan = plans.find(p => p.id === config.activePlanId);
          const bridgedProfile = activePlan ? {
            objective: activePlan.objective,
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
          
          loadFromDb({ 
            ...config, 
            activePlanId: config.activePlanId, 
            plans,
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
            userProfile: bridgedProfile
          });
          useStore.getState().syncCycleWithSubjects();
          useStore.getState().recalculateRoute();
        }
      } else {
        // Clear local data if they chose to start fresh
        setSyncingFromDb(true);
        loadFromDb({
          hasCompletedOnboarding: false,
          weeklyGoalHours: 25,
          userProfile: null,
          cycleQueue: [],
          activeTask: null,
          sessions: []
        });
        setTimeout(() => setSyncingFromDb(false), 100);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsMigrating(false);
      setShowMigration(false);
    }
  };

  const handleLogin = async () => {
    try {
      await googleSignIn();
    } catch (e) {}
  };

  if (!authReady || isMigrating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="w-8 h-8 border-4 border-neutral-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!firebaseUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
        <div className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm max-w-sm w-full text-center space-y-6">
          <div className="w-16 h-16 bg-neutral-900 text-white rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
          </div>
          <div>
            <h1 className="text-3xl font-serif font-bold text-neutral-900">{APP_NAME}</h1>
            <p className="text-neutral-500 mt-2">O GPS inteligente para seus estudos.</p>
          </div>
          <button 
            onClick={handleLogin}
            className="w-full px-6 py-3 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-xl transition-all"
          >
            Entrar com Google
          </button>
        </div>
      </div>
    );
  }

  if (showMigration) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
        <div className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Encontramos dados de estudo neste dispositivo.</h1>
            <p className="text-neutral-500 mt-2">Sua conta atual está vazia, mas encontramos dados salvos localmente. O que deseja fazer?</p>
          </div>
          <div className="space-y-3">
            <button 
              onClick={() => handleMigration(true)}
              className="w-full px-6 py-3 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-xl transition-all"
            >
              Importar para minha conta
            </button>
            <button 
              onClick={() => handleMigration(false)}
              className="w-full px-6 py-3 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-900 font-bold rounded-xl transition-all"
            >
              Começar sem importar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const navigateToTimer = (taskItem: any) => {
    setActiveTask(taskItem);
    setActiveTab('timer');
  };

  if (!hasCompletedOnboarding && activeTab !== 'create-plan') {
    return <Onboarding />;
  }

  // Ensure activeTab is valid for V2
  const currentTab = ['dashboard', 'cycle', 'subjects', 'import', 'history'].includes(activeTab) 
    ? (activeTab === 'dashboard' || activeTab === 'cycle' ? 'today' : 
       activeTab === 'subjects' ? 'content' :
       activeTab === 'import' ? 'inbox' :
       activeTab === 'history' ? 'progress' : activeTab)
    : activeTab;

  return (
    <Layout activeTab={currentTab} setActiveTab={setActiveTab}>
      {currentTab === 'today' && <Today />}
      {currentTab === 'plan' && <PlanOverview />}
      {currentTab === 'content' && <Content />}
      {currentTab === 'inbox' && <Inbox />}
      {currentTab === 'progress' && <Progress />}
      {currentTab === 'timer' && <Timer />}
      {currentTab === 'settings' && <Settings />}
      {currentTab === 'create-plan' && <CreatePlan />}
    </Layout>
  );
}

export default App;

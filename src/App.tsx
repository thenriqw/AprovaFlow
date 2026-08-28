import React, { useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Timer from './components/Timer';
import CycleManager from './components/Cycle';
import Importer from './components/Importer';
import History from './components/History';
import Settings from './components/Settings';
import Onboarding from './components/Onboarding';
import Subjects from './components/Subjects';
import { useStore } from './store';
import { initAuth } from './lib/firebase';

function App() {
  const { activeTab, setActiveTab, setActiveTask, hasCompletedOnboarding, setAuthReady, setNeedsAuth, setFirebaseUser, setWorkspaceToken } = useStore();

  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setFirebaseUser(user);
        setWorkspaceToken(token);
        setNeedsAuth(false);
        setAuthReady(true);
      },
      () => {
        setFirebaseUser(null);
        setWorkspaceToken(null);
        setNeedsAuth(true);
        setAuthReady(true);
      }
    );
    return () => unsubscribe();
  }, [setFirebaseUser, setWorkspaceToken, setNeedsAuth, setAuthReady]);

  const navigateToTimer = (taskItem: any) => {
    setActiveTask(taskItem);
    setActiveTab('timer');
  };

  if (!hasCompletedOnboarding) {
    return <Onboarding />;
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'dashboard' && <Dashboard />}
      {activeTab === 'timer' && <Timer />}
      {activeTab === 'cycle' && <CycleManager onStartTask={navigateToTimer} />}
      {activeTab === 'subjects' && <Subjects />}
      {activeTab === 'import' && <Importer />}
      {activeTab === 'history' && <History />}
      {activeTab === 'settings' && <Settings />}
    </Layout>
  );
}

export default App;

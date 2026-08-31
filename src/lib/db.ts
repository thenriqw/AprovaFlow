import { isQaVisualEnabled } from '../qa/qaFlags';
import { doc, getDoc, setDoc, collection, getDocs, writeBatch, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { Plan, Subject, Topic, StudySession, StudyActivity, Resource } from '../domain/types';

// Migration legacy types
import type { UserProfile, CycleItem } from '../store';

// ==========================================
// NEW ARCHITECTURE (Plan-centric)
// ==========================================

export const getUserConfig = async (uid: string) => {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  return snap.exists() ? snap.data() : null;
};

export const saveUserConfig = async (uid: string, data: any) => {
  if (isQaVisualEnabled()) return;
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, data, { merge: true });
};

// Generic fetcher for a plan's subcollection
export const getPlanCollection = async <T>(uid: string, planId: string, colName: string): Promise<T[]> => {
  const ref = collection(db, 'users', uid, 'plans', planId, colName);
  const snap = await getDocs(ref);
  return snap.docs.map(d => d.data() as T);
};

// Generic saver for a plan's subcollection document
export const savePlanDocument = async <T extends { id: string }>(uid: string, planId: string, colName: string, item: T) => {
  if (isQaVisualEnabled()) return;
  const ref = doc(db, 'users', uid, 'plans', planId, colName, item.id);
  await setDoc(ref, item);
};

export const deletePlanDocument = async (uid: string, planId: string, colName: string, id: string) => {
  if (isQaVisualEnabled()) return;
  const ref = doc(db, 'users', uid, 'plans', planId, colName, id);
  await deleteDoc(ref);
};

// Load everything for a plan
export const loadPlanData = async (uid: string, planId: string) => {
  const [subjects, topics, activities, sessions, resources] = await Promise.all([
    getPlanCollection<Subject>(uid, planId, 'subjects'),
    getPlanCollection<Topic>(uid, planId, 'topics'),
    getPlanCollection<StudyActivity>(uid, planId, 'activities'),
    getPlanCollection<StudySession>(uid, planId, 'sessions'),
    getPlanCollection<Resource>(uid, planId, 'resources')
  ]);
  
  return { subjects, topics, activities, sessions, resources };
};

export const getPlans = async (uid: string): Promise<Plan[]> => {
  const ref = collection(db, 'users', uid, 'plans');
  const snap = await getDocs(ref);
  return snap.docs.map(d => d.data() as Plan);
};

export const savePlan = async (uid: string, plan: Plan) => {
  if (isQaVisualEnabled()) return;
  const ref = doc(db, 'users', uid, 'plans', plan.id);
  await setDoc(ref, plan);
};


// ==========================================
// LEGACY MIGRATION FUNCTIONS
// ==========================================

export const getLegacyUserData = async (uid: string) => {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    return null;
  }
  
  const data = userSnap.data();
  
  // Fetch sessions
  const sessionsRef = collection(db, 'users', uid, 'sessions');
  const sessionsSnap = await getDocs(sessionsRef);
  const sessions = sessionsSnap.docs.map(d => d.data() as any);
  
  return {
    ...data,
    sessions
  };
};

export const saveLegacyUserBaseData = async (uid: string, data: any) => {
  if (isQaVisualEnabled()) return;
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, data, { merge: true });
};

export const saveLegacySessionToDb = async (uid: string, session: any) => {
  if (isQaVisualEnabled()) return;
  const sessionRef = doc(db, 'users', uid, 'sessions', session.id);
  await setDoc(sessionRef, session);
};

export const clearUserData = async (uid: string) => {
  if (isQaVisualEnabled()) return;
  // Danger! We should probably archive instead, but keeping this for testing
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, {
    hasCompletedOnboarding: false,
    weeklyGoalHours: 25,
    userProfile: null,
    cycleQueue: [],
    activeTask: null
  });
};

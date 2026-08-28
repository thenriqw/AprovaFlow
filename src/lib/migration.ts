import { db } from './firebase';
import { doc, setDoc, writeBatch } from 'firebase/firestore';
import type { Plan, Subject, Topic, StudySession } from '../domain/types';

export const migrateLegacyToV2 = async (uid: string, legacyData: any) => {
  if (!legacyData || !legacyData.userProfile || !legacyData.userProfile.subjects) {
    return false; // Nothing to migrate
  }
  
  const { userProfile, sessions = [] } = legacyData;
  
  // Create default plan
  const planId = 'plan_default_' + uid;
  const newPlan: Plan = {
    id: planId,
    userId: uid,
    name: 'Meu Plano',
    objective: userProfile.objective || '',
    examDate: userProfile.examDate || '',
    availableTimePerDay: userProfile.availableTimePerDay || {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  const batch = writeBatch(db);
  
  // Save plan
  const planRef = doc(db, 'users', uid, 'plans', planId);
  batch.set(planRef, newPlan);
  
  // Map subjects and topics
  userProfile.subjects.forEach((legacySub: any) => {
    const subId = legacySub.id;
    const newSub: Subject = {
      id: subId,
      planId: planId,
      name: legacySub.name,
      importance: legacySub.importance,
      difficulty: legacySub.difficulty === 'high' ? 5 : (legacySub.difficulty === 'medium' ? 3 : 1),
      isArchived: legacySub.isArchived,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const subRef = doc(db, 'users', uid, 'plans', planId, 'subjects', subId);
    batch.set(subRef, newSub);
    
    if (legacySub.topics) {
      legacySub.topics.forEach((legacyTop: any) => {
        const topId = legacyTop.id;
        const newTop: Topic = {
          id: topId,
          subjectId: subId,
          name: legacyTop.name,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const topRef = doc(db, 'users', uid, 'plans', planId, 'topics', topId);
        batch.set(topRef, newTop);
      });
    }
  });
  
  // Map sessions
  sessions.forEach((sess: any) => {
    const sessRef = doc(db, 'users', uid, 'plans', planId, 'sessions', sess.id);
    batch.set(sessRef, {
      ...sess,
      planId: planId,
    });
  });
  
  // Nullify old config so we don't migrate again
  const userRef = doc(db, 'users', uid);
  batch.set(userRef, { 
    userProfile: null, 
    migratedToV2: true,
    activePlanId: planId
  }, { merge: true });
  
  await batch.commit();
  return true;
};

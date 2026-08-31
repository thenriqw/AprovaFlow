import { isQaVisualEnabled } from '../qa/qaFlags';
import { db } from './firebase';
import { doc, writeBatch } from 'firebase/firestore';
import type { Plan, Subject, Topic } from '../domain/types';

export const migrateLegacyToV2 = async (uid: string, legacyData: any) => {
  if (isQaVisualEnabled()) return false;
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
  
  const operations: any[] = [];
  
  const planRef = doc(db, 'users', uid, 'plans', planId);
  operations.push({ ref: planRef, data: newPlan });
  
  userProfile.subjects.forEach((legacySub: any) => {
    const subId = legacySub.id;
    const newSub: Subject = {
      id: subId,
      planId: planId,
      name: legacySub.name,
      importance: legacySub.importance,
      difficulty: legacySub.difficulty === 'high' ? 5 : (legacySub.difficulty === 'medium' ? 3 : 1),
      isArchived: legacySub.isArchived || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const subRef = doc(db, 'users', uid, 'plans', planId, 'subjects', subId);
    operations.push({ ref: subRef, data: newSub });
    
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
        operations.push({ ref: topRef, data: newTop });
      });
    }
  });
  
  sessions.forEach((sess: any) => {
    const sessRef = doc(db, 'users', uid, 'plans', planId, 'sessions', sess.id);
    operations.push({ ref: sessRef, data: { ...sess, planId: planId } });
  });
  
  const userRef = doc(db, 'users', uid);
  operations.push({ 
    ref: userRef, 
    data: { userProfile: null, migratedToV2: true, activePlanId: planId }, 
    options: { merge: true } 
  });
  
  // Chunk operations into batches of 450 (safe limit)
  for (let i = 0; i < operations.length; i += 450) {
    const batch = writeBatch(db);
    const chunk = operations.slice(i, i + 450);
    for (const op of chunk) {
      if (op.options) {
        batch.set(op.ref, op.data, op.options);
      } else {
        batch.set(op.ref, op.data);
      }
    }
    await batch.commit();
  }
  
  return true;
};

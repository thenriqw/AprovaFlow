import { writeBatch, doc, collection, getDoc, runTransaction } from 'firebase/firestore';
import { db } from './firebase';
import { ImportJob, Subject, Topic, StudyActivity, ActivityType } from '../domain/types';
import { updateImportJob } from './importService';

// Simple normalizer for conflict matching
function normalizeStr(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, ' ').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export async function applyImportProposal(
  userId: string,
  planId: string,
  importJob: ImportJob,
  existingSubjects: Subject[],
  existingTopics: Topic[],
  selectedSubjects?: string[], // IDs or names of subjects to import
  selectedTopics?: Record<string, string[]> // Map of subject name -> array of topic names
) {
  if (!importJob.proposal || importJob.status !== 'needs_review') {
    throw new Error('Importação inválida para aplicação.');
  }

  // Idempotency: Lock the job by setting it to 'applying'
  // Verify it hasn't been started yet
  const jobRef = doc(db, 'users', userId, 'imports', importJob.id);
  
  await runTransaction(db, async (transaction) => {
    const jobSnap = await transaction.get(jobRef);
    if (!jobSnap.exists() || jobSnap.data().status !== 'needs_review') {
      throw new Error('Importação já processada ou em andamento.');
    }
    transaction.update(jobRef, { status: 'applying', updatedAt: new Date().toISOString() });
  });

  const subjectsRef = collection(db, 'users', userId, 'plans', planId, 'subjects');
  const topicsRef = collection(db, 'users', userId, 'plans', planId, 'topics');
  const activitiesRef = collection(db, 'users', userId, 'plans', planId, 'activities');

  const now = new Date().toISOString();
  
  let subjectsAdded = 0;
  let topicsAdded = 0;
  let activitiesAdded = 0;

  const batches: any[] = [];
  let currentBatch = writeBatch(db);
  let opCount = 0;
  
  const CHUNK_SIZE = 450;

  const commitBatchAndReset = () => {
    batches.push(currentBatch.commit());
    currentBatch = writeBatch(db);
    opCount = 0;
  };

  const addOpToBatch = (ref: any, data: any) => {
    currentBatch.set(ref, data);
    opCount++;
    if (opCount >= CHUNK_SIZE) {
      commitBatchAndReset();
    }
  };
  
  // Working arrays to prevent mutations of original state
  const workingSubjects = [...existingSubjects];
  const workingTopics = [...existingTopics];

  try {
    for (const subjectProp of importJob.proposal.subjects) {
      if (selectedSubjects && !selectedSubjects.includes(subjectProp.name)) {
        continue; // Skipped in UI
      }

      // Conflict detection
      let subjectId = '';
      const normPropSubject = normalizeStr(subjectProp.name);
      const existingSub = workingSubjects.find(s => normalizeStr(s.name) === normPropSubject);
      
      if (existingSub) {
        subjectId = existingSub.id;
      } else {
        const newSubRef = doc(subjectsRef);
        subjectId = newSubRef.id;
        addOpToBatch(newSubRef, {
          id: subjectId,
          planId,
          name: subjectProp.name,
          importance: 3, // Internal default
          difficulty: 3, // Internal default
          createdAt: now,
          updatedAt: now
        });
        subjectsAdded++;
        
        // Add to working array to prevent duplicate subjects in the same import chunk
        workingSubjects.push({ id: subjectId, planId, name: subjectProp.name, importance: 3, difficulty: 3, createdAt: now, updatedAt: now });
      }

      for (const topicProp of subjectProp.topics) {
        if (selectedTopics && selectedTopics[subjectProp.name] && !selectedTopics[subjectProp.name].includes(topicProp.name)) {
          continue; // Skipped in UI
        }

        let topicId = '';
        const normPropTopic = normalizeStr(topicProp.name);
        const existingTop = workingTopics.find(t => t.subjectId === subjectId && normalizeStr(t.name) === normPropTopic);
        
        if (existingTop) {
          topicId = existingTop.id;
        } else {
          const newTopRef = doc(topicsRef);
          topicId = newTopRef.id;
          addOpToBatch(newTopRef, {
            id: topicId,
            planId,
            subjectId,
            name: topicProp.name,
            createdAt: now,
            updatedAt: now
          });
          topicsAdded++;
          
          workingTopics.push({ id: topicId, planId, subjectId, name: topicProp.name, createdAt: now, updatedAt: now });
        }

        for (const actProp of topicProp.activities) {
          // Do not fake activity data
          if (!actProp.title || !actProp.type || !actProp.expectedDurationSeconds) {
            continue;
          }

          const newActRef = doc(activitiesRef);
          addOpToBatch(newActRef, {
            id: newActRef.id,
            planId,
            subjectId,
            topicId,
            title: actProp.title,
            type: actProp.type,
            source: actProp.source || null, // Optional
            expectedDurationSeconds: actProp.expectedDurationSeconds,
            expectedQuestions: actProp.expectedQuestions || 0,
            status: 'pending',
            createdAt: now,
            updatedAt: now
          });
          activitiesAdded++;
        }
      }
    }

    if (opCount > 0) {
      batches.push(currentBatch.commit());
    }

    // Wait for all chunks to commit
    await Promise.all(batches);

    // Update job status to applied only if all succeeded
    await updateImportJob(userId, importJob.id, { status: 'applied', planId });

    return { subjectsAdded, topicsAdded, activitiesAdded };
  } catch (error: any) {
    console.error("Erro durante aplicação em chunks:", error);
    await updateImportJob(userId, importJob.id, { status: 'partial', error: error.message || 'Erro durante aplicação parcial.' });
    throw error;
  }
}


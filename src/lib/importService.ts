import { isQaVisualEnabled } from '../qa/qaFlags';
import { doc, setDoc, updateDoc, collection, serverTimestamp, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { ImportJob } from '../domain/types';

export async function createImportJob(userId: string, data: Partial<ImportJob>): Promise<ImportJob> {
  if (isQaVisualEnabled()) {
    throw new Error('Importação desativada no QA Visual.');
  }
  const importsRef = collection(db, 'users', userId, 'imports');
  const importRef = doc(importsRef);
  
  const newJob: ImportJob = {
    id: importRef.id,
    userId,
    title: data.title || 'Importação sem título',
    filename: data.filename,
    sourceType: data.sourceType || 'text',
    status: data.status || 'queued',
    warnings: data.warnings || [],
    contentHash: data.contentHash,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...data
  };

  await setDoc(importRef, {
    ...newJob,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return newJob;
}

export async function updateImportJob(userId: string, id: string, data: Partial<ImportJob>) {
  if (isQaVisualEnabled()) return;
  const importRef = doc(db, 'users', userId, 'imports', id);
  await updateDoc(importRef, {
    ...data,
    updatedAt: serverTimestamp()
  });
}

export function subscribeToImportJobs(userId: string, onUpdate: (jobs: ImportJob[]) => void): () => void {
  if (isQaVisualEnabled()) {
    onUpdate([]);
    return () => {};
  }
  const importsQuery = query(
    collection(db, 'users', userId, 'imports'),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(importsQuery, (snapshot) => {
    const jobs: ImportJob[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      jobs.push({ 
        id: docSnap.id, 
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt
      } as ImportJob);
    });
    onUpdate(jobs);
  });
}

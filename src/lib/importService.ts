import { doc, setDoc, updateDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { ImportJob } from '../domain/types';

export async function createImportJob(userId: string, data: Partial<ImportJob>): Promise<ImportJob> {
  const importRef = doc(collection(db, 'imports'));
  
  const newJob: ImportJob = {
    id: importRef.id,
    userId,
    title: data.title || 'Importação sem título',
    filename: data.filename,
    sourceType: data.sourceType || 'text',
    status: data.status || 'queued',
    warnings: data.warnings || [],
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

export async function updateImportJob(id: string, data: Partial<ImportJob>) {
  const importRef = doc(db, 'imports', id);
  await updateDoc(importRef, {
    ...data,
    updatedAt: serverTimestamp()
  });
}

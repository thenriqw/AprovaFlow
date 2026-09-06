import { StudySession, StudyActivity } from '../domain/types';

export function calculateNextReview(
  subjectId: string, 
  topicId: string, 
  planId: string, 
  title: string, 
  difficulty: 'low' | 'medium' | 'high' = 'medium',
  pastSessions: StudySession[]
): StudyActivity | null {
  if (!topicId || !planId || !subjectId) return null;

  // Find past sessions for this topic
  const topicSessions = pastSessions
    .filter(s => s.topicId === topicId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
  // Base intervals in days
  const reviewCount = topicSessions.length;
  let intervalDays = 1;
  
  if (reviewCount <= 1) intervalDays = 1; // 1st review (after initial theory)
  else if (reviewCount === 2) intervalDays = 7;
  else if (reviewCount === 3) intervalDays = 15;
  else intervalDays = 30;
  
  // Adjust based on difficulty
  if (difficulty === 'high') {
    intervalDays = Math.max(1, Math.floor(intervalDays / 2));
  } else if (difficulty === 'low') {
    intervalDays = Math.floor(intervalDays * 1.5);
  }
  
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + intervalDays);
  dueDate.setHours(9, 0, 0, 0); // Schedule for 9 AM
  
  return {
    id: `act_rev_${crypto.randomUUID().split('-')[0]}`,
    planId,
    subjectId,
    topicId,
    type: 'Revisão',
    title: `Revisão Espaçada: ${title}`,
    expectedDurationSeconds: 30 * 60, // 30 mins
    expectedQuestions: 15,
    dueDate: dueDate.toISOString(),
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

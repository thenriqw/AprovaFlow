import { StudySession } from '../domain/types';

export interface StreakInfo {
  currentStreak: number;
  maxStreak: number;
  todayStudied: boolean;
  activityMap: Record<string, number>; // YYYY-MM-DD -> duration in seconds
}

export function calculateStreak(sessions: any[]): StreakInfo {
  const activityMap: Record<string, number> = {};
  
  // Aggregate sessions by day
  sessions.forEach(s => {
    if (!s.date) return;
    const dateStr = s.date.split('T')[0];
    activityMap[dateStr] = (activityMap[dateStr] || 0) + s.durationSeconds;
  });

  const dates = Object.keys(activityMap).sort().reverse();
  
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  let currentStreak = 0;
  let maxStreak = 0;
  let tempStreak = 0;

  let checkDate = new Date();
  let checkDateStr = checkDate.toISOString().split('T')[0];
  
  const todayStudied = (activityMap[todayStr] || 0) > 0;
  
  if (todayStudied) {
    currentStreak = 1;
    checkDate.setDate(checkDate.getDate() - 1);
    checkDateStr = checkDate.toISOString().split('T')[0];
  } else if ((activityMap[yesterdayStr] || 0) > 0) {
    // If not studied today, but studied yesterday, the streak is still alive, but starts from yesterday
    checkDate.setDate(checkDate.getDate() - 1);
    checkDateStr = checkDate.toISOString().split('T')[0];
  } else {
    // Streak broken
    currentStreak = 0;
  }

  // Count backwards for current streak
  if (currentStreak === 1 || (activityMap[yesterdayStr] || 0) > 0) {
     if (currentStreak === 0) currentStreak = 0; // Wait, if we start counting from yesterday
     let countingDate = new Date(checkDate);
     let cdStr = countingDate.toISOString().split('T')[0];
     
     while (activityMap[cdStr] > 0) {
       if (currentStreak === 0 && cdStr === yesterdayStr) currentStreak = 1; // start of yesterday streak
       else if (cdStr !== todayStr) currentStreak++; // increment for previous days
       
       countingDate.setDate(countingDate.getDate() - 1);
       cdStr = countingDate.toISOString().split('T')[0];
     }
  }

  // Calculate max streak by iterating all dates
  tempStreak = 0;
  let lastDate: Date | null = null;
  
  // Sort ascending for max streak logic
  const ascDates = Object.keys(activityMap).sort();
  for (let i = 0; i < ascDates.length; i++) {
    const dStr = ascDates[i];
    const d = new Date(dStr);
    
    if (!lastDate) {
      tempStreak = 1;
    } else {
      const diffTime = Math.abs(d.getTime() - lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      if (diffDays === 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
    }
    
    if (tempStreak > maxStreak) {
      maxStreak = tempStreak;
    }
    lastDate = d;
  }

  return {
    currentStreak,
    maxStreak,
    todayStudied,
    activityMap
  };
}

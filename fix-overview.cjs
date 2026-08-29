const fs = require('fs');
let code = fs.readFileSync('src/components/PlanOverview.tsx', 'utf8');

const replacement = `
  // Calculate Capacity
  const hasAvailability = activePlan.availableTimePerDay && Object.values(activePlan.availableTimePerDay).some(h => h > 0);
  const weeklyCapacityHours = hasAvailability ? Object.values(activePlan.availableTimePerDay).reduce((a, b) => a + b, 0) : 0;
  const weeklyCapacityMinutes = weeklyCapacityHours * 60;
  
  // Calculate Demand
  let totalDemandMinutes = 0;
  let pendingDemandMinutes = 0;
  if (v2Activities && v2Activities.length > 0) {
    totalDemandMinutes = v2Activities.reduce((acc, act) => acc + (Math.round((act.expectedDurationSeconds || 0) / 60)), 0);
    pendingDemandMinutes = v2Activities
      .filter(act => act.status !== 'completed')
      .reduce((acc, act) => acc + (Math.round((act.expectedDurationSeconds || 0) / 60)), 0);
  }

  const daysToExam = activePlan.examDate 
    ? Math.max(0, Math.floor((new Date(activePlan.examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const totalWeeks = daysToExam ? Math.ceil(daysToExam / 7) : null;
  const totalCapacityRemaining = totalWeeks && hasAvailability ? totalWeeks * weeklyCapacityMinutes : null;
  const isOverloaded = totalCapacityRemaining !== null && pendingDemandMinutes > totalCapacityRemaining;
`;

code = code.replace(/  \/\/ Calculate Capacity[\s\S]*?const totalCapacityRemaining = totalWeeks \? totalWeeks \* weeklyCapacityMinutes : null;/, replacement);

fs.writeFileSync('src/components/PlanOverview.tsx', code);

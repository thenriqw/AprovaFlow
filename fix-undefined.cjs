const fs = require('fs');

let content = fs.readFileSync('src/store.ts', 'utf-8');

// We can stringify and parse since state contains plain objects and arrays
// But wait, userProfile has `updatedAt` which might be a string (ISO date), so JSON parsing is safe.
const target1 = `await saveUserConfig(state.firebaseUser!.uid, {
            hasCompletedOnboarding: state.hasCompletedOnboarding,
            activePlanId: state.activePlanId,
            weeklyGoalHours: state.weeklyGoalHours, // We can store this at config level or plan level
            cycleQueue: state.cycleQueue,
            activeTask: state.activeTask,
          });`;

const replacement1 = `await saveUserConfig(state.firebaseUser!.uid, JSON.parse(JSON.stringify({
            hasCompletedOnboarding: state.hasCompletedOnboarding,
            activePlanId: state.activePlanId,
            weeklyGoalHours: state.weeklyGoalHours, // We can store this at config level or plan level
            cycleQueue: state.cycleQueue,
            activeTask: state.activeTask ?? null,
          })));`;

const target2 = `await saveLegacyUserBaseData(state.firebaseUser!.uid, {
            hasCompletedOnboarding: state.hasCompletedOnboarding,
            weeklyGoalHours: state.weeklyGoalHours,
            userProfile: state.userProfile,
            cycleQueue: state.cycleQueue,
            activeTask: state.activeTask,
          });`;

const replacement2 = `await saveLegacyUserBaseData(state.firebaseUser!.uid, JSON.parse(JSON.stringify({
            hasCompletedOnboarding: state.hasCompletedOnboarding,
            weeklyGoalHours: state.weeklyGoalHours,
            userProfile: state.userProfile,
            cycleQueue: state.cycleQueue,
            activeTask: state.activeTask ?? null,
          })));`;

content = content.replace(target1, replacement1);
content = content.replace(target2, replacement2);

fs.writeFileSync('src/store.ts', content);

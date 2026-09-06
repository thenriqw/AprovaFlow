const fs = require('fs');
let content = fs.readFileSync('src/components/PlanOverview.tsx', 'utf-8');

const importStr = `import { Calendar, Target, Clock, AlertTriangle } from 'lucide-react';`;
const newImportStr = `import { Calendar, Target, Clock, AlertTriangle, CalendarRange, RefreshCw } from 'lucide-react';
import WeeklyGrid from './WeeklyGrid';
import { generateWeeklySchedule } from '../lib/scheduleEngine';`;

if(content.includes(importStr) && !content.includes('WeeklyGrid')) {
    content = content.replace(importStr, newImportStr);
}

const destructStr = `const { plans, activePlanId, v2Subjects, v2Activities } = useStore();`;
const newDestructStr = `const { plans, activePlanId, v2Subjects, v2Topics, v2Activities, addV2Activity, firebaseUser } = useStore();
  
  const handleGenerateSchedule = async () => {
    if (!activePlan) return;
    const newActs = generateWeeklySchedule(activePlan, v2Subjects, v2Topics);
    newActs.forEach(act => addV2Activity(act));
    
    // Auto sync logic could go here, but Zustand triggers it if configured correctly
    // or we can rely on standard refresh
  };`;

if(content.includes(destructStr) && !content.includes('handleGenerateSchedule')) {
    content = content.replace(destructStr, newDestructStr);
}

const injectTarget = `<div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-neutral-100 bg-neutral-50/50">`;

const injectStr = `
      {/* Grade Horária Visual */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-neutral-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
             <h2 className="text-xl font-serif font-bold text-neutral-900 flex items-center gap-2">
               <CalendarRange className="text-indigo-500" /> Grade Horária da Semana
             </h2>
             <p className="text-sm text-neutral-500 mt-1">Sua rotina visual para os próximos 7 dias.</p>
          </div>
          <button 
             onClick={handleGenerateSchedule}
             className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-sm rounded-xl transition-colors"
          >
             <RefreshCw size={16} /> Auto-Preencher Grade
          </button>
        </div>
        <div className="p-4 bg-neutral-50/30">
           {(!v2Activities || v2Activities.length === 0) ? (
              <div className="text-center py-12">
                 <CalendarRange size={48} className="mx-auto text-neutral-200 mb-4" />
                 <p className="text-neutral-900 font-bold">Sua grade está vazia</p>
                 <p className="text-neutral-500 text-sm max-w-sm mx-auto mt-2">Clique em "Auto-Preencher Grade" para que o sistema distribua suas matérias automaticamente nos seus dias disponíveis.</p>
              </div>
           ) : (
              <WeeklyGrid />
           )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-neutral-100 bg-neutral-50/50">`;

if (content.includes(injectTarget) && !content.includes('Grade Horária Visual')) {
    content = content.replace(injectTarget, injectStr);
    fs.writeFileSync('src/components/PlanOverview.tsx', content);
    console.log("Patched PlanOverview with Grid");
} else {
    console.log("Failed to patch PlanOverview");
}


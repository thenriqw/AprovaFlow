const fs = require('fs');
let content = fs.readFileSync('src/components/Today.tsx', 'utf-8');

const importTarget = `import { formatDuration } from '../lib/utils';`;
const newImport = `import { formatDuration } from '../lib/utils';
import { calculateStreak } from '../lib/streakUtils';
import { Flame } from 'lucide-react';`;

if (content.includes(importTarget)) {
    content = content.replace(importTarget, newImport);
}

const componentTarget = `const { userProfile, cycleQueue, sessions, setActiveTab, activePlanId, plans, setActiveTask } = useStore();`;
const newComponent = `const { userProfile, cycleQueue, sessions, setActiveTab, activePlanId, plans, setActiveTask } = useStore();
  const { currentStreak, todayStudied } = calculateStreak(sessions);`;

if (content.includes(componentTarget)) {
    content = content.replace(componentTarget, newComponent);
}

const renderTarget = `<div className="flex items-center gap-3">`;
const newRender = `<div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-8 bg-neutral-900 rounded-full"></div>
          <div>
            <h1 className="text-3xl font-serif font-bold text-neutral-900">Hoje</h1>
            <p className="text-neutral-500 text-sm mt-1">Sua visão geral diária e próximos passos.</p>
          </div>
        </div>
        
        <div className="hidden sm:flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-neutral-200 shadow-sm animate-in fade-in slide-in-from-right-4">
           <Flame size={20} className={todayStudied ? "text-orange-500 fill-orange-500" : "text-neutral-400"} />
           <div className="flex flex-col">
             <span className="text-xs font-bold text-neutral-500 uppercase leading-none">Ofensiva</span>
             <span className="text-sm font-black text-neutral-900 leading-none mt-1">{currentStreak} {currentStreak === 1 ? 'dia' : 'dias'}</span>
           </div>
        </div>
      </div>
      
      {/* Mobile Streak */}
      <div className="sm:hidden flex items-center justify-center gap-2 bg-white p-3 rounded-xl border border-neutral-200 shadow-sm">
         <Flame size={20} className={todayStudied ? "text-orange-500 fill-orange-500" : "text-neutral-400"} />
         <span className="text-sm font-black text-neutral-900">{currentStreak} dias de ofensiva</span>
      </div>`;

// Find the precise block to replace for the header
const headerRegex = /<div className="flex items-center gap-3">[\s\S]*?<\/div>[\s\S]*?<\/div>/;

const match = content.match(headerRegex);
if (match) {
    content = content.replace(match[0], newRender);
    fs.writeFileSync('src/components/Today.tsx', content);
    console.log("Patched Gamification Today.tsx");
} else {
    console.log("Failed to patch Today.tsx UI");
}


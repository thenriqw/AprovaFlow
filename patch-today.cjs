const fs = require('fs');

let content = fs.readFileSync('src/components/Today.tsx', 'utf-8');

// I will inject a Daily Schedule view right below the Next Task or instead of Next Task if there are activities today.
const target = `} else {
      setActiveTask(null);
    }
    setActiveTab('timer');
  };`;

const newCode = `} else {
      setActiveTask(null);
    }
    setActiveTab('timer');
  };

  const todayActivities = state.v2Activities?.filter(act => {
    if (!act.dueDate) return false;
    const actDate = new Date(act.dueDate);
    const today = new Date();
    return actDate.getDate() === today.getDate() && actDate.getMonth() === today.getMonth();
  }).sort((a,b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()) || [];
`;

if(content.includes(target)) {
    content = content.replace(target, newCode);
    
    // Now replace the entire render body where it shows the next task, maybe just prepending the todayActivities list
    const uiTarget = `{activePlan?.type === 'academico' && actualTopic && (`;
    const uiNew = `{todayActivities.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-neutral-200/50">
                    <p className="text-sm font-bold text-neutral-500 mb-3 uppercase tracking-wider">Atividades de Hoje</p>
                    <div className="flex flex-col gap-2">
                      {todayActivities.map(act => (
                         <div key={act.id} className="flex items-center justify-between bg-white/50 p-2 rounded-lg border border-neutral-100">
                           <div className="flex items-center gap-2">
                             <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                             <span className="font-semibold text-sm text-neutral-900">{act.title}</span>
                             <span className="text-xs text-neutral-500 px-2 py-0.5 bg-neutral-100 rounded">{act.type}</span>
                           </div>
                           <button onClick={() => { setActiveTask({ subject: state.v2Subjects?.find(s => s.id === act.subjectId)?.name || '', topic: state.v2Topics?.find(t => t.id === act.topicId)?.name || '', subjectId: act.subjectId, topicId: act.topicId, activityId: act.id, activityType: act.type, expectedDurationSeconds: act.expectedDurationSeconds }); setActiveTab('timer'); }} className="text-xs font-bold bg-neutral-900 text-white px-3 py-1.5 rounded-lg hover:bg-neutral-800">
                             Iniciar
                           </button>
                         </div>
                      ))}
                    </div>
                  </div>
                )}
                {activePlan?.type === 'academico' && actualTopic && (`;
                
    content = content.replace(uiTarget, uiNew);
    
    fs.writeFileSync('src/components/Today.tsx', content);
    console.log("Patched Today.tsx");
} else {
    console.log("Target not found");
}


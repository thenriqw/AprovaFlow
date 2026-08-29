const fs = require('fs');
let code = fs.readFileSync('src/components/Progress.tsx', 'utf8');

const replacement = `
          <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
             <h3 className="text-lg font-bold text-neutral-900 mb-6">Tempo por Matéria</h3>
             {v2Subjects && v2Subjects.length > 0 ? (
               <div className="space-y-4">
                 {v2Subjects.map(sub => {
                   const subSessions = sessions.filter(s => s.subjectId === sub.id);
                   const subSeconds = subSessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
                   if (subSeconds === 0) return null;
                   return (
                     <div key={sub.id} className="flex items-center justify-between">
                       <span className="text-sm font-medium text-neutral-700">{sub.name}</span>
                       <span className="text-sm font-bold text-neutral-900">{formatPreciseHours(subSeconds)}</span>
                     </div>
                   );
                 })}
                 {sessions.length > 0 && sessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0) > 0 && v2Subjects.every(sub => sessions.filter(s => s.subjectId === sub.id).reduce((acc, s) => acc + (s.durationSeconds || 0), 0) === 0) && (
                    <div className="text-sm text-neutral-500 italic">Sessões registradas não estão vinculadas às matérias atuais.</div>
                 )}
               </div>
             ) : (
               <div className="text-center text-neutral-400 py-8">
                 <p className="font-medium text-neutral-600">Sem dados suficientes.</p>
                 <p className="text-sm">Comece a estudar matérias para visualizar a distribuição de tempo.</p>
               </div>
             )}
          </div>
`;

code = code.replace(/          <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm min-h-\[300px\] flex items-center justify-center">[\s\S]*?<\/div>/, replacement);

fs.writeFileSync('src/components/Progress.tsx', code);

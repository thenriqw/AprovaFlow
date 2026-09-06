import React, { useState } from 'react';
import { useStore } from '../store';
import { Calendar as CalendarIcon, Clock, BookOpen, CheckCircle2, FileText, PlayCircle } from 'lucide-react';

export default function Schedule() {
  const { v2Activities, v2Subjects, v2Topics } = useStore();
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1); // 0-6 for Mon-Sun

  const daysOfWeek = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

  // Filter activities to show only the selected day
  const getActivitiesForDay = (dayIndex: number) => {
    return v2Activities.filter(act => {
      if (!act.dueDate) return false;
      const date = new Date(act.dueDate);
      const actDay = date.getDay() === 0 ? 6 : date.getDay() - 1;
      return actDay === dayIndex;
    }).sort((a, b) => {
      const timeA = new Date(a.dueDate!).getTime();
      const timeB = new Date(b.dueDate!).getTime();
      return timeA - timeB;
    });
  };

  const currentActivities = getActivitiesForDay(selectedDay);

  const getSubjectColor = (subjectId: string) => {
    // Basic color fallback
    const colors = ['bg-blue-100 text-blue-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700', 'bg-purple-100 text-purple-700', 'bg-rose-100 text-rose-700'];
    const idx = parseInt(subjectId.replace(/\D/g, '')) % colors.length || 0;
    return colors[idx];
  };

  const getSubjectName = (subjectId: string) => {
    return v2Subjects.find(s => s.id === subjectId)?.name || 'Desconhecido';
  };
  
  const getTopicName = (topicId?: string) => {
    if (!topicId) return '';
    return v2Topics.find(t => t.id === topicId)?.name || '';
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-8 bg-neutral-900 rounded-full"></div>
        <div>
          <h1 className="text-3xl font-serif font-bold text-neutral-900">Cronograma</h1>
          <p className="text-neutral-500 text-sm mt-1">Sua grade semanal de atividades estruturadas.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col">
        {/* Day Selector */}
        <div className="flex overflow-x-auto border-b border-neutral-100 hide-scrollbar">
          {daysOfWeek.map((day, idx) => (
            <button
              key={day}
              onClick={() => setSelectedDay(idx)}
              className={`flex-1 min-w-[100px] py-4 text-sm font-bold border-b-2 transition-all ${
                selectedDay === idx 
                  ? 'border-neutral-900 text-neutral-900 bg-neutral-50' 
                  : 'border-transparent text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              {day}
            </button>
          ))}
        </div>

        {/* Schedule Content */}
        <div className="p-6 md:p-8 min-h-[400px]">
          {currentActivities.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-neutral-400 space-y-4 mt-20">
              <CalendarIcon size={48} className="text-neutral-200" />
              <p className="text-center font-medium">Nenhuma atividade agendada para este dia.</p>
            </div>
          ) : (
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-neutral-200 before:to-transparent">
              {currentActivities.map((act, index) => {
                const date = new Date(act.dueDate!);
                const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const isCompleted = act.status === 'completed';
                
                return (
                  <div key={act.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                    {/* Timeline Dot */}
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-white shadow-sm absolute left-0 md:left-1/2 -translate-x-1/2 z-10">
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <div className="w-3 h-3 bg-neutral-300 rounded-full group-hover:bg-neutral-900 transition-colors"></div>
                      )}
                    </div>
                    
                    {/* Content Card */}
                    <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] pl-4 md:pl-0 md:group-odd:pr-8 md:group-even:pl-8">
                      <div className={`p-5 rounded-2xl border transition-all ${isCompleted ? 'bg-neutral-50 border-neutral-100 opacity-70' : 'bg-white border-neutral-200 shadow-sm hover:border-neutral-400'}`}>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="flex items-center gap-1.5 text-xs font-bold text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-md">
                            <Clock size={12} />
                            {timeString}
                          </span>
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${getSubjectColor(act.subjectId)}`}>
                            {getSubjectName(act.subjectId)}
                          </span>
                        </div>
                        
                        <h3 className={`text-lg font-bold mb-1 ${isCompleted ? 'text-neutral-500' : 'text-neutral-900'}`}>
                          {act.title}
                        </h3>
                        
                        {act.topicId && (
                           <p className="text-sm font-medium text-neutral-500 flex items-center gap-1.5 mb-4">
                             <BookOpen size={14} /> {getTopicName(act.topicId)}
                           </p>
                        )}
                        
                        <div className="flex items-center justify-between mt-2 pt-4 border-t border-neutral-100">
                           <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                             {act.type === 'Leitura' ? <FileText size={14} /> : <PlayCircle size={14} />}
                             {Math.round(act.expectedDurationSeconds / 60)} min
                           </span>
                           {!isCompleted && (
                             <button className="text-xs font-bold bg-neutral-900 text-white px-3 py-1.5 rounded-lg hover:bg-neutral-800 transition-colors">
                               Iniciar
                             </button>
                           )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

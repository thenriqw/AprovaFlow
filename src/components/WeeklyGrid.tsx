import React from 'react';
import { useStore } from '../store';
import { Clock } from 'lucide-react';

export default function WeeklyGrid() {
  const { v2Activities, v2Subjects } = useStore();

  const daysOfWeek = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
  const hoursOfDay = Array.from({ length: 15 }, (_, i) => i + 8); // 8 AM to 10 PM

  const getSubjectColor = (subjectId: string) => {
    const colors = ['bg-blue-100 border-blue-200 text-blue-700', 'bg-emerald-100 border-emerald-200 text-emerald-700', 'bg-amber-100 border-amber-200 text-amber-700', 'bg-purple-100 border-purple-200 text-purple-700', 'bg-rose-100 border-rose-200 text-rose-700'];
    const idx = parseInt(subjectId.replace(/\D/g, '')) % colors.length || 0;
    return colors[idx];
  };

  const getSubjectName = (subjectId: string) => {
    return v2Subjects?.find(s => s.id === subjectId)?.name || 'Desconhecido';
  };

  // Find activities for a specific day (0=Mon, 6=Sun) and hour
  const getActivityForSlot = (dayIdx: number, hour: number) => {
    if (!v2Activities) return null;
    return v2Activities.find(act => {
      if (!act.dueDate) return false;
      const d = new Date(act.dueDate);
      const actDay = d.getDay() === 0 ? 6 : d.getDay() - 1; // 0=Mon
      return actDay === dayIdx && d.getHours() === hour;
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Header Row */}
        <div className="grid grid-cols-8 border-b border-neutral-100 bg-neutral-50/50 sticky top-0 z-10">
          <div className="p-4 text-center border-r border-neutral-100">
            <Clock size={16} className="mx-auto text-neutral-400" />
          </div>
          {daysOfWeek.map(day => (
            <div key={day} className="p-4 text-center font-bold text-sm text-neutral-600 border-r border-neutral-100 last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        {/* Grid Body */}
        <div className="relative">
          {hoursOfDay.map(hour => (
            <div key={hour} className="grid grid-cols-8 border-b border-neutral-100 last:border-b-0 group">
              {/* Hour Label */}
              <div className="p-3 text-center border-r border-neutral-100 text-xs font-semibold text-neutral-400 flex flex-col justify-center bg-neutral-50/30 group-hover:bg-neutral-50 transition-colors">
                {`${hour}:00`}
              </div>

              {/* Day Slots */}
              {Array.from({ length: 7 }).map((_, dayIdx) => {
                const act = getActivityForSlot(dayIdx, hour);
                return (
                  <div key={dayIdx} className="p-1.5 border-r border-neutral-100 last:border-r-0 min-h-[80px] hover:bg-neutral-50/50 transition-colors">
                    {act ? (
                      <div className={`w-full h-full p-2 rounded-lg border ${getSubjectColor(act.subjectId)} flex flex-col justify-center text-left hover:scale-[1.02] transition-transform cursor-pointer shadow-sm`}>
                        <span className="text-xs font-black truncate block">{getSubjectName(act.subjectId)}</span>
                        <span className="text-[10px] font-medium opacity-80 truncate block mt-0.5">{act.title}</span>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useStore } from '../store';
import { TrendingUp, Clock, CalendarDays, CheckCircle, BrainCircuit } from 'lucide-react';
import History from './History'; // Reuse History under a tab

export default function Progress() {
  const { sessions, v2Subjects, v2Topics } = useStore();
  const [tab, setTab] = useState<'overview' | 'history'>('overview');

  const totalSeconds = sessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
  
  const formatPreciseHours = (seconds: number) => {
    if (seconds === 0) return '0h';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0 && mins > 0) return `${hrs}h${mins.toString().padStart(2, '0')}`;
    if (hrs > 0) return `${hrs}h`;
    return `${mins}min`;
  };

  const totalFormatted = formatPreciseHours(totalSeconds);

  let questionsTotal = 0;
  let questionsCorrect = 0;
  sessions.forEach(s => {
    if (s.questionsTotal) questionsTotal += s.questionsTotal;
    if (s.questionsCorrect) questionsCorrect += s.questionsCorrect;
  });
  
  const accuracy = questionsTotal > 0 ? `${Math.round((questionsCorrect / questionsTotal) * 100)}%` : '--';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-8 bg-neutral-900 rounded-full"></div>
          <div>
            <h1 className="text-3xl font-serif font-bold text-neutral-900">Progresso</h1>
            <p className="text-neutral-500 text-sm mt-1">Acompanhe sua evolução e histórico.</p>
          </div>
        </div>

        <div className="flex bg-neutral-100 p-1 rounded-lg">
          <button 
            onClick={() => setTab('overview')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'overview' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500 hover:text-neutral-900'}`}
          >
            Visão Geral
          </button>
          <button 
            onClick={() => setTab('history')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'history' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500 hover:text-neutral-900'}`}
          >
            Histórico Detalhado
          </button>
        </div>
      </div>

      {tab === 'overview' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
              <Clock size={20} className="text-blue-500 mb-3" />
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1 block">Tempo Total</span>
              <span className="text-2xl font-bold text-neutral-900">{totalFormatted}</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
              <CalendarDays size={20} className="text-purple-500 mb-3" />
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1 block">Sessões</span>
              <span className="text-2xl font-bold text-neutral-900">{sessions.length}</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
              <CheckCircle size={20} className="text-emerald-500 mb-3" />
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1 block">Precisão Geral</span>
              <span className="text-2xl font-bold text-neutral-900">{accuracy}</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
              <BrainCircuit size={20} className="text-orange-500 mb-3" />
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1 block">Tópicos Estudados</span>
              <span className="text-2xl font-bold text-neutral-900">
                {new Set(sessions.filter(s => s.topicId).map(s => s.topicId)).size}
                <span className="text-sm text-neutral-400 font-medium ml-1">
                  / {v2Topics?.length || 0}
                </span>
              </span>
            </div>
          </div>


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
          </div>
      ) : (
        <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm p-6">
          <History hideHeader />
        </div>
      )}

    </div>
  );
}

import React, { useState } from 'react';
import { useStore } from '../store';
import { TrendingUp, Clock, CalendarDays, CheckCircle, BrainCircuit } from 'lucide-react';
import History from './History'; // Reuse History under a tab

export default function Progress() {
  const { sessions, v2Subjects, v2Topics } = useStore();
  const [tab, setTab] = useState<'overview' | 'history'>('overview');

  const totalSeconds = sessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
  const totalHours = Math.round(totalSeconds / 3600);

  let questionsTotal = 0;
  let questionsCorrect = 0;
  sessions.forEach(s => {
    if (s.questionsTotal) questionsTotal += s.questionsTotal;
    if (s.questionsCorrect) questionsCorrect += s.questionsCorrect;
  });
  
  const accuracy = questionsTotal > 0 ? Math.round((questionsCorrect / questionsTotal) * 100) : 0;

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
              <span className="text-2xl font-bold text-neutral-900">{totalHours}h</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
              <CalendarDays size={20} className="text-purple-500 mb-3" />
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1 block">Sessões</span>
              <span className="text-2xl font-bold text-neutral-900">{sessions.length}</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
              <CheckCircle size={20} className="text-emerald-500 mb-3" />
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1 block">Precisão Geral</span>
              <span className="text-2xl font-bold text-neutral-900">{accuracy}%</span>
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

          <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm min-h-[300px] flex items-center justify-center">
             <div className="text-center text-neutral-400">
               <TrendingUp size={48} className="mx-auto mb-4 opacity-50" />
               <p className="font-medium text-neutral-600">Gráficos de evolução em breve.</p>
               <p className="text-sm">Continue registrando sessões para desbloquear insights avançados.</p>
             </div>
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

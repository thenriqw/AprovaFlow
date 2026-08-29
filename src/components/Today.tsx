import React from 'react';
import { useStore } from '../store';
import { Play, CalendarCheck, TrendingUp, Clock } from 'lucide-react';
import { calculatePriorityScore } from '../store';

export default function Today() {
  const { userProfile, cycleQueue, sessions, setActiveTab, activePlanId, plans, setActiveTask } = useStore();
  const activePlan = plans?.find(p => p.id === activePlanId);

  // Time remaining today calculation
  const today = new Date().getDay();
  const availableToday = userProfile?.availableTimePerDay?.[today] || activePlan?.availableTimePerDay?.[today] || 0;
  
  const todaySessions = sessions.filter(s => {
    const d = new Date(s.date);
    const now = new Date();
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  
  const studiedTodaySeconds = todaySessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
  const studiedTodayHours = studiedTodaySeconds / 3600;
  const remainingHours = Math.max(0, availableToday - studiedTodayHours);

  // Get next task
  const state = useStore.getState();
  const queueWithScores = cycleQueue
    .filter(item => item.status === 'pending' || item.status === 'next')
    .map(item => {
      const scoreData = calculatePriorityScore(item, state);
      return { ...item, score: scoreData.score, reasons: scoreData.reasons };
    })
    .sort((a, b) => b.score - a.score);

  const nextTask = queueWithScores[0];
  
  // Find recommended activity if we have v2Activities
  const { v2Activities } = state;
  const recommendedActivity = nextTask && v2Activities?.find(a => 
    a.topicId === nextTask.topicId && a.status !== 'completed'
  );

  const handleStart = () => {
    if (nextTask) {
      setActiveTask(nextTask);
    } else {
      setActiveTask(null);
    }
    setActiveTab('timer');
  };

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
  startOfWeek.setHours(0, 0, 0, 0);

  const weeklySessions = sessions.filter(s => new Date(s.date) >= startOfWeek);
  const weeklySeconds = weeklySessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
  const weeklyHours = Math.round((weeklySeconds / 3600) * 10) / 10;
  
  const weeklyProgress = state.weeklyGoalHours > 0 
    ? Math.min(100, Math.round((weeklyHours / state.weeklyGoalHours) * 100))
    : 0;

  const formatHours = (h: number) => {
    const hrs = Math.floor(h);
    const mins = Math.round((h - hrs) * 60);
    if (hrs > 0 && mins > 0) return `${hrs}h${mins.toString().padStart(2, '0')}m`;
    if (hrs > 0) return `${hrs}h`;
    return `${mins}m`;
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Time Header */}
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-8 bg-neutral-900 rounded-full"></div>
        <div>
          <h1 className="text-3xl font-serif font-bold text-neutral-900">
            {availableToday === 0 ? "Dia de descanso" : 
              remainingHours === 0 && studiedTodayHours > 0 ? "Meta diária concluída ✓" :
              `${formatHours(remainingHours)} disponíveis hoje`}
          </h1>
          {studiedTodayHours > 0 && availableToday > 0 && remainingHours > 0 && (
             <p className="text-neutral-500 text-sm mt-1">Você já estudou {formatHours(studiedTodayHours)} hoje.</p>
          )}
        </div>
      </div>

      {availableToday === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-2xl p-8 text-center shadow-sm">
          <CalendarCheck size={40} className="mx-auto text-neutral-400 mb-4" />
          <h3 className="text-xl font-bold text-neutral-900 mb-2">Hoje está configurado como dia de descanso.</h3>
          <p className="text-neutral-500 mb-6">Aproveite para recarregar as energias ou inicie um estudo livre se desejar.</p>
          <button onClick={() => { setActiveTask(null); setActiveTab('timer'); }} className="px-6 py-3 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-xl transition-all">
            Iniciar estudo livre
          </button>
        </div>
      ) : remainingHours === 0 && studiedTodayHours > 0 ? (
        <div className="bg-white border border-neutral-200 rounded-2xl p-8 text-center shadow-sm">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CalendarCheck size={32} />
          </div>
          <h3 className="text-xl font-bold text-neutral-900 mb-2">Plano de hoje concluído ✓</h3>
          <p className="text-neutral-500 mb-6">Excelente trabalho. Você cumpriu sua meta diária.</p>
          <button onClick={() => { setActiveTask(null); setActiveTab('timer'); }} className="px-6 py-3 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-900 font-bold rounded-xl transition-all">
            Continuar estudando
          </button>
        </div>
      ) : !nextTask && cycleQueue.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-2xl p-8 text-center shadow-sm flex flex-col items-center">
          <div className="w-16 h-16 bg-neutral-100 text-neutral-400 rounded-full flex items-center justify-center mb-4">
            <Clock size={32} />
          </div>
          <h3 className="text-xl font-bold text-neutral-900 mb-2">Seu plano está vazio</h3>
          <p className="text-neutral-500 max-w-md mx-auto mb-6">Você ainda não tem matérias ou atividades no seu plano. Deseja iniciar um estudo livre ou configurar seu plano?</p>
          <div className="flex gap-4">
            <button onClick={() => { setActiveTask(null); setActiveTab('timer'); }} className="px-6 py-3 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-xl transition-all">
              Estudo Livre
            </button>
            <button onClick={() => setActiveTab('plan')} className="px-6 py-3 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-900 font-bold rounded-xl transition-all">
              Abrir Plano
            </button>
          </div>
        </div>
      ) : nextTask ? (
        <div className="space-y-4">
          <h2 className="text-sm font-bold tracking-wider uppercase text-neutral-500 ml-1">Próximo Passo</h2>
          <div className="bg-white border-2 border-neutral-900 rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden group">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-neutral-100 text-neutral-700 text-xs font-bold uppercase tracking-wider rounded-md">
                    {nextTask.subject}
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900">
                  {nextTask.topic}
                </h3>
                
                {nextTask.reasons && nextTask.reasons.length > 0 && (
                  <div className="mt-4 flex items-start gap-2 text-neutral-500">
                    <TrendingUp size={16} className="mt-0.5 flex-shrink-0" />
                    <p className="text-sm leading-relaxed">
                      <span className="font-semibold text-neutral-700">Por que agora?</span> {nextTask.reasons.join(' · ')}
                    </p>
                  </div>
                )}
                {recommendedActivity && (
                  <div className="mt-2 flex items-center gap-3 text-sm font-medium text-neutral-600 bg-neutral-100/50 p-2 rounded-lg inline-flex">
                    <span className="bg-white px-2 py-1 rounded shadow-sm border border-neutral-100 text-neutral-900">{recommendedActivity.type}</span>
                    {recommendedActivity.source && <span>{recommendedActivity.source}</span>}
                    {recommendedActivity.expectedDurationSeconds > 0 && (
                      <>
                        <span className="w-1 h-1 bg-neutral-300 rounded-full"></span>
                        <span>{Math.round(recommendedActivity.expectedDurationSeconds / 60)} min</span>
                      </>
                    )}
                  </div>
                )}
              </div>
              
              <button 
                onClick={handleStart}
                className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-xl transition-transform active:scale-95 flex-shrink-0"
              >
                Começar estudo
                <Play size={18} fill="currentColor" />
              </button>
            </div>
            
            {/* Decorative background element */}
            <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-neutral-50 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-700 pointer-events-none"></div>
          </div>
        </div>
      ) : null}

      {/* Secondary Modules */}
      <div className="grid md:grid-cols-2 gap-6 mt-8">
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <h3 className="text-lg font-bold text-neutral-900 mb-4">Depois</h3>
          {queueWithScores.slice(1, 4).length > 0 ? (
            <div className="space-y-3">
              {queueWithScores.slice(1, 4).map(item => (
                <div key={item.id} className="flex justify-between items-center p-3 hover:bg-neutral-50 rounded-xl transition-colors cursor-default">
                  <div>
                    <p className="text-sm font-bold text-neutral-900">{item.subject}</p>
                    <p className="text-xs text-neutral-500">{item.topic}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-500">Nenhum próximo passo agendado.</p>
          )}
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-neutral-900 mb-1">Resumo da Semana</h3>
            <p className="text-sm text-neutral-500 mb-4">Progresso em relação à meta</p>
          </div>
          <div className="mt-auto">
            <div className="flex justify-between items-end mb-2">
              <span className="text-3xl font-serif font-bold text-neutral-900">{weeklyHours}<span className="text-lg text-neutral-400">h</span></span>
              <span className="text-sm font-medium text-neutral-500">Meta: {state.weeklyGoalHours}h</span>
            </div>
            <div className="h-3 w-full bg-neutral-100 rounded-full overflow-hidden">
              <div className="h-full bg-neutral-900 rounded-full transition-all duration-1000" style={{ width: `${weeklyProgress}%` }}></div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

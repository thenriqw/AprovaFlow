import React from 'react';
import { useStore } from '../store';
import { formatTime } from '../lib/formatters';
import { Target, CheckCircle2, TrendingUp, AlertOctagon, BarChart as BarChartIcon, Calendar } from 'lucide-react';
import { startOfWeek, isAfter, format, eachDayOfInterval, endOfWeek, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { cn } from '../lib/utils';

export default function Dashboard() {
  const { sessions, weeklyGoalHours, cycleQueue, userProfile } = useStore();

  // If literally no data, guide the user
  const hasNoData = sessions.length === 0;
  const hasCycle = cycleQueue.length > 0;
  const hasSubjects = userProfile?.subjects && userProfile.subjects.length > 0;

  // Deriving metrics
  const totalSeconds = sessions.reduce((acc, curr) => acc + curr.durationSeconds, 0);
  const totalQuestions = sessions.reduce((acc, curr) => acc + curr.questionsTotal, 0);
  const correctQuestions = sessions.reduce((acc, curr) => acc + curr.questionsCorrect, 0);
  
  const accuracy = totalQuestions > 0 ? Math.round((correctQuestions / totalQuestions) * 100) : 0;
  
  // Weekly goal approx
  const weeklyGoalSeconds = weeklyGoalHours * 3600;
  const startOfCurrentWeek = startOfWeek(new Date(), { weekStartsOn: 0 }); // Sunday
  const endOfCurrentWeek = endOfWeek(new Date(), { weekStartsOn: 0 });
  const thisWeekSessions = sessions.filter(s => isAfter(new Date(s.date), startOfCurrentWeek));
  const thisWeekSeconds = thisWeekSessions.reduce((acc, curr) => acc + curr.durationSeconds, 0);
  const weeklyProgress = Math.min(100, Math.round((thisWeekSeconds / weeklyGoalSeconds) * 100));

  const recentErrors = [...sessions]
    .filter(s => s.errorReason !== '')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const errorLabels: Record<string, string> = {
    'teoria': 'Falta de Teoria',
    'interpretacao': 'Interpretação',
    'atencao': 'Falta de Atenção',
    'tempo': 'Pressão do Tempo',
    'calculo': 'Erro de Cálculo',
    'outro': 'Outro'
  };

  // Prepare data for chart
  const timeBySubject = sessions.reduce((acc, curr) => {
    acc[curr.subject] = (acc[curr.subject] || 0) + curr.durationSeconds;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(timeBySubject)
    .map(([name, seconds]) => ({
      name,
      minutos: Math.round(seconds / 60)
    }))
    .sort((a, b) => b.minutos - a.minutos)
    .slice(0, 5); // top 5 subjects

  // Theory vs Practice simple metric
  const theoryTime = sessions.filter(s => ['Videoaula', 'Aula presencial', 'Teoria', 'Apostila/Leitura'].includes(s.activityType || '')).reduce((acc, curr) => acc + curr.durationSeconds, 0);
  const practiceTime = sessions.filter(s => ['Questões', 'Simulado'].includes(s.activityType || '')).reduce((acc, curr) => acc + curr.durationSeconds, 0);
  
  const totalTheoryPractice = theoryTime + practiceTime;
  const theoryPercent = totalTheoryPractice > 0 ? Math.round((theoryTime / totalTheoryPractice) * 100) : 0;
  const practicePercent = totalTheoryPractice > 0 ? Math.round((practiceTime / totalTheoryPractice) * 100) : 0;

  // Weekly Heatmap Data
  const daysOfWeek = eachDayOfInterval({ start: startOfCurrentWeek, end: endOfCurrentWeek });
  const heatmapData = daysOfWeek.map(day => {
    const daySessions = thisWeekSessions.filter(s => isSameDay(new Date(s.date), day));
    const seconds = daySessions.reduce((acc, curr) => acc + curr.durationSeconds, 0);
    return {
      date: day,
      label: format(day, 'EEEEEE', { locale: ptBR }),
      hasStudied: seconds > 0,
      isToday: isSameDay(day, new Date())
    };
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Visão Geral</h1>
        <p className="text-neutral-500 mt-1">Acompanhe seu desempenho e diagnostique seus erros.</p>
      </header>

      {hasNoData && (
        <div className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm text-center">
          <h2 className="text-xl font-bold text-neutral-900 mb-2">Bem-vindo(a) ao seu ambiente de estudos!</h2>
          <p className="text-neutral-500 mb-6">Parece que você ainda não registrou nenhuma sessão. Vamos começar?</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            {!hasSubjects && (
              <button onClick={() => useStore.getState().setActiveTab('subjects')} className="px-6 py-3 bg-neutral-900 text-white font-bold rounded-xl hover:bg-neutral-800 transition-all">
                Adicionar matérias
              </button>
            )}
            {hasSubjects && !hasCycle && (
              <button onClick={() => useStore.getState().setActiveTab('import')} className="px-6 py-3 bg-neutral-900 text-white font-bold rounded-xl hover:bg-neutral-800 transition-all">
                Gerar meu ciclo
              </button>
            )}
            {hasCycle && (
              <button onClick={() => useStore.getState().setActiveTab('cycle')} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all">
                Iniciar primeiro estudo
              </button>
            )}
          </div>
        </div>
      )}

      {/* Progress Card & Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm lg:col-span-2">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h3 className="font-semibold text-neutral-900">Meta Semanal</h3>
              <p className="text-sm text-neutral-500">{formatTime(thisWeekSeconds)} de {weeklyGoalHours}h concluídas</p>
            </div>
            <span className="text-2xl font-bold text-neutral-900">{weeklyProgress}%</span>
          </div>
          <div className="w-full bg-neutral-100 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-neutral-900 h-3 rounded-full transition-all duration-1000 ease-out" 
              style={{ width: `${weeklyProgress}%` }}
            />
          </div>
        </div>

        {/* Mini Heatmap */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={18} className="text-neutral-500" />
            <h3 className="font-semibold text-sm text-neutral-900">Dias de Foco</h3>
          </div>
          <div className="flex justify-between items-center gap-1">
            {heatmapData.map((day, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1.5">
                <div 
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300",
                    day.hasStudied ? "bg-green-500 shadow-md shadow-green-500/20" : "bg-neutral-100",
                    day.isToday && !day.hasStudied && "ring-2 ring-neutral-300 ring-offset-2"
                  )}
                />
                <span className={cn(
                  "text-[10px] uppercase font-bold tracking-wider",
                  day.isToday ? "text-neutral-900" : "text-neutral-400"
                )}>
                  {day.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4 text-neutral-500">
            <Target size={20} />
            <h3 className="font-medium text-sm">Tempo Líquido Total</h3>
          </div>
          <p className="text-4xl font-bold tracking-tight text-neutral-900">{formatTime(totalSeconds)}</p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4 text-neutral-500">
            <CheckCircle2 size={20} />
            <h3 className="font-medium text-sm">Questões Resolvidas</h3>
          </div>
          <p className="text-4xl font-bold tracking-tight text-neutral-900">{totalQuestions}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4 text-neutral-500">
            <TrendingUp size={20} />
            <h3 className="font-medium text-sm">Taxa de Acertos</h3>
          </div>
          <p className="text-4xl font-bold tracking-tight text-neutral-900">{accuracy}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Teoria vs Prática */}
        <section className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col justify-center lg:col-span-2">
          <h3 className="font-semibold text-neutral-900 mb-4">Diagnóstico: Teoria vs. Prática</h3>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-neutral-500">Teoria ({theoryPercent}%)</span>
            <span className="text-sm font-medium text-neutral-500">Prática ({practicePercent}%)</span>
          </div>
          <div className="w-full bg-neutral-100 rounded-full h-4 overflow-hidden flex">
            <div 
              className="bg-blue-500 h-4 transition-all duration-1000 ease-out" 
              style={{ width: `${theoryPercent}%` }}
            />
            <div 
              className="bg-green-500 h-4 transition-all duration-1000 ease-out" 
              style={{ width: `${practicePercent}%` }}
            />
          </div>
          <p className="text-xs text-neutral-400 mt-3 text-center">
            {totalTheoryPractice < 3600 // less than 1 hour of data
              ? "Ainda há poucos registros para gerar uma recomendação confiável."
              : `Seu tempo registrado está distribuído em aproximadamente ${theoryPercent}% teoria e ${practicePercent}% prática.`}
          </p>
        </section>

        {/* Distribuição de Tempo (Gráfico) */}
        <section className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <BarChartIcon size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-neutral-900">Distribuição do Tempo</h3>
              <p className="text-sm text-neutral-500">Minutos focados por matéria</p>
            </div>
          </div>
          
          <div className="flex-1 min-h-[250px] flex items-center justify-center">
            {chartData.length === 0 ? (
              <p className="text-neutral-400">Dados insuficientes para gerar gráfico.</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#737373' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#737373' }} />
                  <Tooltip 
                    cursor={{ fill: '#f5f5f5' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                  />
                  <Bar dataKey="minutos" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#171717' : '#d4d4d8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        {/* Caderno de Erros */}
        <section className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
              <AlertOctagon size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-neutral-900">Caderno Diagnóstico</h3>
              <p className="text-sm text-neutral-500">Últimos erros mapeados</p>
            </div>
          </div>
          
          {recentErrors.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center text-center text-neutral-400">
              Nenhum erro registrado recentemente.
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto max-h-[250px] pr-2">
              {recentErrors.map((session, idx) => (
                <div key={idx} className="flex justify-between items-center p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                  <div>
                    <p className="font-semibold text-neutral-900">{session.subject}</p>
                    <p className="text-sm text-neutral-500">{session.topic}</p>
                  </div>
                  <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                    {errorLabels[session.errorReason] || session.errorReason}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

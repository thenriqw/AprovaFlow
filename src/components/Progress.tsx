import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { TrendingUp, Clock, CalendarDays, CheckCircle, BrainCircuit, Flame, Calendar as CalendarIcon } from 'lucide-react';
import History from './History';
import { calculateStreak } from '../lib/streakUtils';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

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
  
  const accuracy = questionsTotal > 0 ? Math.round((questionsCorrect / questionsTotal) * 100) : 0;

  const { currentStreak, maxStreak, activityMap } = useMemo(() => calculateStreak(sessions), [sessions]);

  // Data for Pie Chart (Time per Subject)
  const pieData = useMemo(() => {
    if (!v2Subjects) return [];
    return v2Subjects.map(sub => {
      const subSessions = sessions.filter(s => s.subjectId === sub.id);
      const val = subSessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
      return {
        name: sub.name,
        value: Math.round(val / 60), // in minutes for better scale
        color: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#f43f5e', '#6366f1'][parseInt(sub.id.replace(/\D/g, '')) % 6 || 0]
      };
    }).filter(d => d.value > 0);
  }, [sessions, v2Subjects]);

  // Data for Bar Chart (Last 7 Days)
  const barData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const weekDay = d.toLocaleDateString('pt-BR', { weekday: 'short' });
      
      const seconds = activityMap[dateStr] || 0;
      data.push({
        name: weekDay,
        horas: Number((seconds / 3600).toFixed(1)),
        dateStr
      });
    }
    return data;
  }, [activityMap]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-8 bg-neutral-900 rounded-full"></div>
          <div>
            <h1 className="text-3xl font-serif font-bold text-neutral-900">Desempenho</h1>
            <p className="text-neutral-500 text-sm mt-1">Seu painel analítico e gamificação.</p>
          </div>
        </div>
        <div className="flex bg-neutral-100 p-1 rounded-lg">
          <button 
            onClick={() => setTab('overview')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'overview' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500 hover:text-neutral-900'}`}
          >
            Métricas
          </button>
          <button 
            onClick={() => setTab('history')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'history' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500 hover:text-neutral-900'}`}
          >
            Histórico
          </button>
        </div>
      </div>

      {tab === 'overview' ? (
        <div className="space-y-6">
          {/* Top Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm relative overflow-hidden">
              <Flame size={48} className="absolute -right-4 -bottom-4 text-orange-50 opacity-50" />
              <Flame size={20} className="text-orange-500 mb-3" />
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1 block">Ofensiva</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-neutral-900">{currentStreak}</span>
                <span className="text-sm font-medium text-neutral-400">dias</span>
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm relative overflow-hidden">
              <Clock size={48} className="absolute -right-4 -bottom-4 text-blue-50 opacity-50" />
              <Clock size={20} className="text-blue-500 mb-3" />
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1 block">Tempo Total</span>
              <span className="text-2xl font-black text-neutral-900">{totalFormatted}</span>
            </div>
            
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm relative overflow-hidden">
              <CheckCircle size={48} className="absolute -right-4 -bottom-4 text-emerald-50 opacity-50" />
              <CheckCircle size={20} className="text-emerald-500 mb-3" />
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1 block">Precisão</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-neutral-900">{accuracy}%</span>
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm relative overflow-hidden">
              <BrainCircuit size={48} className="absolute -right-4 -bottom-4 text-purple-50 opacity-50" />
              <BrainCircuit size={20} className="text-purple-500 mb-3" />
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1 block">Tópicos</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-neutral-900">
                  {new Set(sessions.filter(s => s.topicId).map(s => s.topicId)).size}
                </span>
                <span className="text-sm font-medium text-neutral-400">
                  / {v2Topics?.length || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Last 7 Days Chart */}
            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                  <TrendingUp className="text-neutral-400" size={20}/> Últimos 7 Dias
                </h3>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#737373' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#737373' }} />
                    <Tooltip 
                      cursor={{ fill: '#f5f5f5' }}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e5e5e5', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: number) => [`${value}h`, 'Horas']}
                    />
                    <Bar dataKey="horas" fill="#171717" radius={[6, 6, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Subject Distribution */}
            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                  <CalendarIcon className="text-neutral-400" size={20}/> Foco por Disciplina
                </h3>
              </div>
              
              {pieData.length > 0 ? (
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="h-48 w-48 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                          stroke="none"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                           formatter={(value: number) => [`${value} min`, 'Tempo']}
                           contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="flex-1 space-y-3 w-full">
                    {pieData.slice(0, 5).map((entry, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></span>
                          <span className="text-sm font-medium text-neutral-700 truncate max-w-[120px]" title={entry.name}>{entry.name}</span>
                        </div>
                        <span className="text-sm font-bold text-neutral-900">{formatPreciseHours(entry.value * 60)}</span>
                      </div>
                    ))}
                    {pieData.length > 5 && (
                      <div className="text-xs text-neutral-400 font-medium pl-5">+ {pieData.length - 5} outras disciplinas</div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-48 flex flex-col items-center justify-center text-neutral-400 space-y-2">
                  <BrainCircuit size={32} className="opacity-20" />
                  <p className="text-sm font-medium">Sem dados suficientes.</p>
                </div>
              )}
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

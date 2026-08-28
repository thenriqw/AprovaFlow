import React from 'react';
import { useStore } from '../store';
import { formatTime } from '../lib/formatters';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Trash2, CalendarDays } from 'lucide-react';

export default function History() {
  const { sessions, removeSession } = useStore();

  const sortedSessions = [...sessions].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Histórico de Estudos</h1>
        <p className="text-neutral-500 mt-1">Seu diário completo de horas líquidas e resoluções.</p>
      </header>

      <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden">
        {sortedSessions.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center text-neutral-400">
            <CalendarDays size={48} className="mb-4 text-neutral-300" />
            <p>Nenhuma sessão registrada ainda.</p>
            <p className="text-sm mt-1">Seus estudos aparecerão aqui.</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {sortedSessions.map((session) => (
              <div key={session.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-neutral-50 transition-colors">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-lg text-neutral-900">{session.subject}</h3>
                    <span className="px-2.5 py-0.5 bg-neutral-100 text-neutral-600 text-xs font-semibold rounded-full">
                      {format(parseISO(session.date), "dd 'de' MMM, HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-neutral-500">{session.topic}</p>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm text-neutral-500">Tempo Líquido</p>
                    <p className="font-bold text-neutral-900">{formatTime(session.durationSeconds)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-neutral-500">Desempenho</p>
                    <p className="font-bold text-neutral-900">
                      {session.questionsCorrect}/{session.questionsTotal} 
                      <span className="text-neutral-400 font-normal text-xs ml-1">acertos</span>
                    </p>
                  </div>
                  <button 
                    onClick={() => removeSession(session.id)}
                    className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Excluir sessão"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

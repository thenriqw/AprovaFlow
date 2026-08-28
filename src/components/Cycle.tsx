import React from 'react';
import { useStore } from '../store';
import { RefreshCcw, BookOpen, Play, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';

export default function CycleManager({ onStartTask }: { onStartTask: (subject: string, topic: string) => void }) {
  const { cycleQueue, recalculateRoute } = useStore();

  const handleRecalculate = () => {
    recalculateRoute();
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Meu Ciclo</h1>
          <p className="text-neutral-500 mt-1">Fila dinâmica adaptativa. Não se preocupe com atrasos.</p>
        </div>
        <button 
          onClick={() => {
            if (confirm("Recalcular Rota: A IA reorganizará sua fila de matérias com base no seu desempenho (focando mais nas matérias que você erra mais) e no tempo desde o último estudo. Deseja continuar?")) {
              handleRecalculate();
            }
          }}
          className="px-5 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
        >
          <RefreshCcw size={18} />
          <span>Recalcular Rota</span>
        </button>
      </header>

      <div className="bg-white p-6 md:p-8 rounded-3xl border border-neutral-200 shadow-sm">
        {cycleQueue.length === 0 ? (
          <div className="text-center py-12 text-neutral-400">
            Seu ciclo está vazio. Vá para Ajustes para adicionar matérias.
          </div>
        ) : (
          <div className="space-y-4">
            {cycleQueue.map((item, index) => (
              <div 
                key={item.id} 
                className={cn(
                  "p-5 rounded-2xl border transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative",
                  item.status === 'next' 
                    ? "bg-neutral-900 border-neutral-900 text-white shadow-lg shadow-neutral-900/10 scale-[1.02] z-10" 
                    : item.status === 'done'
                      ? "bg-neutral-50 border-neutral-100 opacity-60"
                      : "bg-white border-neutral-200 text-neutral-900"
                )}
              >
                {item.status === 'next' && (
                  <div className="absolute -top-3 left-6 px-3 py-1 bg-blue-600 text-white text-[10px] uppercase tracking-wider font-bold rounded-full flex gap-2 items-center">
                    <span>Recomendação Atual</span>
                    <span className="opacity-75 font-normal capitalize hidden sm:inline">- Foco Inteligente (Baseado em relevância, revisão ou dificuldade)</span>
                  </div>
                )}
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 shrink-0 flex items-center justify-center rounded-xl font-black text-lg",
                    item.status === 'next' ? "bg-white/10 text-white" : "bg-neutral-100 text-neutral-500"
                  )}>
                    {item.status === 'done' ? <CheckCircle2 size={24} className="text-green-500" /> : 
                      <div className="flex flex-col items-center leading-none">
                        <span className="text-sm font-bold">#{index + 1}</span>
                      </div>
                    }
                  </div>
                  <div>
                    <h3 className={cn(
                      "font-bold text-lg", 
                      item.status === 'next' ? "text-white" : item.status === 'done' ? "text-neutral-400 line-through" : "text-neutral-900"
                    )}>
                      {item.subject}
                    </h3>
                    <p className={cn(
                      "text-sm font-medium mt-0.5", 
                      item.status === 'next' ? "text-neutral-400" : item.status === 'done' ? "text-neutral-400 line-through" : "text-neutral-500"
                    )}>
                      {item.topic}
                    </p>
                  </div>
                </div>
                
                {item.status === 'next' && (
                  <button 
                    onClick={() => onStartTask(item.subject, item.topic)}
                    className="w-full md:w-auto px-6 py-3 bg-white text-neutral-900 font-bold rounded-xl hover:bg-neutral-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <Play size={18} /> Estudar Agora
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useStore, CycleItem } from '../store';
import { Wand2, FileText, CheckCircle2, AlertTriangle, RefreshCcw, Save } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Importer() {
  const { setCycleQueue, cycleQueue, setActiveTab } = useStore();
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [reviewData, setReviewData] = useState<CycleItem[] | null>(null);

  const handleImport = async () => {
    if (text.length > 20000) {
      setError('O texto é muito longo. Limite a 20.000 caracteres.');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/parse-edital', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          editalText: text,
          targetExam: useStore.getState().userProfile?.examName || 'Geral',
          availableWeeklyHours: useStore.getState().weeklyGoalHours || 25
        })
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Erro ao processar');
      }

      // Convert from API format to CycleItem format
      let parsedItems: CycleItem[] = [];
      data.subjects.forEach((subj: any) => {
        subj.topics.forEach((topic: any) => {
          parsedItems.push({
            id: crypto.randomUUID(),
            subject: subj.name,
            topic: topic.title,
            weight: subj.weight || 3,
            status: 'pending'
          });
        });
      });

      if (parsedItems.length > 0) {
        parsedItems[0].status = 'next';
      }

      setReviewData(parsedItems);
    } catch (err: any) {
      console.error(err);
      setError('Falha ao comunicar com o servidor. A IA pode estar indisponível.');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmImport = () => {
    if (!reviewData) return;
    
    // Check if we should append or replace
    if (cycleQueue.length > 0) {
      if (!window.confirm("Isso irá SUBSTITUIR sua fila atual pelas novas matérias. Deseja continuar?")) {
        return;
      }
    }
    
    setCycleQueue(reviewData);
    setIsSuccess(true);
    
    setTimeout(() => {
      setIsSuccess(false);
      setReviewData(null);
      setText('');
      setActiveTab('cycle');
    }, 1500);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Importador Inteligente</h1>
        <p className="text-neutral-500 mt-2">Cole o texto do seu edital ou cronograma. A IA estrutura a fila automaticamente.</p>
      </header>

      {!reviewData ? (
        <div className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm relative overflow-hidden">
          {/* Decorator */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-neutral-50 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6 text-neutral-900">
              <FileText size={24} />
              <h2 className="text-xl font-bold">Conteúdo do Edital</h2>
            </div>
            
            <textarea 
              className="w-full h-64 p-6 bg-neutral-50 rounded-2xl border border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-shadow resize-none text-base leading-relaxed mb-2"
              placeholder="Ex: 1. Biologia: 1.1 Citologia, Membrana Plasmática, Organelas. 2. Matemática..."
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (e.target.value.length > 20000) {
                  setError('Limite de caracteres excedido (20.000 max).');
                } else {
                  setError('');
                }
              }}
            />
            <div className="flex justify-end mb-4">
              <span className={cn("text-xs font-bold", text.length > 20000 ? "text-red-500" : "text-neutral-400")}>
                {text.length} / 20.000
              </span>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-2">
                <AlertTriangle size={18} />
                <span className="text-sm font-bold">{error}</span>
              </div>
            )}
            
            <button 
              onClick={handleImport}
              disabled={isLoading || !text || text.length > 20000 || isSuccess}
              className="w-full py-5 bg-neutral-900 text-white font-bold rounded-2xl hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-400 transition-all flex items-center justify-center gap-3 text-lg"
            >
              {isLoading ? (
                <><Wand2 size={24} className="animate-pulse" /> Extraindo Estrutura...</>
              ) : (
                <><Wand2 size={24} /> Analisar Edital</>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-neutral-900">Revisar Matérias ({reviewData.length} tópicos)</h2>
            <button 
              onClick={() => setReviewData(null)}
              className="px-4 py-2 text-sm font-bold text-neutral-500 hover:text-neutral-900 bg-neutral-100 rounded-lg"
            >
              Voltar e Editar Texto
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2 mb-6 pr-2">
            {reviewData.map((item, idx) => (
              <div key={idx} className="p-3 bg-neutral-50 border border-neutral-100 rounded-xl flex justify-between items-center">
                <div>
                  <span className="font-bold text-neutral-900 block">{item.subject}</span>
                  <span className="text-sm text-neutral-500">{item.topic}</span>
                </div>
                <span className="text-xs font-bold px-2 py-1 bg-neutral-200 text-neutral-600 rounded">
                  Peso {item.weight}
                </span>
              </div>
            ))}
          </div>

          <button 
            onClick={confirmImport}
            disabled={isSuccess}
            className="w-full py-5 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 disabled:bg-blue-300 transition-all flex items-center justify-center gap-3 text-lg"
          >
            {isSuccess ? (
              <><CheckCircle2 size={24} className="text-white" /> Fila Salva!</>
            ) : (
              <><Save size={24} /> Confirmar e Gerar Ciclo</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

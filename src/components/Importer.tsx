import React, { useState } from 'react';
import { useStore, CycleItem, SubjectConfig, TopicConfig } from '../store';
import { Wand2, FileText, CheckCircle2, AlertTriangle, Save, Trash2, Plus, Edit2 } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Importer() {
  const { setCycleQueue, cycleQueue, setActiveTab, userProfile, updateUserProfile, syncCycleWithSubjects } = useStore();
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  
  // Review state
  const [reviewSubjects, setReviewSubjects] = useState<(Omit<SubjectConfig, 'id'> & { id?: string })[] | null>(null);

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
          targetExam: userProfile?.examName || 'Geral',
          availableWeeklyHours: useStore.getState().weeklyGoalHours || 25
        })
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Erro ao processar');
      }

      if (!data.subjects || data.subjects.length === 0) {
        setError('Não foi possível interpretar este conteúdo com segurança. Revise o texto e tente novamente.');
        return;
      }

      const parsed: (Omit<SubjectConfig, 'id'> & { id?: string })[] = data.subjects.map((s: any) => ({
        id: crypto.randomUUID(),
        name: s.name,
        difficulty: 'medium',
        importance: s.weight || 3,
        topics: s.topics.map((t: any) => ({ id: crypto.randomUUID(), name: t.title }))
      }));

      setReviewSubjects(parsed);
    } catch (err: any) {
      console.error(err);
      setError('Falha ao comunicar com o servidor. A IA pode estar indisponível.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSubjectField = (index: number, field: string, value: any) => {
    setReviewSubjects(prev => {
      if (!prev) return prev;
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const removeSubject = (index: number) => {
    setReviewSubjects(prev => {
      if (!prev) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  const removeTopic = (subIndex: number, topIndex: number) => {
    setReviewSubjects(prev => {
      if (!prev) return prev;
      const next = [...prev];
      const nextTopics = [...next[subIndex].topics];
      nextTopics.splice(topIndex, 1);
      next[subIndex] = { ...next[subIndex], topics: nextTopics };
      return next;
    });
  };

  const addTopic = (subIndex: number) => {
    setReviewSubjects(prev => {
      if (!prev) return prev;
      const next = [...prev];
      next[subIndex] = { 
        ...next[subIndex], 
        topics: [...next[subIndex].topics, { id: crypto.randomUUID(), name: 'Novo Assunto' }] 
      };
      return next;
    });
  };

  const confirmImport = (mode: 'append' | 'replace') => {
    if (!reviewSubjects || !userProfile) return;
    
    let nextSubjects = [...userProfile.subjects];
    
    if (mode === 'replace') {
      if (!window.confirm("Isso irá SUBSTITUIR seu plano atual pelas novas matérias. Histórico será mantido para os IDs antigos, mas a fila atual será limpa. Continuar?")) {
        return;
      }
      nextSubjects = reviewSubjects.map(s => ({ ...s, id: s.id || crypto.randomUUID() })) as SubjectConfig[];
    } else {
      nextSubjects = [...nextSubjects, ...reviewSubjects.map(s => ({ ...s, id: s.id || crypto.randomUUID() })) as SubjectConfig[]];
    }
    
    updateUserProfile({ ...userProfile, subjects: nextSubjects });
    syncCycleWithSubjects();
    
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setReviewSubjects(null);
      setText('');
      setActiveTab('cycle');
    }, 1500);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Importador</h1>
        <p className="text-neutral-500 mt-2">Cole o texto do seu edital ou cronograma. O éFederal estrutura a fila para você.</p>
      </header>

      {!reviewSubjects ? (
        <div className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm relative overflow-hidden">
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
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
            <h2 className="text-xl font-bold text-neutral-900">Revisar Matérias Extraídas</h2>
            <button 
              onClick={() => setReviewSubjects(null)}
              className="px-4 py-2 text-sm font-bold text-neutral-500 hover:text-neutral-900 bg-neutral-100 rounded-lg"
            >
              Voltar
            </button>
          </div>

          <div className="max-h-[500px] overflow-y-auto space-y-4 mb-6 pr-2">
            {reviewSubjects.map((subject, subIdx) => (
              <div key={subject.id} className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-3">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 space-y-2">
                    <input 
                      type="text" 
                      value={subject.name}
                      onChange={(e) => updateSubjectField(subIdx, 'name', e.target.value)}
                      className="w-full p-2 font-bold text-lg border border-neutral-200 rounded bg-white"
                      placeholder="Nome da matéria"
                    />
                    <div className="flex gap-4">
                      <select 
                        value={subject.importance}
                        onChange={(e) => updateSubjectField(subIdx, 'importance', parseInt(e.target.value))}
                        className="p-1 border border-neutral-200 rounded text-sm bg-white"
                      >
                        {[1,2,3,4,5].map(v => <option key={v} value={v}>Importância {v}</option>)}
                      </select>
                    </div>
                  </div>
                  <button onClick={() => removeSubject(subIdx)} className="p-2 text-red-500 hover:bg-red-50 rounded">
                    <Trash2 size={18} />
                  </button>
                </div>
                
                <div className="pl-4 border-l-2 border-neutral-200 space-y-2">
                  {subject.topics.map((topic, topIdx) => (
                    <div key={topic.id} className="flex gap-2 items-center">
                      <input 
                        type="text"
                        value={topic.name}
                        onChange={(e) => {
                          const newTopics = [...subject.topics];
                          newTopics[topIdx].name = e.target.value;
                          updateSubjectField(subIdx, 'topics', newTopics);
                        }}
                        className="flex-1 p-1 text-sm border border-neutral-200 rounded bg-white"
                      />
                      <button onClick={() => removeTopic(subIdx, topIdx)} className="p-1 text-red-400 hover:bg-red-50 rounded">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <button onClick={() => addTopic(subIdx)} className="text-xs font-bold text-blue-600 flex items-center gap-1 mt-2">
                    <Plus size={14} /> Adicionar Assunto
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={() => confirmImport('append')}
              disabled={isSuccess}
              className="w-full py-4 bg-neutral-900 text-white font-bold rounded-2xl hover:bg-neutral-800 transition-all flex items-center justify-center gap-2"
            >
              <Save size={20} /> Adicionar ao meu plano
            </button>
            <button 
              onClick={() => confirmImport('replace')}
              disabled={isSuccess}
              className="w-full py-4 bg-red-50 text-red-700 font-bold rounded-2xl hover:bg-red-100 transition-all flex items-center justify-center gap-2"
            >
              <AlertTriangle size={20} /> Substituir plano atual
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { useStore } from '../store';
import { ChevronRight, Plus, Trash2, CheckCircle2, Zap } from 'lucide-react';
import { PLAN_TEMPLATES } from '../data/templates';

export default function CreatePlan() {
  const { setActiveTab, createPlan } = useStore();
  const [name, setName] = useState('');
  const [objective, setObjective] = useState('');
  const [examDate, setExamDate] = useState('');
  const [hoursPerDay, setHoursPerDay] = useState('');
  const [planType, setPlanType] = useState<'concurso' | 'vestibular' | 'academico'>('concurso');
  
  // Academic specific
  const [semester, setSemester] = useState('');
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  
  const handleUseTemplate = async (template: any) => {
    setLoading(true);
    setError(null);
    try {
      const avail = {0:3, 1:3, 2:3, 3:3, 4:3, 5:3, 6:3};

      await createPlan({
        name: template.name,
        objective: template.name,
        type: template.type,
        examDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(), // 1 year from now
        availableTimePerDay: avail,
        initialSubjects: template.subjects.map((sub: any) => ({
          name: sub.name,
          professor: sub.professor,
          semester: template.semester,
          maxAbsences: sub.maxAbsences ? parseInt(sub.maxAbsences) : null,
          topics: sub.topics // Passes the topics array to the store action
        }))
      });
      setActiveTab('today');
    } catch (error) {
      console.error(error);
      setError('Erro ao criar plano a partir do modelo.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubject = () => {
    setSubjects([...subjects, { name: '', professor: '', maxAbsences: '' }]);
  };

  const handleRemoveSubject = (idx: number) => {
    setSubjects(subjects.filter((_, i) => i !== idx));
  };

  const handleSubjectChange = (idx: number, field: string, value: string) => {
    const updated = [...subjects];
    updated[idx] = { ...updated[idx], [field]: value };
    setSubjects(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setLoading(true);
    try {
      const hrs = parseInt(hoursPerDay) || 0;
      
      const initialSubjects = planType === 'academico' ? subjects.filter(s => s.name.trim()).map(s => ({
        name: s.name.trim(),
        professor: s.professor?.trim() || undefined,
        semester: semester.trim() || undefined,
        maxAbsences: s.maxAbsences ? parseInt(s.maxAbsences) : undefined
      })) : undefined;

      await createPlan({
        name: name.trim(),
        objective: objective.trim(),
        type: planType,
        examDate,
        availableTimePerDay: { 0:0, 1:hrs, 2:hrs, 3:hrs, 4:hrs, 5:hrs, 6:0 },
        initialSubjects
      });
      setActiveTab('today');
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Erro ao criar plano.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-8 bg-neutral-900 rounded-full"></div>
        <div>
          <h1 className="text-3xl font-serif font-bold text-neutral-900">Novo Plano</h1>
          <p className="text-neutral-500 text-sm mt-1">Crie um novo plano de estudos.</p>
        </div>
      </div>

      
      {/* Seção de Modelos Pré-definidos */}
      
      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl flex items-center gap-3 animate-in fade-in">
          <div className="w-1.5 h-full bg-red-500 rounded-full"></div>
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="mb-10">
        <h2 className="text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
          <Zap className="text-amber-500" /> Comece com um Modelo Pré-definido
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {PLAN_TEMPLATES.map(template => (
            <div key={template.id} className="bg-white border-2 border-neutral-100 rounded-2xl p-6 shadow-sm hover:border-neutral-900 transition-all flex flex-col group">
              <div className="flex items-start justify-between mb-4">
                <span className="px-3 py-1 bg-neutral-900 text-white text-xs font-bold uppercase tracking-wider rounded-md">
                  {template.type === 'academico' ? 'Faculdade' : template.type === 'vestibular' ? 'ENEM' : 'Concurso'}
                </span>
                {template.semester && (
                  <span className="px-2 py-1 bg-neutral-100 text-neutral-600 text-xs font-semibold rounded-md">
                    {template.semester}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-neutral-900 mb-2">{template.name}</h3>
              <p className="text-sm text-neutral-500 mb-6 flex-grow">{template.description}</p>
              <div className="space-y-2 mb-6">
                <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  Disciplinas ({template.subjects.length})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {template.subjects.slice(0, 4).map(sub => (
                    <span key={sub.name} className="px-2 py-1 bg-neutral-50 text-neutral-600 text-xs rounded border border-neutral-100 truncate max-w-full">
                      {sub.name}
                    </span>
                  ))}
                  {template.subjects.length > 4 && (
                    <span className="px-2 py-1 bg-neutral-50 text-neutral-500 text-xs rounded border border-neutral-100">
                      +{template.subjects.length - 4}
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleUseTemplate(template)}
                disabled={loading}
                className="w-full py-3 bg-white border-2 border-neutral-200 text-neutral-900 font-bold rounded-xl group-hover:bg-neutral-900 group-hover:text-white group-hover:border-neutral-900 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Criando...' : 'Usar este Modelo'}
                {!loading && <CheckCircle2 size={18} />}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="relative flex items-center mb-8">
        <div className="flex-grow border-t border-neutral-200"></div>
        <span className="flex-shrink-0 mx-4 text-neutral-400 text-sm font-semibold uppercase tracking-widest">
          Ou crie um plano personalizado
        </span>
        <div className="flex-grow border-t border-neutral-200"></div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-2xl border border-neutral-200 shadow-sm space-y-8">
        
        {/* Tipo de Plano */}
        <div className="space-y-3">
          <label className="block text-sm font-bold text-neutral-900">Selecione o Objetivo</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { id: 'concurso', label: 'Concurso Público' },
              { id: 'vestibular', label: 'Vestibular / ENEM' },
              { id: 'academico', label: 'Faculdade / Acadêmico' }
            ].map(type => (
              <button
                key={type.id}
                type="button"
                onClick={() => setPlanType(type.id as any)}
                className={`p-4 rounded-xl border text-center font-semibold transition-all ${
                  planType === type.id 
                  ? 'border-neutral-900 bg-neutral-900 text-white' 
                  : 'border-neutral-200 text-neutral-600 hover:border-neutral-400'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-neutral-100">
          <div>
            <label className="block text-sm font-bold text-neutral-900 mb-1">Nome do Plano</label>
            <input 
              type="text" 
              required
              placeholder={planType === 'academico' ? 'Ex: Engenharia 4º Semestre' : 'Ex: Concurso INSS 2026'}
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 focus:outline-none"
            />
          </div>

          {planType === 'academico' && (
            <div>
              <label className="block text-sm font-bold text-neutral-900 mb-1">Semestre Atual (Opcional)</label>
              <input 
                type="text" 
                placeholder="Ex: 2026.2"
                value={semester} 
                onChange={e => setSemester(e.target.value)} 
                className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-neutral-900 mb-1">Objetivo (Opcional)</label>
            <input 
              type="text" 
              placeholder={planType === 'academico' ? 'Ex: Passar em todas as matérias' : 'Ex: Aprovação no cargo de Analista'}
              value={objective} 
              onChange={e => setObjective(e.target.value)} 
              className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-neutral-900 mb-1">
              {planType === 'academico' ? 'Data Fim do Semestre (Opcional)' : 'Data da Prova (Opcional)'}
            </label>
            <input 
              type="date" 
              value={examDate} 
              onChange={e => setExamDate(e.target.value)} 
              className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 focus:outline-none text-neutral-900"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-neutral-900 mb-1">Horas de Estudo por Dia (Opcional)</label>
            <input 
              type="number" 
              min="0"
              max="24"
              placeholder="Ex: 2"
              value={hoursPerDay} 
              onChange={e => setHoursPerDay(e.target.value)} 
              className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 focus:outline-none text-neutral-900"
            />
          </div>
        </div>

        {planType === 'academico' && (
          <div className="pt-6 border-t border-neutral-100 space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-bold text-neutral-900">Disciplinas Iniciais</label>
              <button 
                type="button" 
                onClick={handleAddSubject}
                className="text-sm font-semibold text-blue-600 flex items-center gap-1 hover:text-blue-700"
              >
                <Plus size={16} /> Adicionar Disciplina
              </button>
            </div>
            
            <div className="space-y-4">
              {subjects.map((sub, idx) => (
                <div key={idx} className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 relative group">
                  <button 
                    type="button"
                    onClick={() => handleRemoveSubject(idx)}
                    className="absolute top-4 right-4 text-neutral-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={16} />
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-8">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-600 mb-1">Nome da Disciplina</label>
                      <input 
                        type="text" 
                        required
                        value={sub.name}
                        onChange={e => handleSubjectChange(idx, 'name', e.target.value)}
                        placeholder="Cálculo I"
                        className="w-full p-2 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-600 mb-1">Professor (Opcional)</label>
                      <input 
                        type="text" 
                        value={sub.professor}
                        onChange={e => handleSubjectChange(idx, 'professor', e.target.value)}
                        placeholder="Prof. Carlos"
                        className="w-full p-2 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-600 mb-1">Limite de Faltas (Opcional)</label>
                      <input 
                        type="number" 
                        value={sub.maxAbsences}
                        onChange={e => handleSubjectChange(idx, 'maxAbsences', e.target.value)}
                        placeholder="Ex: 15"
                        className="w-full p-2 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
                      />
                    </div>
                  </div>
                </div>
              ))}
              {subjects.length === 0 && (
                <p className="text-sm text-neutral-500 text-center py-4 bg-neutral-50 rounded-xl border border-neutral-200 border-dashed">
                  Nenhuma disciplina adicionada. Você poderá adicioná-las depois.
                </p>
              )}
            </div>
          </div>
        )}

        <div className="pt-4 flex justify-end gap-3">
          <button 
            type="button" 
            onClick={() => setActiveTab('today')}
            className="px-6 py-3 font-bold text-neutral-600 hover:bg-neutral-100 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            disabled={loading || !name.trim()}
            className="px-6 py-3 bg-neutral-900 text-white font-bold rounded-xl hover:bg-neutral-800 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {loading ? 'Criando...' : 'Criar Plano'}
            <ChevronRight size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}

import React, { useState } from 'react';
import { useStore } from '../store';
import { ChevronRight } from 'lucide-react';

export default function CreatePlan() {
  const { setActiveTab, createPlan } = useStore();

  const [name, setName] = useState('');
  const [objective, setObjective] = useState('');
  const [examDate, setExamDate] = useState('');
  const [hoursPerDay, setHoursPerDay] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setLoading(true);
    try {
      const hrs = parseInt(hoursPerDay) || 0;
      await createPlan({
        name: name.trim(),
        objective: objective.trim(),
        examDate,
        availableTimePerDay: { 0:0, 1:hrs, 2:hrs, 3:hrs, 4:hrs, 5:hrs, 6:0 }
      });
      setActiveTab('today');

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-8 bg-neutral-900 rounded-full"></div>
        <div>
          <h1 className="text-3xl font-serif font-bold text-neutral-900">Novo Plano</h1>
          <p className="text-neutral-500 text-sm mt-1">Crie um novo plano de estudos.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-2xl border border-neutral-200 shadow-sm space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-neutral-900 mb-1">Nome do Plano</label>
            <input 
              type="text" 
              required
              placeholder="Ex: Concurso INSS 2026"
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-neutral-900 mb-1">Objetivo (Opcional)</label>
            <input 
              type="text" 
              placeholder="Ex: Aprovação no cargo de Analista"
              value={objective} 
              onChange={e => setObjective(e.target.value)} 
              className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-neutral-900 mb-1">Data da Prova (Opcional)</label>
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

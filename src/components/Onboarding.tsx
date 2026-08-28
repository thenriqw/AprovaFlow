import React, { useState } from 'react';
import { useStore, UserProfile, SubjectConfig } from '../store';
import { APP_NAME } from '../config/constants';
import { ChevronRight, Plus, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Onboarding() {
  const { completeOnboarding, skipOnboarding, recalculateRoute } = useStore();
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<UserProfile>({
    objective: '',
    examName: '',
    examDate: '',
    availableTimePerDay: { 1: 2, 2: 2, 3: 2, 4: 2, 5: 2 }, // default Mon-Fri 2h
    subjects: []
  });
  
  const [newSubject, setNewSubject] = useState<Omit<SubjectConfig, 'id' | 'topics'> & { topics?: any[] }>({ name: '', difficulty: 'medium', importance: 3 });

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const setDayHours = (day: number, hours: number) => {
    setProfile(p => {
      const newTime = { ...p.availableTimePerDay };
      if (hours <= 0) {
        delete newTime[day];
      } else {
        newTime[day] = hours;
      }
      return { ...p, availableTimePerDay: newTime };
    });
  };

  const addSubject = () => {
    if (newSubject.name.trim()) {
      setProfile(p => ({ ...p, subjects: [...p.subjects, { ...newSubject, id: crypto.randomUUID(), topics: [] }] }));
      setNewSubject({ name: '', difficulty: 'medium', importance: 3 });
    }
  };

  const removeSubject = (index: number) => {
    setProfile(p => ({
      ...p,
      subjects: p.subjects.filter((_, i) => i !== index)
    }));
  };

  const finish = () => {
    completeOnboarding(profile);
    recalculateRoute();
  };

  const daysOfWeek = [
    { value: 0, label: 'D' },
    { value: 1, label: 'S' },
    { value: 2, label: 'T' },
    { value: 3, label: 'Q' },
    { value: 4, label: 'Q' },
    { value: 5, label: 'S' },
    { value: 6, label: 'S' },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-xl w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
        
        {/* Decorator */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-neutral-800 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none opacity-50" />
        
        <div className="relative z-10">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-black tracking-tight">{APP_NAME}</h1>
            <p className="text-neutral-400 mt-2">Configure sua rotina para gerarmos um ciclo adaptativo preciso.</p>
          </div>

          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-300 mb-2">Qual seu objetivo principal?</label>
                <select 
                  className="w-full p-4 bg-neutral-950 rounded-xl border border-neutral-800 text-white focus:outline-none focus:border-neutral-500"
                  value={profile.objective}
                  onChange={e => setProfile({...profile, objective: e.target.value})}
                >
                  <option value="">Selecione...</option>
                  <option value="ENEM">ENEM</option>
                  <option value="Vestibular">Vestibular Tradicional</option>
                  <option value="Concurso">Concurso Público</option>
                  <option value="Faculdade">Faculdade / Pesquisa</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-300 mb-2">Nome da prova / Edital</label>
                <input 
                  type="text" 
                  placeholder="Ex: ENEM 2026, Polícia Federal..."
                  className="w-full p-4 bg-neutral-950 rounded-xl border border-neutral-800 text-white focus:outline-none focus:border-neutral-500"
                  value={profile.examName}
                  onChange={e => setProfile({...profile, examName: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-300 mb-2">Data prevista (opcional)</label>
                <input 
                  type="date" 
                  className="w-full p-4 bg-neutral-950 rounded-xl border border-neutral-800 text-white focus:outline-none focus:border-neutral-500"
                  value={profile.examDate}
                  onChange={e => setProfile({...profile, examDate: e.target.value})}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-300 mb-4">Horas disponíveis por dia</label>
                <div className="space-y-3">
                  {daysOfWeek.map(day => (
                    <div key={day.value} className="flex items-center justify-between gap-4 bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                      <span className="font-bold text-neutral-300 w-8">{day.label}</span>
                      <input 
                        type="range" 
                        min="0" max="14" 
                        className="flex-1 h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-white"
                        value={profile.availableTimePerDay[day.value] || 0}
                        onChange={e => setDayHours(day.value, parseInt(e.target.value))}
                      />
                      <span className="font-bold text-white w-12 text-right">
                        {profile.availableTimePerDay[day.value] || 0}h
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-sm font-bold text-neutral-400 mt-6 text-center">
                  Meta gerada: <span className="text-white">{Object.values(profile.availableTimePerDay).reduce((a: any, b: any) => a + b, 0)}h semanais</span>
                </p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-300 mb-2">Adicionar Matérias Iniciais (Opcional)</label>
                <div className="flex gap-2 mb-4">
                  <input 
                    type="text" 
                    placeholder="Ex: Matemática"
                    className="flex-1 p-3 bg-neutral-950 rounded-xl border border-neutral-800 text-white focus:outline-none focus:border-neutral-500"
                    value={newSubject.name}
                    onChange={e => setNewSubject({...newSubject, name: e.target.value})}
                  />
                  <select 
                    className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 text-white focus:outline-none"
                    value={newSubject.difficulty}
                    onChange={e => setNewSubject({...newSubject, difficulty: e.target.value as any})}
                    title="Dificuldade"
                  >
                    <option value="low">Fácil</option>
                    <option value="medium">Média</option>
                    <option value="high">Difícil</option>
                  </select>
                  <button 
                    onClick={addSubject}
                    className="p-3 bg-white text-neutral-900 rounded-xl font-bold hover:bg-neutral-200"
                  >
                    <Plus size={20} />
                  </button>
                </div>
                
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                  {profile.subjects.map((sub, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-neutral-800 rounded-lg">
                      <span className="font-medium text-sm">{sub.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-neutral-400 capitalize">{sub.difficulty}</span>
                        <button onClick={() => removeSubject(idx)} className="text-neutral-500 hover:text-red-400">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {profile.subjects.length === 0 && (
                    <p className="text-center text-neutral-500 text-sm py-4">Nenhuma matéria adicionada ainda.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="mt-10 flex gap-4">
            {step > 1 && (
              <button 
                onClick={handleBack}
                className="px-6 py-4 rounded-xl text-neutral-400 hover:text-white font-bold transition-colors"
              >
                Voltar
              </button>
            )}
            
            {step < 3 ? (
              <button 
                onClick={handleNext}
                className="flex-1 py-4 bg-white text-neutral-900 font-bold rounded-xl hover:bg-neutral-200 transition-colors flex justify-center items-center gap-2"
              >
                Continuar <ChevronRight size={20} />
              </button>
            ) : (
              <button 
                onClick={finish}
                className="flex-1 py-4 bg-white text-neutral-900 font-bold rounded-xl hover:bg-neutral-200 transition-colors flex justify-center items-center gap-2"
              >
                Finalizar Configuração <ChevronRight size={20} />
              </button>
            )}
          </div>

          <div className="mt-6 text-center">
            <button 
              onClick={skipOnboarding}
              className="text-xs text-neutral-500 hover:text-neutral-300 underline underline-offset-4"
            >
              Pular por enquanto. O ciclo será menos preciso sem a configuração inicial.
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

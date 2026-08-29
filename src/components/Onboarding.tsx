import React, { useState } from 'react';
import { Target, FileText, Settings, Play } from 'lucide-react';
import { useStore } from '../store';
import { APP_NAME } from '../config/constants';

export default function Onboarding() {
  const { completeOnboarding } = useStore();
  const [step, setStep] = useState<'options' | 'loading'>('options');

  const handleSelectPath = async (path: string) => {
    setStep('loading');
    
    // For free mode, 0h available per day so it doesn't inflate capacity
    const defaultProfile = {
      objective: path === 'free' ? 'Modo Livre' : 'Novo Plano',
      examName: '', examDate: '',
      availableTimePerDay: path === 'free' ? { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 } : { 0: 0, 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 0 },
      subjects: []
    };

    try {
      if (path === 'objective') {
        // We will just complete with default and let them edit it in CreatePlan or PlanOverview
        await completeOnboarding(defaultProfile);
        useStore.getState().setActiveTab('plan');
      } else if (path === 'import') {
        await completeOnboarding(defaultProfile);
        useStore.getState().setActiveTab('inbox');
      } else if (path === 'manual') {
        await completeOnboarding(defaultProfile);
        useStore.getState().setActiveTab('content');
      } else {
        await completeOnboarding(defaultProfile);
        useStore.getState().setActiveTab('today');
      }
    } catch (e) {
      console.error(e);
      setStep('options');
      alert("Erro ao criar plano. Tente novamente.");
    }
  };

  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-neutral-900 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-neutral-500 font-medium">Preparando seu ambiente...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h2 className="text-4xl font-serif font-bold text-neutral-900 tracking-tight">Como você quer começar?</h2>
        <p className="mt-3 text-neutral-500 text-lg">Escolha o caminho que melhor se adapta a você.</p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-4 shadow-sm border border-neutral-200 rounded-3xl sm:px-10 grid gap-4">
          
          <button 
            onClick={() => handleSelectPath('objective')}
            className="flex items-start gap-4 p-5 rounded-2xl border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 transition-all text-left group"
          >
            <div className="w-12 h-12 bg-neutral-100 group-hover:bg-neutral-900 text-neutral-600 group-hover:text-white rounded-xl flex items-center justify-center flex-shrink-0 transition-colors">
              <Target size={24} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">Tenho uma prova ou objetivo</h3>
              <p className="text-sm text-neutral-500 mt-1 leading-relaxed">Já sabe o que quer? Vamos ajudar a calcular sua demanda.</p>
            </div>
          </button>

          <button 
            onClick={() => handleSelectPath('import')}
            className="flex items-start gap-4 p-5 rounded-2xl border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 transition-all text-left group"
          >
            <div className="w-12 h-12 bg-neutral-100 group-hover:bg-neutral-900 text-neutral-600 group-hover:text-white rounded-xl flex items-center justify-center flex-shrink-0 transition-colors">
              <FileText size={24} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">Tenho um edital ou cronograma</h3>
              <p className="text-sm text-neutral-500 mt-1 leading-relaxed">Cole o texto do material para gerar seu plano automaticamente.</p>
            </div>
          </button>

          <button 
            onClick={() => handleSelectPath('manual')}
            className="flex items-start gap-4 p-5 rounded-2xl border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 transition-all text-left group"
          >
            <div className="w-12 h-12 bg-neutral-100 group-hover:bg-neutral-900 text-neutral-600 group-hover:text-white rounded-xl flex items-center justify-center flex-shrink-0 transition-colors">
              <Settings size={24} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">Quero montar meu plano</h3>
              <p className="text-sm text-neutral-500 mt-1 leading-relaxed">Adicione matérias e tópicos manualmente, do seu jeito.</p>
            </div>
          </button>

          <button 
            onClick={() => handleSelectPath('free')}
            className="flex items-start gap-4 p-5 rounded-2xl border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 transition-all text-left group"
          >
            <div className="w-12 h-12 bg-neutral-100 group-hover:bg-neutral-900 text-neutral-600 group-hover:text-white rounded-xl flex items-center justify-center flex-shrink-0 transition-colors">
              <Play size={24} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">Só quero registrar meus estudos</h3>
              <p className="text-sm text-neutral-500 mt-1 leading-relaxed">Comece agora e organize seu plano depois.</p>
            </div>
          </button>

        </div>
      </div>
    </div>
  );
}

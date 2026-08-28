import React, { useState } from 'react';
import { useStore } from '../store';
import { Settings as SettingsIcon, Trash2, Target, AlertTriangle, User, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Settings() {
  const { weeklyGoalHours, setWeeklyGoalHours, resetAllData, hasCompletedOnboarding, setActiveTab } = useStore();
  const [deleteStep, setDeleteStep] = useState(0);

  const handleReset = () => {
    if (deleteStep === 0) {
      setDeleteStep(1);
    } else if (deleteStep === 1) {
      resetAllData();
      setDeleteStep(0);
      alert('Dados redefinidos com sucesso.');
      window.location.reload();
    }
  };

  const handleLogout = () => {
    if (window.confirm("Deseja realmente sair?")) {
      // In a real app this would clear auth cookies/tokens
      alert("Sessão encerrada (simulação).");
      window.location.reload();
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Configurações</h1>
        <p className="text-neutral-500 mt-1">Personalize suas metas e gerencie seus dados.</p>
      </header>

      <div className="space-y-6">
        {/* Onboarding & Perfil */}
        {hasCompletedOnboarding && (
          <section className="bg-white p-6 md:p-8 rounded-3xl border border-neutral-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-neutral-100 text-neutral-600 rounded-lg">
                <User size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-neutral-900">Meu Plano de Estudos</h3>
                <p className="text-sm text-neutral-500">Altere seu objetivo, matérias ou disponibilidade de tempo.</p>
              </div>
            </div>
            <button 
              onClick={() => {
                useStore.setState({ hasCompletedOnboarding: false });
              }}
              className="px-6 py-3 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-xl transition-all whitespace-nowrap"
            >
              Refazer Configuração
            </button>
          </section>
        )}

        {/* Metas */}
        <section className="bg-white p-6 md:p-8 rounded-3xl border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Target size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-neutral-900">Meta Semanal</h3>
              <p className="text-sm text-neutral-500">Defina sua meta de horas líquidas para a semana.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <input 
              type="range" 
              min="1" 
              max="60" 
              step="1"
              value={weeklyGoalHours}
              onChange={(e) => setWeeklyGoalHours(parseInt(e.target.value))}
              className="flex-1 h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-900"
            />
            <div className="w-20 text-center">
              <span className="text-2xl font-bold text-neutral-900">{weeklyGoalHours}h</span>
            </div>
          </div>
          <p className="text-xs text-neutral-400 mt-4 text-center">
            Escolha uma meta que caiba na sua rotina e que possa ser mantida com consistência.
          </p>
        </section>

        {/* Danger Zone */}
        <section className="bg-white p-6 md:p-8 rounded-3xl border border-red-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-red-600">Zona de Perigo e Conta</h3>
              <p className="text-sm text-neutral-500">Ações destrutivas e controle de acesso.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
              <div>
                <h4 className="font-bold text-neutral-900">Sair da conta</h4>
                <p className="text-sm text-neutral-500 mt-1">Desconectar sua conta atual deste dispositivo.</p>
              </div>
              <button 
                onClick={handleLogout}
                className="px-6 py-3 bg-white border border-neutral-200 hover:bg-neutral-100 text-neutral-900 font-bold rounded-xl transition-all flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <LogOut size={18} /> Sair
              </button>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-red-50/50 rounded-2xl border border-red-100">
              <div>
                <h4 className="font-bold text-neutral-900">Apagar todos os dados</h4>
                <p className="text-sm text-neutral-500 mt-1">Isso excluirá permanentemente seu histórico de sessões e reiniciará seu ciclo.</p>
              </div>
              <button 
                onClick={handleReset}
                className={cn(
                  "px-6 py-3 font-bold rounded-xl transition-all flex items-center justify-center gap-2 whitespace-nowrap",
                  deleteStep === 1 ? "bg-neutral-900 text-white shadow-lg" : "bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/20"
                )}
              >
                <Trash2 size={18} /> {deleteStep === 1 ? "Clique novamente para confirmar" : "Redefinir Dados"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

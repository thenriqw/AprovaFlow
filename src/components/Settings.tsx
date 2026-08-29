import React, { useState } from 'react';
import { useStore } from '../store';
import { Settings as SettingsIcon, Trash2, Target, AlertTriangle, User, LogOut, CheckCircle, Cloud, RefreshCcw, Database } from 'lucide-react';
import { cn } from '../lib/utils';
import { googleSignIn, logout } from '../lib/firebase';

export default function Settings() {
  const { weeklyGoalHours, setWeeklyGoalHours, resetAllData, hasCompletedOnboarding, setActiveTab, firebaseUser } = useStore();
  const [deleteStep, setDeleteStep] = useState(0);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

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

  const handleLogout = async () => {
    if (window.confirm("Deseja realmente sair?")) {
      await logout();
      alert("Sessão encerrada.");
      window.location.reload();
    }
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await googleSignIn();
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Configurações</h1>
        <p className="text-neutral-500 mt-1">Personalize suas metas, gerencie seus dados e integrações.</p>
      </header>

      <div className="space-y-6">
        {/* Workspace Integrações */}
        
        <section className="bg-white p-6 md:p-8 rounded-3xl border border-neutral-200 shadow-sm">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-neutral-100 text-neutral-600 rounded-lg">
                <Database size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-neutral-900">Conta Google</h3>
                <p className="text-sm text-neutral-500">Autenticação e sincronização.</p>
              </div>
            </div>
          </div>
          
          {!firebaseUser ? (
            <div className="flex flex-col items-center p-6 bg-neutral-50 rounded-2xl border border-neutral-100">
              <p className="text-sm text-neutral-500 mb-4 text-center">Para usar a sincronização em nuvem, conecte sua conta Google.</p>
              <button 
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="gsi-material-button w-full sm:w-auto"
                style={{
                  backgroundColor: '#fff',
                  border: '1px solid #dadce0',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontWeight: 500,
                  transition: 'background-color .218s'
                }}
              >
                <div style={{marginRight: '12px'}}>
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{display: 'block', width: '20px', height: '20px'}}>
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    <path fill="none" d="M0 0h48v48H0z"></path>
                  </svg>
                </div>
                <span style={{color: '#3c4043', fontFamily: '"Google Sans",Roboto,Arial,sans-serif'}}>
                  {isLoggingIn ? 'Conectando...' : 'Sign in with Google'}
                </span>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                <div className="flex items-center gap-4 flex-1">
                  <img src={firebaseUser.photoURL || ''} alt="User" className="w-12 h-12 rounded-full border border-neutral-200" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-neutral-900 truncate">{firebaseUser.displayName}</h4>
                    <p className="text-sm text-neutral-500 truncate">{firebaseUser.email}</p>
                  </div>
                </div>
                <button 
                  onClick={handleLogout}
                  className="w-full sm:w-auto px-4 py-2 bg-white border border-neutral-200 hover:bg-neutral-100 text-neutral-900 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <LogOut size={16} /> Desconectar
                </button>
              </div>
              
              <div className="border-t border-neutral-100 pt-6 mt-6">
                <h4 className="text-sm font-bold text-neutral-900 mb-4">Integrações Workspace</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white border border-neutral-200 rounded-xl">
                     <span className="text-sm font-medium text-neutral-700">Google Drive</span>
                     <span className="text-xs font-bold text-neutral-400 bg-neutral-100 px-2 py-1 rounded-md">Não conectado</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white border border-neutral-200 rounded-xl">
                     <span className="text-sm font-medium text-neutral-700">Google Calendar</span>
                     <span className="text-xs font-bold text-neutral-400 bg-neutral-100 px-2 py-1 rounded-md">Não conectado</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white border border-neutral-200 rounded-xl">
                     <span className="text-sm font-medium text-neutral-700">Google Tasks</span>
                     <span className="text-xs font-bold text-neutral-400 bg-neutral-100 px-2 py-1 rounded-md">Não conectado</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>


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

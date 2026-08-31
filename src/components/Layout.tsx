import { isQaVisualEnabled } from '../qa/qaFlags';
import React, { useState } from 'react';
import { cn } from '../lib/utils';
import { 
  Compass, 
  Map, 
  BookOpen, 
  Inbox, 
  TrendingUp,
  Settings as SettingsIcon,
  Plus,
  Play,
  CheckCircle,
  FileText,
  ChevronDown
} from 'lucide-react';
import { APP_NAME } from '../config/constants';
import { useStore } from '../store';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Layout({ children, activeTab, setActiveTab }: LayoutProps) {
  const { plans, activePlanId, switchPlan } = useStore();
  const [showPlanMenu, setShowPlanMenu] = useState(false);
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  
  const activePlan = plans?.find(p => p.id === activePlanId);

  const mainNavItems = [
    { id: 'today', label: 'Hoje', icon: Compass },
    { id: 'plan', label: 'Plano', icon: Map },
    { id: 'content', label: 'Conteúdo', icon: BookOpen },
    { id: 'inbox', label: 'Entrada', icon: Inbox },
    { id: 'progress', label: 'Progresso', icon: TrendingUp },
  ];

  return (
    <div className="flex h-screen bg-neutral-50 text-neutral-900 font-sans">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-72 flex-col bg-white border-r border-neutral-200">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <span className="font-serif font-semibold text-2xl tracking-tight text-neutral-900">{APP_NAME}</span>
            {isQaVisualEnabled() && (
              <span className="ml-2 px-1.5 py-0.5 bg-yellow-400 text-yellow-900 text-[10px] font-bold rounded uppercase tracking-wider">
                QA Visual
              </span>
            )}
          </div>
          
          {/* Plan Selector */}
          <div className="relative mb-6">
            <button 
              onClick={() => setShowPlanMenu(!showPlanMenu)}
              className="w-full flex items-center justify-between px-3 py-2 bg-neutral-50 hover:bg-neutral-100 rounded-lg border border-neutral-200 transition-colors text-left"
            >
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs text-neutral-500 font-medium uppercase tracking-wider mb-0.5">Plano Ativo</span>
                <span className="text-sm font-semibold text-neutral-900 truncate">
                  {activePlan?.name || 'Nenhum plano'}
                </span>
              </div>
              <ChevronDown size={16} className="text-neutral-400 flex-shrink-0" />
            </button>
            
            {showPlanMenu && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-xl shadow-lg shadow-neutral-900/5 py-1 z-50">
                {plans?.map(plan => (
                  <button
                    key={plan.id}
                    onClick={async () => {
                      if (plan.id === activePlanId) {
                        setShowPlanMenu(false);
                        return;
                      }
                      setIsSwitching(true);
                      setShowPlanMenu(false);
                      try {
                        await switchPlan(plan.id);
                      } catch (e) {
                        console.error(e);
                      } finally {
                        setIsSwitching(false);
                      }
                    }}
                    disabled={isSwitching}
                    className={cn(
                      "w-full px-3 py-2 text-left text-sm hover:bg-neutral-50 transition-colors flex items-center justify-between",
                      plan.id === activePlanId ? "font-semibold text-neutral-900" : "text-neutral-600",
                      isSwitching && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <span className="truncate">{plan.name}</span>
                    {plan.id === activePlanId && <CheckCircle size={14} className="text-neutral-900" />}
                  </button>
                ))}
                {plans?.length > 0 && <div className="h-px bg-neutral-100 my-1"></div>}
                <button 
                  onClick={() => {
                    setActiveTab('create-plan');
                    setShowPlanMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 transition-colors flex items-center gap-2"
                >
                  <Plus size={14} />
                  Criar novo plano
                </button>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {mainNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                activeTab === item.id 
                  ? "bg-neutral-100 text-neutral-900 font-semibold" 
                  : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
              )}
            >
              <item.icon size={18} strokeWidth={activeTab === item.id ? 2.5 : 2} />
              {item.label}
            </button>
          ))}
        </nav>
        
        <div className="p-4 mt-auto">
          <button
            onClick={() => setActiveTab('settings')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              activeTab === 'settings'
                ? "bg-neutral-100 text-neutral-900 font-semibold"
                : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
            )}
          >
            <SettingsIcon size={18} />
            Ajustes
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-neutral-50 pb-24 md:pb-0 relative">
        
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-neutral-200 sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <span className="font-serif font-semibold text-lg tracking-tight text-neutral-900">{APP_NAME}</span>
            {isQaVisualEnabled() && (
              <span className="px-1.5 py-0.5 bg-yellow-400 text-yellow-900 text-[10px] font-bold rounded uppercase tracking-wider">
                QA Visual
              </span>
            )}
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setShowPlanMenu(!showPlanMenu)}
              className="flex items-center gap-1.5 text-sm font-semibold text-neutral-900 bg-neutral-100 hover:bg-neutral-200 px-3 py-1.5 rounded-full transition-colors max-w-[150px]"
            >
              <span className="truncate">{isSwitching ? 'Carregando...' : (activePlan?.name || 'Sem plano')}</span>
              <ChevronDown size={14} className={cn("transition-transform flex-shrink-0", showPlanMenu && "rotate-180")} />
            </button>

            {showPlanMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-neutral-200 overflow-hidden z-50">
                <div className="p-2 text-xs font-bold text-neutral-500 uppercase tracking-wider">
                  Seus Planos
                </div>
                {plans?.map(plan => (
                  <button
                    key={plan.id}
                    onClick={async () => {
                      if (plan.id === activePlanId) {
                        setShowPlanMenu(false);
                        return;
                      }
                      setIsSwitching(true);
                      setShowPlanMenu(false);
                      try {
                        await switchPlan(plan.id);
                      } catch (e) {
                        console.error(e);
                      } finally {
                        setIsSwitching(false);
                      }
                    }}
                    disabled={isSwitching}
                    className={cn(
                      "w-full px-3 py-2 text-left text-sm hover:bg-neutral-50 transition-colors flex items-center justify-between",
                      plan.id === activePlanId ? "font-semibold text-neutral-900" : "text-neutral-600",
                      isSwitching && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <span className="truncate">{plan.name}</span>
                    {plan.id === activePlanId && <div className="w-1.5 h-1.5 rounded-full bg-neutral-900"></div>}
                  </button>
                ))}
                {plans?.length > 0 && <div className="h-px bg-neutral-100 my-1"></div>}
                <button 
                  onClick={() => {
                    setActiveTab('create-plan');
                    setShowPlanMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 transition-colors flex items-center gap-2"
                >
                  <Plus size={14} />
                  Criar novo plano
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-10">
          {children}
        </div>
      </main>

      {/* Floating Menu for Mobile + */}
      {showFabMenu && !['settings', 'create-plan', 'onboarding'].includes(activeTab) && (
        <div className="md:hidden fixed bottom-[76px] left-1/2 -translate-x-1/2 z-50 flex flex-col gap-3 items-center">
           <button 
             onClick={() => { setActiveTab('timer'); setShowFabMenu(false); }}
             className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-full shadow-lg border border-neutral-100 text-sm font-semibold text-neutral-900 whitespace-nowrap"
           >
             Registrar sessão
             <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
               <Play size={14} fill="currentColor" />
             </div>
           </button>
        </div>
      )}

      {/* Bottom Nav Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-1 py-2 pb-safe flex justify-around items-center z-40">
        {mainNavItems.map((item, idx) => (
          <React.Fragment key={item.id}>
            {idx === 3 && (
              <div className="relative -top-5">
                <button
                  onClick={() => setShowFabMenu(!showFabMenu)}
                  className="w-14 h-14 bg-neutral-900 hover:bg-neutral-800 text-white rounded-full shadow-lg shadow-neutral-900/20 flex items-center justify-center transition-transform active:scale-95 mx-1"
                >
                  <Plus size={24} className={cn("transition-transform duration-300", showFabMenu && "rotate-45")} />
                </button>
              </div>
            )}
            <button
              onClick={() => {
                setActiveTab(item.id);
                setShowFabMenu(false);
              }}
              className={cn(
                "flex flex-col items-center justify-center w-14 h-12 rounded-lg transition-colors",
                activeTab === item.id ? "text-neutral-900" : "text-neutral-400"
              )}
            >
              <item.icon size={22} strokeWidth={activeTab === item.id ? 2.5 : 2} className="mb-1" />
              <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
            </button>
          </React.Fragment>
        ))}
      </nav>
    </div>
  );
}

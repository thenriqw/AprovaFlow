import React from 'react';
import { cn } from '../lib/utils';
import { LayoutDashboard, Timer, ListTodo, Upload, BookOpenText, History as HistoryIcon, Settings as SettingsIcon } from 'lucide-react';

import { APP_NAME } from '../config/constants';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Layout({ children, activeTab, setActiveTab }: LayoutProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'timer', label: 'Foco Livre', icon: Timer },
    { id: 'cycle', label: 'Meu Ciclo', icon: ListTodo },
    { id: 'subjects', label: 'Matérias', icon: BookOpenText },
    { id: 'import', label: 'Importador', icon: Upload },
    { id: 'history', label: 'Histórico', icon: HistoryIcon },
    { id: 'settings', label: 'Ajustes', icon: SettingsIcon },
  ];

  return (
    <div className="flex h-screen bg-neutral-50 text-neutral-900 font-sans">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-64 flex-col bg-white border-r border-neutral-200">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-neutral-900 rounded-xl flex items-center justify-center text-white">
            <BookOpenText size={24} />
          </div>
          <span className="font-bold text-xl tracking-tight text-neutral-900">{APP_NAME}</span>
        </div>
        <nav className="flex-1 px-4 space-y-1 mt-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                activeTab === item.id 
                  ? "bg-neutral-900 text-white shadow-sm" 
                  : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
              )}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-neutral-50 pb-24 md:pb-0">
        <div className="max-w-5xl mx-auto p-6 md:p-10">
          {children}
        </div>
      </main>

      {/* Bottom Nav Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-4 py-3 pb-safe flex justify-between items-center z-50">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "flex flex-col items-center p-2 rounded-lg transition-colors",
              activeTab === item.id ? "text-neutral-900" : "text-neutral-400"
            )}
          >
            <item.icon size={20} className="mb-1" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

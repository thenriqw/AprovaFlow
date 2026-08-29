import { BookOpen } from "lucide-react";
import React from 'react';
import { useStore } from '../store';
import { Calendar, Target, Clock, AlertTriangle } from 'lucide-react';

export default function PlanOverview() {
  const { plans, activePlanId, v2Subjects, v2Activities } = useStore();
  
  const activePlan = plans?.find(p => p.id === activePlanId);
  
  if (!activePlan) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-2xl font-serif font-bold text-neutral-900 mb-2">Nenhum plano ativo</h2>
        <p className="text-neutral-500">Selecione ou crie um novo plano para visualizar.</p>
      </div>
    );
  }


  // Calculate Capacity
  const hasAvailability = activePlan.availableTimePerDay && Object.values(activePlan.availableTimePerDay).some(h => h > 0);
  const weeklyCapacityHours = hasAvailability ? Object.values(activePlan.availableTimePerDay).reduce((a, b) => a + b, 0) : 0;
  const weeklyCapacityMinutes = weeklyCapacityHours * 60;
  
  // Calculate Demand
  let totalDemandMinutes = 0;
  let pendingDemandMinutes = 0;
  if (v2Activities && v2Activities.length > 0) {
    totalDemandMinutes = v2Activities.reduce((acc, act) => acc + (Math.round((act.expectedDurationSeconds || 0) / 60)), 0);
    pendingDemandMinutes = v2Activities
      .filter(act => act.status !== 'completed')
      .reduce((acc, act) => acc + (Math.round((act.expectedDurationSeconds || 0) / 60)), 0);
  }

  const daysToExam = activePlan.examDate 
    ? Math.max(0, Math.floor((new Date(activePlan.examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const totalWeeks = daysToExam ? Math.ceil(daysToExam / 7) : null;
  const totalCapacityRemaining = totalWeeks && hasAvailability ? totalWeeks * weeklyCapacityMinutes : null;
  const isOverloaded = totalCapacityRemaining !== null && pendingDemandMinutes > totalCapacityRemaining;


  const planStatus = daysToExam !== null && daysToExam === 0 ? 'Concluído' : 'Ativo';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-8 bg-neutral-900 rounded-full"></div>
        <div>
          <h1 className="text-3xl font-serif font-bold text-neutral-900">{activePlan.name}</h1>
          <p className="text-neutral-500 text-sm mt-1">{activePlan.objective || 'Sem objetivo definido'}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex flex-col">
          <Target size={20} className="text-neutral-400 mb-3" />
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Status</span>
          <span className="text-lg font-semibold text-neutral-900">{planStatus}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex flex-col">
          <Calendar size={20} className="text-neutral-400 mb-3" />
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Dias Restantes</span>
          <span className="text-lg font-semibold text-neutral-900">{daysToExam !== null ? daysToExam : '∞'}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex flex-col">
          <Clock size={20} className="text-neutral-400 mb-3" />
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Disponibilidade Semanal</span>
          <span className="text-lg font-semibold text-neutral-900">{Math.round(weeklyCapacityMinutes / 60)}h</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex flex-col">
          <BookOpen size={20} className="text-neutral-400 mb-3" />
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Matérias</span>
          <span className="text-lg font-semibold text-neutral-900">{v2Subjects?.length || 0}</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-neutral-100 bg-neutral-50/50">
          <h2 className="text-xl font-serif font-bold text-neutral-900">Capacidade × Demanda</h2>
          <p className="text-sm text-neutral-500 mt-1">Sua preparação cabe no tempo que você tem?</p>
        </div>
        <div className="p-6">

          {!hasAvailability ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock size={24} className="text-neutral-400" />
              </div>
              <p className="text-neutral-900 font-medium">Configure sua disponibilidade</p>
              <p className="text-neutral-500 text-sm mt-1 max-w-md mx-auto">Adicione seu tempo de estudo diário para calcular se o plano cabe na sua rotina.</p>
            </div>
          ) : (!v2Activities || v2Activities.length === 0) ? (

            <div className="text-center py-10">
              <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={24} className="text-neutral-400" />
              </div>
              <p className="text-neutral-900 font-medium">Não há atividades suficientes no seu plano.</p>
              <p className="text-neutral-500 text-sm mt-1 max-w-md mx-auto">Adicione atividades aos tópicos ou importe seu cronograma para que o éFederal consiga calcular sua carga de estudos real.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-1">Carga Pendente</p>
                  <p className="text-3xl font-bold text-neutral-900">{Math.round(pendingDemandMinutes / 60)}h</p>
                  <p className="text-sm text-neutral-500 mt-1">de {Math.round(totalDemandMinutes / 60)}h totais</p>
                </div>
                {totalCapacityRemaining !== null && (
                  <div className="text-right">
                    <p className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-1">Capacidade Restante</p>
                    <p className="text-3xl font-bold text-neutral-900">{Math.round(totalCapacityRemaining / 60)}h</p>
                  </div>
                )}
              </div>
              {totalCapacityRemaining !== null && pendingDemandMinutes > totalCapacityRemaining && (
                <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm font-medium">
                  Atenção: Sua demanda pendente ultrapassa sua capacidade de tempo disponível até a data da prova. 
                  Recomendamos ajustar as horas diárias ou focar nos tópicos de maior peso.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

// Need to import BookOpen inside PlanOverview

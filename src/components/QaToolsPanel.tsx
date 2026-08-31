import React, { useState } from 'react';
import { seedEnemQa, removeEnemQaSeed, getEnemQaSeedSummary } from '../qa/enemSeed';
import { useStore } from '../store';

export default function QaToolsPanel() {
  const { firebaseUser, switchPlan, plans, activePlanId, cycleQueue, v2Subjects, v2Topics } = useStore();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  if (!firebaseUser) return null;

  const handleCreate = async () => {
    setLoading(true);
    setResult('Criando dataset...');
    try {
      const res = await seedEnemQa(firebaseUser.uid);
      setResult(res);
      if (res.planId) {
        await switchPlan(res.planId);
      }
    } catch (e: any) {
      setResult({ error: e.message });
    }
    setLoading(false);
  };

  const handleRemove = async () => {
    setLoading(true);
    setResult('Removendo dataset...');
    try {
      const res = await removeEnemQaSeed(firebaseUser.uid);
      setResult(res);
      if (res.removedPlanIds && res.removedPlanIds.includes(activePlanId)) {
        const fallback = plans.find(p => !res.removedPlanIds.includes(p.id));
        await switchPlan(fallback ? fallback.id : '');
      }
    } catch (e: any) {
      setResult({ error: e.message });
    }
    setLoading(false);
  };

  const handleSummary = async () => {
    setLoading(true);
    setResult('Buscando resumo...');
    try {
      const res = await getEnemQaSeedSummary(firebaseUser.uid);
      if (res && res.planId === activePlanId) {
        const nextItem = cycleQueue.find(q => q.status === 'next');
        if (nextItem) {
          (res as any).todayRecommendation = {
            subject: v2Subjects.find(s => s.id === nextItem.subjectId)?.name || nextItem.subjectId,
            topic: v2Topics.find(t => t.id === nextItem.topicId)?.name || nextItem.topicId,
            activityId: nextItem.activityId,
            activityType: nextItem.activityType,
            expectedDurationSeconds: nextItem.expectedDurationSeconds,
            recommendationReasons: nextItem.recommendationReasons,
            score: (nextItem as any).score
          };
        }
      }
      setResult(res || { message: 'Seed não encontrado.' });
    } catch (e: any) {
      setResult({ error: e.message });
    }
    setLoading(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white border-2 border-indigo-500 rounded-lg p-4 shadow-2xl max-w-sm w-full max-h-[80vh] flex flex-col">
      <h3 className="font-bold text-indigo-700 mb-2 shrink-0">QA Tools: ENEM Realista</h3>
      
      <div className="flex flex-col gap-2 mb-4 shrink-0">
        <button 
          onClick={handleCreate} 
          disabled={loading}
          className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-3 py-1 rounded text-sm font-medium transition-colors"
        >
          Criar ENEM QA
        </button>
        <button 
          onClick={handleRemove} 
          disabled={loading}
          className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded text-sm font-medium transition-colors"
        >
          Remover ENEM QA
        </button>
        <button 
          onClick={handleSummary} 
          disabled={loading}
          className="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-3 py-1 rounded text-sm font-medium transition-colors"
        >
          Ver Resumo
        </button>
      </div>

      {result && (
        <div className="bg-neutral-900 text-emerald-400 p-2 rounded text-xs font-mono overflow-auto whitespace-pre-wrap flex-1 min-h-0">
          {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
        </div>
      )}
    </div>
  );
}

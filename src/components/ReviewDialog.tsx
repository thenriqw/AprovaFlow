import React, { useState, useEffect } from 'react';
import { X, Check, AlertCircle, Edit2, CheckCircle2 } from 'lucide-react';
import { ImportJob, SubjectProposal, TopicProposal } from '../domain/types';
import { applyImportProposal } from '../lib/applyService';
import { useStore } from '../store';

export default function ReviewDialog({ job, onClose }: { job: ImportJob, onClose: () => void }) {
  const { activePlanId, plans, v2Subjects, v2Topics, firebaseUser, refreshActivePlanData } = useStore();
  const [proposal, setProposal] = useState<any>(null);
  
  // Selection state (true = selected)
  const [selectedSubjects, setSelectedSubjects] = useState<Record<string, boolean>>({});
  const [selectedTopics, setSelectedTopics] = useState<Record<string, Record<string, boolean>>>({});
  
  // Editing state
  const [editingSubject, setEditingSubject] = useState<number | null>(null);
  const [editingTopic, setEditingTopic] = useState<{sIdx: number, tIdx: number} | null>(null);
  const [editValue, setEditValue] = useState('');

  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (job.proposal) {
      setProposal(JSON.parse(JSON.stringify(job.proposal))); // Deep copy
      const initSub: Record<string, boolean> = {};
      const initTop: Record<string, Record<string, boolean>> = {};
      
      job.proposal.subjects.forEach((s: any, sIdx: number) => {
        initSub[sIdx] = true;
        initTop[sIdx] = {};
        s.topics.forEach((t: any, tIdx: number) => {
          initTop[sIdx][tIdx] = true;
        });
      });
      setSelectedSubjects(initSub);
      setSelectedTopics(initTop);
    }
  }, [job]);

  if (!proposal) return null;

  const normalizeStr = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ').normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const handleApply = async () => {
    if (!firebaseUser || !activePlanId) return;
    try {
      setIsApplying(true);
      setError('');
      
      // Filter out unselected
      const filteredProposal = {
        ...proposal,
        subjects: proposal.subjects.map((s: any, sIdx: number) => {
          if (!selectedSubjects[sIdx]) return null;
          return {
            ...s,
            topics: s.topics.filter((_: any, tIdx: number) => selectedTopics[sIdx][tIdx])
          };
        }).filter(Boolean)
      };

      const filteredJob = { ...job, proposal: filteredProposal };

      await applyImportProposal(firebaseUser.uid, activePlanId, filteredJob, v2Subjects, v2Topics);
      
      // Item 14: Refresh state
      await refreshActivePlanData();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsApplying(false);
    }
  };

  const toggleSubject = (sIdx: number) => {
    const newVal = !selectedSubjects[sIdx];
    setSelectedSubjects(prev => ({ ...prev, [sIdx]: newVal }));
    // cascade down
    setSelectedTopics(prev => {
      const updated = { ...prev };
      Object.keys(updated[sIdx] || {}).forEach(tIdx => {
        updated[sIdx][tIdx] = newVal;
      });
      return updated;
    });
  };

  const toggleTopic = (sIdx: number, tIdx: number) => {
    setSelectedTopics(prev => {
      const updated = { ...prev };
      updated[sIdx] = { ...updated[sIdx], [tIdx]: !updated[sIdx][tIdx] };
      return updated;
    });
    // Check if at least one topic is selected, keep subject selected, else unselect
  };

  const saveSubjectEdit = (sIdx: number) => {
    if (!editValue.trim()) return;
    setProposal((prev: any) => {
      const next = { ...prev };
      next.subjects[sIdx].name = editValue.trim();
      return next;
    });
    setEditingSubject(null);
  };

  const saveTopicEdit = (sIdx: number, tIdx: number) => {
    if (!editValue.trim()) return;
    setProposal((prev: any) => {
      const next = { ...prev };
      next.subjects[sIdx].topics[tIdx].name = editValue.trim();
      return next;
    });
    setEditingTopic(null);
  };

  // Compute preview summary
  let newSubjectsCount = 0;
  let mergeSubjectsCount = 0;
  let newTopicsCount = 0;
  let mergeTopicsCount = 0;
  let activitiesCount = 0;
  let ignoredCount = 0;
  
  proposal.subjects.forEach((s: any, sIdx: number) => {
    if (!selectedSubjects[sIdx]) {
      ignoredCount++;
      return;
    }
    const existingSub = v2Subjects.find(sub => normalizeStr(sub.name) === normalizeStr(s.name));
    if (existingSub) mergeSubjectsCount++;
    else newSubjectsCount++;
    
    s.topics.forEach((t: any, tIdx: number) => {
      if (!selectedTopics[sIdx][tIdx]) {
        ignoredCount++;
        return;
      }
      const existingTop = existingSub && v2Topics.find(top => top.subjectId === existingSub.id && normalizeStr(top.name) === normalizeStr(t.name));
      if (existingTop) mergeTopicsCount++;
      else newTopicsCount++;
      
      activitiesCount += (t.activities || []).length;
    });
  });

  const activePlanName = plans.find(p => p.id === activePlanId)?.name || 'Plano Atual';

  return (
    <div className="fixed inset-0 bg-neutral-900/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
          <div>
            <h2 className="text-xl font-bold font-serif text-neutral-900">Revisar Importação</h2>
            <p className="text-sm text-neutral-500 mt-1">{job.title}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
            <X size={20} className="text-neutral-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-neutral-50/30 flex gap-6">
          <div className="flex-1 space-y-4">
            {error && (
              <div className="mb-4 bg-red-50 text-red-700 p-4 rounded-xl flex items-start gap-3 border border-red-100">
                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                <div className="text-sm font-medium">{error}</div>
              </div>
            )}

            {job.warnings && job.warnings.length > 0 && (
              <div className="mb-4 bg-amber-50 text-amber-800 p-4 rounded-xl border border-amber-100 space-y-2">
                <h4 className="font-bold text-sm flex items-center gap-2">
                  <AlertCircle size={16} /> Avisos da Extração
                </h4>
                <ul className="text-sm list-disc pl-5 space-y-1">
                  {job.warnings.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            )}

            <h3 className="font-bold text-neutral-800 mb-2">Estrutura Encontrada</h3>
            {proposal.subjects.map((subject: any, sIdx: number) => {
              const isSelected = selectedSubjects[sIdx];
              const existingSub = v2Subjects.find(s => normalizeStr(s.name) === normalizeStr(subject.name));
              
              return (
                <div key={sIdx} className={`bg-white border rounded-xl overflow-hidden transition-colors ${isSelected ? 'border-neutral-200 shadow-sm' : 'border-neutral-100 opacity-60'}`}>
                  <div className="px-4 py-3 border-b border-neutral-100 flex items-center gap-3 bg-neutral-50/50">
                    <input 
                      type="checkbox" 
                      checked={isSelected || false}
                      onChange={() => toggleSubject(sIdx)}
                      className="w-5 h-5 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 transition-all"
                    />
                    
                    {editingSubject === sIdx ? (
                      <div className="flex-1 flex items-center gap-2">
                        <input 
                          autoFocus
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && saveSubjectEdit(sIdx)}
                          className="flex-1 px-2 py-1 text-sm border border-neutral-300 rounded"
                        />
                        <button onClick={() => saveSubjectEdit(sIdx)} className="text-emerald-600 hover:text-emerald-700">
                          <CheckCircle2 size={18} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center gap-2 group">
                        <span className="font-semibold text-neutral-800">{subject.name}</span>
                        <button onClick={() => { setEditValue(subject.name); setEditingSubject(sIdx); setEditingTopic(null); }} className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-neutral-600 transition-opacity">
                          <Edit2 size={14} />
                        </button>
                      </div>
                    )}

                    {existingSub && (
                      <span className="text-xs font-medium px-2 py-1 bg-amber-100 text-amber-800 rounded-md">
                        Mesclar
                      </span>
                    )}
                  </div>
                  
                  {isSelected && subject.topics.length > 0 && (
                    <div className="px-4 py-3 pl-12 space-y-2">
                      {subject.topics.map((topic: any, tIdx: number) => {
                        const isTopicSelected = selectedTopics[sIdx]?.[tIdx];
                        const existingTop = existingSub && v2Topics.find(t => t.subjectId === existingSub.id && normalizeStr(t.name) === normalizeStr(topic.name));
                        return (
                          <div key={tIdx} className={`flex items-center gap-2 text-sm transition-opacity ${isTopicSelected ? 'text-neutral-600' : 'text-neutral-400 opacity-60'}`}>
                            <input 
                              type="checkbox"
                              checked={isTopicSelected || false}
                              onChange={() => toggleTopic(sIdx, tIdx)}
                              className="w-4 h-4 rounded border-neutral-300 text-neutral-900"
                            />
                            
                            {editingTopic?.sIdx === sIdx && editingTopic?.tIdx === tIdx ? (
                              <div className="flex-1 flex items-center gap-2">
                                <input 
                                  autoFocus
                                  value={editValue}
                                  onChange={e => setEditValue(e.target.value)}
                                  onKeyDown={e => e.key === 'Enter' && saveTopicEdit(sIdx, tIdx)}
                                  className="flex-1 px-2 py-0.5 text-xs border border-neutral-300 rounded"
                                />
                                <button onClick={() => saveTopicEdit(sIdx, tIdx)} className="text-emerald-600 hover:text-emerald-700">
                                  <CheckCircle2 size={16} />
                                </button>
                              </div>
                            ) : (
                              <div className="flex-1 flex items-center gap-2 group">
                                <span>{topic.name}</span>
                                <button onClick={() => { setEditValue(topic.name); setEditingTopic({sIdx, tIdx}); setEditingSubject(null); }} className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-neutral-600 transition-opacity">
                                  <Edit2 size={12} />
                                </button>
                              </div>
                            )}

                            {existingTop && (
                              <span className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">
                                Mesclar
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Preview Panel */}
          <div className="w-64 shrink-0 space-y-4">
             <div className="bg-white border border-neutral-200 rounded-xl p-5 sticky top-0">
               <h3 className="font-bold text-neutral-900 mb-4 border-b border-neutral-100 pb-2">Resumo da Ação</h3>
               
               <div className="space-y-4 text-sm">
                 <div>
                   <div className="text-neutral-500 mb-1">Destino</div>
                   <div className="font-medium text-neutral-800">{activePlanName}</div>
                 </div>

                 <div>
                   <div className="text-neutral-500 mb-1">Matérias (Disciplinas)</div>
                   <div className="flex justify-between font-medium">
                     <span className="text-emerald-600">+{newSubjectsCount} novas</span>
                     <span className="text-amber-600">{mergeSubjectsCount} mescladas</span>
                   </div>
                 </div>
                 
                 <div>
                   <div className="text-neutral-500 mb-1">Tópicos (Assuntos)</div>
                   <div className="flex justify-between font-medium">
                     <span className="text-emerald-600">+{newTopicsCount} novos</span>
                     <span className="text-amber-600">{mergeTopicsCount} mesclados</span>
                   </div>
                 </div>

                 <div>
                   <div className="text-neutral-500 mb-1">Atividades</div>
                   <div className="font-medium text-indigo-600">+{activitiesCount} adicionadas</div>
                 </div>

                 {ignoredCount > 0 && (
                   <div>
                     <div className="text-neutral-500 mb-1">Ignorados</div>
                     <div className="font-medium text-neutral-400">{ignoredCount} itens desmarcados</div>
                   </div>
                 )}

                 <div className="pt-4 border-t border-neutral-100 text-xs text-neutral-500">
                   As matérias marcadas como "Mesclar" serão integradas ao seu plano atual sem duplicar conteúdos existentes.
                 </div>
               </div>
             </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-100 bg-white flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleApply}
            disabled={isApplying || !Object.values(selectedSubjects).some(Boolean)}
            className="px-6 py-2.5 bg-neutral-900 text-white text-sm font-semibold rounded-xl hover:bg-neutral-800 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isApplying ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Aplicando...
              </>
            ) : (
              <>
                <Check size={18} />
                Confirmar Importação
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

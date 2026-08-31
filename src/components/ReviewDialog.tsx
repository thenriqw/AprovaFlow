import React, { useState, useEffect } from 'react';
import { X, Check, AlertCircle, Save } from 'lucide-react';
import { ImportJob, Subject, Topic } from '../domain/types';
import { applyImportProposal } from '../lib/applyService';
import { useStore } from '../store';

export default function ReviewDialog({ job, onClose }: { job: ImportJob, onClose: () => void }) {
  const { activePlanId, v2Subjects, v2Topics, firebaseUser, syncCycleWithSubjects } = useStore();
  const [selectedSubjects, setSelectedSubjects] = useState<Record<string, boolean>>({});
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (job.proposal) {
      const initialSelection: Record<string, boolean> = {};
      job.proposal.subjects.forEach((s: any) => initialSelection[s.name] = true);
      setSelectedSubjects(initialSelection);
    }
  }, [job]);

  if (!job.proposal) return null;

  const handleApply = async () => {
    if (!firebaseUser || !activePlanId) return;
    try {
      setIsApplying(true);
      setError('');
      // Filter out unselected subjects
      const filteredProposal = {
        ...job.proposal,
        subjects: job.proposal.subjects.filter((s: any) => selectedSubjects[s.name])
      };
      const filteredJob = { ...job, proposal: filteredProposal };

      await applyImportProposal(firebaseUser.uid, activePlanId, filteredJob, v2Subjects, v2Topics);
      syncCycleWithSubjects();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsApplying(false);
    }
  };

  const toggleSubject = (name: string) => {
    setSelectedSubjects(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const normalizeStr = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  return (
    <div className="fixed inset-0 bg-neutral-900/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
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
        <div className="flex-1 overflow-y-auto p-6 bg-neutral-50/30">
          {error && (
            <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-xl flex items-start gap-3 border border-red-100">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <div className="text-sm font-medium">{error}</div>
            </div>
          )}

          {job.warnings && job.warnings.length > 0 && (
            <div className="mb-6 bg-amber-50 text-amber-800 p-4 rounded-xl border border-amber-100 space-y-2">
              <h4 className="font-bold text-sm flex items-center gap-2">
                <AlertCircle size={16} />
                Avisos da Extração
              </h4>
              <ul className="text-sm list-disc pl-5 space-y-1">
                {job.warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="font-bold text-neutral-800 mb-2">Estrutura Encontrada</h3>
            {job.proposal.subjects.map((subject: any, idx: number) => {
              const isSelected = selectedSubjects[subject.name];
              
              // Conflict detection
              const existingSub = v2Subjects.find(s => normalizeStr(s.name) === normalizeStr(subject.name));
              
              return (
                <div key={idx} className={`bg-white border rounded-xl overflow-hidden transition-colors ${isSelected ? 'border-neutral-200 shadow-sm' : 'border-neutral-100 opacity-60'}`}>
                  <div className="px-4 py-3 border-b border-neutral-100 flex items-center gap-3 bg-neutral-50/50">
                    <input 
                      type="checkbox" 
                      checked={isSelected || false}
                      onChange={() => toggleSubject(subject.name)}
                      className="w-5 h-5 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 transition-all"
                    />
                    <div className="flex-1 font-semibold text-neutral-800">
                      {subject.name}
                    </div>
                    {existingSub && (
                      <span className="text-xs font-medium px-2 py-1 bg-amber-100 text-amber-800 rounded-md">
                        Será mesclado
                      </span>
                    )}
                    <div className="text-xs text-neutral-500 font-medium px-2 py-1 bg-neutral-100 rounded-md">
                      {subject.topics.length} tópicos
                    </div>
                  </div>
                  
                  {isSelected && subject.topics.length > 0 && (
                    <div className="px-4 py-3 pl-12 space-y-2">
                      {subject.topics.map((topic: any, tIdx: number) => {
                        const existingTop = existingSub && v2Topics.find(t => t.subjectId === existingSub.id && normalizeStr(t.name) === normalizeStr(topic.name));
                        return (
                          <div key={tIdx} className="flex items-center gap-2 text-sm text-neutral-600">
                            <div className="w-1.5 h-1.5 rounded-full bg-neutral-300"></div>
                            <span className="flex-1">{topic.name}</span>
                            {existingTop && (
                              <span className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">
                                Mesclar
                              </span>
                            )}
                            {topic.activities && topic.activities.length > 0 && (
                              <span className="text-xs text-neutral-400">
                                + {topic.activities.length} ativ.
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
                Aplicar ao Plano
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

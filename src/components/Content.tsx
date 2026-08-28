import React, { useState } from 'react';
import { useStore } from '../store';
import { ChevronRight, FileText, PlayCircle, BookOpen } from 'lucide-react';

export default function Content() {
  const { v2Subjects, v2Topics, v2Activities } = useStore();
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  if (!v2Subjects || v2Subjects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in">
        <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <BookOpen size={24} className="text-neutral-400" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900 mb-2">Nenhum conteúdo no plano</h2>
        <p className="text-neutral-500 max-w-sm mx-auto">Adicione matérias e tópicos para começar a estruturar sua preparação.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-8 bg-neutral-900 rounded-full"></div>
        <div>
          <h1 className="text-3xl font-serif font-bold text-neutral-900">Conteúdo</h1>
          <p className="text-neutral-500 text-sm mt-1">Estrutura da sua preparação.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-2">
          {v2Subjects.map(subject => {
            const subjectTopics = v2Topics?.filter(t => t.subjectId === subject.id) || [];
            const isSelected = selectedSubject === subject.id;
            return (
              <button
                key={subject.id}
                onClick={() => setSelectedSubject(subject.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all flex justify-between items-center ${
                  isSelected 
                    ? 'bg-neutral-900 border-neutral-900 text-white shadow-md' 
                    : 'bg-white border-neutral-200 hover:border-neutral-300 text-neutral-900 hover:bg-neutral-50'
                }`}
              >
                <div>
                  <h3 className="font-bold">{subject.name}</h3>
                  <p className={`text-xs mt-1 ${isSelected ? 'text-neutral-300' : 'text-neutral-500'}`}>
                    {subjectTopics.length} tópicos
                  </p>
                </div>
                <ChevronRight size={18} className={isSelected ? 'text-white' : 'text-neutral-400'} />
              </button>
            );
          })}
        </div>

        <div className="md:col-span-2">
          {selectedSubject ? (
            <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-2xl font-serif font-bold text-neutral-900 mb-6">
                {v2Subjects.find(s => s.id === selectedSubject)?.name}
              </h2>
              
              <div className="space-y-4">
                {(v2Topics?.filter(t => t.subjectId === selectedSubject) || []).map(topic => {
                  const activities = v2Activities?.filter(a => a.topicId === topic.id) || [];
                  return (
                    <div key={topic.id} className="border border-neutral-100 rounded-xl p-4 bg-neutral-50/50">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-bold text-neutral-900">{topic.name}</h4>
                        <span className="text-xs font-medium px-2 py-1 bg-white border border-neutral-200 rounded-md text-neutral-500">
                          {activities.length} atividades
                        </span>
                      </div>
                      
                      {activities.length > 0 ? (
                        <div className="space-y-2 mt-4">
                          {activities.map(act => (
                            <div key={act.id} className="flex items-center gap-3 text-sm bg-white p-3 rounded-lg border border-neutral-100">
                              {act.type === 'Videoaula' ? <PlayCircle size={16} className="text-blue-500" /> : <FileText size={16} className="text-neutral-400" />}
                              <span className="text-neutral-700 font-medium">{act.title}</span>
                              {Math.round(act.expectedDurationSeconds / 60) && (
                                <span className="ml-auto text-xs text-neutral-400">{Math.round(act.expectedDurationSeconds / 60)} min</span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-neutral-400 mt-2">Nenhuma atividade cadastrada para este tópico.</p>
                      )}
                    </div>
                  );
                })}
                {(v2Topics?.filter(t => t.subjectId === selectedSubject) || []).length === 0 && (
                  <p className="text-sm text-neutral-500 text-center py-8">Nenhum tópico cadastrado.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[300px] border-2 border-dashed border-neutral-200 rounded-2xl flex items-center justify-center text-neutral-400 bg-neutral-50/50">
              <p>Selecione uma matéria para visualizar os tópicos</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

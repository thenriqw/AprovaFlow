import React, { useState } from 'react';
import { useStore } from '../store';
import { ChevronRight, FileText, PlayCircle, Plus, Edit2, Trash2, BookOpen } from 'lucide-react';
import type { Subject, Topic, StudyActivity } from '../domain/types';

export default function Content() {
  const { v2Subjects, v2Topics, v2Activities, activePlanId, addV2Subject, deleteV2Subject, addV2Topic, deleteV2Topic, syncCycleWithSubjects, recalculateRoute } = useStore();
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');

  const [addingTopicTo, setAddingTopicTo] = useState<string | null>(null);
  const [newTopicName, setNewTopicName] = useState('');
  
  const [addingActivityTo, setAddingActivityTo] = useState<string | null>(null);
  const [editingSubject, setEditingSubject] = useState<string | null>(null);
  const [editingTopic, setEditingTopic] = useState<string | null>(null);
  const [editingActivity, setEditingActivity] = useState<string | null>(null);
  
  const { updateV2Subject, updateV2Topic, updateV2Activity } = useStore();

  const [newActivityTitle, setNewActivityTitle] = useState('');
  const [newActivityType, setNewActivityType] = useState<StudyActivity['type']>('Leitura');
  const [newActivityDuration, setNewActivityDuration] = useState('');
  
  const { addV2Activity, deleteV2Activity } = useStore();


  const handleAddSubject = () => {
    if (!newSubjectName.trim() || !activePlanId) return;
    const newSubject: Subject = {
      id: 'sub_' + Date.now().toString(),
      planId: activePlanId,
      name: newSubjectName.trim(),
      difficulty: 3,
      importance: 3,
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    addV2Subject(newSubject);
    setNewSubjectName('');
    setIsAddingSubject(false);
    setSelectedSubject(newSubject.id);
    syncCycleWithSubjects();
    recalculateRoute();
  };

  const handleAddTopic = (subjectId: string) => {
    if (!newTopicName.trim() || !activePlanId) return;
    const newTopic: Topic = {
      id: 'top_' + Date.now().toString(),
      planId: activePlanId,
      subjectId,
      name: newTopicName.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    addV2Topic(newTopic);
    setNewTopicName('');
    setAddingTopicTo(null);
    syncCycleWithSubjects();
    recalculateRoute();
  };

  const handleDeleteSubject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Tem certeza que deseja excluir esta matéria? Todos os tópicos também serão perdidos.')) {
      deleteV2Subject(id);
      if (selectedSubject === id) setSelectedSubject(null);
      syncCycleWithSubjects();
      recalculateRoute();
    }
  };

  const handleDeleteTopic = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este tópico?')) {
      deleteV2Topic(id);
      syncCycleWithSubjects();
      recalculateRoute();
    }
  };

  const handleAddActivity = (topicId: string, subjectId: string) => {
    if (!newActivityTitle.trim() || !activePlanId) return;
    const durationMins = parseInt(newActivityDuration) || 0;
    
    const newActivity = {
      id: 'act_' + Date.now().toString(),
      planId: activePlanId,
      subjectId,
      topicId,
      title: newActivityTitle.trim(),
      type: newActivityType,
      status: 'pending' as const,
      expectedDurationSeconds: durationMins * 60,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    addV2Activity(newActivity);
    setNewActivityTitle('');
    setNewActivityDuration('');
    setAddingActivityTo(null);
  };


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
        {/* Left Column: Subjects */}
        <div className="md:col-span-1 space-y-3">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-bold text-neutral-900 uppercase tracking-wider text-xs">Matérias</h2>
            {!isAddingSubject && (
              <button onClick={() => setIsAddingSubject(true)} className="p-1 hover:bg-neutral-100 rounded text-neutral-600 transition-colors">
                <Plus size={16} />
              </button>
            )}
          </div>
          
          {isAddingSubject && (
            <div className="bg-white p-3 rounded-xl border border-neutral-300 shadow-sm flex items-center gap-2">
              <input 
                type="text" 
                autoFocus
                placeholder="Nome da matéria..."
                value={newSubjectName}
                onChange={e => setNewSubjectName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddSubject()}
                className="flex-1 bg-transparent text-sm focus:outline-none"
              />
              <button onClick={handleAddSubject} className="p-1.5 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800">
                <Plus size={14} />
              </button>
              <button onClick={() => setIsAddingSubject(false)} className="text-xs text-neutral-500 hover:text-neutral-900 p-1">
                Cancelar
              </button>
            </div>
          )}

          {(!v2Subjects || v2Subjects.length === 0) && !isAddingSubject && (
            <div className="text-center py-6 border-2 border-dashed border-neutral-200 rounded-xl text-neutral-400 text-sm">
              Nenhuma matéria
            </div>
          )}

          {v2Subjects?.map(subject => {
            const subjectTopics = v2Topics?.filter(t => t.subjectId === subject.id) || [];
            const isSelected = selectedSubject === subject.id;
            return (
              <div
                key={subject.id}
                onClick={() => setSelectedSubject(subject.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer group ${
                  isSelected 
                    ? 'bg-neutral-900 border-neutral-900 text-white shadow-md' 
                    : 'bg-white border-neutral-200 hover:border-neutral-300 text-neutral-900 hover:bg-neutral-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold pr-2">{subject.name}</h3>
                    <p className={`text-xs mt-1 ${isSelected ? 'text-neutral-300' : 'text-neutral-500'}`}>
                      {subjectTopics.length} tópicos
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <button 
                      onClick={(e) => handleDeleteSubject(subject.id, e)} 
                      className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity ${isSelected ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-red-50 hover:text-red-600 text-neutral-400'}`}
                      title="Excluir"
                    >
                      <Trash2 size={14} />
                    </button>
                    <ChevronRight size={18} className={isSelected ? 'text-white' : 'text-neutral-400'} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Topics & Activities */}
        <div className="md:col-span-2">
          {selectedSubject ? (
            <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-serif font-bold text-neutral-900">
                  {v2Subjects?.find(s => s.id === selectedSubject)?.name}
                </h2>
                <button 
                  onClick={() => setAddingTopicTo(selectedSubject)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-sm rounded-lg transition-colors"
                >
                  <Plus size={14} />
                  Adicionar Tópico
                </button>
              </div>
              
              <div className="space-y-4">
                {addingTopicTo === selectedSubject && (
                  <div className="border border-neutral-900 bg-neutral-50 p-4 rounded-xl flex items-center gap-3">
                    <input 
                      type="text"
                      autoFocus
                      placeholder="Nome do tópico..."
                      value={newTopicName}
                      onChange={e => setNewTopicName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddTopic(selectedSubject)}
                      className="flex-1 bg-white border border-neutral-300 p-2 rounded-lg text-sm focus:ring-2 focus:ring-neutral-900 focus:outline-none"
                    />
                    <button onClick={() => handleAddTopic(selectedSubject)} className="px-4 py-2 bg-neutral-900 text-white font-bold text-sm rounded-lg hover:bg-neutral-800">
                      Salvar
                    </button>
                    <button onClick={() => setAddingTopicTo(null)} className="px-4 py-2 text-neutral-600 text-sm font-medium hover:bg-neutral-100 rounded-lg">
                      Cancelar
                    </button>
                  </div>
                )}

                {(v2Topics?.filter(t => t.subjectId === selectedSubject) || []).map(topic => {
                  const activities = v2Activities?.filter(a => a.topicId === topic.id) || [];
                  return (
                    <div key={topic.id} className="border border-neutral-200 rounded-xl p-4 bg-white shadow-sm group">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          {editingTopic === topic.id ? (
                            <input
                              type="text"
                              autoFocus
                              defaultValue={topic.name}
                              onBlur={(e) => {
                                if (e.target.value.trim() && e.target.value !== topic.name) {
                                  updateV2Topic({ ...topic, name: e.target.value.trim() });
                                }
                                setEditingTopic(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') e.currentTarget.blur();
                              }}
                              className="font-bold text-neutral-900 bg-white border border-neutral-200 rounded px-1 w-full focus:outline-none focus:ring-1 focus:ring-neutral-900"
                            />
                          ) : (
                            <h4 
                              className="font-bold text-neutral-900"
                              onDoubleClick={() => setEditingTopic(topic.id)}
                            >
                              {topic.name}
                            </h4>
                          )}
                          <span className="text-xs font-medium px-2 py-1 bg-neutral-100 rounded-md text-neutral-600">
                            {activities.length} atividades
                          </span>
                        </div>
                        <button 
                          onClick={() => handleDeleteTopic(topic.id)}
                          className="p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      
                      {activities.length > 0 ? (
                        <div className="space-y-2 mt-4">
                          {activities.map(act => (
                            <div key={act.id} className="group/act flex items-center gap-3 text-sm bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                              {act.type === 'Videoaula' ? <PlayCircle size={16} className="text-blue-500" /> : <FileText size={16} className="text-neutral-400" />}
                              {editingActivity === act.id ? (
                                <input
                                  type="text"
                                  autoFocus
                                  defaultValue={act.title}
                                  onBlur={(e) => {
                                    if (e.target.value.trim() && e.target.value !== act.title) {
                                      updateV2Activity({ ...act, title: e.target.value.trim() });
                                    }
                                    setEditingActivity(null);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') e.currentTarget.blur();
                                  }}
                                  className="text-neutral-700 font-medium flex-1 bg-white border border-neutral-200 rounded px-1 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                                />
                              ) : (
                                <span 
                                  className="text-neutral-700 font-medium flex-1"
                                  onDoubleClick={() => setEditingActivity(act.id)}
                                >
                                  {act.title}
                                </span>
                              )}
                              {act.expectedDurationSeconds > 0 && (
                                <span className="text-xs text-neutral-400">{Math.round(act.expectedDurationSeconds / 60)} min</span>
                              )}
                              <button onClick={() => deleteV2Activity(act.id)} className="opacity-0 group-hover/act:opacity-100 p-1 text-red-500 hover:bg-red-50 rounded">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-neutral-500 mt-4 italic">Nenhuma atividade registrada neste tópico.</p>
                      )}
                      
                      {addingActivityTo === topic.id ? (
                        <div className="mt-4 p-3 bg-neutral-50 rounded-lg border border-neutral-200 space-y-3">
                          <input
                            type="text"
                            placeholder="Título da atividade"
                            value={newActivityTitle}
                            onChange={(e) => setNewActivityTitle(e.target.value)}
                            className="w-full p-2 text-sm bg-white border border-neutral-200 rounded-md focus:ring-1 focus:ring-neutral-900 focus:outline-none"
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <select 
                              value={newActivityType}
                              onChange={(e) => setNewActivityType(e.target.value as any)}
                              className="flex-1 p-2 text-sm bg-white border border-neutral-200 rounded-md focus:outline-none"
                            >
                              <option value="Leitura">Leitura</option>
                              <option value="Videoaula">Videoaula</option>
                              <option value="Questões">Questões</option>
                              <option value="Revisão">Revisão</option>
                              <option value="Simulado">Simulado</option>
                              <option value="Outro">Outro</option>
                            </select>
                            <input
                              type="number"
                              placeholder="Minutos (opcional)"
                              value={newActivityDuration}
                              onChange={(e) => setNewActivityDuration(e.target.value)}
                              className="w-1/3 p-2 text-sm bg-white border border-neutral-200 rounded-md focus:outline-none"
                            />
                          </div>
                          <div className="flex gap-2 pt-1">
                            <button onClick={() => handleAddActivity(topic.id, topic.subjectId)} className="px-3 py-1.5 bg-neutral-900 text-white text-xs font-bold rounded-md hover:bg-neutral-800">
                              Adicionar
                            </button>
                            <button onClick={() => setAddingActivityTo(null)} className="px-3 py-1.5 text-neutral-600 text-xs font-bold hover:bg-neutral-100 rounded-md">
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setAddingActivityTo(topic.id)}
                          className="mt-4 text-xs font-bold text-neutral-500 hover:text-neutral-900 flex items-center gap-1"
                        >
                          <Plus size={14} /> Adicionar Atividade
                        </button>
                      )}

                    </div>
                  );
                })}

                {(v2Topics?.filter(t => t.subjectId === selectedSubject) || []).length === 0 && addingTopicTo !== selectedSubject && (
                  <div className="text-sm text-neutral-500 text-center py-12 border-2 border-dashed border-neutral-200 rounded-xl">
                    Nenhum tópico cadastrado nesta matéria.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[300px] border-2 border-dashed border-neutral-200 rounded-2xl flex flex-col items-center justify-center text-center text-neutral-400 bg-neutral-50/50 p-6">
              <BookOpen size={32} className="mb-4 text-neutral-300" />
              <p className="font-medium text-neutral-600 mb-1">Selecione uma matéria</p>
              <p className="text-sm">Clique em uma matéria ao lado para ver e gerenciar seus tópicos.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

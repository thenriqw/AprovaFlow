import React, { useState } from 'react';
import { useStore, SubjectConfig } from '../store';
import { BookOpen, Plus, Trash2, Edit2, ChevronDown, ChevronUp, Archive, Save, X } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Subjects() {
  const { userProfile, addSubject, updateSubject, deleteSubject, archiveSubject, addTopic, updateTopic, deleteTopic, syncCycleWithSubjects, recalculateRoute } = useStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const [newSubject, setNewSubject] = useState({ name: '', difficulty: 'medium' as const, importance: 3 });
  const [newTopic, setNewTopic] = useState({ subjectId: '', name: '' });
  
  const [editingSubject, setEditingSubject] = useState<string | null>(null);
  const [editingTopic, setEditingTopic] = useState<{subId: string, topId: string} | null>(null);

  const subjects = userProfile?.subjects || [];
  const activeSubjects = subjects.filter(s => !s.isArchived);
  const archivedSubjects = subjects.filter(s => s.isArchived);

  const applyChanges = () => {
    syncCycleWithSubjects();
    recalculateRoute();
  };

  const handleAddSubject = () => {
    if (newSubject.name.trim()) {
      addSubject(newSubject);
      setNewSubject({ name: '', difficulty: 'medium', importance: 3 });
      applyChanges();
    }
  };

  const handleAddTopic = (subjectId: string) => {
    if (newTopic.subjectId === subjectId && newTopic.name.trim()) {
      addTopic(subjectId, newTopic.name);
      setNewTopic({ subjectId: '', name: '' });
      applyChanges();
    }
  };
  
  const handleDeleteSubject = (id: string) => {
    if (window.confirm('Excluir esta matéria afetará permanentemente seu histórico atrelado a ela. Se quiser preservar o histórico, considere usar a opção Arquivar. Deseja excluir definitivamente?')) {
      deleteSubject(id);
      applyChanges();
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <header>
        <h1 className="text-3xl font-black tracking-tight text-neutral-900">Gerenciador de Matérias</h1>
        <p className="text-neutral-500 mt-1">Organize suas disciplinas e tópicos de estudo.</p>
      </header>

      {/* Adicionar Matéria */}
      <section className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm">
        <h2 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2"><Plus size={20}/> Nova Matéria</h2>
        <div className="flex flex-col md:flex-row gap-4">
          <input 
            type="text" 
            placeholder="Nome da matéria (ex: Biologia)"
            className="flex-1 p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
            value={newSubject.name}
            onChange={e => setNewSubject({...newSubject, name: e.target.value})}
          />
          <div className="flex gap-4">
            <select 
              className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-neutral-900 focus:outline-none"
              value={newSubject.difficulty}
              onChange={e => setNewSubject({...newSubject, difficulty: e.target.value as any})}
              title="Dificuldade"
            >
              <option value="low">Dificuldade: Baixa</option>
              <option value="medium">Dificuldade: Média</option>
              <option value="high">Dificuldade: Alta</option>
            </select>
            <select 
              className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-neutral-900 focus:outline-none"
              value={newSubject.importance}
              onChange={e => setNewSubject({...newSubject, importance: parseInt(e.target.value)})}
              title="Importância"
            >
              <option value="1">Peso 1 (Baixo)</option>
              <option value="2">Peso 2</option>
              <option value="3">Peso 3 (Médio)</option>
              <option value="4">Peso 4</option>
              <option value="5">Peso 5 (Alto)</option>
            </select>
            <button 
              onClick={handleAddSubject}
              className="px-6 py-3 bg-neutral-900 text-white font-bold rounded-xl hover:bg-neutral-800 transition-all flex items-center gap-2"
            >
              Adicionar
            </button>
          </div>
        </div>
      </section>

      {/* Lista de Matérias Ativas */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-neutral-900 mb-4">Matérias Ativas</h2>
        {activeSubjects.length === 0 ? (
          <div className="text-center py-12 text-neutral-400 bg-white rounded-3xl border border-neutral-200 shadow-sm">
            Nenhuma matéria ativa.
          </div>
        ) : (
          activeSubjects.map(subject => (
            <div key={subject.id} className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
              <div 
                className="p-5 flex justify-between items-center cursor-pointer hover:bg-neutral-50 transition-colors"
                onClick={() => setExpandedId(expandedId === subject.id ? null : subject.id)}
              >
                {editingSubject === subject.id ? (
                  <div className="flex-1 flex gap-3 mr-4" onClick={e => e.stopPropagation()}>
                    <input 
                      autoFocus
                      type="text" 
                      defaultValue={subject.name}
                      onBlur={e => { updateSubject(subject.id, { name: e.target.value }); applyChanges(); }}
                      onKeyDown={e => { if (e.key === 'Enter') { updateSubject(subject.id, { name: e.currentTarget.value }); applyChanges(); setEditingSubject(null); } }}
                      className="flex-1 p-2 bg-white rounded border border-neutral-300 font-bold"
                    />
                    <select 
                      value={subject.difficulty}
                      onChange={e => { updateSubject(subject.id, { difficulty: e.target.value as any }); applyChanges(); }}
                      className="p-2 border border-neutral-300 rounded bg-white text-sm"
                    >
                      <option value="low">Dificuldade: Baixa</option>
                      <option value="medium">Dificuldade: Média</option>
                      <option value="high">Dificuldade: Alta</option>
                    </select>
                    <select 
                      value={subject.importance}
                      onChange={e => { updateSubject(subject.id, { importance: parseInt(e.target.value) }); applyChanges(); }}
                      className="p-2 border border-neutral-300 rounded bg-white text-sm"
                    >
                      <option value="1">Peso 1 (Baixo)</option>
                      <option value="2">Peso 2</option>
                      <option value="3">Peso 3 (Médio)</option>
                      <option value="4">Peso 4</option>
                      <option value="5">Peso 5 (Alto)</option>
                    </select>
                    <button onClick={() => setEditingSubject(null)} className="p-2 text-green-600 bg-green-50 rounded">
                      <Save size={18} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center text-neutral-600">
                      <BookOpen size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-neutral-900">{subject.name}</h3>
                      <p className="text-xs text-neutral-500">
                        Dif: {subject.difficulty === 'high' ? 'Alta' : subject.difficulty === 'low' ? 'Baixa' : 'Média'} • 
                        Peso: {subject.importance} • 
                        {subject.topics.length} assuntos
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  {!editingSubject && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setEditingSubject(subject.id); }}
                      className="p-2 text-neutral-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                      title="Editar Matéria"
                    >
                      <Edit2 size={18} />
                    </button>
                  )}
                  <button 
                    onClick={(e) => { e.stopPropagation(); archiveSubject(subject.id); applyChanges(); }}
                    className="p-2 text-neutral-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                    title="Arquivar Matéria (Ocultar da Fila)"
                  >
                    <Archive size={18} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteSubject(subject.id); }}
                    className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    title="Excluir Definitivamente"
                  >
                    <Trash2 size={18} />
                  </button>
                  <div className="pl-2 border-l border-neutral-200">
                    {expandedId === subject.id ? <ChevronUp size={20} className="text-neutral-400" /> : <ChevronDown size={20} className="text-neutral-400" />}
                  </div>
                </div>
              </div>
              
              {expandedId === subject.id && (
                <div className="p-5 pt-0 border-t border-neutral-100 bg-neutral-50">
                  <div className="mt-4 mb-4 flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Novo assunto (ex: Cinemática)"
                      className="flex-1 p-2 text-sm bg-white rounded-lg border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                      value={newTopic.subjectId === subject.id ? newTopic.name : ''}
                      onChange={e => setNewTopic({ subjectId: subject.id, name: e.target.value })}
                      onKeyDown={e => e.key === 'Enter' && handleAddTopic(subject.id)}
                    />
                    <button 
                      onClick={() => handleAddTopic(subject.id)}
                      className="px-4 py-2 bg-neutral-200 text-neutral-900 text-sm font-bold rounded-lg hover:bg-neutral-300 transition-all"
                    >
                      Add Assunto
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {subject.topics.map(topic => (
                      <div key={topic.id} className="flex justify-between items-center p-3 bg-white rounded-lg border border-neutral-100 shadow-sm">
                        {editingTopic?.subId === subject.id && editingTopic.topId === topic.id ? (
                          <input 
                            autoFocus
                            type="text"
                            defaultValue={topic.name}
                            onBlur={e => { updateTopic(subject.id, topic.id, e.target.value); applyChanges(); }}
                            onKeyDown={e => { if (e.key === 'Enter') { updateTopic(subject.id, topic.id, e.currentTarget.value); applyChanges(); setEditingTopic(null); } }}
                            className="flex-1 text-sm font-medium text-neutral-900 bg-white border border-neutral-300 rounded px-2 py-1 mr-2"
                          />
                        ) : (
                          <span className="text-sm font-medium text-neutral-700 flex-1">{topic.name}</span>
                        )}
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              if (editingTopic?.topId === topic.id) setEditingTopic(null);
                              else setEditingTopic({ subId: subject.id, topId: topic.id });
                            }}
                            className="text-neutral-400 hover:text-blue-500 transition-colors"
                          >
                            {editingTopic?.topId === topic.id ? <Save size={16} className="text-green-500" /> : <Edit2 size={16} />}
                          </button>
                          <button 
                            onClick={() => { deleteTopic(subject.id, topic.id); applyChanges(); }}
                            className="text-neutral-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {subject.topics.length === 0 && (
                      <p className="text-center text-sm text-neutral-400 py-2">Nenhum assunto cadastrado nesta matéria.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </section>

      {/* Lista de Matérias Arquivadas */}
      {archivedSubjects.length > 0 && (
        <section className="space-y-4 pt-8 border-t border-neutral-200">
          <h2 className="text-xl font-bold text-neutral-500 mb-4">Matérias Arquivadas</h2>
          {archivedSubjects.map(subject => (
            <div key={subject.id} className="bg-neutral-50 rounded-2xl border border-neutral-200 opacity-70">
              <div className="p-5 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-neutral-200 rounded-xl flex items-center justify-center text-neutral-400">
                    <Archive size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-neutral-600 line-through">{subject.name}</h3>
                    <p className="text-xs text-neutral-400">
                      {subject.topics.length} assuntos
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => { updateSubject(subject.id, { isArchived: false }); applyChanges(); }}
                    className="p-2 text-neutral-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all text-sm font-bold"
                  >
                    Desarquivar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
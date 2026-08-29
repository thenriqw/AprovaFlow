const fs = require('fs');
let code = fs.readFileSync('src/components/Content.tsx', 'utf8');

// Add handleAddActivity
const addActivityCode = `
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
      status: 'pending',
      expectedDurationSeconds: durationMins * 60,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    addV2Activity(newActivity);
    setNewActivityTitle('');
    setNewActivityDuration('');
    setAddingActivityTo(null);
  };
`;

code = code.replace(/  const handleDeleteTopic = \(id: string\) => \{[\s\S]*?recalculateRoute\(\);\n    \}\n  \};/, `  const handleDeleteTopic = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este tópico?')) {
      deleteV2Topic(id);
      syncCycleWithSubjects();
      recalculateRoute();
    }
  };
${addActivityCode}`);

const editActivityUI = `
                      {activities.length > 0 ? (
                        <div className="space-y-2 mt-4">
                          {activities.map(act => (
                            <div key={act.id} className="group/act flex items-center gap-3 text-sm bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                              {act.type === 'Videoaula' ? <PlayCircle size={16} className="text-blue-500" /> : <FileText size={16} className="text-neutral-400" />}
                              <span className="text-neutral-700 font-medium flex-1">{act.title}</span>
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
`;

// Looking for {activities.map...
code = code.replace(/                      <div className="space-y-2 mt-4">[\s\S]*?<\/div>/, editActivityUI);

fs.writeFileSync('src/components/Content.tsx', code);

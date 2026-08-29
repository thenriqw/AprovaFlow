const fs = require('fs');
let code = fs.readFileSync('src/components/Content.tsx', 'utf8');

code = code.replace(/const \[newActivityDuration, setNewActivityDuration\] = useState\(''\);/,
`const [newActivityDuration, setNewActivityDuration] = useState('');
  const [newActivitySource, setNewActivitySource] = useState('');`);

const handleAddActivityReplacement = `
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
      source: newActivitySource.trim(),
      status: 'pending' as const,
      expectedDurationSeconds: durationMins * 60,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    addV2Activity(newActivity);
    setNewActivityTitle('');
    setNewActivityDuration('');
    setNewActivitySource('');
    setAddingActivityTo(null);
  };
`;

code = code.replace(/  const handleAddActivity = \(topicId: string, subjectId: string\) => \{[\s\S]*?setAddingActivityTo\(null\);\n  \};/, handleAddActivityReplacement.trim());

const formInputs = `
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
                          <input
                            type="text"
                            placeholder="Fonte (opcional) ex: Gran Cursos"
                            value={newActivitySource}
                            onChange={(e) => setNewActivitySource(e.target.value)}
                            className="w-full p-2 text-sm bg-white border border-neutral-200 rounded-md focus:ring-1 focus:ring-neutral-900 focus:outline-none"
                          />
`;

code = code.replace(/                          <div className="flex gap-2">\n\s*<select [\s\S]*?<\/select>\n\s*<input[\s\S]*?className="w-1\/3 p-2 text-sm bg-white border border-neutral-200 rounded-md focus:outline-none"\n\s*\/>\n\s*<\/div>/, formInputs.trim());

fs.writeFileSync('src/components/Content.tsx', code);

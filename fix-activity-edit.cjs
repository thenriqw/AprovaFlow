const fs = require('fs');
let code = fs.readFileSync('src/components/Content.tsx', 'utf8');

const editForm = `
                                <div className="flex-1 space-y-2 w-full">
                                  <input
                                    type="text"
                                    autoFocus
                                    defaultValue={act.title}
                                    onChange={(e) => act._editTitle = e.target.value}
                                    placeholder="Título"
                                    className="w-full text-neutral-700 font-medium bg-white border border-neutral-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                                  />
                                  <div className="flex gap-2">
                                    <select 
                                      defaultValue={act.type}
                                      onChange={(e) => act._editType = e.target.value}
                                      className="flex-1 p-1 text-xs bg-white border border-neutral-200 rounded-md focus:outline-none"
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
                                      placeholder="Minutos"
                                      defaultValue={act.expectedDurationSeconds > 0 ? Math.round(act.expectedDurationSeconds / 60) : ''}
                                      onChange={(e) => act._editDuration = e.target.value}
                                      className="w-1/3 p-1 text-xs bg-white border border-neutral-200 rounded-md focus:outline-none"
                                    />
                                  </div>
                                  <input
                                    type="text"
                                    placeholder="Fonte (opcional)"
                                    defaultValue={act.source || ''}
                                    onChange={(e) => act._editSource = e.target.value}
                                    className="w-full text-neutral-700 text-xs bg-white border border-neutral-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                                  />
                                  <div className="flex justify-end gap-2 pt-1">
                                    <button 
                                      onClick={() => setEditingActivity(null)}
                                      className="px-2 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-200 rounded"
                                    >
                                      Cancelar
                                    </button>
                                    <button 
                                      onClick={() => {
                                        const title = act._editTitle !== undefined ? act._editTitle.trim() : act.title;
                                        const type = act._editType || act.type;
                                        const source = act._editSource !== undefined ? act._editSource.trim() : act.source;
                                        const durationStr = act._editDuration !== undefined ? act._editDuration : (act.expectedDurationSeconds / 60).toString();
                                        const durationMins = parseInt(durationStr) || 0;
                                        
                                        if (title) {
                                          updateV2Activity({
                                            ...act,
                                            title,
                                            type,
                                            source,
                                            expectedDurationSeconds: durationMins * 60
                                          });
                                        }
                                        setEditingActivity(null);
                                      }}
                                      className="px-2 py-1 text-xs font-medium bg-neutral-900 text-white rounded hover:bg-neutral-800"
                                    >
                                      Salvar
                                    </button>
                                  </div>
                                </div>
`;

code = code.replace(/                                <input\n\s*type="text"\n\s*autoFocus\n\s*defaultValue=\{act\.title\}\n\s*onBlur=\{\(e\) => \{\n\s*if \(e\.target\.value\.trim\(\) && e\.target\.value !== act\.title\) \{\n\s*updateV2Activity\(\{ \.\.\.act, title: e\.target\.value\.trim\(\) \}\);\n\s*\}\n\s*setEditingActivity\(null\);\n\s*\}\}\n\s*onKeyDown=\{\(e\) => \{\n\s*if \(e\.key === 'Enter'\) e\.currentTarget\.blur\(\);\n\s*\}\}\n\s*className="text-neutral-700 font-medium flex-1 bg-white border border-neutral-200 rounded px-1 focus:outline-none focus:ring-1 focus:ring-neutral-900"\n\s*\/>/, editForm.trim());

// Also fixing the wrapper div to align-start when editing
code = code.replace(/<div key=\{act\.id\} className="group\/act flex items-center gap-3 text-sm bg-neutral-50 p-3 rounded-lg border border-neutral-100">/g,
`<div key={act.id} className={\`group/act flex \${editingActivity === act.id ? 'items-start' : 'items-center'} gap-3 text-sm bg-neutral-50 p-3 rounded-lg border border-neutral-100\`}>`);


fs.writeFileSync('src/components/Content.tsx', code);

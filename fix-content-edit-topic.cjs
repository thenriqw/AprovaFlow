const fs = require('fs');
let code = fs.readFileSync('src/components/Content.tsx', 'utf8');

code = code.replace(
  /<h4 \n\s*className="font-bold text-neutral-900"\n\s*onDoubleClick=\{\(\) => setEditingTopic\(topic\.id\)\}\n\s*>\n\s*\{topic\.name\}\n\s*<\/h4>/g,
  `<h4 className="font-bold text-neutral-900 flex items-center gap-2">
                              {topic.name}
                              <button 
                                onClick={(e) => { e.stopPropagation(); setEditingTopic(topic.id); }}
                                className="p-1 text-neutral-400 hover:text-neutral-900 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                                title="Renomear tópico"
                              >
                                <Edit2 size={12} />
                              </button>
                            </h4>`
);

// Fix topic delete button to be always visible on mobile
code = code.replace(
  /<button \n\s*onClick=\{\(\) => handleDeleteTopic\(topic\.id\)\}\n\s*className="p-1\.5 text-neutral-400 hover:bg-red-50 hover:text-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"/g,
  `<button 
                          onClick={() => handleDeleteTopic(topic.id)}
                          className="p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-600 rounded-lg opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"`
);

// Fix activity edit/delete buttons
code = code.replace(
  /<span \n\s*className="text-neutral-700 font-medium flex-1"\n\s*onDoubleClick=\{\(\) => setEditingActivity\(act\.id\)\}\n\s*>\n\s*\{act\.title\}\n\s*<\/span>/g,
  `<span className="text-neutral-700 font-medium flex-1 flex items-center gap-2">
                                  {act.title}
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); setEditingActivity(act.id); }}
                                    className="p-1 text-neutral-400 hover:text-neutral-900 opacity-100 sm:opacity-0 sm:group-hover/act:opacity-100 transition-opacity"
                                    title="Editar"
                                  >
                                    <Edit2 size={12} />
                                  </button>
                                </span>`
);

code = code.replace(
  /<button onClick=\{\(\) => deleteV2Activity\(act\.id\)\} className="opacity-0 group-hover\/act:opacity-100 p-1 text-red-500 hover:bg-red-50 rounded">/g,
  `<button onClick={() => deleteV2Activity(act.id)} className="opacity-100 sm:opacity-0 sm:group-hover/act:opacity-100 p-1 text-red-500 hover:bg-red-50 rounded">`
);

fs.writeFileSync('src/components/Content.tsx', code);

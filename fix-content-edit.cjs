const fs = require('fs');
let code = fs.readFileSync('src/components/Content.tsx', 'utf8');

// Add state for editing
code = code.replace(/const \[addingActivityTo, setAddingActivityTo\] = useState<string \| null>\(null\);/, 
`const [addingActivityTo, setAddingActivityTo] = useState<string | null>(null);
  const [editingSubject, setEditingSubject] = useState<string | null>(null);
  const [editingTopic, setEditingTopic] = useState<string | null>(null);
  const [editingActivity, setEditingActivity] = useState<string | null>(null);
  
  const { updateV2Subject, updateV2Topic, updateV2Activity } = useStore();
`);

// Rename subject UI
code = code.replace(/<span className="font-bold text-neutral-900 truncate">\{sub\.name\}<\/span>/, 
`{editingSubject === sub.id ? (
                      <input
                        type="text"
                        autoFocus
                        defaultValue={sub.name}
                        onBlur={(e) => {
                          if (e.target.value.trim() && e.target.value !== sub.name) {
                            updateV2Subject({ ...sub, name: e.target.value.trim() });
                          }
                          setEditingSubject(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') e.currentTarget.blur();
                        }}
                        className="font-bold text-neutral-900 bg-white border border-neutral-200 rounded px-1 max-w-[150px] focus:outline-none focus:ring-1 focus:ring-neutral-900"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span 
                        className="font-bold text-neutral-900 truncate"
                        onDoubleClick={(e) => { e.stopPropagation(); setEditingSubject(sub.id); }}
                      >
                        {sub.name}
                      </span>
                    )}`);

// Subject archive
code = code.replace(/<button \n                          onClick=\{\(e\) => handleDeleteSubject\(sub\.id, e\)\}/, 
`<button 
                          onClick={(e) => { e.stopPropagation(); updateV2Subject({ ...sub, isArchived: !sub.isArchived }); }}
                          className="p-1.5 text-neutral-400 hover:text-neutral-900 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          title={sub.isArchived ? 'Desarquivar' : 'Arquivar'}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={(e) => handleDeleteSubject(sub.id, e)}`);

// Topic rename
code = code.replace(/<h4 className="font-bold text-neutral-900">\{topic\.name\}<\/h4>/, 
`{editingTopic === topic.id ? (
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
                          )}`);

fs.writeFileSync('src/components/Content.tsx', code);

const fs = require('fs');
let code = fs.readFileSync('src/components/Content.tsx', 'utf8');

code = code.replace(/<span className="text-neutral-700 font-medium flex-1">\{act\.title\}<\/span>/, 
`{editingActivity === act.id ? (
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
                              )}`);

fs.writeFileSync('src/components/Content.tsx', code);

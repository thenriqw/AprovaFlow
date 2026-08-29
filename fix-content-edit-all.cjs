const fs = require('fs');
let code = fs.readFileSync('src/components/Content.tsx', 'utf8');

// 1. Subject list item edit logic
code = code.replace(
  /<h3 className="font-bold pr-2">\{subject\.name\}<\/h3>/g,
  `{editingSubject === subject.id ? (
                      <input
                        type="text"
                        autoFocus
                        defaultValue={subject.name}
                        onBlur={(e) => {
                          if (e.target.value.trim() && e.target.value !== subject.name) {
                            updateV2Subject({ ...subject, name: e.target.value.trim() });
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
                      <h3 className="font-bold pr-2 flex items-center gap-2">
                        {subject.name}
                        <button 
                          onClick={(e) => { e.stopPropagation(); setEditingSubject(subject.id); }}
                          className="p-1 text-neutral-400 hover:text-neutral-900 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                          title="Renomear matéria"
                        >
                          <Edit2 size={12} />
                        </button>
                      </h3>
                    )}`
);

// Add archive button next to delete in subject list
code = code.replace(
  /<button \n\s*onClick=\{\(e\) => handleDeleteSubject\(subject\.id, e\)\}\s*className=\{`p-1\.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity \$\{isSelected \? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-red-50 hover:text-red-600 text-neutral-400'\}\`\}\n\s*title="Excluir"\n\s*>\n\s*<Trash2 size=\{14\} \/>\n\s*<\/button>/g,
  `<div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => { e.stopPropagation(); updateV2Subject({ ...subject, isArchived: !subject.isArchived }); }}
                        className={\`p-1.5 rounded-lg \${isSelected ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-neutral-200 text-neutral-400'}\`}
                        title={subject.isArchived ? "Desarquivar" : "Arquivar"}
                      >
                        <FileText size={14} className={subject.isArchived ? 'text-blue-400' : ''} />
                      </button>
                      <button 
                        onClick={(e) => handleDeleteSubject(subject.id, e)} 
                        className={\`p-1.5 rounded-lg \${isSelected ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-red-50 hover:text-red-600 text-neutral-400'}\`}
                        title="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>`
);

fs.writeFileSync('src/components/Content.tsx', code);

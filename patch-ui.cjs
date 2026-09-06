const fs = require('fs');

let content = fs.readFileSync('src/components/CreatePlan.tsx', 'utf-8');

// The original patching logic failed because the target string was different from what it expected.
// We are injecting right before the form.
const target = `<form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-2xl border border-neutral-200 shadow-sm space-y-8">`;

const replacement = `
      {/* Seção de Modelos Pré-definidos */}
      <div className="mb-10">
        <h2 className="text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
          <Zap className="text-amber-500" /> Comece com um Modelo Pré-definido
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {PLAN_TEMPLATES.map(template => (
            <div key={template.id} className="bg-white border-2 border-neutral-100 rounded-2xl p-6 shadow-sm hover:border-neutral-900 transition-all flex flex-col group">
              <div className="flex items-start justify-between mb-4">
                <span className="px-3 py-1 bg-neutral-900 text-white text-xs font-bold uppercase tracking-wider rounded-md">
                  {template.type === 'academico' ? 'Faculdade' : template.type === 'vestibular' ? 'ENEM' : 'Concurso'}
                </span>
                {template.semester && (
                  <span className="px-2 py-1 bg-neutral-100 text-neutral-600 text-xs font-semibold rounded-md">
                    {template.semester}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-neutral-900 mb-2">{template.name}</h3>
              <p className="text-sm text-neutral-500 mb-6 flex-grow">{template.description}</p>
              <div className="space-y-2 mb-6">
                <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  Disciplinas ({template.subjects.length})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {template.subjects.slice(0, 4).map(sub => (
                    <span key={sub.name} className="px-2 py-1 bg-neutral-50 text-neutral-600 text-xs rounded border border-neutral-100 truncate max-w-full">
                      {sub.name}
                    </span>
                  ))}
                  {template.subjects.length > 4 && (
                    <span className="px-2 py-1 bg-neutral-50 text-neutral-500 text-xs rounded border border-neutral-100">
                      +{template.subjects.length - 4}
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleUseTemplate(template)}
                disabled={loading}
                className="w-full py-3 bg-white border-2 border-neutral-200 text-neutral-900 font-bold rounded-xl group-hover:bg-neutral-900 group-hover:text-white group-hover:border-neutral-900 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Criando...' : 'Usar este Modelo'}
                {!loading && <CheckCircle2 size={18} />}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="relative flex items-center mb-8">
        <div className="flex-grow border-t border-neutral-200"></div>
        <span className="flex-shrink-0 mx-4 text-neutral-400 text-sm font-semibold uppercase tracking-widest">
          Ou crie um plano personalizado
        </span>
        <div className="flex-grow border-t border-neutral-200"></div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-2xl border border-neutral-200 shadow-sm space-y-8">`;

if (content.includes("Ou crie um plano personalizado")) {
    console.log("Already patched");
} else if (content.includes(target)) {
    // Remove the old buggy template if it somehow exists
    const badTemplateStart = `{/* Templates Section */}`;
    const badTemplateEnd = `Ou crie um plano do zero\n        </span>\n        <div className="flex-grow border-t border-neutral-200"></div>\n      </div>`;
    
    if (content.includes(badTemplateStart)) {
      const parts1 = content.split(badTemplateStart);
      const parts2 = parts1[1].split(badTemplateEnd);
      content = parts1[0] + parts2[1].substring(1); // skip the newline
    }
    
    content = content.replace(target, replacement);
    fs.writeFileSync('src/components/CreatePlan.tsx', content);
    console.log("Patched successfully");
} else {
    console.log("Target not found");
}


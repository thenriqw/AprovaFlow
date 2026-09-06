const fs = require('fs');

let content = fs.readFileSync('src/components/CreatePlan.tsx', 'utf-8');

// 1. Add error state
if (!content.includes('const [error, setError]')) {
    content = content.replace("const [loading, setLoading] = useState(false);", "const [loading, setLoading] = useState(false);\n  const [error, setError] = useState<string | null>(null);");
}

// 2. Replace alert() with setError() in handleUseTemplate
content = content.replace(/alert\('Erro ao criar plano a partir do modelo\.'\);/g, "setError('Erro ao criar plano a partir do modelo.');");
content = content.replace(/alert\('Erro ao criar plano\.'\);/g, "setError('Erro ao criar plano.');");

// 3. Clear error on start
content = content.replace("setLoading(true);", "setLoading(true);\n    setError(null);");

// 4. Add error message in UI
const errorUI = `
      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl flex items-center gap-3 animate-in fade-in">
          <div className="w-1.5 h-full bg-red-500 rounded-full"></div>
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}
`;
if (!content.includes('text-red-700 rounded-xl')) {
    content = content.replace('<div className="mb-10">', errorUI + '\n      <div className="mb-10">');
}

fs.writeFileSync('src/components/CreatePlan.tsx', content);
console.log("Patched UI error handling");

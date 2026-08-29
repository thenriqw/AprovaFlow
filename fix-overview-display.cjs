const fs = require('fs');
let code = fs.readFileSync('src/components/PlanOverview.tsx', 'utf8');

const replacement = `
          {!hasAvailability ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock size={24} className="text-neutral-400" />
              </div>
              <p className="text-neutral-900 font-medium">Configure sua disponibilidade</p>
              <p className="text-neutral-500 text-sm mt-1 max-w-md mx-auto">Adicione seu tempo de estudo diário para calcular se o plano cabe na sua rotina.</p>
            </div>
          ) : (!v2Activities || v2Activities.length === 0) ? (
`;

code = code.replace(/          \{\(\!v2Activities \|\| v2Activities\.length === 0\) \? \(/, replacement);

fs.writeFileSync('src/components/PlanOverview.tsx', code);

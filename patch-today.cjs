const fs = require('fs');

let content = fs.readFileSync('src/components/Today.tsx', 'utf-8');

if (!content.includes('import AcademicTodayWidget')) {
  content = content.replace("import { formatDuration } from '../lib/utils';", "import { formatDuration } from '../lib/utils';\nimport AcademicTodayWidget from './AcademicTodayWidget';\nimport { CheckSquare, Square } from 'lucide-react';");

  // insert actualTopic
  content = content.replace(
    "const recommendedActivity = nextTask && v2Activities?.find(a => \n    a.topicId === nextTask.topicId && a.status !== 'completed'\n  );",
    "const recommendedActivity = nextTask && v2Activities?.find(a => \n    a.topicId === nextTask.topicId && a.status !== 'completed'\n  );\n\n  const actualTopic = nextTask && state.v2Topics?.find(t => t.id === nextTask.topicId);"
  );

  // insert Pre/Pos aula UI in nextTask rendering
  const targetActivity = `                {recommendedActivity && (
                  <div className="mt-2 flex items-center gap-3 text-sm font-medium text-neutral-600 bg-neutral-100/50 p-2 rounded-lg inline-flex">`;
  const replacementActivity = `                {activePlan?.type === 'academico' && actualTopic && (
                  <div className="mt-3 flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-sm font-medium text-neutral-700">
                      {actualTopic.preAulaDone ? <CheckSquare size={16} className="text-green-600" /> : <Square size={16} className="text-neutral-400" />}
                      Pré-aula
                    </div>
                    <div className="flex items-center gap-1.5 text-sm font-medium text-neutral-700">
                      {actualTopic.posAulaDone ? <CheckSquare size={16} className="text-green-600" /> : <Square size={16} className="text-neutral-400" />}
                      Pós-aula
                    </div>
                  </div>
                )}
                {recommendedActivity && (
                  <div className="mt-2 flex items-center gap-3 text-sm font-medium text-neutral-600 bg-neutral-100/50 p-2 rounded-lg inline-flex">`;
  
  content = content.replace(targetActivity, replacementActivity);

  // insert AcademicTodayWidget if activePlan?.type === 'academico'
  // I will insert it after the "Seu plano está vazio" / "Próximo Passo" section
  const targetEndNextTask = `      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">`;
      
  const replacementEndNextTask = `      ) : null}

      {activePlan?.type === 'academico' && (
        <AcademicTodayWidget />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">`;

  content = content.replace(targetEndNextTask, replacementEndNextTask);

  fs.writeFileSync('src/components/Today.tsx', content);
  console.log("Patched Today.tsx");
}

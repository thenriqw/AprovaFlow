const fs = require('fs');
let code = fs.readFileSync('src/components/Today.tsx', 'utf8');

code = code.replace(/  const handleStart = \(\) => \{\n    if \(nextTask\) \{\n      setActiveTask\(nextTask\);\n    \} else \{\n      setActiveTask\(null\);\n    \}\n    setActiveTab\('timer'\);\n  \};/, 
`  const handleStart = () => {
    if (nextTask) {
      if (recommendedActivity) {
        setActiveTask({
          ...nextTask,
          activityId: recommendedActivity.id,
          activityType: recommendedActivity.type as any,
          source: recommendedActivity.title,
          expectedDurationSeconds: recommendedActivity.expectedDurationSeconds
        });
      } else {
        setActiveTask(nextTask);
      }
    } else {
      setActiveTask(null);
    }
    setActiveTab('timer');
  };`);

fs.writeFileSync('src/components/Today.tsx', code);

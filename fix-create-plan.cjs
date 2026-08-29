const fs = require('fs');
let code = fs.readFileSync('src/components/CreatePlan.tsx', 'utf8');

const replacement = `
    try {
      const hrs = parseInt(hoursPerDay) || 0;
      await createPlan({
        name: name.trim(),
        objective: objective.trim(),
        examDate,
        availableTimePerDay: { 0:0, 1:hrs, 2:hrs, 3:hrs, 4:hrs, 5:hrs, 6:0 }
      });
      useStore.getState().completeOnboarding({
        objective: objective.trim(),
        examName: name.trim(),
        examDate: examDate,
        availableTimePerDay: { 0:0, 1:hrs, 2:hrs, 3:hrs, 4:hrs, 5:hrs, 6:0 },
        subjects: []
      });
      setActiveTab('today');
    } catch (e) {
      console.error(e);
      alert("Erro ao criar plano: " + e.message);
    }
`;

code = code.replace(/    try \{\n      const hrs = parseInt\(hoursPerDay\) \|\| 0;\n      await createPlan\(\{[\s\S]*?setActiveTab\('today'\);\n    \} catch \(e\) \{\n      console\.error\(e\);\n    \}/, replacement.trim());

fs.writeFileSync('src/components/CreatePlan.tsx', code);

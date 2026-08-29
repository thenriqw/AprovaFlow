const fs = require('fs');
let code = fs.readFileSync('src/components/CreatePlan.tsx', 'utf8');

code = code.replace(/    \} catch \(e\) \{\n      console\.error\(e\);\n    \}/, 
`    } catch (e: any) {
      console.error(e);
      alert(e.message || "Erro ao criar plano.");
    }`);

fs.writeFileSync('src/components/CreatePlan.tsx', code);

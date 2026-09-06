const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf-8');

if (!content.includes("import Schedule from './components/Schedule';")) {
    content = content.replace("import CreatePlan from './components/CreatePlan';", "import CreatePlan from './components/CreatePlan';\nimport Schedule from './components/Schedule';");
}

if (!content.includes("{currentTab === 'schedule' && <Schedule />}")) {
    content = content.replace("{currentTab === 'create-plan' && <CreatePlan />}", "{currentTab === 'create-plan' && <CreatePlan />}\n      {currentTab === 'schedule' && <Schedule />}");
}

fs.writeFileSync('src/App.tsx', content);
console.log("Patched App.tsx");

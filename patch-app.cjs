const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

if (!content.includes('import Classroom')) {
  content = content.replace("import Settings from './components/Settings';", "import Settings from './components/Settings';\nimport Classroom from './components/Classroom';");
  
  content = content.replace(
    "{currentTab === 'settings' && <Settings />}",
    "{currentTab === 'settings' && <Settings />}\n      {currentTab === 'classroom' && <Classroom />}"
  );
  
  fs.writeFileSync('src/App.tsx', content);
}

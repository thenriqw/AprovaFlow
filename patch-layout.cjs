const fs = require('fs');

let content = fs.readFileSync('src/components/Layout.tsx', 'utf-8');

if (!content.includes('import { Home, Compass, Inbox, Search, Settings, BookOpen, Layers, LayoutGrid, Import, School, Calendar }')) {
    content = content.replace("import { Home, Compass, Inbox, Search, Settings, BookOpen, Layers, LayoutGrid, Import, School } from 'lucide-react';", "import { Home, Compass, Inbox, Search, Settings, BookOpen, Layers, LayoutGrid, Import, School, Calendar } from 'lucide-react';");
}

const newItem = `{ id: 'schedule', label: 'Cronograma', icon: <Calendar size={20} /> },`;

// find the map array for desktop sidebar
const targetDesktop = `
            const isAcademico = activePlan?.type === 'academico';
            
            let navItems = [
              { id: 'today', label: 'Hoje', icon: <Home size={20} /> },
              { id: 'plan', label: 'Visão Geral', icon: <Compass size={20} /> },`;
              
const replacementDesktop = `
            const isAcademico = activePlan?.type === 'academico';
            
            let navItems = [
              { id: 'today', label: 'Hoje', icon: <Home size={20} /> },
              { id: 'schedule', label: 'Cronograma', icon: <Calendar size={20} /> },
              { id: 'plan', label: 'Visão Geral', icon: <Compass size={20} /> },`;
              

if (content.includes("{ id: 'plan', label: 'Visão Geral', icon: <Compass size={20} /> }") && !content.includes("{ id: 'schedule', label: 'Cronograma', icon: <Calendar size={20} /> }")) {
    content = content.replace("{ id: 'plan', label: 'Visão Geral', icon: <Compass size={20} /> }", "{ id: 'schedule', label: 'Cronograma', icon: <Calendar size={20} /> },\n              { id: 'plan', label: 'Visão Geral', icon: <Compass size={20} /> }");
}

fs.writeFileSync('src/components/Layout.tsx', content);
console.log("Patched Layout.tsx");


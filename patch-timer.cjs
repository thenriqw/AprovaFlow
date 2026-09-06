const fs = require('fs');

let content = fs.readFileSync('src/components/Timer.tsx', 'utf-8');

const importTarget = `import { useStore } from '../store';`;
const newImport = `import { useStore } from '../store';
import { Users, Headphones, Signal } from 'lucide-react';`;

if (content.includes(importTarget) && !content.includes('Signal }')) {
    content = content.replace(importTarget, newImport);
}

// Add state for ambient noise / room
const stateTarget = `const [difficulty, setDifficulty] = useState<'low' | 'medium' | 'high' | undefined>(undefined);`;
const newState = `const [difficulty, setDifficulty] = useState<'low' | 'medium' | 'high' | undefined>(undefined);
  const [ambient, setAmbient] = useState<string>('silence');
  const [roomUsers, setRoomUsers] = useState(Math.floor(Math.random() * 40) + 12);`;

if (content.includes(stateTarget) && !content.includes('setAmbient')) {
    content = content.replace(stateTarget, newState);
}

const renderTarget = `<header className="text-center mb-8">`;
const newRender = `
      {/* Focus Room UI */}
      {isRunning && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-4 sm:gap-6 bg-white/90 backdrop-blur-md px-4 sm:px-6 py-2.5 rounded-full border border-neutral-200 shadow-lg shadow-neutral-900/5 animate-in fade-in slide-in-from-top-4 z-50">
           <div className="flex items-center gap-2 text-sm font-bold text-neutral-700">
              <Signal size={16} className="text-emerald-500" />
              <span className="hidden sm:inline">Sala de Foco</span>
           </div>
           <div className="w-px h-4 bg-neutral-200"></div>
           <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500">
              <Users size={14} />
              {roomUsers} <span className="hidden sm:inline">focando</span>
           </div>
           <div className="w-px h-4 bg-neutral-200"></div>
           <button 
              onClick={() => setAmbient(a => a === 'lofi' ? 'silence' : 'lofi')}
              className={\`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full transition-all \${ambient === 'lofi' ? 'bg-purple-100 text-purple-700 scale-105' : 'hover:bg-neutral-100 text-neutral-500'}\`}
           >
              <Headphones size={14} />
              Lofi
           </button>
        </div>
      )}

      <header className="text-center mb-8">`;

if (content.includes(renderTarget) && !content.includes('Focus Room UI')) {
    content = content.replace(renderTarget, newRender);
    fs.writeFileSync('src/components/Timer.tsx', content);
    console.log("Patched Timer Focus Room");
} else {
    console.log("Failed to patch Timer");
}

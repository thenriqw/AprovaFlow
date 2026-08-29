const fs = require('fs');
let code = fs.readFileSync('src/components/Settings.tsx', 'utf8');

const regex = /\s*\{\/\* Onboarding & Perfil \*\/\}\s*\{hasCompletedOnboarding && \([\s\S]*?Refazer Configuração\s*<\/button>\s*<\/section>\s*\)\}/;
code = code.replace(regex, '');

fs.writeFileSync('src/components/Settings.tsx', code);

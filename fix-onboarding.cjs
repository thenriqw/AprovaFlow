const fs = require('fs');
let code = fs.readFileSync('src/components/Onboarding.tsx', 'utf8');

const replacement = `
  const handleSelectPath = async (path: string) => {
    setStep('loading');
    
    const defaultProfile = {
      objective: path === 'free' ? 'Modo Livre' : '',
      examName: path === 'free' ? 'Estudo Livre' : path === 'import' ? 'Meu Edital' : path === 'manual' ? 'Plano Manual' : 'Novo Plano',
      examDate: '',
      availableTimePerDay: path === 'free' ? { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 } : { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
      subjects: []
    };
`;

code = code.replace(/  const handleSelectPath = async \(path: string\) => \{[\s\S]*?subjects: \[\]\n    \};/, replacement);

fs.writeFileSync('src/components/Onboarding.tsx', code);

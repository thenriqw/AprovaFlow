const fs = require('fs');
let code = fs.readFileSync('src/components/Onboarding.tsx', 'utf8');

const replacement = `
  const handleSelectPath = async (path: string) => {
    if (path === 'objective') {
      useStore.getState().setActiveTab('create-plan');
      return;
    }
    
    setStep('loading');
    
    const defaultProfile = {
      objective: path === 'free' ? 'Modo Livre' : '',
      examName: path === 'free' ? 'Estudo Livre' : path === 'import' ? 'Meu Edital' : path === 'manual' ? 'Plano Manual' : 'Novo Plano',
      examDate: '',
      availableTimePerDay: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
      subjects: []
    };
    
    try {
      if (path === 'import') {
        await completeOnboarding(defaultProfile);
        useStore.getState().setActiveTab('inbox');
      } else if (path === 'manual') {
        await completeOnboarding(defaultProfile);
        useStore.getState().setActiveTab('content');
      } else {
        await completeOnboarding(defaultProfile);
        useStore.getState().setActiveTab('today');
      }
    } catch (e) {
      console.error(e);
      setStep('options');
      alert("Erro ao criar plano. Tente novamente.");
    }
  };
`;

code = code.replace(/  const handleSelectPath = async \(path: string\) => \{[\s\S]*?alert\("Erro ao criar plano\. Tente novamente\."\);\n    \}\n  \};/, replacement);

fs.writeFileSync('src/components/Onboarding.tsx', code);

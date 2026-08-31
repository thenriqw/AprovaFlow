const DATA = {
  subjects: [
    { name: 'Matemática', imp: 5, diff: 5, acc: [0.60, 0.70], err: ['calculo', 'atencao', 'tempo'], topics: ['Razão e proporção', 'Porcentagem', 'Regra de três', 'Função afim', 'Função quadrática', 'Estatística', 'Probabilidade', 'Geometria plana', 'Geometria espacial', 'Análise combinatória'] },
    { name: 'Física', imp: 5, diff: 5, acc: [0.48, 0.60], err: ['teoria', 'calculo', 'interpretacao'], topics: ['Cinemática', 'Movimento uniforme', 'Movimento uniformemente variado', 'Dinâmica', 'Trabalho e energia', 'Hidrostática', 'Termologia', 'Eletrodinâmica', 'Ondulatória', 'Óptica'] },
    { name: 'Química', imp: 5, diff: 4, acc: [0.56, 0.68], err: ['teoria', 'calculo'], topics: ['Estrutura atômica', 'Tabela periódica', 'Ligações químicas', 'Estequiometria', 'Soluções', 'Termoquímica', 'Eletroquímica', 'Química orgânica'] },
    { name: 'Biologia', imp: 5, diff: 3, acc: [0.78, 0.85], err: ['teoria', 'atencao'], topics: ['Citologia', 'Membrana plasmática', 'Metabolismo energético', 'Genética', 'Ecologia', 'Evolução', 'Fisiologia humana', 'Botânica'] },
    { name: 'Português', imp: 4, diff: 3, acc: [0.75, 0.82], err: ['interpretacao', 'atencao'], topics: ['Interpretação de texto', 'Gêneros textuais', 'Funções da linguagem', 'Variação linguística', 'Coesão e coerência', 'Semântica', 'Gramática aplicada ao texto'] },
    { name: 'Literatura', imp: 3, diff: 3, acc: [0.70, 0.80], err: ['teoria', 'interpretacao'], topics: ['Escolas literárias', 'Modernismo', 'Realismo', 'Romantismo', 'Literatura contemporânea'] },
    { name: 'História', imp: 3, diff: 2, acc: [0.75, 0.82], err: ['teoria', 'interpretacao'], topics: ['Brasil Colônia', 'Brasil Império', 'República Velha', 'Era Vargas', 'Ditadura Militar', 'Revolução Industrial', 'Primeira Guerra Mundial', 'Segunda Guerra Mundial'] },
    { name: 'Geografia', imp: 3, diff: 2, acc: [0.68, 0.77], err: ['interpretacao', 'teoria'], topics: ['Cartografia', 'Urbanização', 'Globalização', 'Geopolítica', 'Climatologia', 'Questões ambientais', 'População', 'Agropecuária'] },
    { name: 'Filosofia', imp: 2, diff: 2, acc: [0.65, 0.75], err: ['interpretacao', 'teoria'], topics: ['Filosofia antiga', 'Ética', 'Filosofia moderna', 'Filosofia política'] },
    { name: 'Sociologia', imp: 2, diff: 2, acc: [0.65, 0.75], err: ['interpretacao'], topics: ['Cultura', 'Trabalho', 'Cidadania', 'Movimentos sociais', 'Desigualdade social'] },
    { name: 'Redação', imp: 5, diff: 4, acc: [0.80, 0.90], err: ['tempo'], topics: ['Estrutura dissertativo-argumentativa', 'Introdução', 'Desenvolvimento', 'Repertório sociocultural', 'Proposta de intervenção', 'Revisão textual'] }
  ]
};

const activityTypes = ['Videoaula', 'Leitura', 'Questões', 'Revisão', 'Simulado', 'Redação', 'Aula presencial', 'Flashcards', 'Outro'];

function createPRNG(seedStr: string) {
  let h1 = 1779033703, h2 = 3144134277, h3 = 1013904242, h4 = 2773480762;
  for (let i = 0, k; i < seedStr.length; i++) {
    k = seedStr.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  let a = h1 >>> 0, b = h2 >>> 0, c = h3 >>> 0, d = h4 >>> 0;
  return function() {
    a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
    let t = (a + b | 0) + d | 0;
    d = d + 1 | 0;
    a = b ^ b >>> 9;
    b = c + (c << 3) | 0;
    c = c << 21 | c >>> 11;
    c = c + t | 0;
    return (t >>> 0) / 4294967296;
  }
}

export function buildEnemQaDatasetPreview() {
  const rand = createPRNG('enem-2026-realista-v1');
  function randomInt(min: number, max: number) { return Math.floor(rand() * (max - min + 1)) + min; }
  function randomChoice<T>(arr: T[]): T { return arr[randomInt(0, arr.length - 1)]; }
  function randomFloat(min: number, max: number) { return rand() * (max - min) + min; }

  let topicsCount = 0;
  for (const s of DATA.subjects) {
    topicsCount += s.topics.length;
  }

  const generatedActivities = [];
  let completedActivities = 0;
  let pendingActivities = 0;
  
  for (const s of DATA.subjects) {
    for (const t of s.topics) {
      const isAdvanced = ['Citologia', 'Membrana plasmática', 'Genética', 'Interpretação de texto', 'Gêneros textuais', 'Brasil Colônia', 'Era Vargas', 'Razão e proporção', 'Porcentagem', 'Regra de três'].includes(t);
      const isOngoing = ['Função quadrática', 'Estatística', 'Probabilidade', 'Geometria plana', 'Dinâmica', 'Trabalho e energia', 'Estequiometria', 'Soluções', 'Ecologia', 'Fisiologia humana', 'Urbanização', 'Globalização'].includes(t);
      const isWeak = ['Eletrodinâmica', 'Óptica', 'Hidrostática', 'Geometria espacial', 'Análise combinatória', 'Eletroquímica', 'Química orgânica'].includes(t);

      let numActivities = 0;
      if (isAdvanced) numActivities = randomInt(3, 4);
      else if (isOngoing) numActivities = randomInt(2, 3);
      else if (isWeak) numActivities = randomInt(1, 2);
      else numActivities = randomInt(0, 1); 

      for (let i = 0; i < numActivities; i++) {
        const aType = randomChoice(['Videoaula', 'Leitura', 'Questões', 'Revisão', 'Questões', 'Videoaula']);
        let status = 'pending';
        if (isAdvanced) status = (rand() > 0.3) ? 'completed' : 'pending';
        else if (isOngoing) status = (rand() > 0.5) ? 'completed' : 'pending';
        else if (isWeak) status = 'pending';
        else status = (rand() > 0.6) ? 'completed' : 'pending';

        generatedActivities.push({ subject: s.name, topic: t, type: aType, status });
        if (status === 'completed') completedActivities++; else pendingActivities++;
      }
    }
  }

  const startDate = new Date('2026-06-01T12:00:00Z');
  const endDate = new Date('2026-08-30T12:00:00Z');
  const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
  
  const specialDays: Record<string, string[]> = {
    '2026-08-24': ['Matemática', 'Biologia'],
    '2026-08-25': ['Física', 'Português'],
    '2026-08-26': [], 
    '2026-08-27': ['Química', 'Matemática'],
    '2026-08-28': ['História'], 
    '2026-08-29': ['Física', 'Química', 'Matemática', 'Português'], 
    '2026-08-30': ['Biologia'] 
  };

  const generalSubjects = DATA.subjects.filter(s => s.name !== 'Redação');
  const getLocalDateStr = (d: Date) => d.toISOString().split('T')[0];

  const sessions = [];
  
  for (let i = 0; i <= totalDays; i++) {
    const currentDay = new Date(startDate);
    currentDay.setDate(startDate.getDate() + i);
    const dateStr = getLocalDateStr(currentDay);

    let dailySessions = 0;
    let targetSubjects: string[] = [];

    if (specialDays[dateStr]) {
      targetSubjects = specialDays[dateStr];
      dailySessions = targetSubjects.length;
    } else {
      const r = rand();
      if (r < 0.28) dailySessions = 0; // ~28% chance of no study
      else if (r < 0.45) dailySessions = 1; 
      else if (r < 0.85) dailySessions = 2; // Compensate with more sessions on active days
      else if (r < 0.95) dailySessions = 3; 
      else dailySessions = 4; // Saturdays could be handled better, but random is okay
      
      for (let j=0; j<dailySessions; j++) targetSubjects.push(randomChoice(generalSubjects).name);
    }

    for (const subName of targetSubjects) {
      let sessDur = 0;
      const rDur = rand();
      if (rDur < 0.15) sessDur = randomInt(20, 35) * 60; // Curtas
      else if (rDur < 0.65) sessDur = randomInt(55, 95) * 60; // Predominantes, avg 75
      else sessDur = randomInt(100, 140) * 60; // Longas
      sessDur += randomInt(0, 59);
      
      sessions.push({ subject: subName, date: dateStr, durationSeconds: sessDur });
    }
  }

  // Redação sessions clamped strictly within bounds.
  // 91 days total. 6 sessions spaced by ~15 days.
  for (let i = 0; i < 6; i++) {
    const offset = 10 + 14 * i + randomInt(-2, 2); // 10, 24, 38, 52, 66, 80
    const redDay = new Date(startDate);
    redDay.setDate(startDate.getDate() + offset);
    sessions.push({
      subject: 'Redação',
      date: getLocalDateStr(redDay),
      durationSeconds: randomInt(70, 110) * 60,
      type: 'Redação'
    });
  }

  const activitiesCount = generatedActivities.length;
  const sessionsCount = sessions.length;
  const totalStudySeconds = sessions.reduce((acc, s) => acc + s.durationSeconds, 0);
  const totalStudyHours = totalStudySeconds / 3600;
  const averageWeeklyHours = totalStudyHours / (91 / 7);
  
  const daysWithStudySet = new Set(sessions.map(s => s.date));
  const daysWithStudy = daysWithStudySet.size;
  const daysWithoutStudy = 91 - daysWithStudy;

  sessions.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const firstSessionDate = sessions[0].date;
  const lastSessionDate = sessions[sessions.length - 1].date;

  const redacaoSessions = sessions.filter(s => s.subject === 'Redação').length;

  return {
    topicsCount,
    activitiesCount,
    completedActivities,
    pendingActivities,
    sessionsCount,
    totalStudyHours: totalStudyHours.toFixed(1),
    averageWeeklyHours: averageWeeklyHours.toFixed(1),
    daysWithStudy,
    daysWithoutStudy,
    firstSessionDate,
    lastSessionDate,
    redacaoSessions
  };
}

console.log(buildEnemQaDatasetPreview());

const fs = require('fs');
const content = `import { writeBatch, collection, doc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

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

const activityTypes = ['Videoaula', 'Leitura', 'Questões', 'Revisão', 'Simulado', 'Redação', 'Aula presencial', 'Flashcards', 'Outro'] as const;

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

        generatedActivities.push({ subject: s.name, topic: t, type: aType, status, isQuestions: aType === 'Questões' || aType === 'Simulado' });
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
      if (r < 0.28) dailySessions = 0;
      else if (r < 0.45) dailySessions = 1; 
      else if (r < 0.85) dailySessions = 2;
      else if (r < 0.95) dailySessions = 3; 
      else dailySessions = 4; 
      
      for (let j=0; j<dailySessions; j++) targetSubjects.push(randomChoice(generalSubjects).name);
    }

    for (const subName of targetSubjects) {
      let sessDur = 0;
      const rDur = rand();
      if (rDur < 0.15) sessDur = randomInt(20, 35) * 60;
      else if (rDur < 0.65) sessDur = randomInt(55, 95) * 60;
      else sessDur = randomInt(100, 140) * 60;
      sessDur += randomInt(0, 59);
      
      sessions.push({ subject: subName, date: currentDay.toISOString(), durationSeconds: sessDur });
    }
  }

  for (let i = 0; i < 6; i++) {
    const offset = 10 + 14 * i + randomInt(-2, 2);
    const redDay = new Date(startDate);
    redDay.setDate(startDate.getDate() + offset);
    sessions.push({
      subject: 'Redação',
      date: redDay.toISOString(),
      durationSeconds: randomInt(70, 110) * 60,
      type: 'Redação'
    });
  }

  const activitiesCount = generatedActivities.length;
  const sessionsCount = sessions.length;
  const totalStudySeconds = sessions.reduce((acc, s) => acc + s.durationSeconds, 0);
  const totalStudyHours = totalStudySeconds / 3600;
  const averageWeeklyHours = totalStudyHours / (91 / 7);
  
  const daysWithStudySet = new Set(sessions.map(s => s.date.split('T')[0]));
  const daysWithStudy = daysWithStudySet.size;
  const daysWithoutStudy = 91 - daysWithStudy;

  sessions.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const firstSessionDate = sessions[0].date.split('T')[0];
  const lastSessionDate = sessions[sessions.length - 1].date.split('T')[0];

  const redacaoSessions = sessions.filter(s => s.subject === 'Redação').length;

  return {
    topicsCount,
    activitiesCount,
    completedActivities,
    pendingActivities,
    sessionsCount,
    totalStudyHours: Number(totalStudyHours.toFixed(1)),
    averageWeeklyHours: Number(averageWeeklyHours.toFixed(1)),
    daysWithStudy,
    daysWithoutStudy,
    firstSessionDate,
    lastSessionDate,
    redacaoSessions
  };
}

export async function seedEnemQa(uid: string) {
  if (!uid) throw new Error('UID is required');

  const preview = buildEnemQaDatasetPreview();

  if (preview.activitiesCount < 90 || preview.activitiesCount > 130) {
    throw new Error(\`QA Constraint Failed: activitiesCount is \${preview.activitiesCount}\`);
  }
  if (preview.sessionsCount < 130 || preview.sessionsCount > 160) {
    throw new Error(\`QA Constraint Failed: sessionsCount is \${preview.sessionsCount}\`);
  }
  if (preview.firstSessionDate < '2026-06-01') {
    throw new Error(\`QA Constraint Failed: firstSessionDate is \${preview.firstSessionDate}\`);
  }
  if (preview.lastSessionDate > '2026-08-30') {
    throw new Error(\`QA Constraint Failed: lastSessionDate is \${preview.lastSessionDate}\`);
  }
  if (preview.redacaoSessions < 5 || preview.redacaoSessions > 7) {
    throw new Error(\`QA Constraint Failed: redacaoSessions is \${preview.redacaoSessions}\`);
  }
  if (preview.averageWeeklyHours < 14 || preview.averageWeeklyHours > 17) {
    throw new Error(\`QA Constraint Failed: averageWeeklyHours is \${preview.averageWeeklyHours}\`);
  }

  const plansRef = collection(db, 'users', uid, 'plans');
  const q = query(plansRef, where('qaSeedId', '==', 'enem-2026-realista-v1'));
  const existing = await getDocs(q);
  if (!existing.empty) {
    return { status: 'already_exists', message: 'O seed ENEM 2026 já existe na conta.' };
  }

  const rand = createPRNG('enem-2026-realista-v1');
  function randomInt(min: number, max: number) { return Math.floor(rand() * (max - min + 1)) + min; }
  function randomChoice<T>(arr: T[]): T { return arr[randomInt(0, arr.length - 1)]; }
  function randomFloat(min: number, max: number) { return rand() * (max - min) + min; }

  const newPlanRef = doc(plansRef);
  const planId = newPlanRef.id;

  let batch = writeBatch(db);
  let opCount = 0;

  async function commitBatch() {
    if (opCount > 0) {
      await batch.commit();
      batch = writeBatch(db);
      opCount = 0;
    }
  }

  async function addOp() {
    opCount++;
    if (opCount >= 400) {
      await commitBatch();
    }
  }

  const now = new Date().toISOString();
  
  batch.set(newPlanRef, {
    id: planId,
    userId: uid,
    name: 'ENEM 2026 — QA Realista',
    objective: 'Medicina — ENEM 2026',
    examDate: '2026-11-08T12:00:00Z',
    qaSeedId: 'enem-2026-realista-v1',
    availableTimePerDay: {
      0: 2, 
      1: 3,
      2: 3,
      3: 3,
      4: 3,
      5: 2,
      6: 5  
    },
    createdAt: now,
    updatedAt: now
  });
  await addOp();

  const subjectsMap: Record<string, string> = {};
  const topicsMap: Record<string, string> = {}; 

  for (const s of DATA.subjects) {
    const sRef = doc(collection(db, 'users', uid, 'plans', planId, 'subjects'));
    subjectsMap[s.name] = sRef.id;
    batch.set(sRef, {
      id: sRef.id,
      name: s.name,
      planId,
      importance: s.imp,
      difficulty: s.diff,
      isArchived: false,
      createdAt: now,
      updatedAt: now
    });
    await addOp();

    for (const t of s.topics) {
      const tRef = doc(collection(db, 'users', uid, 'plans', planId, 'topics'));
      topicsMap[\`\${s.name}::\${t}\`] = tRef.id;
      batch.set(tRef, {
        id: tRef.id,
        name: t,
        planId,
        subjectId: sRef.id,
        createdAt: now,
        updatedAt: now
      });
      await addOp();
    }
  }

  const generatedActivities: any[] = [];
  
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
        const actRef = doc(collection(db, 'users', uid, 'plans', planId, 'activities'));
        const aType = randomChoice(['Videoaula', 'Leitura', 'Questões', 'Revisão', 'Questões', 'Videoaula'] as string[]);
        
        let status = 'pending';
        if (isAdvanced) status = (rand() > 0.3) ? 'completed' : 'pending';
        else if (isOngoing) status = (rand() > 0.5) ? 'completed' : 'pending';
        else if (isWeak) status = 'pending';
        else status = (rand() > 0.6) ? 'completed' : 'pending';

        const expDur = randomInt(1500, 4200);
        
        const actData: any = {
          id: actRef.id,
          title: \`\${aType} — \${t}\`,
          planId,
          subjectId: subjectsMap[s.name],
          topicId: topicsMap[\`\${s.name}::\${t}\`],
          type: aType,
          status,
          expectedDurationSeconds: expDur,
          createdAt: now,
          updatedAt: now
        };

        if (aType === 'Questões' || aType === 'Simulado') actData.expectedQuestions = randomInt(10, 30);
        
        batch.set(actRef, actData);
        await addOp();

        if (status === 'completed') {
          generatedActivities.push({ ...actData, subConfig: s });
        }
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
      if (r < 0.28) dailySessions = 0; 
      else if (r < 0.45) dailySessions = 1; 
      else if (r < 0.85) dailySessions = 2; 
      else if (r < 0.95) dailySessions = 3; 
      else dailySessions = 4; 
      
      for (let j=0; j<dailySessions; j++) targetSubjects.push(randomChoice(generalSubjects).name);
    }

    for (const subName of targetSubjects) {
      const subConfig = DATA.subjects.find(s => s.name === subName)!;
      const sessRef = doc(collection(db, 'users', uid, 'plans', planId, 'sessions'));
      
      let sessDur = 0;
      const rDur = rand();
      if (rDur < 0.15) sessDur = randomInt(20, 35) * 60;
      else if (rDur < 0.65) sessDur = randomInt(55, 95) * 60;
      else sessDur = randomInt(100, 140) * 60;
      sessDur += randomInt(0, 59);
      
      const possibleActs = generatedActivities.filter(a => a.subjectId === subjectsMap[subName]);
      const linkedAct = (possibleActs.length > 0 && rand() > 0.3) ? randomChoice(possibleActs) : null;
      
      const sType = linkedAct ? linkedAct.type : randomChoice(activityTypes as unknown as string[]);
      const isQuestions = sType === 'Questões' || sType === 'Simulado';
      
      const sessData: any = {
        id: sessRef.id,
        planId,
        subjectId: subjectsMap[subName],
        activityId: linkedAct ? linkedAct.id : null,
        activityType: sType,
        date: currentDay.toISOString(),
        durationSeconds: sessDur,
        createdAt: now,
        updatedAt: now
      };

      if (linkedAct) {
        sessData.topicId = linkedAct.topicId;
      } else {
        const fallbackTopic = randomChoice(subConfig.topics);
        sessData.topicId = topicsMap[\`\${subName}::\${fallbackTopic}\`];
      }

      if (isQuestions) {
        const qt = randomInt(10, 30);
        const acc = randomFloat(subConfig.acc[0], subConfig.acc[1]);
        sessData.questionsTotal = qt;
        sessData.questionsCorrect = Math.round(qt * acc);
        if (sessData.questionsCorrect < qt && rand() > 0.4) {
          sessData.errorReason = randomChoice(subConfig.err);
        } else {
          sessData.errorReason = '';
        }
      }

      batch.set(sessRef, sessData);
      await addOp();
    }
  }

  for (let i = 0; i < 6; i++) {
    const offset = 10 + 14 * i + randomInt(-2, 2);
    const redDay = new Date(startDate);
    redDay.setDate(startDate.getDate() + offset);
    const sessRef = doc(collection(db, 'users', uid, 'plans', planId, 'sessions'));
    batch.set(sessRef, {
      id: sessRef.id,
      planId,
      subjectId: subjectsMap['Redação'],
      topicId: topicsMap['Redação::Estrutura dissertativo-argumentativa'],
      activityType: 'Redação',
      date: redDay.toISOString(),
      durationSeconds: randomInt(70, 110) * 60,
      createdAt: now,
      updatedAt: now
    });
    await addOp();
  }

  await commitBatch();

  return { status: 'success', planId, message: 'Seed ENEM QA 2026 executado com sucesso.', preview };
}

export async function removeEnemQaSeed(uid: string) {
  if (!uid) throw new Error('UID is required');
  const plansRef = collection(db, 'users', uid, 'plans');
  const q = query(plansRef, where('qaSeedId', '==', 'enem-2026-realista-v1'));
  const existing = await getDocs(q);
  
  if (existing.empty) {
    return { status: 'not_found', message: 'Nenhum seed QA encontrado.' };
  }

  let batch = writeBatch(db);
  let opCount = 0;

  async function addOp() {
    opCount++;
    if (opCount >= 400) {
      await batch.commit();
      batch = writeBatch(db);
      opCount = 0;
    }
  }

  const removedPlanIds: string[] = [];

  for (const planDoc of existing.docs) {
    const planId = planDoc.id;
    removedPlanIds.push(planId);
    const collectionsToClear = ['subjects', 'topics', 'activities', 'sessions', 'resources'];
    
    for (const col of collectionsToClear) {
      const snap = await getDocs(collection(db, 'users', uid, 'plans', planId, col));
      for (const d of snap.docs) {
        batch.delete(d.ref);
        await addOp();
      }
    }
    
    batch.delete(planDoc.ref);
    await addOp();
  }

  if (opCount > 0) {
    await batch.commit();
  }

  return { status: 'success', removedPlanIds, message: 'Seed ENEM QA 2026 removido com sucesso.' };
}

export async function getEnemQaSeedSummary(uid: string) {
  if (!uid) throw new Error('UID is required');
  const plansRef = collection(db, 'users', uid, 'plans');
  const q = query(plansRef, where('qaSeedId', '==', 'enem-2026-realista-v1'));
  const existing = await getDocs(q);
  
  if (existing.empty) return null;
  const planDoc = existing.docs[0];
  const planId = planDoc.id;

  const [subjSnap, topSnap, actSnap, sessSnap] = await Promise.all([
    getDocs(collection(db, 'users', uid, 'plans', planId, 'subjects')),
    getDocs(collection(db, 'users', uid, 'plans', planId, 'topics')),
    getDocs(collection(db, 'users', uid, 'plans', planId, 'activities')),
    getDocs(collection(db, 'users', uid, 'plans', planId, 'sessions')),
  ]);

  const activities = actSnap.docs.map(d => d.data());
  const sessions = sessSnap.docs.map(d => d.data());

  const subMap: Record<string, string> = {};
  subjSnap.docs.forEach(d => { subMap[d.id] = d.data().name; });

  const completedActivities = activities.filter(a => a.status === 'completed').length;
  const pendingActivities = activities.filter(a => a.status === 'pending').length;

  const totalStudySeconds = sessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
  const totalStudyHours = (totalStudySeconds / 3600).toFixed(1);

  const sevenDaysAgo = new Date('2026-08-24T00:00:00Z').getTime();
  const recentSessions = sessions.filter(s => new Date(s.date).getTime() >= sevenDaysAgo);
  const last7DaysStudySeconds = recentSessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
  const last7DaysStudyHours = (last7DaysStudySeconds / 3600).toFixed(1);

  const daysWithStudy = new Set(sessions.map(s => s.date.split('T')[0])).size;
  const totalDays = 91; 
  const daysWithoutStudy = totalDays - daysWithStudy;

  let firstSessionDate = 'N/A';
  let lastSessionDate = 'N/A';
  const dates = sessions.map(s => new Date(s.date).getTime()).sort((a,b) => a-b);
  if (dates.length > 0) {
    firstSessionDate = new Date(dates[0]).toISOString().split('T')[0];
    lastSessionDate = new Date(dates[dates.length-1]).toISOString().split('T')[0];
  }

  const accMap: Record<string, { correct: number, total: number }> = {};
  const sessCountMap: Record<string, number> = {};
  const errMap: Record<string, number> = {};
  
  sessions.forEach(s => {
    const subName = subMap[s.subjectId] || 'Desconhecido';
    sessCountMap[subName] = (sessCountMap[subName] || 0) + 1;
    
    if (typeof s.questionsTotal === 'number' && s.questionsTotal > 0) {
      accMap[subName] = accMap[subName] || { correct: 0, total: 0 };
      accMap[subName].correct += (s.questionsCorrect || 0);
      accMap[subName].total += s.questionsTotal;
    }
    
    if (s.errorReason) {
      errMap[s.errorReason] = (errMap[s.errorReason] || 0) + 1;
    }
  });

  const accuracyBySubject: Record<string, string> = {};
  for (const [sub, data] of Object.entries(accMap)) {
    accuracyBySubject[sub] = \`\${Math.round((data.correct / data.total) * 100)}%\`;
  }

  return {
    planId,
    subjectsCount: subjSnap.size,
    topicsCount: topSnap.size,
    activitiesCount: actSnap.size,
    completedActivities,
    pendingActivities,
    sessionsCount: sessSnap.size,
    totalStudySeconds,
    totalStudyHours,
    last7DaysStudySeconds,
    last7DaysStudyHours,
    sessionsBySubject: sessCountMap,
    accuracyBySubject,
    errorReasonsDistribution: errMap,
    daysWithStudy,
    daysWithoutStudy,
    firstSessionDate,
    lastSessionDate,
    currentDemandSeconds: activities.filter(a => a.status === 'pending').reduce((acc, a) => acc + (a.expectedDurationSeconds || 0), 0)
  };
}
`;
fs.writeFileSync('src/qa/enemSeed.ts', content);

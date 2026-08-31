import { writeBatch, collection, doc, getDocs, query, where, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { StudySession, StudyActivity, Subject, Topic } from '../domain/types';

// Deterministic PRNG (Mulberry32)
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

const rand = createPRNG('enem-2026-realista-v1');
function randomInt(min: number, max: number) { return Math.floor(rand() * (max - min + 1)) + min; }
function randomChoice<T>(arr: T[]): T { return arr[randomInt(0, arr.length - 1)]; }
function randomFloat(min: number, max: number) { return rand() * (max - min) + min; }

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

export async function seedEnemQa(uid: string) {
  if (!uid) throw new Error('UID is required');

  const plansRef = collection(db, 'users', uid, 'plans');
  const q = query(plansRef, where('qaSeedId', '==', 'enem-2026-realista-v1'));
  const existing = await getDocs(q);
  if (!existing.empty) {
    return { status: 'already_exists', message: 'O seed ENEM 2026 já existe na conta.' };
  }

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
    name: 'ENEM 2026 — QA Realista',
    objective: 'Medicina — ENEM 2026',
    examDate: '2026-11-01T12:00:00Z',
    qaSeedId: 'enem-2026-realista-v1',
    availableTimePerDay: {
      0: 2 * 3600, // Domingo
      1: 3 * 3600,
      2: 3 * 3600,
      3: 3 * 3600,
      4: 3 * 3600,
      5: 2 * 3600,
      6: 5 * 3600  // Sábado
    },
    createdAt: now,
    updatedAt: now
  });
  await addOp();

  // Create Subjects & Topics
  const subjectsMap: Record<string, string> = {};
  const topicsMap: Record<string, string> = {}; // topicName -> topicId

  for (const s of DATA.subjects) {
    const sRef = doc(collection(db, 'users', uid, 'plans', planId, 'subjects'));
    subjectsMap[s.name] = sRef.id;
    batch.set(sRef, {
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
      topicsMap[t] = tRef.id;
      batch.set(tRef, {
        name: t,
        planId,
        subjectId: sRef.id,
        createdAt: now,
        updatedAt: now
      });
      await addOp();
    }
  }

  // Activities logic
  const generatedActivities: any[] = [];
  
  for (const s of DATA.subjects) {
    for (const t of s.topics) {
      const isAdvanced = ['Citologia', 'Membrana plasmática', 'Genética', 'Interpretação de texto', 'Gêneros textuais', 'Brasil Colônia', 'Era Vargas', 'Razão e proporção', 'Porcentagem', 'Regra de três'].includes(t);
      const isOngoing = ['Função quadrática', 'Estatística', 'Probabilidade', 'Geometria plana', 'Dinâmica', 'Trabalho e energia', 'Estequiometria', 'Soluções', 'Ecologia', 'Fisiologia humana', 'Urbanização', 'Globalização'].includes(t);
      const isWeak = ['Eletrodinâmica', 'Óptica', 'Hidrostática', 'Geometria espacial', 'Análise combinatória', 'Eletroquímica', 'Química orgânica'].includes(t);

      let numActivities = 0;
      if (isAdvanced) numActivities = randomInt(3, 5);
      else if (isOngoing) numActivities = randomInt(2, 4);
      else if (isWeak) numActivities = randomInt(0, 1);
      else numActivities = randomInt(0, 2);

      for (let i = 0; i < numActivities; i++) {
        const actRef = doc(collection(db, 'users', uid, 'plans', planId, 'activities'));
        const aType = randomChoice(['Videoaula', 'Leitura', 'Questões', 'Revisão', 'Questões', 'Videoaula'] as string[]);
        
        let status = 'pending';
        if (isAdvanced) status = (rand() > 0.2) ? 'completed' : 'pending';
        else if (isOngoing) status = (rand() > 0.5) ? 'completed' : 'pending';
        else if (isWeak) status = 'pending';
        else status = (rand() > 0.6) ? 'completed' : 'pending';

        const expDur = randomInt(1500, 4200);
        
        const actData: any = {
          title: `${aType} — ${t}`,
          planId,
          subjectId: subjectsMap[s.name],
          topicId: topicsMap[t],
          type: aType,
          status,
          expectedDurationSeconds: expDur,
          createdAt: now,
          updatedAt: now
        };

        if (aType === 'Questões') actData.expectedQuestions = randomInt(10, 30);
        
        batch.set(actRef, actData);
        await addOp();

        if (status === 'completed') {
          generatedActivities.push({ ...actData, id: actRef.id, subConfig: s });
        }
      }
    }
  }

  // Sessions Logic
  const startDate = new Date('2026-06-01T12:00:00Z');
  const endDate = new Date('2026-08-30T12:00:00Z');
  const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
  
  // Specific days to hardcode
  const specialDays: Record<string, string[]> = {
    '2026-08-24': ['Matemática', 'Biologia'],
    '2026-08-25': ['Física', 'Português'],
    '2026-08-26': [], // None
    '2026-08-27': ['Química', 'Matemática'],
    '2026-08-28': ['História'], // Short
    '2026-08-29': ['Física', 'Química', 'Matemática', 'Português'], // Strong Saturday
    '2026-08-30': ['Biologia'] // Short
  };

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
      // General random distribution: 0 to 4 sessions, avg 1-2 to make 14-17h week.
      const r = rand();
      if (r < 0.25) dailySessions = 0; // 25% chance of no study
      else if (r < 0.55) dailySessions = 1;
      else if (r < 0.85) dailySessions = 2;
      else if (r < 0.95) dailySessions = 3;
      else dailySessions = 4;
      
      // Select subjects randomly for this day based on active activities or general
      for (let j=0; j<dailySessions; j++) targetSubjects.push(randomChoice(DATA.subjects).name);
    }

    for (const subName of targetSubjects) {
      const subConfig = DATA.subjects.find(s => s.name === subName)!;
      const sessRef = doc(collection(db, 'users', uid, 'plans', planId, 'sessions'));
      
      const sessDur = randomInt(15, 80) * 60 + randomInt(0, 59); // 15-80 mins with seconds noise
      
      // Try to find a matching completed activity
      const possibleActs = generatedActivities.filter(a => a.subjectId === subjectsMap[subName]);
      const linkedAct = (possibleActs.length > 0 && rand() > 0.3) ? randomChoice(possibleActs) : null;
      
      const sType = linkedAct ? linkedAct.type : randomChoice(activityTypes as unknown as string[]);
      const isQuestions = sType === 'Questões' || sType === 'Simulado';
      
      const sessData: any = {
        planId,
        subjectId: subjectsMap[subName],
        topicId: linkedAct ? linkedAct.topicId : randomChoice(subConfig.topics), // May not strictly match reality if random, but close enough
        activityId: linkedAct ? linkedAct.id : null,
        activityType: sType,
        date: currentDay.toISOString(),
        durationSeconds: sessDur,
        createdAt: now
      };

      if (!sessData.topicId) {
        sessData.topicId = topicsMap[randomChoice(subConfig.topics)];
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

  // Inject redação sessões (5-7 quinzenalmente)
  for (let i = 0; i < 6; i++) {
    const redDay = new Date(startDate);
    redDay.setDate(startDate.getDate() + 15 * i + randomInt(-2, 2));
    const sessRef = doc(collection(db, 'users', uid, 'plans', planId, 'sessions'));
    batch.set(sessRef, {
      planId,
      subjectId: subjectsMap['Redação'],
      topicId: topicsMap['Estrutura dissertativo-argumentativa'],
      activityType: 'Redação',
      date: redDay.toISOString(),
      durationSeconds: randomInt(70, 110) * 60,
      createdAt: now
    });
    await addOp();
  }

  await commitBatch();

  return { status: 'success', planId, message: 'Seed ENEM QA 2026 executado com sucesso.' };
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

  for (const planDoc of existing.docs) {
    const planId = planDoc.id;
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

  return { status: 'success', message: 'Seed ENEM QA 2026 removido com sucesso.' };
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

  const completedActivities = activities.filter(a => a.status === 'completed').length;
  const pendingActivities = activities.filter(a => a.status === 'pending').length;

  const totalStudySeconds = sessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
  const totalStudyHours = (totalStudySeconds / 3600).toFixed(1);

  const sevenDaysAgo = new Date('2026-08-23T12:00:00Z').getTime();
  const recentSessions = sessions.filter(s => new Date(s.date).getTime() >= sevenDaysAgo);
  const last7DaysStudySeconds = recentSessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
  const last7DaysStudyHours = (last7DaysStudySeconds / 3600).toFixed(1);

  const daysWithStudy = new Set(sessions.map(s => s.date.split('T')[0])).size;
  const totalDays = 91; // Approx 3 months
  const daysWithoutStudy = totalDays - daysWithStudy;

  let firstSessionDate = 'N/A';
  let lastSessionDate = 'N/A';
  const dates = sessions.map(s => new Date(s.date).getTime()).sort((a,b) => a-b);
  if (dates.length > 0) {
    firstSessionDate = new Date(dates[0]).toISOString().split('T')[0];
    lastSessionDate = new Date(dates[dates.length-1]).toISOString().split('T')[0];
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
    daysWithStudy,
    daysWithoutStudy,
    firstSessionDate,
    lastSessionDate,
    currentDemandSeconds: activities.filter(a => a.status === 'pending').reduce((acc, a) => acc + (a.expectedDurationSeconds || 0), 0)
  };
}

import { Plan, Subject, Topic, StudyActivity } from '../domain/types';

export function generateWeeklySchedule(plan: Plan, subjects: Subject[], topics: Topic[]): StudyActivity[] {
  const activities: StudyActivity[] = [];
  let activityIdCounter = 0;

  const createId = () => `act_${crypto.randomUUID().split('-')[0]}_${activityIdCounter++}`;

  if (plan.type === 'academico') {
    // A simplified mapping according to the UNEX 2026.2 Medicine schedule logic
    // We will find subjects by name and schedule them on standard days
    
    // For demo purposes, we will use a relative date from next Monday
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilNextMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    
    // helper to get a date for a specific day of the week (0 = Sunday, 1 = Monday)
    const getDateForNextDay = (dayIndex: number, hours: number, minutes: number) => {
        let diff = dayIndex - 1; // offset from monday
        const d = new Date(today.getTime() + (daysUntilNextMonday + diff) * 24 * 60 * 60 * 1000);
        d.setHours(hours, minutes, 0, 0);
        return d;
    };

    const academicMapping = [
      { subjectName: 'Biologia Celular', day: 2, hour: 13, min: 50 }, // Terça
      { subjectName: 'Fisiologia Humana', day: 2, hour: 16, min: 20 }, // Terça
      { subjectName: 'Saúde Coletiva', day: 3, hour: 13, min: 50 }, // Quarta
      { subjectName: 'Psicologia Médica', day: 3, hour: 18, min: 50 }, // Quarta
      { subjectName: 'Anatomia Humana', day: 4, hour: 8, min: 20 }, // Quinta
      { subjectName: 'Tutorial PBL', day: 4, hour: 18, min: 0 }, // Quinta
      { subjectName: 'Histologia e Embriologia', day: 5, hour: 7, min: 30 }, // Sexta
      { subjectName: 'Propedêutica Médica I', day: 1, hour: 13, min: 50 }, // Segunda
    ];

    academicMapping.forEach(mapping => {
        const subject = subjects.find(s => s.name.toLowerCase().includes(mapping.subjectName.toLowerCase()));
        if (subject) {
            const firstTopic = topics.find(t => t.subjectId === subject.id);
            const topicId = firstTopic ? firstTopic.id : undefined;

            // Pré-aula (45 min antes)
            activities.push({
                id: createId(),
                planId: plan.id,
                subjectId: subject.id,
                topicId: topicId,
                type: 'Leitura',
                title: `Pré-aula: ${subject.name}`,
                expectedDurationSeconds: 45 * 60,
                dueDate: getDateForNextDay(mapping.day, mapping.hour - 1, mapping.min).toISOString(),
                status: 'pending',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

            // Aula/Fixação
            activities.push({
                id: createId(),
                planId: plan.id,
                subjectId: subject.id,
                topicId: topicId,
                type: 'Revisão',
                title: `Fixação Pós-Aula: ${subject.name}`,
                expectedDurationSeconds: 45 * 60,
                dueDate: getDateForNextDay(mapping.day, mapping.hour + 2, mapping.min).toISOString(),
                status: 'pending',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        }
    });

  } else {
    // For 'concurso' or 'vestibular'
    // Distribute topics in blocks of Theory and Questions over the 7 days based on availableTimePerDay
    
    // We will schedule for the upcoming week (Monday to Sunday)
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilNextMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    
    let topicIndex = 0;

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        // dayIndex logic: 1 = Monday, 2 = Tuesday ... 7 = Sunday
        // mapped to plan.availableTimePerDay where 0 = Sunday, 1 = Monday
        const actualDayIndex = (dayOffset + 1) % 7; 
        const hoursAvailable = plan.availableTimePerDay[actualDayIndex] || 0;
        
        if (hoursAvailable > 0 && topics.length > 0) {
            const date = new Date(today.getTime() + (daysUntilNextMonday + dayOffset) * 24 * 60 * 60 * 1000);
            
            // Generate blocks of 1 hour each
            let blocks = hoursAvailable;
            let hourStart = 8; // start at 8 AM
            
            for (let b = 0; b < blocks; b++) {
                if (topicIndex >= topics.length) {
                    topicIndex = 0; // loop around if we run out of topics
                }
                const topic = topics[topicIndex];
                
                // Alternate between Theory and Questions based on block index
                const isTheory = b % 2 === 0;
                
                date.setHours(hourStart + b, 0, 0, 0);
                
                activities.push({
                    id: createId(),
                    planId: plan.id,
                    subjectId: topic.subjectId,
                    topicId: topic.id,
                    type: isTheory ? 'Leitura' : 'Questões',
                    title: `${isTheory ? 'Teoria' : 'Prática'}: ${topic.name}`,
                    expectedDurationSeconds: 60 * 60, // 1 hour
                    expectedQuestions: isTheory ? 0 : 20,
                    dueDate: date.toISOString(),
                    status: 'pending',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
                
                if (!isTheory) {
                    topicIndex++; // move to next topic after theory + practice pair
                }
            }
        }
    }
  }

  return activities;
}

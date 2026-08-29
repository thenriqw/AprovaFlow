const fs = require('fs');
let code = fs.readFileSync('src/components/CreatePlan.tsx', 'utf8');

const replacement = `
  const [name, setName] = useState('');
  const [objective, setObjective] = useState('');
  const [examDate, setExamDate] = useState('');
  const [hoursPerDay, setHoursPerDay] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setLoading(true);
    try {
      const hrs = parseInt(hoursPerDay) || 0;
      await createPlan({
        name: name.trim(),
        objective: objective.trim(),
        examDate,
        availableTimePerDay: { 0:0, 1:hrs, 2:hrs, 3:hrs, 4:hrs, 5:hrs, 6:0 }
      });
      setActiveTab('today');
`;

code = code.replace(/  const \[name, setName\] = useState\(''\);[\s\S]*?setActiveTab\('today'\);/, replacement);

const inputReplacement = `
          <div>
            <label className="block text-sm font-bold text-neutral-900 mb-1">Data da Prova (Opcional)</label>
            <input 
              type="date" 
              value={examDate} 
              onChange={e => setExamDate(e.target.value)} 
              className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 focus:outline-none text-neutral-900"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-neutral-900 mb-1">Horas de Estudo por Dia (Opcional)</label>
            <input 
              type="number" 
              min="0"
              max="24"
              placeholder="Ex: 2"
              value={hoursPerDay} 
              onChange={e => setHoursPerDay(e.target.value)} 
              className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 focus:outline-none text-neutral-900"
            />
          </div>
        </div>
`;

code = code.replace(/          <div>\n            <label className="block text-sm font-bold text-neutral-900 mb-1">Data da Prova \(Opcional\)<\/label>[\s\S]*?<\/div>\n        <\/div>/, inputReplacement);

fs.writeFileSync('src/components/CreatePlan.tsx', code);

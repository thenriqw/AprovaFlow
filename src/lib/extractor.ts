export async function extractTextFromFile(file: File): Promise<{ content: string; detectedType: string }> {
  const name = file.name.toLowerCase();
  
  if (name.endsWith('.pdf')) {
    const pdfjsLib = await import('pdfjs-dist');
    // Configure worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
    
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }
    
    if (fullText.trim().length === 0) {
      throw new Error('PDF_NO_TEXT'); // Handled by caller to show OCR message
    }
    
    return { content: fullText, detectedType: 'pdf' };
  }
  
  if (name.endsWith('.docx')) {
    const mammoth = await import('mammoth');
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return { content: result.value, detectedType: 'docx' };
  }
  
  if (name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv')) {
    const XLSX = await import('xlsx');
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    let fullText = '';
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const csv = XLSX.utils.sheet_to_csv(sheet);
      fullText += `--- Aba: ${sheetName} ---\n${csv}\n`;
    }
    
    return { content: fullText, detectedType: name.endsWith('.csv') ? 'csv' : 'xlsx' };
  }
  
  if (name.endsWith('.txt')) {
    const text = await file.text();
    return { content: text, detectedType: 'txt' };
  }

  throw new Error('UNSUPPORTED_FORMAT');
}

export function parseSpreadsheetDeterministically(content: string, filename: string) {
  const subjectsMap: Record<string, any> = {};
  let recognizedAny = false;
  
  // Split by sheets
  const sheets = content.split(/--- Aba: .*? ---\n/).filter(s => s.trim().length > 0);
  
  const normalizeStr = (s: string) => s.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  for (const sheetData of sheets) {
    const lines = sheetData.split('\n').filter(l => l.trim().length > 0);
    if (lines.length === 0) continue;
    
    // Naive CSV parsing
    const parseCSVLine = (line: string) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' && line[i+1] === '"') {
          current += '"';
          i++;
        } else if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current);
      return result.map(s => s.trim());
    };
    
    const headers = parseCSVLine(lines[0]);
    const normHeaders = headers.map(normalizeStr);
    
    // Find column indices
    const subjectIdx = normHeaders.findIndex(h => h === 'materia' || h === 'disciplina');
    const topicIdx = normHeaders.findIndex(h => h === 'assunto' || h === 'topico');
    const activityIdx = normHeaders.findIndex(h => h === 'atividade' || h === 'tipo');
    const durationIdx = normHeaders.findIndex(h => h === 'duracao' || h === 'tempo');
    const sourceIdx = normHeaders.findIndex(h => h === 'fonte' || h === 'source');
    
    if (subjectIdx === -1 || topicIdx === -1) {
      continue; // Skip this sheet if structure not recognized
    }
    
    recognizedAny = true;
    
    for (let i = 1; i < lines.length; i++) {
      const row = parseCSVLine(lines[i]);
      if (row.length <= subjectIdx || !row[subjectIdx]) continue;
      
      const subjectName = row[subjectIdx];
      const topicName = row.length > topicIdx && row[topicIdx] ? row[topicIdx] : undefined;
      if (!topicName) continue;
      
      let title = undefined;
      let activityType = undefined;
      
      if (activityIdx !== -1 && row.length > activityIdx && row[activityIdx]) {
         const val = row[activityIdx].trim();
         const normVal = normalizeStr(val);
         const allowedTypes = ['Videoaula', 'Leitura', 'Questões', 'Revisão', 'Simulado', 'Redação', 'Aula presencial', 'Flashcards'];
         const matchedType = allowedTypes.find(t => normalizeStr(t) === normVal);
         activityType = matchedType || 'Outro';
         title = val;
      }
      
      let durationSeconds = undefined;
      if (durationIdx !== -1 && row.length > durationIdx && row[durationIdx]) {
         const mins = parseInt(row[durationIdx].replace(/[^0-9]/g, ''), 10);
         if (!isNaN(mins)) durationSeconds = mins * 60;
      }
      
      let sourceStr = undefined;
      if (sourceIdx !== -1 && row.length > sourceIdx && row[sourceIdx]) {
         sourceStr = row[sourceIdx].trim();
      }
      
      if (!subjectsMap[subjectName]) {
        subjectsMap[subjectName] = { name: subjectName, topicsMap: {} };
      }
      if (!subjectsMap[subjectName].topicsMap[topicName]) {
        subjectsMap[subjectName].topicsMap[topicName] = { name: topicName, activities: [] };
      }
      
      if (title && activityType) {
        subjectsMap[subjectName].topicsMap[topicName].activities.push({
          title,
          type: activityType,
          expectedDurationSeconds: durationSeconds,
          source: sourceStr
        });
      }
    }
  }
  
  if (!recognizedAny) return null; // Let it fallback to Gemini
  
  const subjects = Object.values(subjectsMap).map(sub => ({
    name: sub.name,
    topics: Object.values(sub.topicsMap).map((t: any) => ({
      name: t.name,
      activities: t.activities
    }))
  }));
  
  return {
    title: filename,
    detectedType: 'spreadsheet',
    subjects,
    warnings: []
  };
}

export async function parseWithGemini(content: string, detectedType: string, filename: string) {
  const response = await fetch('/api/parse-document', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, detectedType, filename })
  });
  
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || 'Falha na IA');
  }
  
  const proposal = data.proposal;
  if (!proposal || typeof proposal !== 'object') {
    throw new Error('A resposta da IA não é um objeto JSON válido.');
  }
  
  if (!Array.isArray(proposal.subjects)) {
    throw new Error('A estrutura de disciplinas (subjects) retornada é inválida.');
  }
  
  // Post-response validation without inventing data
  proposal.subjects = proposal.subjects.filter((subject: any) => subject && subject.name && typeof subject.name === 'string' && subject.name.trim().length > 0);
  
  proposal.subjects.forEach((subject: any) => {
    if (!Array.isArray(subject.topics)) subject.topics = [];
    
    subject.topics = subject.topics.filter((topic: any) => topic && topic.name && typeof topic.name === 'string' && topic.name.trim().length > 0);
    
    subject.topics.forEach((topic: any) => {
      if (!Array.isArray(topic.activities)) topic.activities = [];
      
      // Preserve only valid activities
      topic.activities = topic.activities.filter((act: any) => act && act.title && typeof act.title === 'string' && act.title.trim().length > 0).map((act: any) => {
        const out: any = { title: act.title };
        if (act.type) out.type = act.type;
        if (act.expectedDurationSeconds && typeof act.expectedDurationSeconds === 'number') out.expectedDurationSeconds = act.expectedDurationSeconds;
        if (act.source) out.source = act.source;
        if (act.expectedQuestions && typeof act.expectedQuestions === 'number') out.expectedQuestions = act.expectedQuestions;
        return out;
      });
    });
  });
  
  return proposal;
}

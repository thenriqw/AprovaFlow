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
  
  // Split by sheets
  const sheets = content.split(/--- Aba: .*? ---\n/).filter(s => s.trim().length > 0);
  
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
    
    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase());
    
    // Find column indices
    let subjectIdx = headers.findIndex(h => h.includes('matéria') || h.includes('materia') || h.includes('disciplina'));
    let topicIdx = headers.findIndex(h => h.includes('assunto') || h.includes('tópico') || h.includes('topico'));
    let activityIdx = headers.findIndex(h => h.includes('atividade') || h.includes('tipo'));
    
    // Default to first few columns if not found
    if (subjectIdx === -1) subjectIdx = 0;
    if (topicIdx === -1) topicIdx = headers.length > 1 ? 1 : -1;
    
    for (let i = 1; i < lines.length; i++) {
      const row = parseCSVLine(lines[i]);
      if (row.length <= subjectIdx || !row[subjectIdx]) continue;
      
      const subjectName = row[subjectIdx];
      const topicName = topicIdx !== -1 && row.length > topicIdx ? row[topicIdx] : 'Geral';
      
      let activityType = 'Estudo livre';
      let title = topicName;
      if (activityIdx !== -1 && row.length > activityIdx) {
         activityType = row[activityIdx];
      }
      
      if (!subjectsMap[subjectName]) {
        subjectsMap[subjectName] = { name: subjectName, topicsMap: {} };
      }
      if (!subjectsMap[subjectName].topicsMap[topicName]) {
        subjectsMap[subjectName].topicsMap[topicName] = { name: topicName, activities: [] };
      }
      
      subjectsMap[subjectName].topicsMap[topicName].activities.push({
        title,
        type: activityType,
        expectedDurationSeconds: 3600
      });
    }
  }
  
  const subjects = Object.values(subjectsMap).map(sub => ({
    name: sub.name,
    topics: Object.values(sub.topicsMap)
  }));
  
  return {
    title: filename,
    detectedType: 'spreadsheet',
    subjects,
    warnings: subjects.length === 0 ? ['Nenhum dado válido encontrado na planilha. Verifique as colunas.'] : []
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
  
  // Post-response validation (Item 15)
  const proposal = data.proposal;
  if (!proposal || typeof proposal !== 'object') {
    throw new Error('A resposta da IA não é um objeto JSON válido.');
  }
  
  if (!Array.isArray(proposal.subjects)) {
    throw new Error('A estrutura de disciplinas (subjects) retornada é inválida.');
  }
  
  proposal.subjects.forEach((subject: any) => {
    if (!subject.name) subject.name = 'Disciplina Desconhecida';
    if (!Array.isArray(subject.topics)) subject.topics = [];
    
    subject.topics.forEach((topic: any) => {
      if (!topic.name) topic.name = 'Tópico Geral';
      if (!Array.isArray(topic.activities)) topic.activities = [];
      
      topic.activities.forEach((activity: any) => {
        if (!activity.title) activity.title = 'Estudo';
        if (!activity.type) activity.type = 'Estudo livre';
        if (!activity.expectedDurationSeconds) activity.expectedDurationSeconds = 3600;
      });
    });
  });
  
  return proposal;
}

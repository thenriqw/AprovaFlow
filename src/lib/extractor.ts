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
  
  return data.proposal;
}

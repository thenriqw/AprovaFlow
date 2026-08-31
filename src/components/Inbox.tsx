import React, { useState, useRef } from 'react';
import { Upload, FileText, Database, File, AlertCircle, FileType2, Search, Check, FileUp } from 'lucide-react';
import { useStore } from '../store';
import { extractTextFromFile, parseWithGemini, parseSpreadsheetDeterministically } from '../lib/extractor';
import { createImportJob, updateImportJob } from '../lib/importService';
import ReviewDialog from './ReviewDialog';
import { ImportJob } from '../domain/types';

export default function Inbox() {
  const { imports, firebaseUser } = useStore();
  const [activeTab, setActiveTab] = useState<'file' | 'text' | 'catalog'>('file');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [textInput, setTextInput] = useState('');
  const [reviewJob, setReviewJob] = useState<ImportJob | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateHash = async (text: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !firebaseUser) return;
    
    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('O arquivo excede o limite de 10MB.');
      return;
    }

    let currentJobId: string | null = null;

    try {
      setIsProcessing(true);
      setError('');
      
      const ext = file.name.split('.').pop()?.toLowerCase() || 'text';
      let sourceType: 'pdf' | 'docx' | 'xlsx' | 'csv' | 'text' | 'txt' = 'text';
      if (['pdf', 'docx', 'xlsx', 'csv', 'txt'].includes(ext)) {
        sourceType = ext as any;
      }
      
      // 2. Extract Text FIRST so we can hash before job creation
      const { content, detectedType } = await extractTextFromFile(file);
      
      const contentHash = await generateHash(content);

      // Check for duplicates
      const isDuplicate = imports.some(i => i.contentHash === contentHash && i.status !== 'failed');
      if (isDuplicate) {
        if (!window.confirm('Este arquivo parece já ter sido importado. Deseja importar novamente?')) {
          setIsProcessing(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }
      }

      // 1. Create Job
      const job = await createImportJob(firebaseUser.uid, {
        title: file.name,
        filename: file.name,
        sourceType: sourceType as any,
        status: 'processing',
        contentHash
      });
      currentJobId = job.id;

      // 4. Parse with AI or Local Parser
      let proposal;
      if (['csv', 'xlsx'].includes(detectedType)) {
        proposal = parseSpreadsheetDeterministically(content, file.name);
        if (!proposal) {
          proposal = await parseWithGemini(content, detectedType, file.name);
        }
      } else {
        proposal = await parseWithGemini(content, detectedType, file.name);
      }

      // 5. Update Job with Proposal
      await updateImportJob(firebaseUser.uid, job.id, { 
        status: 'needs_review',
        proposal,
        warnings: proposal.warnings || []
      });
      
    } catch (err: any) {
      console.error(err);
      const msg = err.message === 'PDF_NO_TEXT' ? 'Este PDF parece ser escaneado. A leitura por OCR ainda não está disponível.' : err.message;
      setError(msg);
      if (currentJobId) {
        try {
          await updateImportJob(firebaseUser.uid, currentJobId, { status: 'failed', error: msg });
        } catch (updateErr) {
          console.error("Failed to update job status to failed", updateErr);
        }
      }
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleTextSubmit = async () => {
    if (!textInput.trim() || !firebaseUser) return;
    
    if (textInput.length > 50000) {
      setError('O texto excede o limite de 50.000 caracteres.');
      return;
    }

    let currentJobId: string | null = null;

    try {
      setIsProcessing(true);
      setError('');
      
      const contentHash = await generateHash(textInput);
      const isDuplicate = imports.some(i => i.contentHash === contentHash && i.status !== 'failed');
      if (isDuplicate) {
        if (!window.confirm('Este texto parece já ter sido importado. Deseja importar novamente?')) {
          setIsProcessing(false);
          return;
        }
      }

      const job = await createImportJob(firebaseUser.uid, {
        title: 'Texto Colado',
        sourceType: 'text',
        status: 'processing',
        contentHash
      });
      currentJobId = job.id;

      const proposal = await parseWithGemini(textInput, 'text', 'texto-colado.txt');

      await updateImportJob(firebaseUser.uid, job.id, { 
        status: 'needs_review',
        proposal,
        warnings: proposal.warnings || []
      });
      
      setTextInput('');

    } catch (err: any) {
      setError(err.message);
      if (currentJobId) {
        try {
          await updateImportJob(firebaseUser.uid, currentJobId, { status: 'failed', error: err.message });
        } catch (updateErr) {
          console.error("Failed to update job status to failed", updateErr);
        }
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl">
      
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-8 bg-neutral-900 rounded-full"></div>
        <div>
          <h1 className="text-3xl font-serif font-bold text-neutral-900">Study Inbox</h1>
          <p className="text-neutral-500 text-sm mt-1">Importe editais, cronogramas e conteúdos para o seu plano.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Import Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="flex bg-neutral-100 p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab('file')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'file' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
            >
              <Upload size={18} />
              Arquivo
            </button>
            <button 
              onClick={() => setActiveTab('text')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'text' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
            >
              <FileText size={18} />
              Colar Texto
            </button>
            <button 
              onClick={() => setActiveTab('catalog')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'catalog' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
            >
              <Search size={18} />
              Catálogo
            </button>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-start gap-3 border border-red-100">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <div className="text-sm font-medium">{error}</div>
            </div>
          )}

          {activeTab === 'file' && (
            <div className="bg-white border-2 border-dashed border-neutral-200 rounded-2xl p-8 text-center hover:bg-neutral-50 hover:border-neutral-300 transition-all">
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".pdf,.docx,.xlsx,.csv,.txt"
                className="hidden" 
              />
              <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {isProcessing ? (
                  <div className="w-8 h-8 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin"></div>
                ) : (
                  <FileUp size={28} className="text-neutral-600" />
                )}
              </div>
              <h3 className="font-bold text-neutral-900 text-lg">
                {isProcessing ? 'Processando arquivo...' : 'Escolha um arquivo'}
              </h3>
              <p className="text-sm text-neutral-500 mt-2 mb-6 max-w-sm mx-auto">
                {isProcessing 
                  ? 'Isso pode levar alguns instantes. A IA está analisando a estrutura.'
                  : 'Suporta PDF (com texto), DOCX, XLSX, CSV e TXT (até 10MB).'}
              </p>
              {!isProcessing && (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-2.5 bg-neutral-900 text-white font-semibold rounded-xl hover:bg-neutral-800 transition-colors"
                >
                  Selecionar Arquivo
                </button>
              )}
            </div>
          )}

          {activeTab === 'text' && (
            <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden flex flex-col h-[400px]">
              <textarea 
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Cole aqui seu edital, lista de matérias ou cronograma..."
                className="flex-1 w-full p-6 resize-none focus:outline-none text-neutral-700 bg-transparent"
                disabled={isProcessing}
              ></textarea>
              <div className="p-4 border-t border-neutral-100 bg-neutral-50 flex justify-end">
                <button 
                  onClick={handleTextSubmit}
                  disabled={!textInput.trim() || isProcessing}
                  className="px-6 py-2.5 bg-neutral-900 text-white font-semibold rounded-xl hover:bg-neutral-800 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isProcessing && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                  {isProcessing ? 'Analisando...' : 'Organizar Conteúdo'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'catalog' && (
            <div className="bg-white border border-neutral-200 p-8 rounded-2xl text-center">
               <div className="flex justify-center mb-4">
                  <Database size={32} className="text-neutral-300" />
               </div>
               <h3 className="font-bold text-lg text-neutral-900">Catálogo de Editais</h3>
               <p className="text-neutral-500 mt-2 max-w-md mx-auto">
                  Ainda não temos templates oficiais publicados. Use as opções de arquivo ou texto para importar seus próprios editais.
               </p>
            </div>
          )}

        </div>

        {/* Right Column: History */}
        <div className="space-y-4">
          <h2 className="font-bold text-lg text-neutral-800 flex items-center justify-between">
            Histórico
            <span className="text-xs bg-neutral-100 px-2 py-1 rounded-md text-neutral-500">{imports.length}</span>
          </h2>

          <div className="space-y-3">
            {imports.length === 0 ? (
              <div className="text-sm text-neutral-500 text-center py-8 border border-dashed border-neutral-200 rounded-xl">
                Nenhuma importação ainda.
              </div>
            ) : (
              imports.map(job => (
                <div key={job.id} className="bg-white border border-neutral-200 p-4 rounded-xl flex items-start gap-3">
                  <div className={`p-2 rounded-lg mt-0.5 ${
                    job.status === 'applied' ? 'bg-emerald-50 text-emerald-600' :
                    job.status === 'needs_review' ? 'bg-amber-50 text-amber-600' :
                    job.status === 'failed' ? 'bg-red-50 text-red-600' :
                    'bg-neutral-50 text-neutral-500'
                  }`}>
                    {job.status === 'applied' ? <Check size={18} /> :
                     job.status === 'needs_review' ? <AlertCircle size={18} /> :
                     job.sourceType === 'pdf' ? <FileType2 size={18} /> : 
                     <FileText size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-neutral-900 text-sm truncate">{job.title}</h4>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {new Date(job.createdAt).toLocaleDateString()} • {
                        job.status === 'queued' ? 'Na fila' :
                        job.status === 'extracting' ? 'Extraindo...' :
                        job.status === 'processing' ? 'Processando IA...' :
                        job.status === 'needs_review' ? 'Aguardando revisão' :
                        job.status === 'applied' ? 'Aplicado' :
                        job.status === 'failed' ? 'Falhou' : job.status
                      }
                    </p>
                    {job.status === 'needs_review' && (
                      <button 
                        onClick={() => setReviewJob(job)}
                        className="mt-2 text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-md hover:bg-amber-100 transition-colors"
                      >
                        Revisar e Aplicar
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {reviewJob && (
        <ReviewDialog job={reviewJob} onClose={() => setReviewJob(null)} />
      )}
    </div>
  );
}

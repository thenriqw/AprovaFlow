import React from 'react';
import { Inbox as InboxIcon, Upload, Database, FileText } from 'lucide-react';
import Importer from './Importer'; // We will just render the old Importer inside a new wrapper for now

export default function Inbox() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-8 bg-neutral-900 rounded-full"></div>
        <div>
          <h1 className="text-3xl font-serif font-bold text-neutral-900">Entrada</h1>
          <p className="text-neutral-500 text-sm mt-1">Sua caixa de entrada de materiais e editais.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4">
          <div className="bg-neutral-900 text-white p-5 rounded-2xl shadow-lg shadow-neutral-900/10 flex flex-col gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <Upload size={20} />
            </div>
            <h3 className="font-bold text-lg">Processar Novo Edital</h3>
            <p className="text-sm text-neutral-300 opacity-90 leading-relaxed">
              Cole o texto do seu edital e nossa IA extrairá automaticamente matérias e tópicos para o seu plano.
            </p>
          </div>
          
          <div className="bg-white border border-neutral-200 p-5 rounded-2xl shadow-sm flex flex-col gap-3 opacity-60 cursor-not-allowed">
            <div className="w-10 h-10 bg-neutral-100 text-neutral-400 rounded-xl flex items-center justify-center">
              <Database size={20} />
            </div>
            <h3 className="font-bold text-lg text-neutral-900">Integração Google Drive</h3>
            <p className="text-sm text-neutral-500 leading-relaxed">
              Em breve. Sincronize PDFs e documentos diretamente do seu Drive.
            </p>
          </div>
        </div>

        <div className="md:col-span-2">
          {/* Reuse the existing logic visually nested here */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
             <Importer />
          </div>
        </div>
      </div>
    </div>
  );
}

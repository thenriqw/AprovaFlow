import React from 'react';
import { Inbox as InboxIcon, Upload, Database, FileText } from 'lucide-react';
import Importer from './Importer'; // We will just render the old Importer inside a new wrapper for now

export default function Inbox() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl">
      
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-8 bg-neutral-900 rounded-full"></div>
        <div>
          <h1 className="text-3xl font-serif font-bold text-neutral-900">Processar Edital</h1>
          <p className="text-neutral-500 text-sm mt-1">Cole o texto do seu edital e transforme em matérias e tópicos.</p>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-2xl p-6 md:p-8 shadow-sm">
        <Importer />
      </div>

      <div className="bg-neutral-50 border border-neutral-200 p-5 rounded-xl text-center">
         <div className="flex justify-center mb-2">
            <Database size={20} className="text-neutral-400" />
         </div>
         <h3 className="font-bold text-sm text-neutral-700">Integração Google Drive</h3>
         <p className="text-sm text-neutral-500 mt-1 max-w-md mx-auto">
            A importação de PDFs e documentos diretamente do seu Drive estará disponível em breve.
         </p>
      </div>
      
    </div>
  );
}

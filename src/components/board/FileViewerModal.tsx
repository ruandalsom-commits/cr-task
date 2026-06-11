import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X as CloseIcon, Download, Printer, Trash2, MessageSquare, History, Image as ImageIcon, Info, FileOutput, ChevronLeft, ChevronRight, FileText } from 'lucide-react';

interface FileViewerModalProps {
  file: { name: string, url: string, isImage: boolean, isVideo: boolean } | null;
  onClose: () => void;
  taskTitle: string;
}

export function FileViewerModal({ file, onClose, taskTitle }: FileViewerModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!file || !mounted) return null;

  const getFileIcon = () => {
    if (file.name.endsWith('.csv') || file.name.endsWith('.xlsx')) {
      return <div className="w-64 h-48 bg-[#107c41] text-white flex items-center justify-center rounded-lg shadow-lg text-6xl font-bold">X</div>;
    }
    if (file.name.endsWith('.pdf')) {
      return <div className="w-64 h-48 bg-red-500 text-white flex items-center justify-center rounded-lg shadow-lg"><FileText className="w-24 h-24" /></div>;
    }
    return <div className="w-64 h-48 bg-blue-500 text-white flex items-center justify-center rounded-lg shadow-lg"><FileText className="w-24 h-24" /></div>;
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white w-full max-w-[1400px] h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden relative" onClick={e => e.stopPropagation()}>
        {/* Top Header */}
        <div className="h-16 border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 text-green-700 rounded flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-slate-800">{file.name}</span>
            <span className="text-xs text-slate-500">Workspace Principal &gt; {taskTitle} &gt; Atualização</span>
          </div>
        </div>
        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
          <CloseIcon className="w-6 h-6" />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 bg-[#f5f6f8] relative flex flex-col items-center justify-center">
          <button className="absolute left-8 p-3 text-slate-300 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
            <ChevronLeft className="w-8 h-8" />
          </button>
          
          <div className="max-w-4xl max-h-full p-8 flex items-center justify-center">
            {file.isImage ? (
              <img src={file.url} alt={file.name} className="max-w-full max-h-[70vh] object-contain shadow-xl rounded" />
            ) : file.isVideo ? (
              <video src={file.url} controls className="max-w-full max-h-[70vh] shadow-xl rounded"></video>
            ) : (
              getFileIcon()
            )}
          </div>

          <button className="absolute right-8 p-3 text-slate-300 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
            <ChevronRight className="w-8 h-8" />
          </button>

          {/* Bottom Toolbar */}
          <div className="absolute bottom-8 bg-white border border-slate-200 shadow-lg rounded-lg flex items-center p-2 gap-2">
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded">
              <MessageSquare className="w-4 h-4" /> Comentar
            </button>
            <div className="w-px h-6 bg-slate-200"></div>
            <a href={file.url} target="_blank" download className="p-2 text-slate-600 hover:bg-slate-50 rounded" title="Download">
              <Download className="w-5 h-5" />
            </a>
            <button className="p-2 text-slate-600 hover:bg-slate-50 rounded" title="Imprimir">
              <Printer className="w-5 h-5" />
            </button>
            <button className="p-2 text-red-500 hover:bg-red-50 rounded" title="Excluir">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-20 border-l border-slate-200 bg-white flex flex-col items-center py-4 gap-6 shrink-0">
          <button className="flex flex-col items-center gap-1 text-slate-400 hover:text-blue-600 transition-colors">
            <MessageSquare className="w-6 h-6" />
            <span className="text-[10px] font-medium">Comentários</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-slate-400 hover:text-blue-600 transition-colors">
            <History className="w-6 h-6" />
            <span className="text-[10px] font-medium">Versões</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-slate-400 hover:text-blue-600 transition-colors">
            <ImageIcon className="w-6 h-6" />
            <span className="text-[10px] font-medium">Galeria</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-slate-400 hover:text-blue-600 transition-colors">
            <Info className="w-6 h-6" />
            <span className="text-[10px] font-medium">Info</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-slate-400 hover:text-blue-600 transition-colors">
            <FileOutput className="w-6 h-6" />
            <span className="text-[10px] font-medium">Extrair</span>
          </button>
        </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

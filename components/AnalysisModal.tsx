import React from 'react';
import { X, Bot, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  content: string;
}

export const AnalysisModal: React.FC<AnalysisModalProps> = ({ isOpen, onClose, isLoading, content }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex justify-between items-center text-white shrink-0">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Bot size={24} /> Análisis Inteligente
          </h3>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Loader2 size={48} className="animate-spin mb-4 text-indigo-500" />
              <p>Gemini está analizando los registros...</p>
            </div>
          ) : (
            <div className="prose prose-sm md:prose-base max-w-none text-gray-700">
              {/* Note: In a real environment, you'd install 'react-markdown'. Since I cannot install packages, I will render raw text but structured safely or assume the environment supports it. For this output, I will display formatted text using basic preservation. */}
              <div className="whitespace-pre-wrap font-sans leading-relaxed">
                 {content}
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-gray-50 p-4 border-t border-gray-100 shrink-0 text-center">
             <p className="text-xs text-gray-400">Generado por Google Gemini. Verifique siempre los datos oficiales.</p>
        </div>
      </div>
    </div>
  );
};
import React, { useState } from 'react';
import { Plus, X, Mic, Bot, Music } from 'lucide-react';

interface FloatingActionMenuProps {
  onOpenVoice: () => void;
  onOpenChat: () => void;
  onOpenMusic: () => void;
}

export const FloatingActionMenu: React.FC<FloatingActionMenuProps> = ({ 
  onOpenVoice, 
  onOpenChat, 
  onOpenMusic 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  const buttonBaseClass = "w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white transition-all duration-300 hover:scale-110";

  return (
    <div className="fixed bottom-6 right-6 flex flex-col items-center gap-3 z-40">
      
      {/* Sub-buttons (Actions) */}
      <div className={`flex flex-col gap-3 transition-all duration-300 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
        
        {/* Music Button */}
        <div className="flex items-center gap-2">
            <span className={`bg-gray-800 text-white text-xs py-1 px-2 rounded-md shadow-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
                Música
            </span>
            <button 
                onClick={() => { onOpenMusic(); setIsOpen(false); }}
                className={`${buttonBaseClass} bg-pink-600 hover:bg-pink-700`}
            >
                <Music size={20} />
            </button>
        </div>

        {/* Chat/Guide Button */}
        <div className="flex items-center gap-2">
            <span className={`bg-gray-800 text-white text-xs py-1 px-2 rounded-md shadow-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
                Ayuda
            </span>
            <button 
                onClick={() => { onOpenChat(); setIsOpen(false); }}
                className={`${buttonBaseClass} bg-indigo-600 hover:bg-indigo-700`}
            >
                <Bot size={20} />
            </button>
        </div>

        {/* Voice Assistant Button */}
        <div className="flex items-center gap-2">
            <span className={`bg-gray-800 text-white text-xs py-1 px-2 rounded-md shadow-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
                Voz
            </span>
            <button 
                onClick={() => { onOpenVoice(); setIsOpen(false); }}
                className={`${buttonBaseClass} bg-brand-600 hover:bg-brand-700`}
            >
                <Mic size={20} />
            </button>
        </div>

      </div>

      {/* Main Toggle Button */}
      <button
        onClick={toggleMenu}
        className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-white transition-all duration-300 z-50 ${isOpen ? 'bg-gray-700 rotate-45' : 'bg-gradient-to-r from-brand-600 to-indigo-600 hover:scale-105'}`}
        title="Menú de Acciones"
      >
        <Plus size={28} />
      </button>

    </div>
  );
};
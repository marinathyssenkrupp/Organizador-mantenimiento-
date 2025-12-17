import React from 'react';
import { Trash2, X, AlertTriangle } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col items-center p-6 animate-scale-in border border-gray-100 dark:border-gray-700">
        
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 mb-4 animate-pulse">
            <Trash2 size={32} />
        </div>

        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2 text-center">
            ¿Eliminar Registro?
        </h3>
        
        <p className="text-gray-500 dark:text-gray-400 text-center text-sm mb-6">
            Esta acción no se puede deshacer. ¿Estás seguro de que quieres borrar esta mantención permanentemente?
        </p>

        <div className="flex gap-3 w-full">
            <button 
                onClick={onClose}
                className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
            >
                No, Cancelar
            </button>
            <button 
                onClick={() => {
                    onConfirm();
                    onClose();
                }}
                className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-200 dark:shadow-none transition-all text-sm flex items-center justify-center gap-2 transform active:scale-95"
            >
                <Trash2 size={18} />
                Sí, Borrar
            </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useRef } from 'react';
import { X, Upload, Check, Loader2, Calendar, User, FileText } from 'lucide-react';
import { analyzeShiftSchedule } from '../services/geminiService';
import { Shift } from '../types';

interface ShiftUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveShifts: (shifts: Shift[]) => void;
}

export const ShiftUploadModal: React.FC<ShiftUploadModalProps> = ({ isOpen, onClose, onSaveShifts }) => {
  const [fileData, setFileData] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectedShifts, setDetectedShifts] = useState<Shift[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFileData(reader.result as string);
        setMimeType(file.type);
        setDetectedShifts([]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!fileData) return;
    setIsAnalyzing(true);
    
    const shifts = await analyzeShiftSchedule(fileData, mimeType);
    setDetectedShifts(shifts);
    setIsAnalyzing(false);
  };

  const handleSave = () => {
      onSaveShifts(detectedShifts);
      onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-4 flex justify-between items-center text-white shrink-0">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Calendar size={22} /> Cargar Turnos (IA)
          </h3>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-gray-50 dark:bg-gray-900/50">
          
          {detectedShifts.length === 0 ? (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Sube una foto o PDF de la planilla de turnos. <br/>
                  La IA detectará automáticamente fechas y supervisores.
                </p>
              </div>

              {/* Upload Area */}
              <div 
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors bg-white dark:bg-gray-800"
                onClick={() => fileInputRef.current?.click()}
              >
                {fileData ? (
                   mimeType.includes('image') ? (
                      <img src={fileData} alt="Preview" className="max-h-48 object-contain rounded-lg shadow-sm" />
                   ) : (
                      <div className="flex flex-col items-center text-gray-500">
                          <FileText size={48} />
                          <span className="mt-2 font-medium">Documento PDF cargado</span>
                      </div>
                   )
                ) : (
                  <>
                    <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4">
                      <Upload size={32} />
                    </div>
                    <p className="font-medium text-gray-700 dark:text-gray-200">Clic para subir Planilla</p>
                    <p className="text-sm text-gray-400 mt-1">Soporta JPG, PNG, PDF</p>
                  </>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*,application/pdf" 
                  className="hidden" 
                />
              </div>

              {fileData && (
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 size={20} className="animate-spin" /> Analizando Planilla...
                    </>
                  ) : (
                    <>
                      <Check size={20} /> Extraer Turnos
                    </>
                  )}
                </button>
              )}
            </div>
          ) : (
             <div className="animate-slide-up space-y-4">
                 <div className="flex justify-between items-center">
                     <h4 className="font-bold text-gray-800 dark:text-white">Turnos Detectados ({detectedShifts.length})</h4>
                     <button 
                        onClick={() => { setFileData(null); setDetectedShifts([]); }}
                        className="text-xs text-amber-600 hover:underline"
                     >
                         Cancelar / Reintentar
                     </button>
                 </div>
                 
                 <div className="space-y-2 max-h-60 overflow-y-auto">
                     {detectedShifts.map((shift, idx) => (
                         <div key={idx} className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                             <div className="flex items-center gap-3">
                                 <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-full text-amber-600">
                                     <User size={16} />
                                 </div>
                                 <div>
                                     <p className="font-bold text-gray-800 dark:text-gray-200">{shift.name}</p>
                                     <p className="text-xs text-gray-500">{new Date(shift.date + 'T00:00:00').toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                                 </div>
                             </div>
                         </div>
                     ))}
                 </div>

                 <button
                    onClick={handleSave}
                    className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold shadow-md transition-all flex items-center justify-center gap-2"
                 >
                    <Check size={20} /> Guardar Turnos
                 </button>
             </div>
          )}

        </div>
      </div>
    </div>
  );
};

import React, { useState, useRef } from 'react';
import { X, Camera, Upload, CheckCircle, AlertTriangle, Loader2, Image as ImageIcon } from 'lucide-react';
import { analyzeEquipmentImage } from '../services/geminiService';
import { MaintenanceRecord } from '../types';
import ReactMarkdown from 'react-markdown';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRecords: MaintenanceRecord[];
}

export const InventoryModal: React.FC<InventoryModalProps> = ({ isOpen, onClose, currentRecords }) => {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null); // Clear previous result
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;
    
    setIsAnalyzing(true);
    setResult(null);
    
    const analysis = await analyzeEquipmentImage(image, currentRecords);
    
    setResult(analysis);
    setIsAnalyzing(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-600 p-4 flex justify-between items-center text-white shrink-0">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Camera size={22} /> Escáner de Inventario Visual
          </h3>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-gray-50 dark:bg-gray-900/50">
          
          {!result && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <p className="text-gray-600 dark:text-gray-300">
                  Sube una foto de una <strong>lista en papel, un plano o un sector del mall</strong>.
                  <br/>
                  La IA detectará qué equipos están en la foto y te dirá cuáles ya tienen mantención este mes.
                </p>
              </div>

              {/* Upload Area */}
              <div 
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors bg-white dark:bg-gray-800"
                onClick={() => fileInputRef.current?.click()}
              >
                {image ? (
                  <img src={image} alt="Preview" className="max-h-64 object-contain rounded-lg shadow-sm" />
                ) : (
                  <>
                    <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center text-orange-600 dark:text-orange-400 mb-4">
                      <Upload size={32} />
                    </div>
                    <p className="font-medium text-gray-700 dark:text-gray-200">Clic para subir foto o tomar captura</p>
                    <p className="text-sm text-gray-400 mt-1">Soporta JPG, PNG</p>
                  </>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>

              {image && (
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 size={20} className="animate-spin" /> Analizando Foto...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={20} /> Comparar con Mantenciones
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Results Area */}
          {result && (
            <div className="animate-slide-up space-y-4">
              <div className="flex justify-between items-center">
                 <h4 className="font-bold text-gray-800 dark:text-white text-lg">Resultado del Análisis</h4>
                 <button 
                    onClick={() => { setImage(null); setResult(null); }}
                    className="text-sm text-orange-600 dark:text-orange-400 font-medium hover:underline"
                 >
                    Escanear otra
                 </button>
              </div>
              
              <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <ReactMarkdown>{result}</ReactMarkdown>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex gap-3 text-sm text-blue-800 dark:text-blue-200 border border-blue-100 dark:border-blue-800">
                <AlertTriangle size={20} className="shrink-0" />
                <p>
                  Recuerda: La IA puede cometer errores visuales. Verifica siempre físicamente los equipos marcados como pendientes.
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
import React, { useState, useRef, useEffect } from 'react';
import { Mic, X, Loader2, CheckCircle2, AlertCircle, StopCircle, HelpCircle, FilePlus, Volume2 } from 'lucide-react';
import { processVoiceCommand, consultPendingStatus } from '../services/geminiService';
import { MaintenanceRecord, Location, EquipmentType } from '../types';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecordCreated: (record: MaintenanceRecord) => void;
  currentRecords: MaintenanceRecord[];
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({ isOpen, onClose, onRecordCreated, currentRecords }) => {
  const [mode, setMode] = useState<'create' | 'consult'>('create');
  const [status, setStatus] = useState<'idle' | 'recording' | 'processing' | 'success' | 'speaking' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [transcript, setTranscript] = useState<Partial<MaintenanceRecord> | null>(null);
  const [consultResponse, setConsultResponse] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (isOpen) {
        setStatus('idle');
        setTranscript(null);
        setConsultResponse(null);
        // Stop any previous speech
        window.speechSynthesis.cancel();
    }
  }, [isOpen]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
          const base64 = reader.result as string;
          processAudio(base64);
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setStatus('recording');
    } catch (err) {
      console.error("Mic Error:", err);
      setStatus('error');
      setErrorMessage("No se pudo acceder al micrófono.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && status === 'recording') {
      mediaRecorderRef.current.stop();
      setStatus('processing');
    }
  };

  const speakText = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 1.0;
    
    utterance.onstart = () => setStatus('speaking');
    utterance.onend = () => setStatus('idle'); // Back to idle after speaking
    
    window.speechSynthesis.speak(utterance);
  };

  const processAudio = async (base64Audio: string) => {
    try {
        if (mode === 'create') {
            const result = await processVoiceCommand(base64Audio);
            if (result) {
                setTranscript(result);
                setStatus('success');
                
                setTimeout(() => {
                    const newRecord: MaintenanceRecord = {
                        id: crypto.randomUUID(),
                        technician: result.technician || 'Desconocido',
                        date: result.date || new Date().toISOString().split('T')[0],
                        time: result.time || '09:00',
                        location: (result.location as Location) || Location.MOL_MAL_MARINO,
                        equipmentType: (result.equipmentType as EquipmentType) || EquipmentType.ELEVATOR,
                        equipmentOrder: result.equipmentOrder || 'General',
                        notes: result.notes || 'Generado por Asistente de Voz',
                        audioNote: base64Audio
                    };
                    onRecordCreated(newRecord);
                }, 1500);

            } else {
                setStatus('error');
                setErrorMessage("No pude entender los detalles.");
            }
        } else {
            // Consult Mode
            const textResponse = await consultPendingStatus(base64Audio, currentRecords);
            setConsultResponse(textResponse);
            speakText(textResponse);
        }
    } catch (e) {
        setStatus('error');
        setErrorMessage("Error de conexión con la IA.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col items-center relative transition-all">
        
        <button 
            onClick={() => {
                window.speechSynthesis.cancel();
                onClose();
            }} 
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
            <X size={24} />
        </button>

        {/* Mode Tabs */}
        <div className="w-full flex border-b border-gray-100 dark:border-gray-700 mt-2">
            <button 
                onClick={() => { setMode('create'); setStatus('idle'); setConsultResponse(null); }}
                className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${mode === 'create' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-gray-400 dark:text-gray-500'}`}
            >
                <FilePlus size={16} /> Registrar
            </button>
            <button 
                 onClick={() => { setMode('consult'); setStatus('idle'); setTranscript(null); }}
                 className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${mode === 'consult' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-400 dark:text-gray-500'}`}
            >
                <HelpCircle size={16} /> Consultar
            </button>
        </div>

        <div className="pt-8 pb-4 px-6 text-center w-full">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                {mode === 'create' ? 'Dictar Mantención' : 'Consultar Pendientes'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
                {mode === 'create' 
                    ? '"José revisó el ascensor Torre Marina hoy..."'
                    : '"¿Qué equipos faltan en el Boulevard?"'
                }
            </p>
        </div>

        <div className="py-6 flex flex-col justify-center items-center w-full min-h-[200px]">
            {status === 'idle' && (
                <button 
                    onClick={startRecording}
                    className={`w-20 h-20 rounded-full text-white flex items-center justify-center shadow-lg transform hover:scale-105 transition-all ${mode === 'create' ? 'bg-brand-600 hover:bg-brand-500' : 'bg-purple-600 hover:bg-purple-500'}`}
                >
                    <Mic size={36} />
                </button>
            )}

            {status === 'recording' && (
                <div className="flex flex-col items-center">
                    <div className="relative">
                        <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20"></div>
                        <button 
                            onClick={stopRecording}
                            className="relative z-10 w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition-all"
                        >
                            <StopCircle size={36} />
                        </button>
                    </div>
                    <p className="mt-4 text-red-500 font-medium animate-pulse text-sm">Escuchando...</p>
                </div>
            )}

            {status === 'processing' && (
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 relative flex items-center justify-center">
                         <Loader2 size={48} className={`${mode === 'create' ? 'text-brand-600' : 'text-purple-600'} animate-spin`} />
                    </div>
                    <p className={`mt-4 font-medium text-sm ${mode === 'create' ? 'text-brand-600' : 'text-purple-600'}`}>Analizando...</p>
                </div>
            )}

            {status === 'success' && mode === 'create' && (
                <div className="flex flex-col items-center animate-scale-in">
                    <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 mb-2">
                        <CheckCircle2 size={40} />
                    </div>
                    <h4 className="text-lg font-bold text-green-700 dark:text-green-400">¡Entendido!</h4>
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg mt-2 text-xs text-left max-w-[280px] w-full text-gray-700 dark:text-gray-200">
                        <p><strong>Tec:</strong> {transcript?.technician}</p>
                        <p><strong>Equipo:</strong> {transcript?.equipmentOrder}</p>
                    </div>
                </div>
            )}

            {(status === 'speaking' || (status === 'idle' && consultResponse)) && mode === 'consult' && (
                 <div className="flex flex-col items-center animate-scale-in w-full px-6">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 ${status === 'speaking' ? 'bg-purple-100 text-purple-600 animate-pulse' : 'bg-gray-100 text-gray-500'}`}>
                        <Volume2 size={32} />
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl text-center w-full max-h-40 overflow-y-auto">
                        <p className="text-sm text-purple-900 dark:text-purple-200 font-medium italic">"{consultResponse}"</p>
                    </div>
                    {status === 'speaking' && (
                         <button onClick={() => window.speechSynthesis.cancel()} className="mt-2 text-xs text-red-500 hover:underline">Detener audio</button>
                    )}
                 </div>
            )}

            {status === 'error' && (
                 <div className="flex flex-col items-center animate-shake">
                    <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 mb-2">
                        <AlertCircle size={36} />
                    </div>
                    <p className="text-red-600 dark:text-red-400 font-medium px-4 text-center text-sm">{errorMessage}</p>
                    <button 
                        onClick={() => setStatus('idle')}
                        className="mt-4 text-xs text-gray-500 underline"
                    >
                        Intentar de nuevo
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

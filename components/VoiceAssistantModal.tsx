import React, { useState, useRef, useEffect } from 'react';
import { Mic, X, Loader2, CheckCircle2, AlertCircle, StopCircle, HelpCircle, FilePlus, Volume2, Trash2 } from 'lucide-react';
import { processVoiceCommand, consultPendingStatus, checkVoiceConfirmation } from '../services/geminiService';
import { MaintenanceRecord, Location, EquipmentType } from '../types';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecordCreated: (record: MaintenanceRecord) => void;
  onRecordDeleted: (criteria: Partial<MaintenanceRecord>) => boolean;
  currentRecords: MaintenanceRecord[];
}

type AssistantStatus = 'idle' | 'recording' | 'processing' | 'success' | 'confirming' | 'recording_confirmation' | 'processing_confirmation' | 'deleted' | 'speaking' | 'error';

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({ isOpen, onClose, onRecordCreated, onRecordDeleted, currentRecords }) => {
  const [mode, setMode] = useState<'create' | 'consult'>('create');
  const [status, setStatus] = useState<AssistantStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [transcript, setTranscript] = useState<Partial<MaintenanceRecord> | null>(null);
  const [pendingDeletion, setPendingDeletion] = useState<Partial<MaintenanceRecord> | null>(null);
  const [consultResponse, setConsultResponse] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (isOpen) {
        setStatus('idle');
        setTranscript(null);
        setPendingDeletion(null);
        setConsultResponse(null);
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
      
      // Determine next status based on current context
      if (status === 'confirming') {
          setStatus('recording_confirmation');
      } else {
          setStatus('recording');
      }

    } catch (err) {
      console.error("Mic Error:", err);
      setStatus('error');
      setErrorMessage("No se pudo acceder al micrófono.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && (status === 'recording' || status === 'recording_confirmation')) {
      mediaRecorderRef.current.stop();
      
      if (status === 'recording_confirmation') {
          setStatus('processing_confirmation');
      } else {
          setStatus('processing');
      }
    }
  };

  const speakText = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 1.0;
    
    // Only switch to 'speaking' state if we aren't in a confirmation flow
    // because 'confirming' needs to persist to show buttons.
    utterance.onstart = () => {
        if (!isConfirmationPhase) setStatus('speaking');
    }
    utterance.onend = () => {
        if (status === 'speaking') setStatus('idle');
    }
    
    window.speechSynthesis.speak(utterance);
  };

  const handleManualConfirm = () => {
    // If recording, stop it first to prevent double processing
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
    }

    if (pendingDeletion) {
        const success = onRecordDeleted(pendingDeletion);
        if (success) {
            setStatus('deleted');
            setTranscript(pendingDeletion);
            speakText("Registro eliminado correctamente.");
        } else {
            setStatus('error');
            setErrorMessage("No encontré el registro.");
            speakText("No pude encontrar el registro.");
        }
        setPendingDeletion(null);
    }
  };

  const handleManualCancel = () => {
     // If recording, stop it first
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
    }
    setStatus('idle');
    speakText("Operación cancelada.");
    setPendingDeletion(null);
  };

  const processAudio = async (base64Audio: string) => {
    try {
        // --- CONFIRMATION FLOW ---
        // Handle processing if we came from 'confirming' state
        if ((status === 'processing_confirmation' || status === 'confirming') && pendingDeletion) {
            const isConfirmed = await checkVoiceConfirmation(base64Audio);
            
            if (isConfirmed) {
                // We re-call logic but without stopping recorder (it's already stopped)
                if (pendingDeletion) {
                    const success = onRecordDeleted(pendingDeletion);
                    if (success) {
                        setStatus('deleted');
                        setTranscript(pendingDeletion);
                        speakText("Registro eliminado correctamente.");
                    } else {
                        setStatus('error');
                        setErrorMessage("No encontré el registro.");
                        speakText("No pude encontrar el registro.");
                    }
                    setPendingDeletion(null);
                }
            } else {
                setStatus('idle');
                speakText("Operación cancelada.");
                setPendingDeletion(null);
            }
            return;
        }

        // --- STANDARD FLOW ---
        if (mode === 'create') {
            const result = await processVoiceCommand(base64Audio);
            if (result) {
                
                if (result.intent === 'DELETE') {
                    // Ask for confirmation instead of deleting immediately
                    setPendingDeletion(result.data);
                    setStatus('confirming');
                    speakText(`¿Seguro que quieres borrar el registro de ${result.data.equipmentOrder || 'este equipo'}? Pulsa el micrófono y di sí, o usa los botones.`);
                } else {
                    // Handle Creation
                    setTranscript(result.data);
                    setStatus('success');
                    
                    setTimeout(() => {
                        const newRecord: MaintenanceRecord = {
                            id: crypto.randomUUID(),
                            technician: result.data.technician || 'Desconocido',
                            date: result.data.date || new Date().toISOString().split('T')[0],
                            time: result.data.time || '09:00',
                            location: (result.data.location as Location) || Location.MOL_MAL_MARINO,
                            equipmentType: (result.data.equipmentType as EquipmentType) || EquipmentType.ELEVATOR,
                            equipmentOrder: result.data.equipmentOrder || 'General',
                            notes: result.data.notes || 'Generado por Asistente de Voz',
                            audioNote: base64Audio
                        };
                        onRecordCreated(newRecord);
                    }, 1500);
                }

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

  const isConfirmationPhase = status === 'confirming' || status === 'recording_confirmation' || status === 'processing_confirmation';

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
                <FilePlus size={16} /> Gestión (Crear/Borrar)
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
                {mode === 'create' ? 'Dictar o Borrar' : 'Consultar Pendientes'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
                {mode === 'create' 
                    ? '"José revisó la Torre..." o "Borra lo de la Torre hoy"'
                    : '"¿Qué equipos faltan en el Boulevard?"'
                }
            </p>
        </div>

        <div className="py-6 flex flex-col justify-center items-center w-full min-h-[220px]">
            {/* IDLE STATE */}
            {status === 'idle' && (
                <button 
                    onClick={startRecording}
                    className={`w-20 h-20 rounded-full text-white flex items-center justify-center shadow-lg transform hover:scale-105 transition-all ${mode === 'create' ? 'bg-brand-600 hover:bg-brand-500' : 'bg-purple-600 hover:bg-purple-500'}`}
                >
                    <Mic size={36} />
                </button>
            )}

            {/* GENERIC RECORDING STATE (NOT CONFIRMATION) */}
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

            {/* GENERIC PROCESSING STATE (NOT CONFIRMATION) */}
            {status === 'processing' && (
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 relative flex items-center justify-center">
                         <Loader2 size={48} className={`${mode === 'create' ? 'text-brand-600' : 'text-purple-600'} animate-spin`} />
                    </div>
                    <p className={`mt-4 font-medium text-sm ${mode === 'create' ? 'text-brand-600' : 'text-purple-600'}`}>Analizando...</p>
                </div>
            )}

            {/* CONFIRMATION PHASE (Handles Idle, Recording, Processing within Confirmation) */}
            {isConfirmationPhase && (
                 <div className="flex flex-col items-center animate-scale-in text-center px-6 w-full">
                    <div className="w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600 dark:text-yellow-400 mb-2">
                        {status === 'processing_confirmation' ? <Loader2 size={36} className="animate-spin" /> : <AlertCircle size={36} />}
                    </div>
                    <h4 className="text-lg font-bold text-yellow-700 dark:text-yellow-400">¿Estás seguro?</h4>
                    <p className="text-sm text-gray-500 mt-2 mb-4">
                        {status === 'recording_confirmation' ? 'Escuchando tu respuesta...' : 
                         status === 'processing_confirmation' ? 'Verificando...' : 'Se eliminará el registro encontrado.'}
                    </p>
                    
                    {/* Buttons Row - ALWAYS VISIBLE */}
                    <div className="flex gap-3 w-full max-w-[280px]">
                         <button 
                            onClick={handleManualCancel}
                            disabled={status === 'processing_confirmation'}
                            className="flex-1 py-3 px-4 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm disabled:opacity-50"
                        >
                            No
                        </button>
                        <button 
                            onClick={handleManualConfirm}
                            disabled={status === 'processing_confirmation'}
                            className="flex-1 py-3 px-4 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-md text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <Trash2 size={16} /> Sí, borrar
                        </button>
                    </div>

                     <div className="mt-4 flex flex-col items-center gap-2">
                         <span className="text-xs text-gray-400 font-medium uppercase">
                             {status === 'recording_confirmation' ? 'Detener Voz' : 'O dilo con voz'}
                         </span>
                         
                         {status === 'recording_confirmation' ? (
                            <div className="relative">
                                <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20"></div>
                                <button 
                                    onClick={stopRecording}
                                    className="relative z-10 w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors"
                                >
                                    <StopCircle size={20} />
                                </button>
                            </div>
                         ) : status === 'processing_confirmation' ? (
                             <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                 <Loader2 size={20} className="animate-spin text-gray-500" />
                             </div>
                         ) : (
                            <button 
                                onClick={startRecording}
                                className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center transition-colors"
                            >
                                <Mic size={20} />
                            </button>
                         )}
                    </div>
                </div>
            )}

            {/* SUCCESS STATE (Created) */}
            {status === 'success' && mode === 'create' && (
                <div className="flex flex-col items-center animate-scale-in">
                    <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 mb-2">
                        <CheckCircle2 size={40} />
                    </div>
                    <h4 className="text-lg font-bold text-green-700 dark:text-green-400">¡Creado!</h4>
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg mt-2 text-xs text-left max-w-[280px] w-full text-gray-700 dark:text-gray-200">
                        <p><strong>Tec:</strong> {transcript?.technician}</p>
                        <p><strong>Equipo:</strong> {transcript?.equipmentOrder}</p>
                    </div>
                </div>
            )}

            {/* DELETED STATE */}
            {status === 'deleted' && (
                <div className="flex flex-col items-center animate-scale-in">
                    <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 mb-2">
                        <Trash2 size={40} />
                    </div>
                    <h4 className="text-lg font-bold text-red-700 dark:text-red-400">¡Eliminado!</h4>
                    <p className="text-xs text-gray-500 mt-2">Se borró el registro correctamente.</p>
                </div>
            )}

            {/* SPEAKING / RESPONSE STATE (Consult) */}
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

            {/* ERROR STATE */}
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
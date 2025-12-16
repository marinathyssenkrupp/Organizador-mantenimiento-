import React, { useState, useRef } from 'react';
import { Mic, Square, Play, Trash2, AlertCircle } from 'lucide-react';

interface AudioRecorderProps {
  onAudioSaved: (base64Audio: string | undefined) => void;
  initialAudio?: string;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onAudioSaved, initialAudio }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | undefined>(initialAudio);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64 = reader.result as string;
          setAudioUrl(base64);
          onAudioSaved(base64);
        };
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("No se pudo acceder al micrófono. Por favor verifica los permisos.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const deleteRecording = () => {
    setAudioUrl(undefined);
    onAudioSaved(undefined);
  };

  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
      <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Nota de Audio (Detalles)</label>
      
      <div className="flex items-center gap-3">
        {!audioUrl && !isRecording && (
          <button
            type="button"
            onClick={startRecording}
            className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-sm font-medium transition-colors"
          >
            <Mic size={16} />
            Grabar Audio
          </button>
        )}

        {isRecording && (
          <button
            type="button"
            onClick={stopRecording}
            className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg text-sm font-medium animate-pulse transition-colors"
          >
            <Square size={16} fill="currentColor" />
            Detener Grabación
          </button>
        )}

        {audioUrl && (
          <div className="flex items-center gap-2 w-full">
            <audio src={audioUrl} controls className="h-8 w-full max-w-[200px]" />
            <button
              type="button"
              onClick={deleteRecording}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
              title="Eliminar audio"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>
      {isRecording && <p className="text-xs text-red-500 mt-2 flex items-center gap-1"><span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span> Grabando...</p>}
    </div>
  );
};
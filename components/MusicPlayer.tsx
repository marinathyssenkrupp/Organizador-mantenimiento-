import React, { useState } from 'react';
import { Minimize2, Maximize2, X, Music, Disc, SkipForward, SkipBack } from 'lucide-react';

// Estaciones de SoundCloud (Playlists oficiales y estables)
const STATIONS = [
  { 
    name: 'Lofi Girl Study', 
    genre: 'Relajación / Trabajo', 
    // Playlist: Lofi Girl Favorites
    id: '1297573672',
    color: 'from-orange-500 to-red-600'
  },
  { 
    name: 'Deep Focus', 
    genre: 'Concentración', 
    // Playlist: Focus at Work
    id: '1195653697',
    color: 'from-blue-500 to-indigo-600'
  },
  { 
    name: 'Jazz Vibes', 
    genre: 'Clásicos', 
    // Playlist: Jazz Vibes
    id: '346263595',
    color: 'from-yellow-600 to-amber-700'
  },
  { 
    name: 'Synthwave Mix', 
    genre: 'Energía Retro', 
    // Playlist: Synthwave Mix
    id: '1252601971',
    color: 'from-pink-500 to-purple-600'
  }
];

interface MusicPlayerProps {
    isOpen: boolean;
    onClose: () => void;
}

export const MusicPlayer: React.FC<MusicPlayerProps> = ({ isOpen, onClose }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const currentStation = STATIONS[currentIndex];

  const nextStation = () => {
      setIsLoading(true);
      setCurrentIndex((prev) => (prev + 1) % STATIONS.length);
  };

  const prevStation = () => {
      setIsLoading(true);
      setCurrentIndex((prev) => (prev - 1 + STATIONS.length) % STATIONS.length);
  };

  if (!isOpen) return null;

  // --- MODO MINIMIZADO (Estilo Winamp - Barra Superior) ---
  if (isMinimized) {
      return (
        <div className="fixed top-20 right-4 z-50 animate-scale-in">
            <div className={`bg-gray-900 border border-gray-600 rounded-md shadow-2xl flex items-center p-1 gap-2 w-64 overflow-hidden`}>
                {/* Visualizer simulado */}
                <div className="h-6 w-1 bg-green-500 animate-[pulse_0.8s_infinite]"></div>
                <div className="h-4 w-1 bg-green-500 animate-[pulse_1.2s_infinite]"></div>
                <div className="h-8 w-1 bg-green-500 animate-[pulse_0.5s_infinite]"></div>

                <div className="flex-1 flex flex-col justify-center overflow-hidden px-1">
                    <span className="text-[10px] text-green-400 font-mono uppercase truncate">
                        {currentIndex + 1}. {currentStation.name}
                    </span>
                    <span className="text-[8px] text-gray-400 font-mono">
                        00:00 / ∞
                    </span>
                </div>

                <div className="flex gap-1">
                    <button 
                        onClick={() => setIsMinimized(false)}
                        className="p-1 hover:bg-gray-700 rounded text-gray-300 hover:text-white transition-colors"
                        title="Restaurar"
                    >
                        <Maximize2 size={12} />
                    </button>
                    <button 
                        onClick={onClose}
                        className="p-1 hover:bg-red-900 rounded text-gray-300 hover:text-red-400 transition-colors"
                        title="Cerrar"
                    >
                        <X size={12} />
                    </button>
                </div>
            </div>
        </div>
      );
  }

  // --- MODO EXPANDIDO (Tarjeta Flotante Inferior) ---
  return (
    <div className="fixed bottom-24 right-6 z-50 animate-slide-up origin-bottom-right">
      <div className="bg-black rounded-xl shadow-2xl border border-gray-800 w-80 overflow-hidden flex flex-col">
        
        {/* Header Compacto */}
        <div className={`bg-gradient-to-r ${currentStation.color} p-3 flex justify-between items-center text-white`}>
            <div className="flex items-center gap-2 overflow-hidden">
                <Disc size={18} className={isLoading ? "animate-spin" : ""} />
                <div className="flex flex-col">
                    <span className="font-bold text-sm truncate w-32">{currentStation.name}</span>
                    <span className="text-[10px] opacity-80">{currentStation.genre}</span>
                </div>
            </div>
            <div className="flex gap-1">
                 <button onClick={prevStation} className="p-1.5 hover:bg-black/20 rounded-full" title="Anterior">
                    <SkipBack size={16} fill="currentColor" />
                </button>
                <button onClick={nextStation} className="p-1.5 hover:bg-black/20 rounded-full" title="Siguiente">
                    <SkipForward size={16} fill="currentColor" />
                </button>
                <div className="w-px h-4 bg-white/30 mx-1 self-center"></div>
                <button onClick={() => setIsMinimized(true)} className="p-1.5 hover:bg-black/20 rounded-full" title="Minimizar">
                    <Minimize2 size={16} />
                </button>
                <button onClick={onClose} className="p-1.5 hover:bg-black/20 rounded-full" title="Cerrar">
                    <X size={16} />
                </button>
            </div>
        </div>

        {/* Iframe de SoundCloud (Motor Robusto) */}
        <div className="relative h-40 bg-gray-900">
             {isLoading && (
                 <div className="absolute inset-0 flex items-center justify-center z-0 text-gray-500 gap-2">
                     <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-500 border-t-white"></div>
                     <span className="text-xs">Cargando...</span>
                 </div>
             )}
             
             {/* Key cambia para forzar recarga limpia al cambiar estación */}
             <iframe
                key={currentStation.id}
                width="100%"
                height="100%"
                scrolling="no"
                frameBorder="no"
                allow="autoplay"
                src={`https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/playlists/${currentStation.id}&color=%23ff5500&auto_play=true&hide_related=false&show_comments=false&show_user=false&show_reposts=false&show_teaser=true&visual=true`}
                onLoad={() => setIsLoading(false)}
                className="relative z-10"
                title="Music Player"
             ></iframe>
        </div>
        
        <div className="bg-gray-900 p-1 text-center">
             <p className="text-[9px] text-gray-500">Conexión estable vía SoundCloud</p>
        </div>
      </div>
    </div>
  );
};
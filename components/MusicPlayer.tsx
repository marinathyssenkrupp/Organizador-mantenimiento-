import React, { useState, useEffect, useRef } from 'react';
import { Music, Play, Pause, SkipForward, SkipBack, Minimize2, X, Radio, Volume2, Volume1, Wifi } from 'lucide-react';

// High Quality, Direct Stream URLs (Reliable & Free for web players)
const STATIONS = [
  { 
    name: 'Groove Salad', 
    genre: 'Ambient / Downtempo', 
    url: 'https://ice1.somafm.com/groovesalad-128-mp3',
    color: 'from-green-500 to-teal-600'
  },
  { 
    name: 'Radio Paradise', 
    genre: 'Rock / Pop Mix', 
    url: 'https://stream.radioparadise.com/main-128',
    color: 'from-blue-500 to-indigo-600'
  },
  { 
    name: 'Lofi Hip Hop', 
    genre: 'Beats to Relax', 
    url: 'https://stream.zeno.fm/0r0xa75dcc9uv', // Zeno FM Lofi Stream
    color: 'from-pink-500 to-purple-600'
  },
  { 
    name: 'Venice Classic', 
    genre: 'Música Clásica', 
    url: 'https://uk2.internet-radio.com/proxy/veniceclassic?mp=/stream;',
    color: 'from-yellow-600 to-orange-700'
  },
  { 
    name: 'Deep Space One', 
    genre: 'Espacial / Drone', 
    url: 'https://ice1.somafm.com/deepspaceone-128-mp3',
    color: 'from-slate-700 to-gray-900'
  }
];

interface MusicPlayerProps {
    isOpen: boolean;
    onClose: () => void;
}

export const MusicPlayer: React.FC<MusicPlayerProps> = ({ isOpen, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentStationIndex, setCurrentStationIndex] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentStation = STATIONS[currentStationIndex];

  // Initialize Audio Object
  useEffect(() => {
    if (!audioRef.current) {
        audioRef.current = new Audio();
        audioRef.current.crossOrigin = "anonymous";
    }

    const audio = audioRef.current;

    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => {
        setIsLoading(false); 
        setError(false);
        if (isPlaying) audio.play().catch(e => console.error("Play error:", e));
    };
    const handleError = () => {
        setIsLoading(false);
        setError(true);
        setIsPlaying(false);
    };

    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);

    return () => {
        audio.removeEventListener('waiting', handleWaiting);
        audio.removeEventListener('canplay', handleCanPlay);
        audio.removeEventListener('error', handleError);
    };
  }, []);

  // Handle Station Change
  useEffect(() => {
    if (audioRef.current) {
        // Pause current
        audioRef.current.pause();
        // Change src
        audioRef.current.src = currentStation.url;
        audioRef.current.load();
        
        if (isPlaying) {
            setIsLoading(true);
            audioRef.current.play().catch(e => {
                console.error("Autoplay prevented:", e);
                setIsPlaying(false);
            });
        }
    }
  }, [currentStationIndex]);

  // Handle Play/Pause Toggle logic
  useEffect(() => {
      if (audioRef.current) {
          if (isPlaying) {
              if (audioRef.current.src !== currentStation.url) {
                  audioRef.current.src = currentStation.url;
              }
              audioRef.current.play().catch(() => setIsPlaying(false));
          } else {
              audioRef.current.pause();
          }
      }
  }, [isPlaying]);

  // Handle Volume
  useEffect(() => {
      if (audioRef.current) {
          audioRef.current.volume = volume;
      }
  }, [volume]);

  // Cleanup on unmount (or app close)
  useEffect(() => {
      return () => {
          if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current = null;
          }
      };
  }, []);


  const togglePlay = () => setIsPlaying(!isPlaying);

  const nextStation = () => {
      let next = currentStationIndex + 1;
      if (next >= STATIONS.length) next = 0;
      setCurrentStationIndex(next);
      setIsPlaying(true);
  };

  const prevStation = () => {
      let prev = currentStationIndex - 1;
      if (prev < 0) prev = STATIONS.length - 1;
      setCurrentStationIndex(prev);
      setIsPlaying(true);
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed right-6 z-50 transition-all duration-500 ease-in-out shadow-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden ${isMinimized ? 'bottom-24 w-16 h-16 rounded-full' : 'bottom-24 w-80 rounded-3xl'}`}>
      
      {/* Minimized View */}
      {isMinimized && (
         <button 
            onClick={() => setIsMinimized(false)}
            className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${currentStation.color} text-white hover:brightness-110 relative group transition-all`}
         >
            {/* Close button hidden in minimized unless hovered */}
            <div 
                onClick={(e) => { e.stopPropagation(); onClose(); setIsPlaying(false); }}
                className="absolute -top-1 -right-1 bg-gray-900 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
                <X size={10} />
            </div>

            {isPlaying && (
                 <span className="absolute inset-0 rounded-full border-2 border-white/50 animate-ping"></span>
            )}
            <Music size={24} className={isPlaying ? 'animate-pulse' : ''} />
         </button>
      )}

      {/* Expanded View */}
      {!isMinimized && (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
          
          {/* Header */}
          <div className={`bg-gradient-to-r ${currentStation.color} p-4 flex justify-between items-start text-white shrink-0 relative overflow-hidden`}>
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            
            <div className="relative z-10">
                <div className="flex items-center gap-1 opacity-90">
                    <Radio size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Radio Online</span>
                </div>
            </div>

            <div className="flex gap-2 relative z-10">
                <button onClick={() => setIsMinimized(true)} className="hover:bg-white/20 p-1.5 rounded-full transition-colors backdrop-blur-sm">
                    <Minimize2 size={16} />
                </button>
                <button onClick={() => { setIsPlaying(false); onClose(); }} className="hover:bg-white/20 p-1.5 rounded-full transition-colors backdrop-blur-sm">
                    <X size={16} />
                </button>
            </div>
          </div>

          {/* Player Body */}
          <div className="p-6 flex flex-col items-center gap-5 relative">
             
             {/* Visualizer / Album Art */}
             <div className="relative w-32 h-32">
                {/* Vinyl Record Animation */}
                <div className={`w-32 h-32 rounded-full bg-gray-900 border-4 border-gray-800 shadow-xl flex items-center justify-center overflow-hidden transition-transform duration-[5000ms] ease-linear ${isPlaying && !isLoading ? 'animate-[spin_4s_linear_infinite]' : ''}`}>
                    {/* Inner Label */}
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${currentStation.color} border-2 border-white/20`}></div>
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none rounded-full"></div>
                </div>
                
                {/* Status Indicator */}
                <div className="absolute -bottom-2 -right-2 bg-white dark:bg-gray-800 rounded-full p-1.5 shadow-md">
                    {isLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-brand-500 border-t-transparent"></div>
                    ) : error ? (
                        <Wifi size={16} className="text-red-500" />
                    ) : isPlaying ? (
                        <div className="flex gap-0.5 items-end h-3">
                            <span className="w-1 bg-green-500 h-2 animate-[bounce_1s_infinite]"></span>
                            <span className="w-1 bg-green-500 h-3 animate-[bounce_1.2s_infinite]"></span>
                            <span className="w-1 bg-green-500 h-1.5 animate-[bounce_0.8s_infinite]"></span>
                        </div>
                    ) : (
                        <div className="w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                    )}
                </div>
             </div>

             {/* Metadata */}
             <div className="text-center w-full">
                 <h3 className="font-bold text-gray-800 dark:text-white text-lg truncate leading-tight">
                    {currentStation.name}
                 </h3>
                 <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-1">
                    {error ? "Error de conexión" : isLoading ? "Conectando..." : currentStation.genre}
                 </p>
             </div>

             {/* Main Controls */}
             <div className="flex items-center gap-6 w-full justify-center">
                 <button onClick={prevStation} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                    <SkipBack size={24} fill="currentColor" />
                 </button>

                 <button 
                    onClick={togglePlay}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg transform active:scale-95 ${isPlaying ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white' : 'bg-gradient-to-r ' + currentStation.color + ' text-white hover:scale-105'}`}
                 >
                    {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                 </button>

                 <button onClick={nextStation} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                    <SkipForward size={24} fill="currentColor" />
                 </button>
             </div>

             {/* Volume Slider */}
             <div className="w-full flex items-center gap-3 px-2 pt-2">
                 <button onClick={() => setVolume(v => v === 0 ? 0.5 : 0)} className="text-gray-400">
                     {volume === 0 ? <Volume2 size={16} className="opacity-50" /> : <Volume2 size={16} />}
                 </button>
                 <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.05" 
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gray-500"
                 />
             </div>

          </div>
        </div>
      )}
    </div>
  );
};
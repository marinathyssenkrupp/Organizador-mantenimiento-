
import React, { useState, useEffect } from 'react';
import { Shift } from '../types';
import { Shield, User, Moon, Sun, Clock } from 'lucide-react';

interface ShiftTickerProps {
  shifts: Shift[];
}

export const ShiftTicker: React.FC<ShiftTickerProps> = ({ shifts }) => {
  const [currentStaff, setCurrentStaff] = useState<Shift[]>([]);
  const [displayIndex, setDisplayIndex] = useState(0);
  const [timeOfDay, setTimeOfDay] = useState<'Día' | 'Noche'>('Día');

  useEffect(() => {
    // 1. Determine "Now" (Date and Shift Type)
    const updateTicker = () => {
        const now = new Date();
        const hour = now.getHours();
        
        // Define Logic: Night shift starts at 20:00 (8 PM) and ends at 08:00 (8 AM)
        // If it's between 00:00 and 08:00, we technically need the shift from the "Previous Date" usually, 
        // but for simplicity in this app context, we'll check today's date with 'Noche' tag first.
        
        let isNight = hour >= 20 || hour < 8;
        let queryDate = now.toISOString().split('T')[0];

        // If it's early morning (e.g. 2 AM), the shift usually belongs to the previous calendar day's night start.
        // However, AI parsing usually assigns the date written on the paper. 
        // We will filter strictly by today's date for simplicity unless strictly necessary.
        
        const type = isNight ? 'Noche' : 'Día';
        setTimeOfDay(type);

        // Filter shifts for TODAY and the CURRENT TYPE
        const activeShifts = shifts.filter(s => s.date === queryDate && s.shiftType === type);
        
        // Fallback: If no specific 'Day/Night' tag found, just show anyone assigned to Today
        if (activeShifts.length === 0) {
            const anyToday = shifts.filter(s => s.date === queryDate);
            setCurrentStaff(anyToday);
        } else {
            setCurrentStaff(activeShifts);
        }
    };

    updateTicker();
    const interval = setInterval(updateTicker, 60000); // Update every minute for time check
    return () => clearInterval(interval);
  }, [shifts]);

  // 2. Rotate names if multiple people are on shift
  useEffect(() => {
      if (currentStaff.length > 1) {
          const interval = setInterval(() => {
              setDisplayIndex(prev => (prev + 1) % currentStaff.length);
          }, 4000); // Rotate every 4 seconds
          return () => clearInterval(interval);
      } else {
          setDisplayIndex(0);
      }
  }, [currentStaff.length]);

  if (currentStaff.length === 0) return null;

  const activePerson = currentStaff[displayIndex];

  return (
    <div className="w-full bg-gray-900 text-white overflow-hidden shadow-md border-b border-gray-700 relative h-10 flex items-center justify-center">
       {/* Background Pulse Effect */}
       <div className={`absolute inset-0 opacity-10 ${timeOfDay === 'Noche' ? 'bg-indigo-900' : 'bg-orange-500'} animate-pulse`}></div>
       
       <div className="max-w-7xl mx-auto px-4 w-full flex items-center justify-center gap-3 relative z-10">
           
           {/* Icon based on Time */}
           <div className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${timeOfDay === 'Noche' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-orange-500/20 text-orange-300'}`}>
               {timeOfDay === 'Noche' ? <Moon size={10} /> : <Sun size={10} />}
               <span>Turno {timeOfDay}</span>
           </div>

           {/* Rotating Name */}
           <div className="flex items-center gap-2 animate-fade-in transition-all duration-500 min-w-[200px] justify-center">
                {activePerson.role === 'Supervisor' ? (
                    <div className="bg-amber-500/20 p-1 rounded-full text-amber-400">
                        <Shield size={14} />
                    </div>
                ) : (
                    <div className="bg-blue-500/20 p-1 rounded-full text-blue-400">
                        <User size={14} />
                    </div>
                )}
                
                <div className="flex flex-col leading-none">
                    <span className="text-[10px] text-gray-400 uppercase font-bold">{activePerson.role || 'En Turno'}</span>
                    <span className="text-sm font-bold text-white tracking-wide">{activePerson.name}</span>
                </div>
           </div>
       </div>
    </div>
  );
};

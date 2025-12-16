import React from 'react';
import { MaintenanceRecord, EquipmentType, Location } from '../types';
import { User, Play, FileText, ArrowUp, Zap } from 'lucide-react';

interface CalendarViewProps {
  records: MaintenanceRecord[];
  currentMonth: string; // YYYY-MM
  onPlayAudio: (audioUrl: string) => void;
  onEditRecord: (record: MaintenanceRecord) => void;
  onDayClick: (date: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ records, currentMonth, onPlayAudio, onEditRecord, onDayClick }) => {
  const [year, month] = currentMonth.split('-').map(Number);
  
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
  const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: startDay }, (_, i) => i);

  const getRecordsForDay = (day: number) => {
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `${currentMonth}-${dayStr}`;
    return records.filter(r => r.date === dateStr);
  };

  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  const getLocationColor = (location: Location) => {
    switch (location) {
      case Location.MOL_MAL_MARINO:
        return {
           bg: 'bg-blue-50 dark:bg-blue-900/30', 
           border: 'border-blue-100 dark:border-blue-800', 
           text: 'text-blue-900 dark:text-blue-200',
           label: 'bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-100'
        };
      case Location.MARINA_BOULEVARD:
        return {
           bg: 'bg-purple-50 dark:bg-purple-900/30', 
           border: 'border-purple-100 dark:border-purple-800', 
           text: 'text-purple-900 dark:text-purple-200',
           label: 'bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-100'
        };
      case Location.AMA:
        return {
           bg: 'bg-emerald-50 dark:bg-emerald-900/30', 
           border: 'border-emerald-100 dark:border-emerald-800', 
           text: 'text-emerald-900 dark:text-emerald-200',
           label: 'bg-emerald-100 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-100'
        };
      default:
        return { bg: 'bg-gray-50', border: 'border-gray-100', text: 'text-gray-900', label: 'bg-gray-200' };
    }
  };

  const getEquipmentIcon = (type: EquipmentType) => {
    return type === EquipmentType.ELEVATOR ? <ArrowUp size={10} className="text-blue-600 dark:text-blue-400" /> : <Zap size={10} className="text-orange-600 dark:text-orange-400" />;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
        {weekDays.map(d => (
          <div key={d} className="py-2 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 auto-rows-fr bg-gray-100/50 dark:bg-gray-900/50 gap-px border-l border-t border-gray-200 dark:border-gray-700">
        {/* Gap used for borders, background creates the line effect */}
        
        {blanks.map(i => (
          <div key={`blank-${i}`} className="min-h-[140px] bg-white dark:bg-gray-800 p-2 opacity-50"></div>
        ))}

        {days.map(day => {
          const dayRecords = getRecordsForDay(day);
          const hasRecords = dayRecords.length > 0;
          const dayStr = String(day).padStart(2, '0');
          const dateStr = `${currentMonth}-${dayStr}`;

          // Group records by location
          const recordsByLocation: Record<string, MaintenanceRecord[]> = {};
          dayRecords.forEach(r => {
            if (!recordsByLocation[r.location]) recordsByLocation[r.location] = [];
            recordsByLocation[r.location].push(r);
          });

          return (
            <div 
              key={day} 
              onClick={() => onDayClick(dateStr)}
              className="min-h-[140px] bg-white dark:bg-gray-800 p-1 sm:p-2 relative group cursor-pointer transition-all duration-200 hover:z-10 hover:shadow-lg hover:scale-[1.02] active:scale-95 origin-center"
            >
              <span className={`text-sm font-semibold block mb-1 transition-colors ${hasRecords ? 'text-brand-700 dark:text-brand-400' : 'text-gray-400 dark:text-gray-600 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`}>
                {day}
              </span>
              
              <div className="space-y-2">
                {Object.keys(recordsByLocation).map(loc => {
                  const items = recordsByLocation[loc];
                  const styles = getLocationColor(loc as Location);
                  
                  return (
                    <div key={loc} className="flex flex-col gap-1">
                      {/* Location Divider/Header */}
                      <div className={`text-[9px] font-bold px-1 rounded ${styles.label} bg-opacity-50 inline-block w-max`}>
                         {loc}
                      </div>
                      
                      {items.map(record => (
                        <div 
                          key={record.id} 
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditRecord(record);
                          }}
                          className={`text-[10px] sm:text-xs p-1.5 rounded border flex flex-col gap-1 shadow-sm ${styles.bg} ${styles.border} ${styles.text} hover:opacity-80 transition-opacity cursor-pointer`}
                        >
                          <div className="flex justify-between items-center font-bold pb-1 border-b border-current/10">
                              <div className="flex items-center gap-1">
                                  {getEquipmentIcon(record.equipmentType)}
                                  <span>{record.equipmentOrder}</span>
                              </div>
                              {record.audioNote && (
                                  <button 
                                      onClick={(e) => {
                                          e.stopPropagation();
                                          onPlayAudio(record.audioNote!);
                                      }}
                                      className="text-current hover:text-brand-600 dark:hover:text-brand-400 bg-white/50 dark:bg-black/20 rounded-full p-0.5"
                                      title="Reproducir nota de audio"
                                  >
                                      <Play size={10} fill="currentColor" />
                                  </button>
                              )}
                          </div>

                          <div className="flex items-center gap-1 opacity-90 truncate font-medium">
                              <User size={10} />
                              <span className="truncate">{record.technician}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
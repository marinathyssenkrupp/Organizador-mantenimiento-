import React from 'react';
import { MaintenanceRecord, EquipmentType, Location } from '../types';
import { X, Play, User, Clock, MapPin, AlignLeft, Volume2 } from 'lucide-react';

interface DayDetailModalProps {
  date: string;
  records: MaintenanceRecord[];
  onClose: () => void;
  onEdit: (record: MaintenanceRecord) => void;
  onPlayAudio: (url: string) => void;
}

export const DayDetailModal: React.FC<DayDetailModalProps> = ({ date, records, onClose, onEdit, onPlayAudio }) => {
  if (!records) return null;

  // Group by Location
  const groupedRecords: Record<string, MaintenanceRecord[]> = {};
  records.forEach(r => {
    if (!groupedRecords[r.location]) groupedRecords[r.location] = [];
    groupedRecords[r.location].push(r);
  });

  const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <>
    <style>{`
      @keyframes zoomIn {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
      }
      .animate-zoom-in {
        animation: zoomIn 0.2s ease-out forwards;
      }
    `}</style>
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm transition-opacity duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh] animate-zoom-in border border-gray-100 dark:border-gray-700">
        <div className="bg-brand-600 dark:bg-brand-800 p-4 flex justify-between items-center text-white shrink-0">
          <div>
              <h3 className="font-bold text-xl capitalize flex items-center gap-2">
                <span className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">🗓️</span>
                {formattedDate}
              </h3>
              <p className="text-brand-100 text-sm mt-1">{records.length} mantenciones registradas</p>
          </div>
          <button onClick={onClose} className="hover:bg-brand-700 dark:hover:bg-brand-900 p-2 rounded-full transition-colors bg-white/10">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-gray-50/50 dark:bg-gray-900/50">
            {Object.keys(groupedRecords).length === 0 ? (
                <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                    No hay registros para este día.
                </div>
            ) : (
                Object.values(Location).map(location => {
                    const locRecords = groupedRecords[location];
                    if (!locRecords || locRecords.length === 0) return null;

                    return (
                        <div key={location} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                            <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 border-b border-gray-200 dark:border-gray-700 font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                                <div className="p-1 bg-white dark:bg-gray-600 rounded-md shadow-sm text-brand-500">
                                    <MapPin size={16} />
                                </div>
                                {location}
                            </div>
                            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                {locRecords.map(record => (
                                    <div 
                                        key={record.id} 
                                        className="p-4 hover:bg-brand-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer group"
                                        onClick={() => onEdit(record)}
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-3">
                                                {/* Tech Avatar Placeholder */}
                                                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold text-lg shadow-sm border border-indigo-200 dark:border-indigo-700">
                                                    {record.technician.charAt(0).toUpperCase()}
                                                </div>
                                                
                                                <div>
                                                    <div className="flex items-center gap-2 font-bold text-gray-800 dark:text-gray-100">
                                                        {record.technician}
                                                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide ${
                                                            record.equipmentType === EquipmentType.ELEVATOR 
                                                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                                                            : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                                                        }`}>
                                                            {record.equipmentType === EquipmentType.ELEVATOR ? 'Ascensor' : 'Escalera'}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-2">
                                                        <span className="font-medium text-gray-700 dark:text-gray-300">{record.equipmentOrder}</span>
                                                        <span>•</span>
                                                        <span className="flex items-center gap-1"><Clock size={12} /> {record.time}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {(record.notes || record.audioNote) && (
                                            <div className="ml-12 mt-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-sm text-gray-700 dark:text-gray-300 space-y-2 border border-gray-100 dark:border-gray-700">
                                                {record.notes && (
                                                    <div className="flex gap-2">
                                                        <AlignLeft size={16} className="text-gray-400 shrink-0 mt-0.5" />
                                                        <p className="whitespace-pre-wrap leading-relaxed">{record.notes}</p>
                                                    </div>
                                                )}
                                                {record.audioNote && (
                                                    <div className="flex items-center gap-2 pt-1">
                                                        <Volume2 size={16} className="text-gray-400" />
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onPlayAudio(record.audioNote!);
                                                            }}
                                                            className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full text-xs font-medium hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-gray-600 transition-colors shadow-sm"
                                                        >
                                                            <Play size={12} fill="currentColor" /> Reproducir Nota de Voz
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        <div className="mt-2 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-xs text-brand-600 dark:text-brand-400 font-medium">Clic para editar detalles →</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })
            )}
        </div>
      </div>
    </div>
    </>
  );
};
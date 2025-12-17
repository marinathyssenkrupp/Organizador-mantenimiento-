
import React from 'react';
import { MaintenanceRecord, EquipmentType, Location, Shift } from '../types';
import { X, Play, User, Clock, MapPin, AlignLeft, Volume2, Trash2, Hash, ArrowUp, Zap, ShieldCheck } from 'lucide-react';

interface DayDetailModalProps {
  date: string;
  records: MaintenanceRecord[];
  shift?: Shift; // Optional Shift data for this day
  onClose: () => void;
  onEdit: (record: MaintenanceRecord) => void;
  onDelete: (id: string) => void;
  onPlayAudio: (url: string) => void;
}

export const DayDetailModal: React.FC<DayDetailModalProps> = ({ date, records, shift, onClose, onEdit, onDelete, onPlayAudio }) => {
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
        
        {/* Header */}
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

        {/* SHIFT BANNER - Shown if there is a shift assigned */}
        {shift && (
             <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 px-6 py-3 flex items-center gap-3">
                 <div className="bg-amber-100 dark:bg-amber-900/50 p-2 rounded-full text-amber-600 dark:text-amber-400">
                     <ShieldCheck size={20} />
                 </div>
                 <div>
                     <p className="text-xs text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">Turno Asignado</p>
                     <p className="text-lg font-bold text-gray-800 dark:text-white">{shift.name}</p>
                 </div>
             </div>
        )}

        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-8 bg-gray-50/50 dark:bg-gray-900/50">
            {Object.keys(groupedRecords).length === 0 ? (
                <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                    No hay registros de mantención para este día.
                </div>
            ) : (
                Object.values(Location).map(location => {
                    const locRecords = groupedRecords[location];
                    if (!locRecords || locRecords.length === 0) return null;

                    // Sort records: First by Sector Name, then by Time
                    const sortedLocRecords = [...locRecords].sort((a, b) => {
                        const sectorA = (a.sector || '').toLowerCase();
                        const sectorB = (b.sector || '').toLowerCase();
                        if (sectorA < sectorB) return -1;
                        if (sectorA > sectorB) return 1;
                        return a.time.localeCompare(b.time);
                    });

                    return (
                        <div key={location} className="space-y-3">
                            {/* Location Header */}
                            <div className="flex items-center gap-2 pb-2 border-b-2 border-brand-100 dark:border-gray-700">
                                <div className="p-1.5 bg-brand-100 dark:bg-brand-900 rounded-md text-brand-600 dark:text-brand-300">
                                    <MapPin size={18} />
                                </div>
                                <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100">{location}</h4>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {sortedLocRecords.map(record => {
                                    const isElevator = record.equipmentType === EquipmentType.ELEVATOR;
                                    
                                    return (
                                        <div 
                                            key={record.id} 
                                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 group relative"
                                            onClick={() => onEdit(record)}
                                        >
                                            <div className="p-4">
                                                {/* HEADER ROW: Sector & Delete Button (No Overlap) */}
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="flex-1 pr-3">
                                                        <h5 className="text-lg font-black text-gray-800 dark:text-white leading-tight">
                                                            {record.sector || 'Sector General'}
                                                        </h5>
                                                        <div className="flex items-center gap-2 mt-1.5">
                                                            {isElevator ? (
                                                                <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                                                                    <ArrowUp size={10} /> Ascensor
                                                                </span>
                                                            ) : (
                                                                <span className="bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold border border-orange-200 dark:border-orange-800 flex items-center gap-1">
                                                                    <Zap size={10} /> Escalera
                                                                </span>
                                                            )}
                                                            <div className="text-xs text-gray-400 flex items-center">
                                                                <Clock size={12} className="inline mr-1" />
                                                                {record.time}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Delete Button - Fixed Position */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onDelete(record.id);
                                                        }}
                                                        className="p-2 bg-gray-50 dark:bg-gray-700 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/40 rounded-lg transition-colors border border-gray-100 dark:border-gray-600 shrink-0"
                                                        title="Eliminar registro"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>

                                                {/* BODY ROW: Detailed Info Box */}
                                                <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-3 border border-gray-100 dark:border-gray-700/50 flex items-center justify-between">
                                                    {/* Equipment Info */}
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-white dark:bg-gray-800 p-2 rounded-md border border-gray-200 dark:border-gray-600 text-gray-500 shadow-sm">
                                                            <Hash size={18} />
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] uppercase text-gray-400 font-bold block mb-0.5">Equipos Realizados</span>
                                                            <span className="text-base font-black text-gray-800 dark:text-gray-200 tracking-tight">
                                                                {record.equipmentOrder}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Technician Info */}
                                                    <div className="flex items-center gap-3 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
                                                         <div className="text-right">
                                                            <span className="text-[10px] uppercase text-gray-400 font-bold block mb-0.5">Técnico</span>
                                                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 block max-w-[100px] truncate">
                                                                {record.technician}
                                                            </span>
                                                         </div>
                                                         <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-sm border-2 border-white dark:border-gray-800 shadow-sm">
                                                            {record.technician.charAt(0)}
                                                         </div>
                                                    </div>
                                                </div>

                                                {/* FOOTER ROW: Notes */}
                                                {(record.notes || record.audioNote) && (
                                                    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/50">
                                                        {record.notes && (
                                                            <div className="flex gap-2 mb-2">
                                                                <AlignLeft size={16} className="text-gray-400 shrink-0 mt-0.5" />
                                                                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed w-full">
                                                                    {record.notes}
                                                                </p>
                                                            </div>
                                                        )}
                                                        {record.audioNote && (
                                                            <button 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onPlayAudio(record.audioNote!);
                                                                }}
                                                                className="flex items-center gap-2 w-full px-3 py-2 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                                                            >
                                                                <Play size={14} fill="currentColor" /> Escuchar Nota de Voz
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })
            )}
        </div>
        
        {/* Footer Hint */}
        <div className="p-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-center text-xs text-gray-400">
            Haz clic en una tarjeta para editar los detalles.
        </div>
      </div>
    </div>
    </>
  );
};

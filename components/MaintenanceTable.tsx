import React from 'react';
import { MaintenanceRecord, EquipmentType } from '../types';
import { Trash2, User, Clock, Hash, Calendar, Volume2, Edit2, Map } from 'lucide-react';

interface MaintenanceTableProps {
  records: MaintenanceRecord[];
  type: EquipmentType;
  onDelete: (id: string) => void;
  onPlayAudio: (audioUrl: string) => void;
  onEdit: (record: MaintenanceRecord) => void;
}

export const MaintenanceTable: React.FC<MaintenanceTableProps> = ({ records, type, onDelete, onPlayAudio, onEdit }) => {
  const filteredRecords = records.filter(r => r.equipmentType === type);

  if (filteredRecords.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
        <p className="text-gray-400 dark:text-gray-500 italic">No hay registros de {type.toLowerCase()} para este mes y ubicación.</p>
      </div>
    );
  }

  // Sort by Date then Time
  const sortedRecords = [...filteredRecords].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time}`);
    const dateB = new Date(`${b.date}T${b.time}`);
    return dateA.getTime() - dateB.getTime();
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 className="font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
            {type === EquipmentType.ELEVATOR ? "🛗" : "🪜"} {type}
            <span className="bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-200 text-xs px-2 py-0.5 rounded-full ml-2">
                {sortedRecords.length}
            </span>
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
            <tr>
              <th className="px-6 py-3 font-medium"><div className="flex items-center gap-1"><Calendar size={14}/> Fecha</div></th>
              <th className="px-6 py-3 font-medium"><div className="flex items-center gap-1"><Clock size={14}/> Hora</div></th>
              <th className="px-6 py-3 font-medium"><div className="flex items-center gap-1"><Map size={14}/> Sector</div></th>
              <th className="px-6 py-3 font-medium"><div className="flex items-center gap-1"><Hash size={14}/> Equipo(s)</div></th>
              <th className="px-6 py-3 font-medium"><div className="flex items-center gap-1"><User size={14}/> Técnico</div></th>
              <th className="px-6 py-3 font-medium">Nota</th>
              <th className="px-6 py-3 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {sortedRecords.map((record) => (
              <tr key={record.id} className="hover:bg-brand-50 dark:hover:bg-gray-700 transition-colors group">
                <td className="px-6 py-3 font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                  {new Date(record.date).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </td>
                <td className="px-6 py-3 text-gray-600 dark:text-gray-300">{record.time}</td>
                <td className="px-6 py-3 text-gray-600 dark:text-gray-300 capitalize">
                    {record.sector || <span className="text-gray-300 dark:text-gray-600">-</span>}
                </td>
                <td className="px-6 py-3">
                  <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 text-xs font-semibold px-2.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                    {record.equipmentOrder}
                  </span>
                </td>
                <td className="px-6 py-3 text-gray-700 dark:text-gray-300 capitalize">{record.technician}</td>
                <td className="px-6 py-3 text-gray-700 dark:text-gray-300">
                  <div className="flex items-center gap-2">
                    {record.audioNote && (
                      <button 
                        onClick={() => onPlayAudio(record.audioNote!)}
                        className="text-brand-600 hover:text-brand-800 dark:text-brand-400 dark:hover:text-brand-300 p-1 bg-brand-50 dark:bg-brand-900 rounded-full"
                        title="Reproducir audio"
                      >
                        <Volume2 size={16} />
                      </button>
                    )}
                    {record.notes && <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[100px]">{record.notes}</span>}
                  </div>
                </td>
                <td className="px-6 py-3 text-right flex justify-end gap-2">
                  <button
                    onClick={() => onEdit(record)}
                    className="text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-all p-1"
                    title="Editar registro"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(record.id)}
                    className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-all p-1"
                    title="Eliminar registro"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
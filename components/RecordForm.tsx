import React, { useState, useEffect } from 'react';
import { MaintenanceRecord, Location, EquipmentType } from '../types';
import { Plus, Save, X, Edit2, ChevronDown } from 'lucide-react';
import { AudioRecorder } from './AudioRecorder';

interface RecordFormProps {
  onSave: (record: MaintenanceRecord) => void;
  onCancel: () => void;
  initialDate?: string;
  initialData?: MaintenanceRecord | null;
}

// Predefined Data Constants
const PREDEFINED_TECHNICIANS = [
  "Jose Krause",
  "Javier Silva",
  "Italo Sanhueza",
  "Diego Vargas",
  "Victor Jaramillo",
  "Victor Gonzalez",
  "Jorge Letelier",
  "Cristian Guerrero",
  "Julio Perez"
];

const EQUIPMENT_BY_LOCATION: Record<string, string[]> = {
  [Location.MOL_MAL_MARINO]: [
    "París",
    "Ripley",
    "Torre Marina",
    "Ascensor Panorámico"
  ],
  [Location.MARINA_BOULEVARD]: [
    "Torre Boulevard",
    "Estacionamiento",
    "Pasarela",
    "Ascensor Pasarela",
    "Montacarga Boulevard"
  ],
  [Location.AMA]: [
    "Torre AMA",
    "Ascensor HJM",
    "Ascensor Estacionamiento AMA",
    "Montacargas de AMA"
  ]
};

export const RecordForm: React.FC<RecordFormProps> = ({ onSave, onCancel, initialDate, initialData }) => {
  const [formData, setFormData] = useState<Partial<MaintenanceRecord>>({
    id: crypto.randomUUID(),
    date: initialDate || new Date().toISOString().split('T')[0],
    time: '09:00',
    location: Location.MOL_MAL_MARINO,
    equipmentType: EquipmentType.ELEVATOR,
    technician: '',
    equipmentOrder: '',
    notes: '',
    audioNote: undefined
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.technician && formData.equipmentOrder && formData.date && formData.time) {
      onSave(formData as MaintenanceRecord);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAudioSaved = (base64Audio: string | undefined) => {
    setFormData(prev => ({ ...prev, audioNote: base64Audio }));
  };

  // Get relevant equipment list based on selected location
  const currentEquipmentList = formData.location ? (EQUIPMENT_BY_LOCATION[formData.location] || []) : [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-brand-600 dark:bg-brand-800 p-4 flex justify-between items-center text-white shrink-0">
          <h3 className="font-bold text-lg flex items-center gap-2">
            {initialData ? <Edit2 size={20} /> : <Plus size={20} />} 
            {initialData ? 'Editar Mantención' : 'Nueva Mantención'}
          </h3>
          <button onClick={onCancel} className="hover:bg-brand-700 dark:hover:bg-brand-900 p-1 rounded transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Fecha</label>
              <input
                type="date"
                name="date"
                required
                value={formData.date}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-2 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Hora</label>
              <input
                type="time"
                name="time"
                required
                value={formData.time}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-2 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Ubicación</label>
            <div className="relative">
              <select
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-2 appearance-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              >
                {Object.values(Location).map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-3 text-gray-500 pointer-events-none" size={16} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Tipo de Equipo</label>
            <div className="flex gap-4">
              {Object.values(EquipmentType).map(type => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="equipmentType"
                    value={type}
                    checked={formData.equipmentType === type}
                    onChange={handleChange}
                    className="text-brand-600 dark:text-brand-400 focus:ring-brand-500 dark:bg-gray-700"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{type}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Técnico</label>
              <input
                list="technicians-list"
                type="text"
                name="technician"
                required
                placeholder="Seleccionar o escribir..."
                value={formData.technician}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-2 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
              <datalist id="technicians-list">
                {PREDEFINED_TECHNICIANS.map((tech) => (
                  <option key={tech} value={tech} />
                ))}
              </datalist>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Orden / ID Equipo</label>
              <input
                list="equipment-list"
                type="text"
                name="equipmentOrder"
                required
                placeholder="Seleccionar o escribir..."
                value={formData.equipmentOrder}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-2 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
              <datalist id="equipment-list">
                {currentEquipmentList.map((eq) => (
                  <option key={eq} value={eq} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
             <AudioRecorder onAudioSaved={handleAudioSaved} initialAudio={formData.audioNote} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Nota de Texto (Opcional)</label>
            <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Detalles adicionales, observaciones..."
                rows={2}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-2 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-brand-600 hover:bg-brand-700 dark:bg-brand-700 dark:hover:bg-brand-600 text-white rounded-lg shadow-md transition-colors flex items-center gap-2 font-medium"
            >
              <Save size={18} /> {initialData ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
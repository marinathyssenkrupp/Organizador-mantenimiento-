import React, { useState, useEffect } from 'react';
import { MaintenanceRecord, Location, EquipmentType } from '../types';
import { Plus, Save, X, Edit2, Check } from 'lucide-react';
import { AudioRecorder } from './AudioRecorder';

interface RecordFormProps {
  onSave: (record: MaintenanceRecord) => void;
  onCancel: () => void;
  initialDate?: string;
  initialData?: MaintenanceRecord | null;
}

// Predefined Data Constants
// Updated list based on user request (sorted alphabetically)
const PREDEFINED_TECHNICIANS = [
  "Cristian Guerrero",
  "Diego Vargas",
  "Francisca Chimuelo",
  "Italo Sanhueza",
  "Javier Silva",
  "Jonathan Labbé",
  "Jorge Letelier",
  "José Krause",
  "Julio Pérez",
  "Víctor González",
  "Víctor Jaramillo"
];

// Specific Sectors for Elevators
const ELEVATOR_SECTORS: Record<Location, string[]> = {
  [Location.MOL_MAL_MARINO]: [
    "Ripley",
    "París",
    "Panorámico",
    "Cine",
    "Torre Marina",
    "Montacargas 14 Norte",
    "Montacargas 15 Norte"
  ],
  [Location.MARINA_BOULEVARD]: [
    "Torre Boulevard",
    "Estacionamientos Otis",
    "Montacargas Boulevard",
    "Pasarela Boulevard"
  ],
  [Location.AMA]: [
    "Torre Ama",
    "Ascensores H&M",
    "Montacargas Ama",
    "Estacionamientos Torre Ama",
    "Ascensores Jumbo"
  ]
};

// Specific Sectors for Escalators
const ESCALATOR_SECTORS: Record<Location, string[]> = {
  [Location.MOL_MAL_MARINO]: [
    "Ripley",
    "París",
    "Cine",
    "Gimnasio",
    "Sector Patio Comida",
    "Sector Cruz Verde"
  ],
  [Location.MARINA_BOULEVARD]: [
    "Primer Piso",
    "Segundo Piso",
    "Tercer Piso",
    "Pasarelas"
  ],
  [Location.AMA]: [
    "Rampas",
    "Escaleras Mecánicas",
    "Sector Jumbo"
  ]
};

export const RecordForm: React.FC<RecordFormProps> = ({ onSave, onCancel, initialDate, initialData }) => {
  const [formData, setFormData] = useState<Partial<MaintenanceRecord>>({
    id: crypto.randomUUID(),
    date: initialDate || new Date().toISOString().split('T')[0],
    time: '09:00',
    location: Location.MOL_MAL_MARINO,
    sector: '',
    equipmentType: EquipmentType.ELEVATOR,
    technician: '',
    equipmentOrder: '', // Will store "1, 2, 3"
    notes: '',
    audioNote: undefined
  });

  const [selectedNumbers, setSelectedNumbers] = useState<string[]>([]);

  // Calculate limits based on selected type
  const isElevator = formData.equipmentType === EquipmentType.ELEVATOR;
  const maxNumber = isElevator ? 4 : 22;
  const equipmentNumbers = Array.from({ length: maxNumber }, (_, i) => (i + 1).toString());

  // Determine available sectors based on current selection (Location AND Type)
  const availableSectors = formData.location
      ? (isElevator 
          ? ELEVATOR_SECTORS[formData.location as Location] 
          : ESCALATOR_SECTORS[formData.location as Location])
      : [];

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      // Parse existing equipment order into selected numbers if they are numbers
      if (initialData.equipmentOrder) {
          // Extract numbers from string like "1, 2, 3" or "Nº 1, 2"
          const matches = initialData.equipmentOrder.match(/\d+/g);
          if (matches) {
              // Filter out numbers that exceed the current limit (just in case type changed)
              const validMatches = matches.filter(n => parseInt(n) <= maxNumber);
              setSelectedNumbers(validMatches);
          }
      }
    }
  }, [initialData]);

  // Update formData.equipmentOrder whenever selection changes
  useEffect(() => {
    if (selectedNumbers.length > 0) {
        // Sort numbers numerically
        const sorted = [...selectedNumbers].sort((a, b) => parseInt(a) - parseInt(b));
        setFormData(prev => ({ ...prev, equipmentOrder: sorted.join(', ') }));
    } else {
        setFormData(prev => ({ ...prev, equipmentOrder: '' }));
    }
  }, [selectedNumbers]);

  const toggleNumber = (num: string) => {
    setSelectedNumbers(prev => {
        if (prev.includes(num)) {
            return prev.filter(n => n !== num);
        } else {
            return [...prev, num];
        }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.technician && formData.equipmentOrder && formData.date && formData.time) {
      onSave(formData as MaintenanceRecord);
    } else {
        alert("Por favor selecciona un Técnico y al menos un Equipo.");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newType = e.target.value as EquipmentType;
      // Reset selection when type changes to avoid invalid numbers (e.g. Elevator 20)
      setSelectedNumbers([]);
      setFormData(prev => ({ 
          ...prev, 
          equipmentType: newType, 
          equipmentOrder: '',
          sector: '' // Reset sector when type changes to avoid mismatch
      }));
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newLocation = e.target.value as Location;
      setFormData(prev => ({ 
          ...prev, 
          location: newLocation,
          sector: '' // Reset sector when location changes
      }));
  };

  const handleAudioSaved = (base64Audio: string | undefined) => {
    setFormData(prev => ({ ...prev, audioNote: base64Audio }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[95vh]">
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

          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Ubicación</label>
                <select
                    name="location"
                    value={formData.location}
                    onChange={handleLocationChange}
                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-2 focus:ring-2 focus:ring-brand-500 outline-none"
                >
                    {Object.values(Location).map(loc => (
                        <option key={loc} value={loc}>{loc}</option>
                    ))}
                </select>
            </div>
            <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Tipo</label>
                <select
                    name="equipmentType"
                    value={formData.equipmentType}
                    onChange={handleTypeChange}
                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-2 focus:ring-2 focus:ring-brand-500 outline-none"
                >
                    {Object.values(EquipmentType).map(type => (
                        <option key={type} value={type}>{type}</option>
                    ))}
                </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Sector / Detalle</label>
            {availableSectors.length > 0 ? (
                 <select
                    name="sector"
                    value={formData.sector}
                    onChange={handleChange}
                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-2 focus:ring-2 focus:ring-brand-500 outline-none"
                 >
                    <option value="">-- Seleccionar Sector --</option>
                    {availableSectors.map(s => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                 </select>
            ) : (
                <input
                type="text"
                name="sector"
                value={formData.sector || ''}
                onChange={handleChange}
                placeholder="Ej: Ala Norte, Patio de Comidas..."
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-2 focus:ring-2 focus:ring-brand-500 outline-none"
                />
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Técnico</label>
            <select
                name="technician"
                required
                value={formData.technician}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-2 focus:ring-2 focus:ring-brand-500 outline-none"
            >
                <option value="">-- Seleccionar Técnico --</option>
                {PREDEFINED_TECHNICIANS.map(t => (
                    <option key={t} value={t}>{t}</option>
                ))}
            </select>
          </div>

          <div>
             <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                 Seleccionar {isElevator ? 'Ascensores (1-4)' : 'Escaleras (1-22)'}
             </label>
             <div className={`grid gap-2 transition-all ${isElevator ? 'grid-cols-4' : 'grid-cols-6'}`}>
                {equipmentNumbers.map(num => {
                    const isSelected = selectedNumbers.includes(num);
                    return (
                        <button
                            key={num}
                            type="button"
                            onClick={() => toggleNumber(num)}
                            className={`
                                h-10 w-full rounded-lg text-sm font-bold transition-all duration-200 flex items-center justify-center relative
                                ${isSelected 
                                    ? 'bg-brand-600 text-white shadow-md transform scale-105' 
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}
                            `}
                        >
                            {num}
                            {isSelected && <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white -mt-1 -mr-1"></div>}
                        </button>
                    );
                })}
             </div>
             <p className="text-[10px] text-gray-400 mt-1">
                Seleccionados: {selectedNumbers.length > 0 ? selectedNumbers.sort((a,b) => parseInt(a)-parseInt(b)).join(', ') : 'Ninguno'}
             </p>
          </div>

          <div className="space-y-4">
             <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Notas Adicionales</label>
                <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={2}
                    placeholder="Detalles del trabajo..."
                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-2 focus:ring-2 focus:ring-brand-500 outline-none resize-none"
                />
             </div>
             
             <AudioRecorder onAudioSaved={handleAudioSaved} initialAudio={formData.audioNote} />
          </div>

        </form>
        
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 shrink-0">
            <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
                Cancelar
            </button>
            <button
                type="button"
                onClick={handleSubmit}
                className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg shadow-lg shadow-brand-200 dark:shadow-none transition-all flex items-center gap-2"
            >
                <Save size={18} />
                Guardar
            </button>
        </div>
      </div>
    </div>
  );
};

export enum Location {
  MOL_MAL_MARINO = 'Marina',
  MARINA_BOULEVARD = 'Boulevard',
  AMA = 'Ama',
}

export enum EquipmentType {
  ELEVATOR = 'Ascensor',
  ESCALATOR = 'Escalera Mecánica',
}

export interface MaintenanceRecord {
  id: string;
  technician: string;
  date: string; // ISO Date string YYYY-MM-DD
  time: string; // HH:mm
  location: Location;
  sector?: string; // New field for specific sector
  equipmentType: EquipmentType;
  equipmentOrder: string; // Identifier/Order of the equipment (Now supports multiple like "1, 2, 3")
  notes?: string;
  audioNote?: string; // Base64 string of the audio recording
}

export interface Shift {
  date: string; // YYYY-MM-DD
  name: string; // Name of the supervisor/technician
}

export interface MonthOption {
  value: string; // YYYY-MM
  label: string;
}

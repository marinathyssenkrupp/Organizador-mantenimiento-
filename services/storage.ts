
import { MaintenanceRecord, Shift } from '../types';

const STORAGE_KEY = 'maintenance_records_v1';
const SHIFTS_KEY = 'shifts_schedule_v1';

// --- Maintenance Records ---

export const getRecords = (): MaintenanceRecord[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to load records", error);
    return [];
  }
};

export const saveRecord = (record: MaintenanceRecord): MaintenanceRecord[] => {
  const records = getRecords();
  const newRecords = [...records, record];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecords));
  return newRecords;
};

export const deleteRecord = (id: string): MaintenanceRecord[] => {
  const records = getRecords();
  const newRecords = records.filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecords));
  return newRecords;
};

export const updateRecord = (updatedRecord: MaintenanceRecord): MaintenanceRecord[] => {
  const records = getRecords();
  const newRecords = records.map(r => r.id === updatedRecord.id ? updatedRecord : r);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecords));
  return newRecords;
};

// --- Shifts ---

export const getShifts = (): Shift[] => {
  try {
    const data = localStorage.getItem(SHIFTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to load shifts", error);
    return [];
  }
};

export const saveShifts = (newShifts: Shift[]): Shift[] => {
  const currentShifts = getShifts();
  
  // Merge strategies: Overwrite if date+shiftType exists, append if new
  const shiftsMap = new Map<string, Shift>();

  const getKey = (s: Shift) => `${s.date}_${s.shiftType}`;

  currentShifts.forEach(s => {
    // Migration for legacy data (missing role/shiftType)
    const safeShift: Shift = {
        date: s.date,
        name: s.name,
        role: s.role || 'Supervisor',
        shiftType: s.shiftType || 'Día'
    };
    shiftsMap.set(getKey(safeShift), safeShift);
  });

  newShifts.forEach(s => {
    shiftsMap.set(getKey(s), s);
  });
  
  const mergedShifts = Array.from(shiftsMap.values());
  
  localStorage.setItem(SHIFTS_KEY, JSON.stringify(mergedShifts));
  return mergedShifts;
};

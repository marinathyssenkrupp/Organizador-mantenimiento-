
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
  
  // Merge strategies: Overwrite if date exists, append if new
  const shiftsMap = new Map<string, string>();
  currentShifts.forEach(s => shiftsMap.set(s.date, s.name));
  newShifts.forEach(s => shiftsMap.set(s.date, s.name));
  
  const mergedShifts: Shift[] = Array.from(shiftsMap.entries()).map(([date, name]) => ({ date, name }));
  
  localStorage.setItem(SHIFTS_KEY, JSON.stringify(mergedShifts));
  return mergedShifts;
};

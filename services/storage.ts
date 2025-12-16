import { MaintenanceRecord } from '../types';

const STORAGE_KEY = 'maintenance_records_v1';

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
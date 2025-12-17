import React, { useState, useEffect, useMemo } from 'react';
import { MaintenanceRecord, Location, EquipmentType } from './types';
import { getRecords, saveRecord, deleteRecord, updateRecord } from './services/storage';
import { RecordForm } from './components/RecordForm';
import { MaintenanceTable } from './components/MaintenanceTable';
import { CalendarView } from './components/CalendarView';
import { DayDetailModal } from './components/DayDetailModal';
import { analyzeMaintenanceData } from './services/geminiService';
import { generateMonthlyPDF } from './services/pdfGenerator';
import { AnalysisModal } from './components/AnalysisModal';
import { VoiceAssistantModal } from './components/VoiceAssistantModal';
import { GuideModal } from './components/GuideModal';
import { InventoryModal } from './components/InventoryModal';
import { DeleteConfirmationModal } from './components/DeleteConfirmationModal';
import { FloatingActionMenu } from './components/FloatingActionMenu';
import { 
  PlusCircle, 
  Sparkles, 
  MapPin,
  ClipboardList,
  Table,
  Calendar as CalendarIcon,
  CalendarDays,
  Layers,
  Moon,
  Sun,
  Download,
  Share2,
  MessageCircle,
  Mail,
  FileText,
  Search,
  HelpCircle,
  Camera
} from 'lucide-react';

const App: React.FC = () => {
  // --- State ---
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [selectedLocation, setSelectedLocation] = useState<Location | 'ALL'>('ALL'); 
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MaintenanceRecord | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [activeAudio, setActiveAudio] = useState<string | null>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  
  // Theme State
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // Modal States
  const [selectedDayDetail, setSelectedDayDetail] = useState<string | null>(null);
  const [recordToDeleteId, setRecordToDeleteId] = useState<string | null>(null);

  // AI & Feature States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState("");
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  
  // Controlled via Menu
  const [isVoiceAssistantOpen, setIsVoiceAssistantOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);

  // --- Effects ---
  useEffect(() => {
    setRecords(getRecords());
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // --- Logic ---
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const recordMonth = r.date.slice(0, 7);
      const locationMatch = selectedLocation === 'ALL' || r.location === selectedLocation;
      
      // Search Filter
      const term = searchTerm.toLowerCase();
      const searchMatch = !term || 
        r.technician.toLowerCase().includes(term) ||
        r.equipmentOrder.toLowerCase().includes(term) ||
        r.location.toLowerCase().includes(term) ||
        (r.notes && r.notes.toLowerCase().includes(term));

      return recordMonth === selectedMonth && locationMatch && searchMatch;
    });
  }, [records, selectedMonth, selectedLocation, searchTerm]);

  const handleSaveRecord = (record: MaintenanceRecord) => {
    let updated;
    if (editingRecord) {
        updated = updateRecord(record);
    } else {
        updated = saveRecord(record);
    }
    setRecords(updated);
    setIsFormOpen(false);
    setEditingRecord(null);
  };
  
  const handleVoiceRecordCreated = (record: MaintenanceRecord) => {
      // Automatically save the record coming from Voice Assistant
      const updated = saveRecord(record);
      setRecords(updated);
      setIsVoiceAssistantOpen(false);
      
      if (record.date.slice(0,7) !== selectedMonth) {
          setSelectedMonth(record.date.slice(0,7));
      }
  };

  const handleVoiceRecordDeleted = (criteria: Partial<MaintenanceRecord>): boolean => {
    const targetDate = criteria.date || new Date().toISOString().split('T')[0];
    const targetEquipment = criteria.equipmentOrder?.toLowerCase() || '';
    
    const recordToDelete = records.find(r => {
        const dateMatch = r.date === targetDate;
        // Simple fuzzy match for equipment name
        const eqMatch = targetEquipment ? r.equipmentOrder.toLowerCase().includes(targetEquipment) : false;
        
        return dateMatch && eqMatch;
    });

    if (recordToDelete) {
        const updated = deleteRecord(recordToDelete.id);
        setRecords(updated);
        return true;
    }
    return false;
  };

  // Triggered when clicking Trash icon
  const handleDeleteRequest = (id: string) => {
    setRecordToDeleteId(id);
  };

  // Triggered when confirming inside DeleteConfirmationModal
  const executeDelete = () => {
    if (recordToDeleteId) {
        const updated = deleteRecord(recordToDeleteId);
        setRecords(updated);
        
        // If we were editing this exact record, close the form
        if (editingRecord?.id === recordToDeleteId) {
            setIsFormOpen(false);
            setEditingRecord(null);
        }
        setRecordToDeleteId(null);
    }
  };

  const handleEdit = (record: MaintenanceRecord) => {
    setEditingRecord(record);
    setIsFormOpen(true);
    setSelectedDayDetail(null); // Close detail modal if open to focus on edit
  };

  const handleAnalyze = async () => {
    if (filteredRecords.length === 0) {
      alert("No hay datos para analizar en este mes.");
      return;
    }
    
    setIsAnalysisModalOpen(true);
    setIsAnalyzing(true);
    setAnalysisResult("");

    const monthLabel = new Date(selectedMonth + "-01").toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
    const locationLabel = selectedLocation === 'ALL' ? "Todas las Ubicaciones" : selectedLocation;
    
    const result = await analyzeMaintenanceData(filteredRecords, monthLabel, locationLabel);
    setAnalysisResult(result);
    setIsAnalyzing(false);
  };

  const playAudio = (audioUrl: string) => {
    const audio = new Audio(audioUrl);
    audio.play();
  };

  // --- Export & Share Logic ---

  const exportToCSV = () => {
    if (filteredRecords.length === 0) {
      alert("No hay registros para exportar en este mes.");
      return;
    }

    // CSV Headers
    const headers = ["Fecha", "Hora", "Ubicación", "Tipo", "Equipo", "Técnico", "Notas"];
    
    // CSV Rows
    const rows = filteredRecords.map(r => [
      r.date,
      r.time,
      r.location,
      r.equipmentType,
      `"${r.equipmentOrder}"`, // Quote to handle commas in text
      r.technician,
      `"${(r.notes || '').replace(/"/g, '""')}"` // Escape quotes in notes
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");

    // Add BOM for Excel UTF-8 compatibility
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `mantenciones_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowShareMenu(false);
  };

  const exportToPDF = () => {
    if (filteredRecords.length === 0) {
      alert("No hay registros para exportar en este mes.");
      return;
    }
    
    const monthLabel = new Date(selectedMonth + "-01").toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
    const locationLabel = selectedLocation === 'ALL' ? "Todas las Ubicaciones" : selectedLocation;

    generateMonthlyPDF(filteredRecords, monthLabel, locationLabel);
    setShowShareMenu(false);
    
    // Optional: Prompt to save to Drive manually
    setTimeout(() => {
        alert("El PDF se ha descargado. Por favor, arrástralo a tu carpeta de Google Drive para guardarlo en la nube.");
    }, 1000);
  };

  const shareViaWhatsApp = () => {
    if (filteredRecords.length === 0) {
      alert("No hay registros para compartir.");
      return;
    }
    const elevators = filteredRecords.filter(r => r.equipmentType === EquipmentType.ELEVATOR).length;
    const escalators = filteredRecords.filter(r => r.equipmentType === EquipmentType.ESCALATOR).length;
    
    const text = `*Reporte de Mantenciones - ${selectedMonth}*\n\n` +
                 `📍 Ubicación: ${selectedLocation === 'ALL' ? 'Todas' : selectedLocation}\n` +
                 `🛗 Ascensores: ${elevators}\n` +
                 `🪜 Escaleras: ${escalators}\n` +
                 `✅ Total Registros: ${filteredRecords.length}\n\n` +
                 `Enviado desde Gestor de Mantenciones.`;
                 
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    setShowShareMenu(false);
  };

  const shareViaEmail = () => {
     if (filteredRecords.length === 0) {
      alert("No hay registros para compartir.");
      return;
    }
    const subject = `Reporte de Mantenciones ${selectedMonth}`;
    const body = `Adjunto resumen de mantenciones para el mes ${selectedMonth}.\n\n` +
                 `Ubicación: ${selectedLocation === 'ALL' ? 'Todas' : selectedLocation}\n` +
                 `Total Registros: ${filteredRecords.length}`;
    
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setShowShareMenu(false);
  };


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col font-sans transition-colors duration-200 relative">
      
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-brand-600 dark:bg-brand-700 text-white p-2 rounded-lg">
              <ClipboardList size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight hidden sm:block">Gestor de Mantenciones</h1>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight sm:hidden">Gestor</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">Planilla de Control Vertical</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
             <button
              onClick={() => setIsInventoryOpen(true)}
              className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Escanear Inventario (Foto)"
            >
              <Camera size={20} />
            </button>
            <button
              onClick={() => setIsGuideOpen(true)}
              className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Ayuda / Guía"
            >
              <HelpCircle size={20} />
            </button>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title={darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Export/Share Menu */}
            <div className="relative">
                <button 
                    onClick={() => setShowShareMenu(!showShareMenu)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                    <Share2 size={16} />
                    <span className="hidden sm:inline">Exportar</span>
                </button>
                
                {showShareMenu && (
                    <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowShareMenu(false)}></div>
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-20 py-1 animate-fade-in">
                        <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Cierre Mensual</div>
                        <button onClick={exportToPDF} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                            <FileText size={16} className="text-red-600" /> 
                            <span>Guardar PDF (Drive)</span>
                        </button>
                        <div className="my-1 border-t border-gray-100 dark:border-gray-700"></div>
                        <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Otras Opciones</div>
                        <button onClick={exportToCSV} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                            <Download size={14} /> Planilla Excel (.csv)
                        </button>
                        <button onClick={shareViaWhatsApp} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                            <MessageCircle size={14} className="text-green-600" /> WhatsApp
                        </button>
                         <button onClick={shareViaEmail} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                            <Mail size={14} className="text-blue-600" /> Correo
                        </button>
                    </div>
                    </>
                )}
            </div>

             <button
              onClick={handleAnalyze}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg border border-indigo-200 dark:border-indigo-800 transition-colors"
            >
              <Sparkles size={16} />
              Analizar
            </button>
            <button
              onClick={() => {
                  setEditingRecord(null);
                  setIsFormOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 dark:bg-brand-700 dark:hover:bg-brand-600 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
            >
              <PlusCircle size={18} />
              <span className="hidden sm:inline">Nuevo</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Controls Bar */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-8 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            {/* Month Selector */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-300">
                <CalendarDays size={20} />
                </div>
                <div className="flex flex-col">
                <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Mes de Visualización</label>
                <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="font-semibold text-gray-800 dark:text-gray-200 bg-transparent outline-none cursor-pointer"
                />
                </div>
            </div>

            <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block"></div>

            {/* Location Selector (Tabs style) */}
            <div className="flex p-1 bg-gray-100 dark:bg-gray-700 rounded-lg w-full sm:w-auto overflow-x-auto">
                <button
                    onClick={() => setSelectedLocation('ALL')}
                    className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap ${
                    selectedLocation === 'ALL'
                        ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                >
                    {selectedLocation === 'ALL' && <Layers size={14} />}
                    Todas
                </button>
                {Object.values(Location).map((loc) => (
                <button
                    key={loc}
                    onClick={() => setSelectedLocation(loc)}
                    className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap ${
                    selectedLocation === loc
                        ? 'bg-white dark:bg-gray-600 text-brand-600 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                >
                    {selectedLocation === loc && <MapPin size={14} className="animate-pulse" />}
                    {loc}
                </button>
                ))}
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Consultar técnico, equipo..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-500 outline-none transition-all"
            />
          </div>

        </div>

        {/* Dashboard View */}
        <div className="space-y-6">
          
          {/* Stats Summary & View Toggle */}
          <div className="flex flex-col md:flex-row justify-between items-end gap-4">
            <div className="flex gap-4 w-full md:w-auto">
               <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm flex-1 md:flex-none">
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase block">Ascensores</span>
                  <span className="text-xl font-bold text-gray-800 dark:text-white">
                      {filteredRecords.filter(r => r.equipmentType === EquipmentType.ELEVATOR).length}
                  </span>
               </div>
                <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm flex-1 md:flex-none">
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase block">Escaleras</span>
                  <span className="text-xl font-bold text-gray-800 dark:text-white">
                       {filteredRecords.filter(r => r.equipmentType === EquipmentType.ESCALATOR).length}
                  </span>
               </div>
            </div>

            {/* View Toggle */}
            <div className="bg-gray-100 dark:bg-gray-700 p-1 rounded-lg flex">
                <button 
                    onClick={() => setViewMode('calendar')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${
                        viewMode === 'calendar' ? 'bg-white dark:bg-gray-600 text-brand-600 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                >
                    <CalendarIcon size={16} /> Calendario
                </button>
                <button 
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${
                        viewMode === 'list' ? 'bg-white dark:bg-gray-600 text-brand-600 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                >
                    <Table size={16} /> Lista
                </button>
            </div>
          </div>

          {/* Main Content Area */}
          {viewMode === 'calendar' ? (
              <div className="animate-fade-in">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
                     <h2 className="text-lg font-bold text-gray-700 dark:text-gray-200 capitalize">
                        {new Date(selectedMonth + "-02").toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}
                     </h2>
                     <div className="flex gap-3 text-xs overflow-x-auto pb-1 sm:pb-0">
                        {Object.values(Location).map(loc => {
                            let colorClass = 'bg-gray-200';
                            if (loc === Location.MOL_MAL_MARINO) colorClass = 'bg-blue-100 border-blue-200 dark:bg-blue-900 dark:border-blue-700 text-blue-700 dark:text-blue-200';
                            if (loc === Location.MARINA_BOULEVARD) colorClass = 'bg-purple-100 border-purple-200 dark:bg-purple-900 dark:border-purple-700 text-purple-700 dark:text-purple-200';
                            if (loc === Location.AMA) colorClass = 'bg-emerald-100 border-emerald-200 dark:bg-emerald-900 dark:border-emerald-700 text-emerald-700 dark:text-emerald-200';
                            
                            return (
                                <div key={loc} className={`flex items-center gap-1 whitespace-nowrap px-2 py-1 rounded border ${colorClass}`}>
                                    <span className="w-2 h-2 rounded-full bg-current"></span>
                                    {loc}
                                </div>
                            );
                        })}
                     </div>
                  </div>
                  <CalendarView 
                      records={filteredRecords} 
                      currentMonth={selectedMonth}
                      onPlayAudio={playAudio}
                      onEditRecord={handleEdit}
                      onDayClick={(date) => {
                          const recordsForDay = filteredRecords.filter(r => r.date === date);
                          if (recordsForDay.length > 0) {
                              setSelectedDayDetail(date);
                          } else {
                              // Optional: Open form for that day
                              setEditingRecord(null);
                              // We could pass initialDate to form
                              // setIsFormOpen(true);
                          }
                      }}
                  />
              </div>
          ) : (
            <div className="space-y-8 animate-slide-up">
              <MaintenanceTable 
                records={filteredRecords} 
                type={EquipmentType.ELEVATOR} 
                onDelete={handleDeleteRequest}
                onPlayAudio={playAudio}
                onEdit={handleEdit}
              />
              <MaintenanceTable 
                records={filteredRecords} 
                type={EquipmentType.ESCALATOR} 
                onDelete={handleDeleteRequest}
                onPlayAudio={playAudio}
                onEdit={handleEdit}
              />
            </div>
          )}
        </div>
      </main>

      {/* Floating Action Menu (Unified) */}
      <FloatingActionMenu 
        onOpenVoice={() => setIsVoiceAssistantOpen(true)}
        onOpenChat={() => setIsGuideOpen(true)}
      />

      {/* Modals */}
      {isFormOpen && (
        <RecordForm 
          onSave={handleSaveRecord} 
          onCancel={() => {
            setIsFormOpen(false);
            setEditingRecord(null);
          }} 
          initialData={editingRecord}
        />
      )}

      {selectedDayDetail && (
          <DayDetailModal 
            date={selectedDayDetail}
            records={filteredRecords.filter(r => r.date === selectedDayDetail)}
            onClose={() => setSelectedDayDetail(null)}
            onEdit={(record) => {
                handleEdit(record);
            }}
            onDelete={handleDeleteRequest}
            onPlayAudio={playAudio}
          />
      )}

      <DeleteConfirmationModal
        isOpen={!!recordToDeleteId}
        onClose={() => setRecordToDeleteId(null)}
        onConfirm={executeDelete}
      />

      <AnalysisModal 
        isOpen={isAnalysisModalOpen}
        onClose={() => setIsAnalysisModalOpen(false)}
        isLoading={isAnalyzing}
        content={analysisResult}
      />

      <VoiceAssistantModal 
        isOpen={isVoiceAssistantOpen}
        onClose={() => setIsVoiceAssistantOpen(false)}
        onRecordCreated={handleVoiceRecordCreated}
        onRecordDeleted={handleVoiceRecordDeleted}
        currentRecords={filteredRecords}
      />

      <InventoryModal 
        isOpen={isInventoryOpen}
        onClose={() => setIsInventoryOpen(false)}
        currentRecords={filteredRecords}
      />

      <GuideModal 
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

    </div>
  );
};

export default App;
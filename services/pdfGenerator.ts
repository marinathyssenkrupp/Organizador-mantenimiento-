import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MaintenanceRecord } from '../types';

export const generateMonthlyPDF = (
  records: MaintenanceRecord[],
  monthLabel: string,
  locationLabel: string
) => {
  const doc = new jsPDF();
  
  // Colors
  const brandColor = [2, 132, 199]; // #0284c7 (brand-600)
  
  // --- Header ---
  doc.setFillColor(brandColor[0], brandColor[1], brandColor[2]);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Reporte de Mantenciones', 14, 20);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Periodo: ${monthLabel}`, 14, 28);
  doc.text(`Ubicación: ${locationLabel}`, 14, 34);

  // --- Statistics Summary ---
  const total = records.length;
  const elevators = records.filter(r => r.equipmentType === 'Ascensor').length;
  const escalators = records.filter(r => r.equipmentType === 'Escalera Mecánica').length;

  doc.setTextColor(50, 50, 50);
  doc.setFontSize(10);
  doc.text(`Resumen General: Total: ${total} | Ascensores: ${elevators} | Escaleras: ${escalators}`, 14, 48);

  // --- Table Content ---
  // Sort records by Date -> Time
  const sortedRecords = [...records].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time}`);
    const dateB = new Date(`${b.date}T${b.time}`);
    return dateA.getTime() - dateB.getTime();
  });

  const tableData = sortedRecords.map(record => [
    record.date,
    record.time,
    record.location,
    record.equipmentType === 'Ascensor' ? 'Asc.' : 'Esc.',
    record.equipmentOrder,
    record.technician,
    record.notes || '-'
  ]);

  autoTable(doc, {
    startY: 55,
    head: [['Fecha', 'Hora', 'Ubicación', 'Tipo', 'Equipo', 'Técnico', 'Notas']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: brandColor,
      textColor: 255,
      fontSize: 8,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: 50
    },
    alternateRowStyles: {
      fillColor: [240, 249, 255]
    },
    columnStyles: {
      0: { cellWidth: 22 }, // Date
      1: { cellWidth: 15 }, // Time
      2: { cellWidth: 25 }, // Location
      3: { cellWidth: 12 }, // Type
      4: { cellWidth: 35 }, // Equipment
      5: { cellWidth: 30 }, // Tech
      6: { cellWidth: 'auto' } // Notes
    }
  });

  // --- Footer ---
  const pageCount = doc.getNumberOfPages();
  for(let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Página ${i} de ${pageCount} - Generado el ${new Date().toLocaleDateString()}`,
      doc.internal.pageSize.width / 2, 
      doc.internal.pageSize.height - 10, 
      { align: 'center' }
    );
  }

  // Save File
  const fileName = `Reporte_Mantencion_${monthLabel.replace(/\s/g, '_')}_${new Date().getTime()}.pdf`;
  doc.save(fileName);
};
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ExportColumn {
  header: string;
  accessor: string;
  format?: (value: unknown) => string;
}

/**
 * Export data to CSV format (safer alternative to xlsx)
 * CSV is universally supported by Excel, Google Sheets, and other spreadsheet applications
 */
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn[],
  filename: string
) {
  // Create CSV header row
  const headers = columns.map(col => escapeCSVField(col.header)).join(',');
  
  // Create CSV data rows
  const rows = data.map(row => {
    return columns.map(col => {
      const value = row[col.accessor];
      const formattedValue = col.format ? col.format(value) : String(value ?? '');
      return escapeCSVField(formattedValue);
    }).join(',');
  });
  
  // Combine header and rows with BOM for Excel UTF-8 support
  const BOM = '\uFEFF';
  const csvContent = BOM + [headers, ...rows].join('\n');
  
  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Escape special characters in CSV fields
 */
function escapeCSVField(field: string): string {
  // If field contains comma, newline, or quote, wrap in quotes and escape internal quotes
  if (field.includes(',') || field.includes('\n') || field.includes('"')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

/**
 * Legacy Excel export function - now uses CSV for security
 * @deprecated Use exportToCSV instead for better security
 */
export function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn[],
  filename: string
) {
  // Redirect to CSV export for security (xlsx package has vulnerabilities)
  exportToCSV(data, columns, filename);
}

export function exportToPDF<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn[],
  filename: string,
  title?: string,
  options?: { subtitle?: string; brandColor?: [number, number, number] }
) {
  const doc = new jsPDF();
  const color = options?.brandColor || [212, 175, 55];
  
  // Header bar
  doc.setFillColor(color[0], color[1], color[2]);
  doc.rect(0, 0, 210, 8, 'F');

  // Title
  if (title) {
    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.text(title, 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    const sub = options?.subtitle || `Gerado em: ${new Date().toLocaleString('pt-BR')}`;
    doc.text(sub, 14, 30);
  }

  const tableData = data.map(row => 
    columns.map(col => {
      const value = row[col.accessor];
      return col.format ? col.format(value) : String(value ?? '');
    })
  );

  autoTable(doc, {
    head: [columns.map(col => col.header)],
    body: tableData,
    startY: title ? 35 : 20,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: color,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(180, 180, 180);
    doc.text(`Nexsiles • Página ${i}/${pageCount}`, 14, doc.internal.pageSize.height - 10);
  }

  doc.save(`${filename}.pdf`);
}

export function formatCurrency(value: unknown): string {
  const num = Number(value);
  if (isNaN(num)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(num);
}

export function formatDate(value: unknown): string {
  if (!value) return '-';
  return new Date(String(value)).toLocaleDateString('pt-BR');
}

export function formatDateTime(value: unknown): string {
  if (!value) return '-';
  return new Date(String(value)).toLocaleString('pt-BR');
}

import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { exportToExcel, exportToPDF, ExportColumn } from '@/lib/export';

interface ExportButtonProps<T extends Record<string, unknown>> {
  data: T[];
  columns: ExportColumn[];
  filename: string;
  title?: string;
}

export function ExportButton<T extends Record<string, unknown>>({ 
  data, 
  columns, 
  filename,
  title 
}: ExportButtonProps<T>) {
  const handleExportExcel = () => {
    exportToExcel(data, columns, filename);
  };

  const handleExportPDF = () => {
    exportToPDF(data, columns, filename, title);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-popover">
        <DropdownMenuItem onClick={handleExportExcel} className="gap-2 cursor-pointer">
          <FileSpreadsheet className="h-4 w-4 text-green-600" />
          Exportar Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportPDF} className="gap-2 cursor-pointer">
          <FileText className="h-4 w-4 text-red-600" />
          Exportar PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

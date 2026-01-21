import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar as CalendarIcon, Filter, X, Search } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';

export interface PedidoFilters {
  status: string;
  dateRange: DateRange | undefined;
  search: string;
}

interface Props {
  filters: PedidoFilters;
  onFiltersChange: (filters: PedidoFilters) => void;
}

const STATUS_OPTIONS = [
  { value: 'todos', label: 'Todos os status' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'cancelado', label: 'Cancelado' },
];

export function PedidosFilters({ filters, onFiltersChange }: Props) {
  const [isDateOpen, setIsDateOpen] = useState(false);

  const hasActiveFilters = 
    filters.status !== 'todos' || 
    filters.dateRange?.from || 
    filters.search;

  const handleClearFilters = () => {
    onFiltersChange({
      status: 'todos',
      dateRange: undefined,
      search: '',
    });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-4">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por cliente..."
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className="pl-9"
        />
      </div>

      {/* Status Filter */}
      <Select
        value={filters.status}
        onValueChange={(value) => onFiltersChange({ ...filters, status: value })}
      >
        <SelectTrigger className="w-full sm:w-[160px]">
          <Filter className="w-4 h-4 mr-2" />
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent className="bg-popover">
          {STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Date Range */}
      <Popover open={isDateOpen} onOpenChange={setIsDateOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full sm:w-auto justify-start text-left font-normal',
              !filters.dateRange?.from && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {filters.dateRange?.from ? (
              filters.dateRange.to ? (
                <>
                  {format(filters.dateRange.from, 'dd/MM')} - {format(filters.dateRange.to, 'dd/MM')}
                </>
              ) : (
                format(filters.dateRange.from, 'dd/MM/yyyy')
              )
            ) : (
              'Data'
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-popover" align="end">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={filters.dateRange?.from}
            selected={filters.dateRange}
            onSelect={(range) => {
              onFiltersChange({ ...filters, dateRange: range });
              if (range?.to) setIsDateOpen(false);
            }}
            numberOfMonths={2}
            locale={ptBR}
          />
        </PopoverContent>
      </Popover>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClearFilters}
          className="shrink-0"
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}

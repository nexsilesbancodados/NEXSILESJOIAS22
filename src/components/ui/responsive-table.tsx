import * as React from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Column<T> {
  key: string;
  header: string;
  cell: (item: T) => React.ReactNode;
  className?: string;
  hideOnMobile?: boolean;
  priority?: number; // Higher = more important, shown first on mobile
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  isLoading?: boolean;
  mobileCardRender?: (item: T) => React.ReactNode;
  onRowClick?: (item: T) => void;
  className?: string;
}

export function ResponsiveTable<T>({
  data,
  columns,
  keyExtractor,
  emptyMessage = 'Nenhum item encontrado',
  emptyIcon,
  isLoading,
  mobileCardRender,
  onRowClick,
  className,
}: ResponsiveTableProps<T>) {
  const visibleMobileColumns = columns
    .filter(c => !c.hideOnMobile)
    .sort((a, b) => (b.priority || 0) - (a.priority || 0));

  if (data.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        {emptyIcon}
        <p className="text-lg font-medium mt-4">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      {/* Mobile Card View - when custom render provided */}
      {mobileCardRender && (
        <div className="md:hidden space-y-3">
          {data.map((item) => (
            <div
              key={keyExtractor(item)}
              className={cn(
                'p-4 rounded-lg border bg-card',
                onRowClick && 'cursor-pointer hover:bg-accent/50 transition-colors'
              )}
              onClick={() => onRowClick?.(item)}
            >
              {mobileCardRender(item)}
            </div>
          ))}
        </div>
      )}

      {/* Mobile Horizontal Scroll Table - when no custom render */}
      {!mobileCardRender && (
        <div className="md:hidden">
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="min-w-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    {visibleMobileColumns.map((col) => (
                      <TableHead key={col.key} className={col.className}>
                        {col.header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item) => (
                    <TableRow
                      key={keyExtractor(item)}
                      className={onRowClick ? 'cursor-pointer hover:bg-accent/50' : ''}
                      onClick={() => onRowClick?.(item)}
                    >
                      {visibleMobileColumns.map((col) => (
                        <TableCell key={col.key} className={col.className}>
                          {col.cell(item)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      )}

      {/* Desktop Table View */}
      <div className={mobileCardRender ? 'hidden md:block' : 'hidden md:block'}>
        <ScrollArea className="w-full">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={col.key} className={col.className}>
                    {col.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <TableRow
                  key={keyExtractor(item)}
                  className={onRowClick ? 'cursor-pointer hover:bg-accent/50' : ''}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((col) => (
                    <TableCell key={col.key} className={col.className}>
                      {col.cell(item)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    </div>
  );
}

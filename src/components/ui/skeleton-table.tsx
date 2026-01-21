import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface SkeletonTableProps {
  columns?: number;
  rows?: number;
}

export function SkeletonTable({ columns = 5, rows = 5 }: SkeletonTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {Array.from({ length: columns }).map((_, i) => (
            <TableHead key={i}>
              <Skeleton className="h-4 w-[100px]" />
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <TableRow key={rowIndex}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <TableCell key={colIndex}>
                <Skeleton className="h-4 w-full" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function SkeletonTableCard({ columns = 5, rows = 5 }: SkeletonTableProps) {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-[200px]" />
        <Skeleton className="h-9 w-[120px]" />
      </div>
      <SkeletonTable columns={columns} rows={rows} />
    </div>
  );
}

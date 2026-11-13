import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export type ResponsiveListColumn<T> = {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  headClassName?: string;
  cellClassName?: string;
};

export function ResponsiveList<T>({
  rows,
  rowKey,
  columns,
  renderCard,
  emptyMessage,
}: {
  rows: T[];
  rowKey: (row: T) => string;
  columns: ResponsiveListColumn<T>[];
  renderCard: (row: T) => React.ReactNode;
  emptyMessage: string;
}) {
  if (!rows.length) {
    return (
      <Card>
        <CardContent>
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="hidden md:block">
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((c) => (
                  <TableHead key={c.key} className={c.headClassName}>
                    {c.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={rowKey(row)}>
                  {columns.map((c) => (
                    <TableCell key={c.key} className={c.cellClassName}>
                      {c.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <div className="flex flex-col gap-3 md:hidden">
        {rows.map((row) => (
          <div key={rowKey(row)}>{renderCard(row)}</div>
        ))}
      </div>
    </>
  );
}

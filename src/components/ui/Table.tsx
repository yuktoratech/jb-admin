import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface TableColumn<T> {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Array<TableColumn<T>>;
  rows: T[];
  rowKey: (row: T) => string;
  className?: string;
}

export function Table<T>({ columns, rows, rowKey, className }: TableProps<T>) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="min-w-full border-collapse text-left">
        <thead className="border-y border-neutral-200 bg-neutral-50">
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col" className={cn("whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500", column.className)}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200 bg-white">
          {rows.map((row) => (
            <tr key={rowKey(row)} className="hover:bg-neutral-50/70">
              {columns.map((column) => (
                <td key={column.key} className={cn("px-4 py-3.5 text-sm text-neutral-700", column.className)}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

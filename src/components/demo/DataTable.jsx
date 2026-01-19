import React from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export default function DataTable({ data, isLoading }) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-6" />
          ))}
        </div>
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className="grid grid-cols-4 gap-4">
            {Array(4).fill(0).map((_, j) => (
              <Skeleton key={j} className="h-4" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        暂无查询结果
      </div>
    );
  }

  const columns = Object.keys(data[0]);

  return (
    <div className="border rounded-lg bg-white">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            {columns.map((column) => (
              <TableHead key={column} className="font-semibold text-slate-700">
                {column}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => (
            <TableRow key={index} className="hover:bg-slate-50">
              {columns.map((column) => (
                <TableCell key={column} className="font-mono text-sm">
                  {typeof row[column] === 'number' 
                    ? row[column].toLocaleString() 
                    : row[column]
                  }
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Table as TableType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { User, Check, Ban } from "lucide-react";
import { csvRepository } from "@/services/csv-repository";

const statusConfig = {
  available: {
    label: "Available",
    color: "border-green-500 bg-green-500/10",
    icon: Check,
  },
  occupied: {
    label: "Occupied",
    color: "border-red-500 bg-red-500/10",
    icon: User,
  },
  reserved: {
    label: "Reserved",
    color: "border-yellow-500 bg-yellow-500/10",
    icon: Ban,
  },
};

export function TableLayout() {
  const [tables, setTables] = React.useState<TableType[]>([]);

  React.useEffect(() => {
    csvRepository.getTables().then(setTables);
  }, []);

  const toggleStatus = (tableId: number) => {
    const updatedTables = tables.map(table => {
      if (table.id === tableId) {
        const statuses: TableType['status'][] = ['available', 'occupied', 'reserved'];
        const currentIndex = statuses.indexOf(table.status);
        const nextIndex = (currentIndex + 1) % statuses.length;
        return { ...table, status: statuses[nextIndex], orderId: statuses[nextIndex] === 'available' ? undefined : table.orderId };
      }
      return table;
    });
    setTables(updatedTables);
    csvRepository.saveTables(updatedTables);
  };

  return (
    <div className="flex flex-col">
      <h1 className="text-2xl font-bold font-headline mb-4">Table Management</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        {tables.map((table) => {
          const config = statusConfig[table.status];
          const Icon = config.icon;
          return (
            <Card
              key={table.id}
              className={cn(
                "flex flex-col justify-between shadow-md hover:shadow-lg transition-shadow border-2",
                config.color
              )}
            >
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-2xl font-bold font-headline">
                  {String(table.id).padStart(2, "0")}
                </CardTitle>
                <Icon className="h-6 w-6 text-muted-foreground" />
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-sm text-muted-foreground mb-1">{config.label}</div>
                <div className="flex items-center justify-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{table.capacity} Guests</span>
                </div>
                 {table.orderId && (
                  <div className="text-xs mt-2 text-primary font-semibold">{table.orderId}</div>
                )}
              </CardContent>
              <CardFooter>
                 <Button className="w-full" variant="outline" onClick={() => toggleStatus(table.id)}>
                    Change Status
                  </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

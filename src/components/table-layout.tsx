
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Table as TableType, Order } from "@/lib/types";
import { cn } from "@/lib/utils";
import { User, Check, Ban, PlusCircle } from "lucide-react";
import { saveTables } from "@/app/actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { BillView } from "./bill-view";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAppData } from "@/hooks/use-app-data";
import { Skeleton } from "./ui/skeleton";

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

function TableLayoutLoading() {
    return (
        <div className="flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold font-headline">Table Management</h1>
                <Skeleton className="h-10 w-36" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                {[...Array(6)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                             <Skeleton className="h-8 w-10" />
                             <Skeleton className="h-6 w-6" />
                        </CardHeader>
                        <CardContent className="text-center">
                            <Skeleton className="h-5 w-20 mx-auto mb-1" />
                            <Skeleton className="h-5 w-24 mx-auto" />
                        </CardContent>
                        <CardFooter>
                            <Skeleton className="h-9 w-full" />
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    )
}

export function TableLayout() {
  const { allTables, activeOrders, setAllTables, loading, appConfig } = useAppData();
  const [viewingOrder, setViewingOrder] = React.useState<Order | null>(null);
  const [isAddTableDialogOpen, setAddTableDialogOpen] = React.useState(false);
  const [newTableCapacity, setNewTableCapacity] = React.useState<number>(4);
  const { toast } = useToast();

  const toggleStatus = React.useCallback(async (tableId: number) => {
    const updatedTables = allTables.map(table => {
        if (table.id === tableId) {
        const statuses: TableType['status'][] = ['available', 'occupied', 'reserved'];
        const currentIndex = statuses.indexOf(table.status);
        const nextIndex = (currentIndex + 1) % statuses.length;
        return { ...table, status: statuses[nextIndex], orderId: statuses[nextIndex] === 'available' ? undefined : table.orderId };
        }
        return table;
    });
    setAllTables(updatedTables);
    await saveTables(updatedTables);
  }, [allTables, setAllTables]);

  const handleViewOrder = React.useCallback((orderId?: string) => {
    if (!orderId) return;
    const order = activeOrders.find(o => o.id === orderId);
    if (order) {
      setViewingOrder(order);
    } else {
        toast({
            variant: "destructive",
            title: "Order Not Found",
            description: `Could not find active order with ID: ${orderId}`
        });
    }
  }, [activeOrders, toast]);

  const handleAddTable = React.useCallback(async () => {
    if (newTableCapacity < 1) {
        toast({
            variant: "destructive",
            title: "Invalid Capacity",
            description: "Table capacity must be at least 1."
        });
        return;
    }
    const newTable: TableType = {
        id: allTables.length > 0 ? Math.max(...allTables.map(t => t.id)) + 1 : 1,
        capacity: newTableCapacity,
        status: 'available'
    };

    const updatedTables = [...allTables, newTable];
    await saveTables(updatedTables);
    setAllTables(updatedTables);
    toast({
        title: "Table Added",
        description: `Table ${newTable.id} with capacity ${newTable.capacity} has been added.`
    });
    setAddTableDialogOpen(false);
    setNewTableCapacity(4);

  }, [newTableCapacity, allTables, toast, setAllTables]);

  if (loading || !appConfig) {
      return <TableLayoutLoading />;
  }

  return (
    <div className="flex flex-col">
       <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold font-headline">Table Management</h1>
        <Button onClick={() => setAddTableDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Table
        </Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        {allTables.map((table) => {
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
                   <Button variant="link" size="sm" className="text-xs mt-2 text-primary font-semibold h-auto p-0" onClick={() => handleViewOrder(table.orderId)}>
                    {table.orderId}
                   </Button>
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

       {/* View Order Dialog */}
       <Dialog open={!!viewingOrder} onOpenChange={(open) => !open && setViewingOrder(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {viewingOrder && <BillView order={viewingOrder} appConfig={appConfig} />}
        </DialogContent>
      </Dialog>
      
      {/* Add Table Dialog */}
       <Dialog open={isAddTableDialogOpen} onOpenChange={setAddTableDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add New Table</DialogTitle>
            <DialogDescription>
                Specify the capacity for the new table.
            </DialogDescription>
          </DialogHeader>
           <div className="py-4">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                    id="capacity"
                    type="number"
                    value={newTableCapacity}
                    onChange={(e) => setNewTableCapacity(Number(e.target.value))}
                    placeholder="e.g. 4"
                    min="1"
                />
            </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddTableDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddTable}>Add Table</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

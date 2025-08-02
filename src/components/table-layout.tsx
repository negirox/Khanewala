
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Table as TableType, Order } from "@/lib/types";
import { cn } from "@/lib/utils";
import { User, Check, Ban, PlusCircle } from "lucide-react";
import { getTables, saveTables, getActiveOrders } from "@/app/actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { BillView } from "./bill-view";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useToast } from "@/hooks/use-toast";

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
  const [activeOrders, setActiveOrders] = React.useState<Order[]>([]);
  const [viewingOrder, setViewingOrder] = React.useState<Order | null>(null);
  const [isAddTableDialogOpen, setAddTableDialogOpen] = React.useState(false);
  const [newTableCapacity, setNewTableCapacity] = React.useState<number>(4);
  const { toast } = useToast();

  React.useEffect(() => {
    getTables().then(setTables);
    getActiveOrders().then(orders => setActiveOrders(orders.map(o => ({...o, createdAt: new Date(o.createdAt)}))));
  }, []);

  const toggleStatus = React.useCallback((tableId: number) => {
    setTables(prevTables => {
        const updatedTables = prevTables.map(table => {
          if (table.id === tableId) {
            const statuses: TableType['status'][] = ['available', 'occupied', 'reserved'];
            const currentIndex = statuses.indexOf(table.status);
            const nextIndex = (currentIndex + 1) % statuses.length;
            return { ...table, status: statuses[nextIndex], orderId: statuses[nextIndex] === 'available' ? undefined : table.orderId };
          }
          return table;
        });
        saveTables(updatedTables);
        return updatedTables;
    });
  }, []);

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
        id: tables.length > 0 ? Math.max(...tables.map(t => t.id)) + 1 : 1,
        capacity: newTableCapacity,
        status: 'available'
    };

    const updatedTables = [...tables, newTable];
    await saveTables(updatedTables);
    setTables(updatedTables);
    toast({
        title: "Table Added",
        description: `Table ${newTable.id} with capacity ${newTable.capacity} has been added.`
    });
    setAddTableDialogOpen(false);
    setNewTableCapacity(4);

  }, [newTableCapacity, tables, toast]);

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
          {viewingOrder && <BillView order={viewingOrder} />}
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


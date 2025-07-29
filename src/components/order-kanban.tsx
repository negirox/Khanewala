
"use client";

import * as React from "react";
import { PlusCircle, ArrowRight, Clock, CheckCircle, Utensils, Archive, Printer, Percent, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { OrderForm } from "@/components/order-form";
import { menuItems as allMenuItems } from "@/lib/data";
import type { Order, OrderStatus, Customer } from "@/lib/types";
import { Badge } from "./ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BillView } from "./bill-view";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { csvRepository } from "@/services/csv-repository";

const statusConfig: Record<
  OrderStatus,
  { title: string; icon: React.ElementType; nextStatus?: OrderStatus, color: string }
> = {
  received: { title: "Received", icon: Clock, nextStatus: "preparing", color: "bg-blue-500" },
  preparing: { title: "Preparing", icon: Utensils, nextStatus: "ready", color: "bg-yellow-500" },
  ready: { title: "Ready for Pickup", icon: CheckCircle, nextStatus: "archived", color: "bg-green-500" },
  served: { title: "Served", icon: Archive, color: "bg-gray-500" }, // This is now effectively the archived state
  archived: { title: "Archived", icon: Archive, color: "bg-gray-500" },
};

const KANBAN_STATUSES: OrderStatus[] = ["received", "preparing", "ready"];

export function OrderKanban() {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [archivedOrders, setArchivedOrders] = React.useState<Order[]>([]);
  const [allCustomers, setAllCustomers] = React.useState<Customer[]>([]);
  const [isSheetOpen, setSheetOpen] = React.useState(false);
  const [printingOrder, setPrintingOrder] = React.useState<Order | null>(null);
  const [discountOrder, setDiscountOrder] = React.useState<Order | null>(null);
  const [discountPercentage, setDiscountPercentage] = React.useState<number>(0);

  React.useEffect(() => {
    Promise.all([
      csvRepository.getActiveOrders(),
      csvRepository.getArchivedOrders(),
      csvRepository.getCustomers()
    ]).then(([active, archived, customers]) => {
      setOrders(active);
      setArchivedOrders(archived);
      setAllCustomers(customers);
    })
  }, []);

  const handleUpdateStatus = (orderId: string, newStatus: OrderStatus) => {
    if (newStatus === 'archived') {
        const orderToArchive = orders.find(o => o.id === orderId);
        if(orderToArchive) {
            const newArchivedOrders = [{...orderToArchive, status: 'archived'}, ...archivedOrders];
            const newActiveOrders = orders.filter(o => o.id !== orderId);
            setArchivedOrders(newArchivedOrders);
            setOrders(newActiveOrders);
            csvRepository.saveAllOrders(newActiveOrders, newArchivedOrders);
        }
    } else {
        const newActiveOrders = orders.map((order) =>
            order.id === orderId ? { ...order, status: newStatus } : order
        );
        setOrders(newActiveOrders);
        csvRepository.saveAllOrders(newActiveOrders, archivedOrders);
    }
  };

  const handleNewOrder = (newOrderData: Omit<Order, 'id' | 'createdAt'>) => {
    const newOrder: Order = {
        ...newOrderData,
        id: `ORD${(Math.random() * 1000).toFixed(0).padStart(3, '0')}`,
        createdAt: new Date(),
    };
    const newActiveOrders = [newOrder, ...orders];
    setOrders(newActiveOrders);
    csvRepository.saveAllOrders(newActiveOrders, archivedOrders);
    setSheetOpen(false);
  }

  const handleApplyDiscount = () => {
    if (!discountOrder) return;
    const discountValue = Math.max(0, Math.min(100, discountPercentage));
    const newActiveOrders = orders.map(o => {
        if (o.id === discountOrder.id) {
            const newTotal = o.subtotal * (1 - discountValue / 100);
            return { ...o, discount: discountValue, total: newTotal };
        }
        return o;
    });
    setOrders(newActiveOrders);
    csvRepository.saveAllOrders(newActiveOrders, archivedOrders);
    setDiscountOrder(null);
    setDiscountPercentage(0);
  }
  
  const groupedOrders = React.useMemo(() => {
    return orders.reduce((acc, order) => {
      (acc[order.status] = acc[order.status] || []).push(order);
      return acc;
    }, {} as Record<OrderStatus, Order[]>);
  }, [orders]);


  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold font-headline">Current Orders</h1>
        <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Order
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-4xl">
            <OrderForm allMenuItems={allMenuItems} allCustomers={allCustomers} onSubmit={handleNewOrder} />
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6 items-start">
        {KANBAN_STATUSES.map((status) => (
          <div key={status} className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
               <span className={`w-3 h-3 rounded-full ${statusConfig[status].color}`}></span>
              <h2 className="font-semibold font-headline text-lg">
                {statusConfig[status].title}
              </h2>
              <Badge variant="secondary">{groupedOrders[status]?.length || 0}</Badge>
            </div>
            <div className="space-y-4 h-full min-h-[200px] bg-muted/50 rounded-lg p-4">
              {groupedOrders[status]?.map((order) => (
                <Card key={order.id} className="shadow-md hover:shadow-lg transition-shadow flex flex-col">
                  <CardHeader>
                    <CardTitle className="flex flex-wrap justify-between items-center gap-2">
                      <span>{order.id} - Table {order.tableNumber}</span>
                      <span className="text-sm font-normal text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(order.createdAt, { addSuffix: true })}
                      </span>
                    </CardTitle>
                    {order.customerName && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground pt-1">
                            <User className="h-4 w-4" />
                            <span>{order.customerName}</span>
                        </div>
                    )}
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <ul>
                      {order.items.map((item, index) => (
                        <li key={index} className="flex justify-between">
                          <span className='pr-2'>{item.menuItem.name}</span>
                          <span className="text-muted-foreground whitespace-nowrap">x{item.quantity}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="border-t my-2" />
                    <div className="space-y-1 text-sm">
                        <div className="flex justify-between"><span>Subtotal:</span> <span>${order.subtotal.toFixed(2)}</span></div>
                        {order.discount > 0 && <div className="flex justify-between text-destructive"><span>Discount:</span> <span>-{order.discount}%</span></div>}
                        <div className="flex justify-between font-bold text-base"><span>Total:</span> <span>${order.total.toFixed(2)}</span></div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-2">
                     <div className="flex flex-col sm:flex-row w-full gap-2">
                        <Button variant="outline" className="w-full" onClick={() => { setDiscountOrder(order); setDiscountPercentage(order.discount)}}>
                            <Percent className="mr-2 h-4 w-4" />
                            Discount
                        </Button>
                        <Button variant="outline" className="w-full" onClick={() => setPrintingOrder(order)}>
                            <Printer className="mr-2 h-4 w-4" />
                            Print Bill
                        </Button>
                     </div>
                    <div className="w-full">
                    {statusConfig[status].nextStatus && (
                         <Button
                          variant="secondary"
                          className="w-full"
                          onClick={() => handleUpdateStatus(order.id, statusConfig[status].nextStatus!)}
                        >
                          {statusConfig[status].nextStatus === 'archived' ? (
                            <>
                              Mark as Served & Archive <Archive className="ml-2 h-4 w-4" />
                            </>
                          ) : (
                             <>
                              Move to {statusConfig[statusConfig[status].nextStatus!].title}
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                          )}
                        </Button>
                    )}
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
      
       <Dialog open={!!printingOrder} onOpenChange={(open) => !open && setPrintingOrder(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Print Bill</DialogTitle>
          </DialogHeader>
          {printingOrder && <BillView order={printingOrder} />}
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={!!discountOrder} onOpenChange={(open) => !open && setDiscountOrder(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Apply Discount</AlertDialogTitle>
                <AlertDialogDescription>
                    Enter a discount percentage for order {discountOrder?.id}.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
                <Label htmlFor="discount">Discount (%)</Label>
                <Input
                    id="discount"
                    type="number"
                    value={discountPercentage}
                    onChange={(e) => setDiscountPercentage(Number(e.target.value))}
                    placeholder="e.g. 15"
                />
            </div>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleApplyDiscount}>Apply Discount</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}

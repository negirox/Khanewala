
"use client";

import * as React from "react";
import { PlusCircle, ArrowRight, Clock, CheckCircle, Utensils, Archive, Printer, Percent, User, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle as DialogTitlePrimitive } from "@/components/ui/dialog";
import { OrderForm } from "@/components/order-form";
import type { Order, OrderStatus, Customer, MenuItem, Table as TableType } from "@/lib/types";
import { Badge } from "./ui/badge";
import { formatDistanceToNow } from "date-fns";
import { BillView } from "./bill-view";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { getActiveOrders, getArchivedOrders, getCustomers, getMenuItems, saveAllOrders, createNewOrder, getTables, saveTables } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { appConfig } from "@/lib/config";
import { cn } from "@/lib/utils";

const statusConfig: Record<
  OrderStatus,
  { title: string; icon: React.ElementType; nextStatus?: OrderStatus, color: string }
> = {
  received: { title: "Received", icon: Clock, nextStatus: "preparing", color: "bg-blue-500" },
  preparing: { title: "Preparing", icon: Utensils, nextStatus: "ready", color: "bg-yellow-500" },
  ready: { title: "Ready for Pickup", icon: CheckCircle, nextStatus: "archived", color: "bg-green-500" },
  served: { title: "Served", icon: Archive, color: "bg-gray-500" },
  archived: { title: "Archived", icon: Archive, color: "bg-gray-500" },
};

const KANBAN_STATUSES: OrderStatus[] = ["received", "preparing", "ready"];

export function OrderKanban() {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [archivedOrders, setArchivedOrders] = React.useState<Order[]>([]);
  const [allCustomers, setAllCustomers] = React.useState<Customer[]>([]);
  const [allMenuItems, setAllMenuItems] = React.useState<MenuItem[]>([]);
  const [allTables, setAllTables] = React.useState<TableType[]>([]);
  const [isNewOrderDialogOpen, setNewOrderDialogOpen] = React.useState(false);
  const [printingOrder, setPrintingOrder] = React.useState<Order | null>(null);
  const [discountOrder, setDiscountOrder] = React.useState<Order | null>(null);
  const [discountPercentage, setDiscountPercentage] = React.useState<number>(0);
  const { toast } = useToast();

  React.useEffect(() => {
    Promise.all([
      getActiveOrders(),
      getArchivedOrders(),
      getCustomers(),
      getMenuItems(),
      getTables()
    ]).then(([active, archived, customers, menuItems, tables]) => {
      setOrders(active.map(o => ({...o, createdAt: new Date(o.createdAt)})));
      setArchivedOrders(archived.map(o => ({...o, createdAt: new Date(o.createdAt)})));
      setAllCustomers(customers);
      setAllMenuItems(menuItems);
      setAllTables(tables);
    })
  }, []);

  const handleUpdateStatus = React.useCallback(async (orderId: string, newStatus: OrderStatus) => {
    let newActiveOrders = [...orders];
    let newArchivedOrders = [...archivedOrders];
    let newTables = [...allTables];

    if (newStatus === 'archived') {
        const orderToArchive = newActiveOrders.find(o => o.id === orderId);
        if(orderToArchive) {
            newArchivedOrders = [{...orderToArchive, status: 'archived'}, ...newArchivedOrders];
            newActiveOrders = newActiveOrders.filter(o => o.id !== orderId);
            
            // Update table status to available
            newTables = newTables.map(table => 
                table.id === orderToArchive.tableNumber 
                ? { ...table, status: 'available', orderId: undefined } 
                : table
            );
            setAllTables(newTables);
            await saveTables(newTables);
        }
    } else {
        newActiveOrders = newActiveOrders.map((order) =>
            order.id === orderId ? { ...order, status: newStatus } : order
        );
    }
    setOrders(newActiveOrders);
    setArchivedOrders(newArchivedOrders);
    await saveAllOrders(newActiveOrders, newArchivedOrders);
  }, [orders, archivedOrders, allTables]);

  const handleNewOrder = React.useCallback(async (newOrderData: Omit<Order, 'id' | 'createdAt'>) => {
    const { newActiveOrders, updatedCustomers, newOrder } = await createNewOrder(newOrderData, orders, archivedOrders, allCustomers);

    setOrders(newActiveOrders.map(o => ({...o, createdAt: new Date(o.createdAt)})));
    setAllCustomers(updatedCustomers);
    
    // Also update table status to occupied
    const updatedTables = allTables.map(table => 
        table.id === newOrder.tableNumber
        ? { ...table, status: 'occupied', orderId: newOrder.id }
        : table
    );
    setAllTables(updatedTables);
    await saveTables(updatedTables);

    if (newOrder.pointsEarned) {
         toast({
            title: "Loyalty Points Added!",
            description: `${newOrder.customerName} earned ${newOrder.pointsEarned} points.`,
        });
    }

    setNewOrderDialogOpen(false);
  }, [orders, archivedOrders, allCustomers, allTables, toast]);
  
  const handleCancelOrder = React.useCallback(async (orderToCancel: Order) => {
    const newActiveOrders = orders.filter(o => o.id !== orderToCancel.id);
    setOrders(newActiveOrders);

    const newTables = allTables.map(table => 
        table.id === orderToCancel.tableNumber 
        ? { ...table, status: 'available', orderId: undefined } 
        : table
    );
    setAllTables(newTables);
    await saveTables(newTables);

    await saveAllOrders(newActiveOrders, archivedOrders);

    toast({
        title: "Order Cancelled",
        description: `Order ${orderToCancel.id} has been cancelled.`,
        variant: "destructive",
    });
  }, [orders, archivedOrders, allTables, toast]);


  const handleApplyDiscount = React.useCallback(async () => {
    if (!discountOrder) return;
    const discountValue = Math.max(0, Math.min(appConfig.maxDiscount, discountPercentage));
    
    if (discountValue > appConfig.maxDiscount) {
        toast({
            variant: "destructive",
            title: "Discount Error",
            description: `Discount cannot exceed the maximum of ${appConfig.maxDiscount}%.`,
        });
        return;
    }

    const newActiveOrders = orders.map(o => {
        if (o.id === discountOrder.id) {
            const newTotal = o.subtotal * (1 - discountValue / 100);
            return { ...o, discount: discountValue, total: newTotal };
        }
        return o;
    });
    setOrders(newActiveOrders);
    await saveAllOrders(newActiveOrders, archivedOrders);
    setDiscountOrder(null);
    setDiscountPercentage(0);
  }, [discountOrder, discountPercentage, orders, archivedOrders, toast]);
  
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
        <Dialog open={isNewOrderDialogOpen} onOpenChange={setNewOrderDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
            <OrderForm allMenuItems={allMenuItems} allCustomers={allCustomers} allTables={allTables} onSubmit={handleNewOrder} onCancel={() => setNewOrderDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6 items-start">
        {KANBAN_STATUSES.map((status) => (
          <div key={status} className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
               <span className={cn("w-3 h-3 rounded-full", statusConfig[status].color)}></span>
              <h2 className="font-semibold font-headline text-lg">
                {statusConfig[status].title}
              </h2>
              <Badge variant="secondary">{groupedOrders[status]?.length || 0}</Badge>
            </div>
            <div className="space-y-4 h-full min-h-[200px] bg-muted/50 rounded-lg p-4">
              {groupedOrders[status]?.sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).map((order) => (
                <Card key={order.id} className="shadow-md hover:shadow-lg transition-shadow flex flex-col">
                  <CardHeader>
                    <CardTitle className="flex flex-wrap justify-between items-center gap-2">
                        <div className="flex items-center gap-x-3">
                             <span>{order.id} - Table {order.tableNumber}</span>
                             {(order.status === 'received' || order.status === 'preparing') && (
                                 <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                         <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive">
                                             <Trash2 className="h-4 w-4" />
                                         </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will permanently cancel order {order.id}. This action cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Keep Order</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleCancelOrder(order)}>Cancel Order</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                             )}
                        </div>
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
                        <div className="flex justify-between"><span>Subtotal:</span> <span>{appConfig.currency}{order.subtotal.toFixed(2)}</span></div>
                        {order.discount > 0 && <div className="flex justify-between text-destructive"><span>Discount:</span> <span>-{order.discount}%</span></div>}
                        <div className="flex justify-between font-bold text-base"><span>Total:</span> <span>{appConfig.currency}{order.total.toFixed(2)}</span></div>
                        {order.pointsEarned && order.pointsEarned > 0 && <div className="flex justify-between text-yellow-500"><span>Points Earned:</span> <span>+{order.pointsEarned}</span></div>}
                    </div>
                  </CardContent>
                   <CardFooter className="flex flex-col gap-2">
                     <div className="flex w-full flex-col sm:flex-row gap-2">
                         <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            setDiscountOrder(order);
                            setDiscountPercentage(order.discount);
                          }}
                        >
                          <Percent className="mr-2 h-4 w-4" />
                          Discount
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => setPrintingOrder(order)}
                        >
                          <Printer className="mr-2 h-4 w-4" />
                          Print Bill
                        </Button>
                     </div>
                    {statusConfig[status].nextStatus && (
                      <Button
                        variant="secondary"
                        className="w-full"
                        onClick={() =>
                          handleUpdateStatus(
                            order.id,
                            statusConfig[status].nextStatus!
                          )
                        }
                      >
                        {statusConfig[status].nextStatus === 'archived' ? (
                          <>
                            <span>Serve & Archive</span>
                            <Archive className="ml-2 h-4 w-4" />
                          </>
                        ) : (
                          <>
                           <span>Move to Next</span>
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    )}
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
            <DialogTitlePrimitive>Print Bill</DialogTitlePrimitive>
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
                    The maximum allowed discount is {appConfig.maxDiscount}%.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
                <Label htmlFor="discount">Discount (%)</Label>
                <Input
                    id="discount"
                    type="number"
                    value={discountPercentage}
                    onChange={(e) => setDiscountPercentage(Number(e.target.value))}
                    placeholder={`e.g. 15 (Max ${appConfig.maxDiscount})`}
                    max={appConfig.maxDiscount}
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

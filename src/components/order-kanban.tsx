
"use client";

import * as React from "react";
import { ArrowRight, Clock, CheckCircle, Utensils, Archive, Printer, Percent, User, Trash2, Star, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle as DialogTitlePrimitive, DialogDescription } from "@/components/ui/dialog";
import type { Order, OrderStatus, Customer, Table as TableType } from "@/lib/types";
import { Badge } from "./ui/badge";
import { formatDistanceToNow } from "date-fns";
import { BillView } from "./bill-view";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { getActiveOrders, getArchivedOrders, saveAllOrders, saveTables, getTables, getCustomers, saveCustomers } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { appConfig } from "@/lib/config";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { loyaltyService } from "@/services/loyalty-service";

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
  const [allTables, setAllTables] = React.useState<TableType[]>([]);
  const [allCustomers, setAllCustomers] = React.useState<Customer[]>([]);

  const [printingOrder, setPrintingOrder] = React.useState<Order | null>(null);
  const [discountOrder, setDiscountOrder] = React.useState<Order | null>(null);
  const [discountPercentage, setDiscountPercentage] = React.useState<number>(0);

  const [redeemOrder, setRedeemOrder] = React.useState<Order | null>(null);
  const [pointsToRedeem, setPointsToRedeem] = React.useState<number>(0);
  
  const { toast } = useToast();

  React.useEffect(() => {
    Promise.all([
      getActiveOrders(),
      getArchivedOrders(),
      getTables(),
      getCustomers()
    ]).then(([active, archived, tables, customers]) => {
      setOrders(active.map(o => ({...o, createdAt: new Date(o.createdAt)})));
      setArchivedOrders(archived.map(o => ({...o, createdAt: new Date(o.createdAt)})));
      setAllTables(tables);
      setAllCustomers(customers);
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
            
            if (orderToArchive.tableNumber) {
              newTables = newTables.map(table => 
                  table.id === orderToArchive.tableNumber 
                  ? { ...table, status: 'available', orderId: undefined } 
                  : table
              );
              setAllTables(newTables);
              await saveTables(newTables);
            }
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
  
  const handleCancelOrder = React.useCallback(async (orderToCancel: Order) => {
    const newActiveOrders = orders.filter(o => o.id !== orderToCancel.id);
    setOrders(newActiveOrders);

    if (orderToCancel.tableNumber) {
      const newTables = allTables.map(table => 
          table.id === orderToCancel.tableNumber 
          ? { ...table, status: 'available', orderId: undefined } 
          : table
      );
      setAllTables(newTables);
      await saveTables(newTables);
    }

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
    if (discountPercentage > appConfig.maxDiscount) {
        toast({
            variant: "destructive",
            title: "Discount Error",
            description: `Discount cannot exceed the maximum of ${appConfig.maxDiscount}%.`,
        });
        return;
    }

    const newActiveOrders = orders.map(o => {
        if (o.id === discountOrder.id) {
            const discountedSubtotal = o.subtotal * (1 - discountValue / 100);
            const newTotal = discountedSubtotal - (o.redeemedValue || 0);
            return { ...o, discount: discountValue, total: newTotal };
        }
        return o;
    });

    setOrders(newActiveOrders);
    await saveAllOrders(newActiveOrders, archivedOrders);
    
    toast({
        title: discountValue > 0 ? "Discount Applied" : "Discount Removed",
        description: `Order ${discountOrder.id} total has been updated.`,
    });

    setDiscountOrder(null);
    setDiscountPercentage(0);
}, [discountOrder, discountPercentage, orders, archivedOrders, toast]);

  const handleRedeemPoints = React.useCallback(async () => {
    if (!redeemOrder || !redeemOrder.customerId) return;
    
    const customer = allCustomers.find(c => c.id === redeemOrder.customerId);
    if (!customer) {
        toast({ variant: "destructive", title: "Customer not found." });
        return;
    }

    const { updatedCustomer, redeemedValue, pointsRedeemed } = loyaltyService.redeemPoints(customer, pointsToRedeem);
    
    if (pointsRedeemed > 0) {
      const newCustomers = allCustomers.map(c => c.id === updatedCustomer.id ? updatedCustomer : c);
      setAllCustomers(newCustomers);
      await saveCustomers(newCustomers);
      
      const newActiveOrders = orders.map(o => {
        if (o.id === redeemOrder.id) {
            const currentRedeemedValue = o.redeemedValue || 0;
            const newTotal = o.total - (redeemedValue - currentRedeemedValue);
            return {
                ...o,
                pointsRedeemed: pointsRedeemed,
                redeemedValue: redeemedValue,
                total: newTotal,
            };
        }
        return o;
      });

      setOrders(newActiveOrders);
      await saveAllOrders(newActiveOrders, archivedOrders);
      
      toast({
        title: "Points Redeemed!",
        description: `${pointsRedeemed} points redeemed for a ${appConfig.currency}${redeemedValue.toFixed(2)} discount.`,
      });
    }

    setRedeemOrder(null);
    setPointsToRedeem(0);

  }, [redeemOrder, pointsToRedeem, orders, archivedOrders, allCustomers, toast]);
  
  const handleRevertRedemption = React.useCallback(async (orderToUpdate: Order) => {
    if (!orderToUpdate.customerId || !orderToUpdate.pointsRedeemed) return;

    const customer = allCustomers.find(c => c.id === orderToUpdate.customerId);
    if (!customer) {
        toast({ variant: "destructive", title: "Customer not found." });
        return;
    }

    const { updatedCustomer } = loyaltyService.revertRedemption(customer, orderToUpdate.pointsRedeemed);
    
    const newCustomers = allCustomers.map(c => c.id === updatedCustomer.id ? updatedCustomer : c);
    setAllCustomers(newCustomers);
    await saveCustomers(newCustomers);
    
    const newActiveOrders = orders.map(o => {
        if (o.id === orderToUpdate.id) {
            const newTotal = o.total + (o.redeemedValue || 0);
            return {
                ...o,
                pointsRedeemed: 0,
                redeemedValue: 0,
                total: newTotal,
            };
        }
        return o;
    });

    setOrders(newActiveOrders);
    await saveAllOrders(newActiveOrders, archivedOrders);

    toast({
        title: "Redemption Reverted",
        description: `${orderToUpdate.pointsRedeemed} points returned to ${customer.name}.`,
    });
  }, [orders, archivedOrders, allCustomers, toast]);


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
                        <div className="flex-1">
                             <span className="font-bold text-base">{order.id}{order.tableNumber && ` - T${order.tableNumber}`}</span>
                             <p className="text-xs font-normal text-muted-foreground whitespace-nowrap">
                                {formatDistanceToNow(order.createdAt, { addSuffix: true })}
                            </p>
                        </div>
                        <div className="flex items-center">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPrintingOrder(order)}>
                                        <Printer className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Print Bill</TooltipContent>
                            </Tooltip>
                            {status === 'ready' && (
                                <>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                                            setDiscountOrder(order);
                                            setDiscountPercentage(order.discount || 0);
                                        }}>
                                            <Percent className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Apply/Remove Discount</TooltipContent>
                                </Tooltip>
                                 <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={!order.customerId} onClick={() => {
                                            if (order.redeemedValue && order.redeemedValue > 0) {
                                                handleRevertRedemption(order);
                                            } else {
                                                setRedeemOrder(order);
                                                setPointsToRedeem(0);
                                            }
                                        }}>
                                           {(order.redeemedValue && order.redeemedValue > 0) ? <RotateCcw className="h-4 w-4 text-destructive" /> : <Star className="h-4 w-4" />}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>{(order.redeemedValue && order.redeemedValue > 0) ? 'Revert Point Redemption' : 'Redeem Points'}</TooltipContent>
                                </Tooltip>
                                </>
                            )}
                             {order.status === 'received' && (
                                 <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                 <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                                                     <Trash2 className="h-4 w-4" />
                                                 </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Cancel Order</TooltipContent>
                                        </Tooltip>
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
                    </CardTitle>
                    {order.customerName && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground pt-1">
                            <User className="h-4 w-4" />
                            <span>{order.customerName}</span>
                        </div>
                    )}
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <ul className="text-xs space-y-1">
                      {order.items.map((item, index) => (
                        <li key={index} className="flex justify-between">
                          <span className='pr-2'>{item.menuItem.name}</span>
                          <span className="text-muted-foreground whitespace-nowrap">x{item.quantity}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="border-t my-2" />
                    <div className="space-y-1 text-xs">
                        <div className="flex justify-between"><span>Subtotal:</span> <span>{appConfig.currency}{order.subtotal.toFixed(2)}</span></div>
                        {order.discount > 0 && <div className="flex justify-between text-destructive"><span>Discount ({order.discount}%):</span> <span>-{appConfig.currency}{(order.subtotal * (order.discount/100)).toFixed(2)}</span></div>}
                         {order.redeemedValue && order.redeemedValue > 0 && <div className="flex justify-between text-destructive"><span>Points Redeemed:</span> <span>-{appConfig.currency}{order.redeemedValue.toFixed(2)}</span></div>}
                        <div className="flex justify-between font-bold text-sm"><span>Total:</span> <span>{appConfig.currency}{order.total.toFixed(2)}</span></div>
                         {(order.pointsEarned !== undefined && order.pointsEarned > 0) && (
                            <div className="flex justify-between items-center text-yellow-500">
                                <span className="flex items-center gap-1"><Star className="h-3 w-3"/> Points Earned:</span> 
                                <span>+{order.pointsEarned}</span>
                            </div>
                         )}
                    </div>
                  </CardContent>
                   <CardFooter className="flex flex-col gap-2">
                    {statusConfig[status].nextStatus && (
                      <Button
                        size="sm"
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
                <AlertDialogTitle>Apply/Remove Discount</AlertDialogTitle>
                <AlertDialogDescription>
                    Enter a discount percentage for order {discountOrder?.id}. 
                    Set to 0 to remove the discount. The maximum is {appConfig.maxDiscount}%.
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

      <AlertDialog open={!!redeemOrder} onOpenChange={(open) => !open && setRedeemOrder(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Redeem Loyalty Points</AlertDialogTitle>
                <AlertDialogDescription>
                    Customer has {allCustomers.find(c => c.id === redeemOrder?.customerId)?.loyaltyPoints || 0} points available.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
                <Label htmlFor="points">Points to Redeem</Label>
                <Input
                    id="points"
                    type="number"
                    value={pointsToRedeem}
                    onChange={(e) => setPointsToRedeem(Number(e.target.value))}
                    placeholder="0"
                    max={allCustomers.find(c => c.id === redeemOrder?.customerId)?.loyaltyPoints || 0}
                />
                 <p className="text-xs text-muted-foreground mt-2">
                    Value: {appConfig.currency}{(pointsToRedeem * appConfig.loyalty.currencyUnitPerPoint).toFixed(2)}
                </p>
            </div>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleRedeemPoints}>Redeem</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}

"use client";

import * as React from "react";
import { PlusCircle, ArrowRight, Clock, CheckCircle, Utensils, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { OrderForm } from "@/components/order-form";
import { initialOrders, menuItems as allMenuItems } from "@/lib/data";
import type { Order, OrderStatus } from "@/lib/types";
import { Badge } from "./ui/badge";
import { formatDistanceToNow } from "date-fns";

const statusConfig: Record<
  OrderStatus,
  { title: string; icon: React.ElementType; nextStatus?: OrderStatus, color: string }
> = {
  received: { title: "Received", icon: Clock, nextStatus: "preparing", color: "bg-blue-500" },
  preparing: { title: "Preparing", icon: Utensils, nextStatus: "ready", color: "bg-yellow-500" },
  ready: { title: "Ready for Pickup", icon: CheckCircle, nextStatus: "served", color: "bg-green-500" },
  served: { title: "Served", icon: ThumbsUp, color: "bg-gray-500" },
};

export function OrderKanban() {
  const [orders, setOrders] = React.useState<Order[]>(initialOrders);
  const [isSheetOpen, setSheetOpen] = React.useState(false);

  const handleUpdateStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
  };

  const handleNewOrder = (newOrderData: Omit<Order, 'id' | 'createdAt'>) => {
    const newOrder: Order = {
        ...newOrderData,
        id: `ORD${(Math.random() * 1000).toFixed(0).padStart(3, '0')}`,
        createdAt: new Date(),
    };
    setOrders(prev => [newOrder, ...prev]);
    setSheetOpen(false);
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
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
            <OrderForm allMenuItems={allMenuItems} onSubmit={handleNewOrder} />
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
        {(Object.keys(statusConfig) as OrderStatus[]).map((status) => (
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
                <Card key={order.id} className="shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      <span>{order.id} - Table {order.tableNumber}</span>
                      <span className="text-sm font-normal text-muted-foreground">
                        {formatDistanceToNow(order.createdAt, { addSuffix: true })}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul>
                      {order.items.map((item, index) => (
                        <li key={index} className="flex justify-between">
                          <span>{item.menuItem.name}</span>
                          <span className="text-muted-foreground">x{item.quantity}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="border-t my-2" />
                    <p className="font-semibold text-right">Total: ${order.total.toFixed(2)}</p>
                  </CardContent>
                  {statusConfig[status].nextStatus && (
                     <CardFooter>
                        <Button
                          variant="secondary"
                          className="w-full"
                          onClick={() => handleUpdateStatus(order.id, statusConfig[status].nextStatus!)}
                        >
                          Move to {statusConfig[statusConfig[status].nextStatus!].title}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </CardFooter>
                  )}
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PlusCircle,
  MinusCircle,
  Trash2,
  Bot,
  Sparkles,
  Loader2,
} from "lucide-react";
import { getMenuRecommendations } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import type { MenuItem, OrderItem, Order } from "@/lib/types";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Image from "next/image";

interface OrderFormProps {
  allMenuItems: MenuItem[];
  onSubmit: (orderData: Omit<Order, "id" | "createdAt">) => void;
}

export function OrderForm({ allMenuItems, onSubmit }: OrderFormProps) {
  const [orderItems, setOrderItems] = React.useState<OrderItem[]>([]);
  const [tableNumber, setTableNumber] = React.useState<number | "">("");
  const [isAiLoading, setIsAiLoading] = React.useState(false);
  const [aiSuggestion, setAiSuggestion] = React.useState<{ recommendations: string[], reasoning: string } | null>(null);

  const { toast } = useToast();

  const total = React.useMemo(
    () =>
      orderItems.reduce(
        (acc, item) => acc + item.menuItem.price * item.quantity,
        0
      ),
    [orderItems]
  );

  const handleAddItem = (menuItem: MenuItem) => {
    setOrderItems((prev) => {
      const existingItem = prev.find(
        (item) => item.menuItem.id === menuItem.id
      );
      if (existingItem) {
        return prev.map((item) =>
          item.menuItem.id === menuItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { menuItem, quantity: 1 }];
    });
  };

  const handleRemoveItem = (menuItemId: string) => {
     setOrderItems((prev) => prev.filter(item => item.menuItem.id !== menuItemId));
  }

  const handleUpdateQuantity = (menuItemId: string, quantity: number) => {
    if (quantity < 1) {
        handleRemoveItem(menuItemId);
    } else {
        setOrderItems((prev) => prev.map(item => item.menuItem.id === menuItemId ? { ...item, quantity } : item));
    }
  }

  const handleGetAiSuggestions = async () => {
    if (orderItems.length === 0) {
      toast({
        variant: "destructive",
        title: "Cannot get suggestions",
        description: "Please add items to the order first.",
      });
      return;
    }

    setIsAiLoading(true);
    const orderSummary = orderItems
      .map((item) => `${item.quantity}x ${item.menuItem.name}`)
      .join(", ");

    const result = await getMenuRecommendations({ orderSummary });
    setIsAiLoading(false);

    if (result.success && result.data) {
        setAiSuggestion(result.data);
    } else {
      toast({
        variant: "destructive",
        title: "AI Suggestion Error",
        description: result.error,
      });
    }
  };

  const handleSubmit = () => {
    if (orderItems.length === 0 || tableNumber === "") {
        toast({
            variant: "destructive",
            title: "Incomplete Order",
            description: "Please add items and specify a table number.",
        });
        return;
    }
    onSubmit({
        items: orderItems,
        tableNumber: Number(tableNumber),
        status: "received",
        total: total,
    });
  }
  
  const menuByCategory = allMenuItems.reduce((acc, item) => {
    (acc[item.category] = acc[item.category] || []).push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);


  return (
    <>
      <SheetHeader>
        <SheetTitle className="font-headline">Create New Order</SheetTitle>
        <SheetDescription>
          Browse the menu and add items to the order.
        </SheetDescription>
      </SheetHeader>
      <div className="grid grid-cols-2 gap-4 h-full">
        {/* Left Side: Menu */}
        <div className="flex flex-col">
          <h3 className="font-semibold font-headline text-lg mb-2">Menu</h3>
          <ScrollArea className="flex-1 pr-4 -mr-4">
            <div className="space-y-4">
            {Object.entries(menuByCategory).map(([category, items]) => (
                <div key={category}>
                    <h4 className="font-semibold text-md mb-2 sticky top-0 bg-background/95 backdrop-blur-sm py-1">{category}</h4>
                    <div className="grid grid-cols-1 gap-2">
                        {items.map(item => (
                            <Card key={item.id} className="flex p-2 items-center gap-2 cursor-pointer hover:bg-accent/50" onClick={() => handleAddItem(item)}>
                                {item.image && <Image src={item.image} alt={item.name} width={64} height={64} className="rounded-md object-cover" />}
                                <div className="flex-1">
                                    <p className="font-semibold">{item.name}</p>
                                    <p className="text-sm text-muted-foreground">${item.price.toFixed(2)}</p>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            ))}
            </div>
          </ScrollArea>
        </div>

        {/* Right Side: Order Summary */}
        <div className="flex flex-col">
          <h3 className="font-semibold font-headline text-lg mb-2">Current Order</h3>
          <Card className="flex-1 flex flex-col">
            <CardHeader>
                <div className="space-y-1">
                    <Label htmlFor="tableNumber">Table Number</Label>
                    <Input id="tableNumber" type="number" value={tableNumber} onChange={(e) => setTableNumber(Number(e.target.value))} placeholder="e.g. 5" />
                </div>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <ScrollArea className="h-full">
              <div className="p-6 pt-0">
                {orderItems.length > 0 ? (
                  <div className="space-y-4">
                    {orderItems.map((item) => (
                      <div key={item.menuItem.id} className="flex items-center gap-4">
                        <div className="flex-1">
                          <p className="font-medium">{item.menuItem.name}</p>
                          <p className="text-sm text-muted-foreground">${item.menuItem.price.toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleUpdateQuantity(item.menuItem.id, item.quantity - 1)}><MinusCircle className="h-4 w-4" /></Button>
                            <span>{item.quantity}</span>
                            <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleUpdateQuantity(item.menuItem.id, item.quantity + 1)}><PlusCircle className="h-4 w-4" /></Button>
                        </div>
                        <p className="w-16 text-right font-medium">${(item.menuItem.price * item.quantity).toFixed(2)}</p>
                        <Button variant="ghost" size="icon" className="text-destructive h-6 w-6" onClick={() => handleRemoveItem(item.menuItem.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-10">
                    No items added yet.
                  </p>
                )}
                </div>
              </ScrollArea>
            </CardContent>
            {orderItems.length > 0 && (
                <>
                    <Separator />
                    <CardFooter className="flex flex-col gap-4 p-6">
                        <div className="flex justify-between w-full font-bold text-lg">
                            <span>Total</span>
                            <span>${total.toFixed(2)}</span>
                        </div>
                         <Button type="button" variant="outline" className="w-full" onClick={handleGetAiSuggestions} disabled={isAiLoading}>
                            {isAiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                            Get AI Suggestions
                        </Button>
                    </CardFooter>
                </>
            )}
          </Card>
        </div>
      </div>
      <SheetFooter className="mt-4">
        <Button onClick={handleSubmit} className="w-full" size="lg" disabled={orderItems.length === 0 || tableNumber === ""}>Place Order</Button>
      </SheetFooter>

      {aiSuggestion && (
        <AlertDialog open={!!aiSuggestion} onOpenChange={(open) => !open && setAiSuggestion(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2"><Sparkles className="text-primary"/> AI Recommendations</AlertDialogTitle>
                    <AlertDialogDescription>
                        Based on the current order, here are some suggestions:
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-4">
                    <div>
                        <h4 className="font-semibold mb-2">Suggestions:</h4>
                        <ul className="list-disc pl-5 space-y-1">
                            {aiSuggestion.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2">Reasoning:</h4>
                        <p className="text-sm text-muted-foreground">{aiSuggestion.reasoning}</p>
                    </div>
                </div>
                <AlertDialogFooter>
                    <AlertDialogAction>Got it, thanks!</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}

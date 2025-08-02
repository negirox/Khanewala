
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  PlusCircle,
  MinusCircle,
  Trash2,
  Loader2,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { MenuItem, OrderItem, Order, Customer, Table } from "@/lib/types";
import Image from "next/image";
import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover";
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from "./ui/command";
import { appConfig } from "@/lib/config";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";

interface OrderFormProps {
  allMenuItems: MenuItem[];
  allCustomers: Customer[];
  allTables: Table[];
  onSubmit: (orderData: Omit<Order, "id" | "createdAt">) => void;
  onCancel: () => void;
}

export function OrderForm({ allMenuItems, allCustomers, allTables, onSubmit, onCancel }: OrderFormProps) {
  const [orderItems, setOrderItems] = React.useState<OrderItem[]>([]);
  const [tableNumber, setTableNumber] = React.useState<string>("");
  const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(null);

  const { toast } = useToast();

  const subtotal = React.useMemo(
    () =>
      orderItems.reduce(
        (acc, item) => acc + item.menuItem.price * item.quantity,
        0
      ),
    [orderItems]
  );

  const handleAddItem = React.useCallback((menuItem: MenuItem) => {
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
  }, []);

  const handleRemoveItem = React.useCallback((menuItemId: string) => {
     setOrderItems((prev) => prev.filter(item => item.menuItem.id !== menuItemId));
  }, []);

  const handleUpdateQuantity = React.useCallback((menuItemId: string, quantity: number) => {
    if (quantity < 1) {
        handleRemoveItem(menuItemId);
    } else {
        setOrderItems((prev) => prev.map(item => item.menuItem.id === menuItemId ? { ...item, quantity } : item));
    }
  }, [handleRemoveItem]);

  const handleSubmit = React.useCallback(() => {
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
        subtotal: subtotal,
        discount: 0,
        total: subtotal,
        customerId: selectedCustomer?.id,
        customerName: selectedCustomer?.name,
    });
  }, [orderItems, tableNumber, onSubmit, subtotal, selectedCustomer, toast]);
  
  const menuByCategory = React.useMemo(() => {
    return allMenuItems.reduce((acc, item) => {
      (acc[item.category] = acc[item.category] || []).push(item);
      return acc;
    }, {} as Record<string, MenuItem[]>);
  }, [allMenuItems]);

  const availableTables = React.useMemo(() => {
    return allTables.filter(table => table.status === 'available');
  }, [allTables]);


  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-headline">Create New Order</DialogTitle>
        <DialogDescription>
          Browse the menu and add items to the order.
        </DialogDescription>
      </DialogHeader>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={orderItems.length === 0 || tableNumber === ""}>Place Order</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0">
        {/* Left Side: Menu */}
        <div className="flex flex-col h-full min-h-0">
          <h3 className="font-semibold font-headline text-lg mb-2">Menu</h3>
           <ScrollArea className="flex-1 pr-4 -mr-4 border rounded-md">
            <Accordion type="multiple" defaultValue={Object.keys(menuByCategory)} className="w-full">
            {Object.entries(menuByCategory).map(([category, items]) => (
                <AccordionItem value={category} key={category}>
                    <AccordionTrigger className="font-semibold text-md sticky top-0 bg-background/95 backdrop-blur-sm py-2 px-2">
                        {category}
                    </AccordionTrigger>
                    <AccordionContent className="p-1">
                         <div className="grid grid-cols-1 gap-2 p-1">
                            {items.map(item => (
                                <Card key={item.id} className="flex p-2 items-center gap-2 cursor-pointer hover:bg-accent/50" onClick={() => handleAddItem(item)}>
                                    {item.image && <Image src={item.image} alt={item.name} width={64} height={64} className="rounded-md object-cover" />}
                                    <div className="flex-1">
                                        <p className="font-semibold">{item.name}</p>
                                        <p className="text-sm text-muted-foreground">{appConfig.currency}{item.price.toFixed(2)}</p>
                                    </div>
                                    <div className="p-2">
                                        <PlusCircle className="text-primary"/>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            ))}
            </Accordion>
          </ScrollArea>
        </div>

        {/* Right Side: Order Summary */}
        <div className="flex flex-col h-full min-h-0">
          <h3 className="font-semibold font-headline text-lg mb-2">Current Order</h3>
          <Card className="flex-1 flex flex-col">
            <CardHeader className="space-y-4">
                <div className="space-y-1">
                    <Label htmlFor="tableNumber">Table Number</Label>
                     <Select value={tableNumber} onValueChange={setTableNumber}>
                        <SelectTrigger id="tableNumber">
                            <SelectValue placeholder="Select an available table" />
                        </SelectTrigger>
                        <SelectContent>
                            {availableTables.length > 0 ? (
                                availableTables.map(table => (
                                    <SelectItem key={table.id} value={String(table.id)}>
                                        Table {table.id} (Capacity: {table.capacity})
                                    </SelectItem>
                                ))
                            ) : (
                                <SelectItem value="disabled" disabled>No available tables</SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-1">
                    <Label>Customer (Optional)</Label>
                    {selectedCustomer ? (
                        <div className="flex items-center justify-between p-2 rounded-md bg-muted">
                            <span className="font-medium">{selectedCustomer.name}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedCustomer(null)}>
                                <X className="h-4 w-4"/>
                            </Button>
                        </div>
                    ) : (
                        <CustomerSearchPopover customers={allCustomers} onSelectCustomer={setSelectedCustomer} />
                    )}
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
                          <p className="text-sm text-muted-foreground">{appConfig.currency}{item.menuItem.price.toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleUpdateQuantity(item.menuItem.id, item.quantity - 1)}><MinusCircle className="h-4 w-4" /></Button>
                            <span>{item.quantity}</span>
                            <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleUpdateQuantity(item.menuItem.id, item.quantity + 1)}><PlusCircle className="h-4 w-4" /></Button>
                        </div>
                        <p className="w-16 text-right font-medium">{appConfig.currency}{(item.menuItem.price * item.quantity).toFixed(2)}</p>
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
                            <span>{appConfig.currency}{subtotal.toFixed(2)}</span>
                        </div>
                    </CardFooter>
                </>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

function CustomerSearchPopover({ customers, onSelectCustomer }: { customers: Customer[], onSelectCustomer: (customer: Customer) => void }) {
    const [open, setOpen] = React.useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-start">
                    Search for a customer...
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                    <CommandInput placeholder="Search by name, email..." />
                    <CommandList>
                        <CommandEmpty>No customer found.</CommandEmpty>
                        <CommandGroup>
                            {customers.map((customer) => (
                                <CommandItem
                                    key={customer.id}
                                    value={`${customer.name} ${customer.email}`}
                                    onSelect={() => {
                                        onSelectCustomer(customer);
                                        setOpen(false);
                                    }}
                                >
                                    {customer.name}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

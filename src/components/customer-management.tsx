
"use client";

import * as React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { Customer } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription as DialogDesc } from "./ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Input } from "./ui/input";
import { Mail, Phone, PlusCircle, Edit, Trash2, Star, Upload } from "lucide-react";
import { addNewCustomer, saveCustomers } from "@/app/actions";
import { cn } from "@/lib/utils";
import { useAppData } from "@/hooks/use-app-data";
import { Skeleton } from "./ui/skeleton";


const emptyCustomer: Omit<Customer, 'id' | 'loyaltyPoints'> = { name: "", email: "", phone: "", avatar: "" };

function CustomerManagementLoading() {
    return (
        <div className="flex flex-col">
            <div className="flex items-center justify-between mb-4 gap-4">
                <h1 className="text-2xl font-bold font-headline">Customer Management</h1>
                <Skeleton className="h-10 w-48" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="items-center text-center">
                            <Skeleton className="h-20 w-20 rounded-full" />
                            <div className="flex-1 pt-2 w-full space-y-2">
                                <Skeleton className="h-6 w-3/4 mx-auto" />
                                <Skeleton className="h-4 w-1/2 mx-auto" />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-4 w-4 rounded" />
                                <Skeleton className="h-4 w-full" />
                            </div>
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-4 w-4 rounded" />
                                <Skeleton className="h-4 w-full" />
                            </div>
                        </CardContent>
                        <div className="flex justify-end p-2 border-t">
                            <Skeleton className="h-8 w-8" />
                            <Skeleton className="h-8 w-8 ml-2" />
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    )
}

export function CustomerManagement() {
  const { allCustomers, setAllCustomers, loading, refreshData } = useAppData();
  const [isDialogOpen, setDialogOpen] = React.useState(false);
  const [editingCustomer, setEditingCustomer] = React.useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");

  const handleEdit = React.useCallback((customer: Customer) => {
    setEditingCustomer(customer);
    setDialogOpen(true);
  }, []);
  
  const handleAddNew = React.useCallback(() => {
    setEditingCustomer(null);
    setDialogOpen(true);
  }, []);
  
  const handleDelete = React.useCallback(async (customerId: string) => {
    const updatedCustomers = allCustomers.filter(customer => customer.id !== customerId);
    setAllCustomers(updatedCustomers);
    await saveCustomers(updatedCustomers);
  }, [allCustomers, setAllCustomers]);

  const handleSave = React.useCallback(async (customerData: Customer | Omit<Customer, 'id'|'loyaltyPoints'>) => {
    if ('id' in customerData) { // Editing existing customer
        const updatedCustomers = allCustomers.map(customer => customer.id === customerData.id ? customerData : customer);
        setAllCustomers(updatedCustomers);
        await saveCustomers(updatedCustomers);
    } else { // Adding new customer
        await addNewCustomer(customerData);
        await refreshData();
    }
    setDialogOpen(false);
    setEditingCustomer(null);
  }, [allCustomers, setAllCustomers, refreshData]);

  const filteredCustomers = React.useMemo(() => {
    return allCustomers.filter(customer =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm)
    );
  }, [allCustomers, searchTerm]);

  if (loading) {
      return <CustomerManagementLoading />
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-4 gap-4">
        <h1 className="text-2xl font-bold font-headline">Customer Management</h1>
        <div className="flex-1 max-w-sm">
            <Input 
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Customer
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredCustomers.map((customer) => (
          <Card key={customer.id} className="flex flex-col">
            <CardHeader className="items-center text-center">
                <Avatar className="h-20 w-20">
                    <AvatarImage src={customer.avatar || "https://placehold.co/100x100.png"} alt={customer.name} />
                    <AvatarFallback>{customer.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 pt-2">
                    <CardTitle>{customer.name}</CardTitle>
                    <CardDescription className="flex items-center justify-center gap-1 text-yellow-500">
                        <Star className="h-4 w-4" /> {customer.loyaltyPoints} Points
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${customer.email}`} className="text-sm hover:underline truncate">
                  {customer.email}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{customer.phone}</span>
              </div>
            </CardContent>
            <div className="flex justify-end p-2 border-t">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(customer)}>
                    <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(customer.id)}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
          </Card>
        ))}
      </div>
      {isDialogOpen && <EditCustomerDialog
        isOpen={isDialogOpen}
        onOpenChange={setDialogOpen}
        customer={editingCustomer}
        onSave={handleSave}
      />}
    </div>
  );
}


const formSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(2, "Name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(10, "Invalid phone number"),
    avatar: z.string().url().optional().or(z.literal('')),
    loyaltyPoints: z.coerce.number().min(0, "Loyalty points cannot be negative.").optional(),
});

type FormValues = z.infer<typeof formSchema>;

function EditCustomerDialog({ isOpen, onOpenChange, customer, onSave }: { isOpen: boolean, onOpenChange: (open: boolean) => void, customer: Customer | null, onSave: (data: any) => void}) {
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: customer ? { ...customer } : { ...emptyCustomer, loyaltyPoints: 0 },
    });

    React.useEffect(() => {
        form.reset(customer ? { ...customer } : { ...emptyCustomer, loyaltyPoints: 0 });
    }, [customer, form]);

    function onSubmit(values: FormValues) {
        if(customer) { // Editing
            onSave(values as Customer);
        } else { // Creating
            const { id, loyaltyPoints, ...newCustomerData } = values;
            onSave(newCustomerData);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{customer ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
                    <DialogDesc>
                        {customer ? 'Update the details for this customer.' : 'Fill in the details for the new customer.'}
                    </DialogDesc>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="email" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl><Input placeholder="john.doe@example.com" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="phone" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Phone</FormLabel>
                                <FormControl><Input placeholder="123-456-7890" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                         <FormField control={form.control} name="avatar" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Avatar URL</FormLabel>
                                <FormControl><Input placeholder="https://placehold.co/100x100.png" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormItem>
                            <FormLabel>Upload Image</FormLabel>
                            <div className="flex items-center gap-2">
                                <Input type="file" className="flex-1" disabled/>
                                <Button variant="outline" type="button" disabled>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Upload
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">Image uploads are not implemented in this demo.</p>
                        </FormItem>
                        {customer && <FormField control={form.control} name="loyaltyPoints" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Loyalty Points</FormLabel>
                                <FormControl><Input type="number" placeholder="0" {...field} value={field.value || 0} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />}
                        <DialogFooter>
                            <Button type="submit">Save Changes</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

    
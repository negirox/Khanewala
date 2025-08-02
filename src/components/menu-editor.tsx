

"use client";

import * as React from "react";
import Papa from "papaparse";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { menuItems as initialMenuItems } from "@/lib/data";
import type { MenuItem } from "@/lib/types";
import { PlusCircle, Edit, Trash2, Upload } from "lucide-react";
import { Textarea } from "./ui/textarea";
import { csvRepository } from "@/services/csv-repository";
import { appConfig } from "@/lib/config";
import { useToast } from "@/hooks/use-toast";


const emptyMenuItem: MenuItem = { id: "", name: "", price: 0, category: "Main Courses", description: "" };

export function MenuEditor() {
  const [menuItems, setMenuItems] = React.useState<MenuItem[]>([]);
  const [isDialogOpen, setDialogOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<MenuItem | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    csvRepository.getMenuItems().then(setMenuItems);
  }, []);

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setDialogOpen(true);
  };
  
  const handleAddNew = () => {
    setEditingItem(null);
    setDialogOpen(true);
  };
  
  const handleDelete = (itemId: string) => {
    const updatedItems = menuItems.filter(item => item.id !== itemId);
    setMenuItems(updatedItems);
    csvRepository.saveMenuItems(updatedItems);
  }

  const handleSave = (itemData: MenuItem) => {
    let updatedItems;
    if (editingItem) {
      updatedItems = menuItems.map(item => item.id === itemData.id ? itemData : item)
    } else {
      updatedItems = [...menuItems, { ...itemData, id: `ITEM${Date.now()}` }];
    }
    setMenuItems(updatedItems);
    csvRepository.saveMenuItems(updatedItems);
    setDialogOpen(false);
    setEditingItem(null);
  };
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          // Note: This is a basic import. For production, you'd want
          // robust validation (e.g., with Zod) on the parsed data.
          const newItems = results.data.map((row: any) => ({
            id: `ITEM${Date.now()}_${Math.random()}`,
            name: row.name || "Unnamed Item",
            price: Number(row.price) || 0,
            category: ["Appetizers", "Main Courses", "Desserts", "Beverages"].includes(row.category) ? row.category : "Main Courses",
            description: row.description || "",
            image: row.image || "https://placehold.co/600x400.png",
          })) as MenuItem[];

          const updatedMenuItems = [...menuItems, ...newItems];
          setMenuItems(updatedMenuItems);
          csvRepository.saveMenuItems(updatedMenuItems);
          
          toast({
            title: "Menu Imported",
            description: `${newItems.length} items were successfully imported from the CSV file.`,
          });
        },
        error: (error) => {
          toast({
            variant: "destructive",
            title: "Import Error",
            description: `Failed to parse CSV file: ${error.message}`,
          });
        }
      });
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col">
       <div className="flex items-center justify-between mb-4 gap-2">
        <h1 className="text-2xl font-bold font-headline">Menu Editor</h1>
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".csv"
          />
          <Button variant="outline" onClick={triggerFileUpload}>
            <Upload className="mr-2 h-4 w-4" />
            Upload CSV
          </Button>
          <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Item
          </Button>
        </div>
      </div>
      <Card className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {menuItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>{appConfig.currency}{item.price.toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <EditItemDialog 
        isOpen={isDialogOpen}
        onOpenChange={setDialogOpen}
        item={editingItem}
        onSave={handleSave}
      />
    </div>
  );
}

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Card } from "./ui/card";

const formSchema = z.object({
  id: z.string(),
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  price: z.coerce.number().min(0, { message: "Price cannot be negative." }),
  category: z.enum(["Appetizers", "Main Courses", "Desserts", "Beverages"]),
  description: z.string().optional(),
});


function EditItemDialog({ isOpen, onOpenChange, item, onSave }: { isOpen: boolean, onOpenChange: (open: boolean) => void, item: MenuItem | null, onSave: (data: MenuItem) => void}) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: item || emptyMenuItem,
  });
  
  React.useEffect(() => {
    form.reset(item || emptyMenuItem);
  }, [item, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    onSave(values);
  }
  
  return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{item ? 'Edit Menu Item' : 'Add New Menu Item'}</DialogTitle>
            <DialogDescription>
              {item ? 'Update the details for this menu item.' : 'Fill in the details for the new menu item.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Butter Chicken" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="e.g. 15.99" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Appetizers">Appetizers</SelectItem>
                        <SelectItem value="Main Courses">Main Courses</SelectItem>
                        <SelectItem value="Desserts">Desserts</SelectItem>
                        <SelectItem value="Beverages">Beverages</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="A short description of the dish." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
  );
}


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
import type { MenuItem } from "@/lib/types";
import { PlusCircle, Edit, Trash2, Upload, Download, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Textarea } from "./ui/textarea";
import { saveMenuItems } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Card } from "./ui/card";
import { useAppData } from "@/hooks/use-app-data";
import { Skeleton } from "./ui/skeleton";

const emptyMenuItem: MenuItem = { id: "", name: "", price: 0, category: "Main Courses", description: "" };
const menuCategories = ["Appetizers", "Main Courses", "Desserts", "Beverages", "Breads", "Rice & Biryani", "Indian Chinese"];

const ITEMS_PER_PAGE = 10;

function MenuEditorLoading() {
    return (
        <div className="flex flex-col">
            <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-2">
                <Skeleton className="h-10 w-full max-w-sm" />
                <div className="flex flex-wrap gap-2">
                    <Skeleton className="h-10 w-40" />
                    <Skeleton className="h-10 w-40" />
                    <Skeleton className="h-10 w-40" />
                </div>
            </div>
            <Card className="p-0">
                 <Skeleton className="h-96 w-full" />
            </Card>
        </div>
    )
}

export function MenuEditor() {
  const { allMenuItems, refreshData, loading, appConfig } = useAppData();
  const [isDialogOpen, setDialogOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<MenuItem | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = React.useState("");
  const [sortConfig, setSortConfig] = React.useState<{ key: keyof MenuItem; direction: 'ascending' | 'descending' } | null>({ key: 'name', direction: 'ascending' });
  const [currentPage, setCurrentPage] = React.useState(1);


  const handleEdit = React.useCallback((item: MenuItem) => {
    setEditingItem(item);
    setDialogOpen(true);
  }, []);
  
  const handleAddNew = React.useCallback(() => {
    setEditingItem(null);
    setDialogOpen(true);
  }, []);
  
  const handleDelete = React.useCallback(async (itemId: string) => {
    const updatedItems = allMenuItems.filter(item => item.id !== itemId);
    await saveMenuItems(updatedItems);
    await refreshData();
  }, [allMenuItems, refreshData]);

  const handleSave = React.useCallback(async (itemData: MenuItem) => {
    let updatedItems;
    if (editingItem) {
      updatedItems = allMenuItems.map(item => item.id === itemData.id ? itemData : item)
    } else {
      updatedItems = [...allMenuItems, { ...itemData, id: `ITEM${Date.now()}` }];
    }
    await saveMenuItems(updatedItems);
    await refreshData();
    setDialogOpen(false);
    setEditingItem(null);
  }, [editingItem, allMenuItems, refreshData]);
  
  const handleFileUpload = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const newItems = results.data.map((row: any) => ({
            id: `ITEM${Date.now()}_${Math.random()}`,
            name: row.name || "Unnamed Item",
            price: Number(row.price) || 0,
            category: menuCategories.includes(row.category) ? row.category : "Main Courses",
            description: row.description || "",
            image: row.image || "https://placehold.co/600x400.png",
          })) as MenuItem[];

          const updatedMenuItems = [...allMenuItems, ...newItems];
          await saveMenuItems(updatedMenuItems);
          await refreshData();
          
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
  }, [toast, allMenuItems, refreshData]);

  const triggerFileUpload = React.useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleDownloadSample = React.useCallback(() => {
    const sampleData = [
      { name: "Samosa", price: 5.99, category: "Appetizers", description: "Crispy pastry with spiced potatoes and peas.", image: "https://placehold.co/600x400.png" },
      { name: "Paneer Butter Masala", price: 14.99, category: "Main Courses", description: "Paneer in a creamy tomato sauce.", image: "https://placehold.co/600x400.png" },
    ];
    const csv = Papa.unparse(sampleData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'sample-menu.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const requestSort = React.useCallback((key: keyof MenuItem) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  }, [sortConfig]);

  const getSortIcon = React.useCallback((key: keyof MenuItem) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="h-4 w-4 ml-2" />;
    }
    return <ArrowUpDown className="h-4 w-4 ml-2 text-primary" />;
  }, [sortConfig]);

  const sortedAndFilteredItems = React.useMemo(() => {
    let sortableItems = [...allMenuItems];
    if (searchTerm) {
      sortableItems = sortableItems.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [allMenuItems, searchTerm, sortConfig]);

  const totalPages = Math.ceil(sortedAndFilteredItems.length / ITEMS_PER_PAGE);
  const paginatedItems = React.useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedAndFilteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedAndFilteredItems, currentPage]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (loading || !appConfig) {
      return <MenuEditorLoading />;
  }

  return (
    <div className="flex flex-col">
       <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-2">
         <Input
            placeholder="Search by name or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        <div className="flex flex-wrap gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".csv"
          />
           <Button variant="outline" onClick={handleDownloadSample}>
            <Download className="mr-2 h-4 w-4" />
            Download Sample
          </Button>
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
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><Button variant="ghost" onClick={() => requestSort('name')}>Name {getSortIcon('name')}</Button></TableHead>
                <TableHead><Button variant="ghost" onClick={() => requestSort('category')}>Category {getSortIcon('category')}</Button></TableHead>
                <TableHead><Button variant="ghost" onClick={() => requestSort('price')}>Price {getSortIcon('price')}</Button></TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.map((item) => (
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
        </div>
        <div className="flex items-center justify-end space-x-2 p-4">
            <div className="flex-1 text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
            </div>
            <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
            >
                <ChevronLeft className="h-4 w-4" />
                Previous
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
            >
                Next
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
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

const formSchema = z.object({
  id: z.string(),
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  price: z.coerce.number().min(0, { message: "Price cannot be negative." }),
  category: z.enum(menuCategories),
  description: z.string().optional(),
  image: z.string().url().optional().or(z.literal('')),
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
                        {menuCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
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
              <FormField
                  control={form.control}
                  name="image"
                  render={({field}) => (
                    <FormItem>
                      <FormLabel>Image URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://placehold.co/600x400.png"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormItem>
                  <FormLabel>Upload Image</FormLabel>
                  <div className="flex items-center gap-2">
                    <Input type="file" className="flex-1" disabled />
                    <Button variant="outline" type="button" disabled>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Max 300kb. Image uploads are not implemented in this demo.
                  </p>
                </FormItem>
              <DialogFooter>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
  );
}

    

    
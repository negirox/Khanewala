
"use client";

import * as React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { StaffMember, StaffTransaction, StaffTransactionType, PaymentMode } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Mail, Phone, Clock, PlusCircle, Edit, Trash2, DollarSign, Upload, HandCoins, Download, History, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { saveStaff, addStaffTransaction, generateStaffTransactionReport, uploadAvatar } from "@/app/actions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "./ui/separator";
import { DateRange } from "react-day-picker";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { useAppData } from "@/hooks/use-app-data";
import { Skeleton } from "./ui/skeleton";

const roleColors: Record<StaffMember['role'], string> = {
    Manager: "bg-red-500 text-white",
    Chef: "bg-orange-500 text-white",
    Waiter: "bg-blue-500 text-white",
    Busboy: "bg-green-500 text-white",
};

const emptyStaffMember: StaffMember = { id: "", name: "", role: "Waiter", email: "", phone: "", shift: "Morning", avatar: "", salary: 0, aadharCard: "", panCard: "", voterId: "", carryForwardBalance: 0 };

function StaffManagementLoading() {
    return (
        <div className="flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold font-headline">Staff Management</h1>
                <Skeleton className="h-10 w-36" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                 {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="items-center text-center">
                            <Skeleton className="h-20 w-20 rounded-full" />
                            <div className="flex-1 pt-2 w-full space-y-2">
                                <Skeleton className="h-6 w-3/4 mx-auto" />
                                <Skeleton className="h-5 w-1/4 mx-auto" />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Skeleton className="h-5 w-full" />
                            <Skeleton className="h-5 w-full" />
                            <Skeleton className="h-5 w-full" />
                            <Skeleton className="h-5 w-full" />
                        </CardContent>
                        <CardFooter className="flex flex-col gap-2 border-t pt-2">
                            <Skeleton className="h-9 w-full" />
                             <div className="flex justify-end w-full">
                                <Skeleton className="h-8 w-8" />
                                <Skeleton className="h-8 w-8 ml-2" />
                            </div>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    )
}

export function StaffManagement() {
  const { allStaff, allStaffTransactions, refreshData, loading, appConfig } = useAppData();
  const [isFormDialogOpen, setFormDialogOpen] = React.useState(false);
  const [isTransactionDialogOpen, setTransactionDialogOpen] = React.useState(false);
  const [editingStaff, setEditingStaff] = React.useState<StaffMember | null>(null);
  const [viewingStaff, setViewingStaff] = React.useState<StaffMember | null>(null);


  const handleEdit = React.useCallback((member: StaffMember) => {
    setEditingStaff(member);
    setFormDialogOpen(true);
  }, []);
  
  const handleAddNew = React.useCallback(() => {
    setEditingStaff(null);
    setFormDialogOpen(true);
  }, []);
  
  const handleDelete = React.useCallback(async (staffId: string) => {
    const updatedStaff = allStaff.filter(member => member.id !== staffId);
    await saveStaff(updatedStaff);
    await refreshData();
  }, [allStaff, refreshData]);

  const handleSave = React.useCallback(async (staffData: StaffMember) => {
    let updatedStaff;
    if (editingStaff) {
      updatedStaff = allStaff.map(member => member.id === staffData.id ? staffData : member);
    } else {
      updatedStaff = [...allStaff, { ...staffData, id: `STAFF${Date.now()}`, carryForwardBalance: 0 }];
    }
    await saveStaff(updatedStaff);
    await refreshData();
    
    setFormDialogOpen(false);
    setEditingStaff(null);
  }, [editingStaff, allStaff, refreshData]);

  const handleViewTransactions = React.useCallback((member: StaffMember) => {
    setViewingStaff(member);
    setTransactionDialogOpen(true);
  }, []);

  const handleAddTransaction = React.useCallback(async ({ newTransaction, updatedStaffMember }: { newTransaction: StaffTransaction, updatedStaffMember: StaffMember }) => {
    await refreshData();
    setViewingStaff(updatedStaffMember); // Update the currently viewed staff member
  }, [refreshData]);

  if (loading || !appConfig) {
      return <StaffManagementLoading />
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold font-headline">Staff Management</h1>
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Staff
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {allStaff.map((member) => (
          <Card key={member.id} className="flex flex-col">
            <CardHeader className="items-center text-center">
                <Avatar className="h-20 w-20">
                    <AvatarImage src={member.avatar || "https://placehold.co/100x100.png"} alt={member.name} />
                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 pt-2">
                    <CardTitle className="text-xl">{member.name}</CardTitle>
                    <Badge className={cn("mt-1", roleColors[member.role])}>{member.role}</Badge>
                </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${member.email}`} className="hover:underline truncate">
                  {member.email}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{member.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Shift: {member.shift}</span>
              </div>
               <div className="flex items-center gap-3">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span>Salary: {appConfig.currency}{member.salary?.toFixed(2) ?? 'N/A'}</span>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2 border-t pt-2">
                <Button variant="outline" className="w-full" onClick={() => handleViewTransactions(member)}>
                    <HandCoins className="mr-2"/> View Transactions
                </Button>
                <div className="flex justify-end w-full">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(member)}>
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(member.id)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </CardFooter>
          </Card>
        ))}
      </div>
      {isFormDialogOpen && <EditStaffDialog
        isOpen={isFormDialogOpen}
        onOpenChange={setFormDialogOpen}
        staffMember={editingStaff}
        onSave={handleSave}
      />}
       {isTransactionDialogOpen && <StaffTransactionDialog
        isOpen={isTransactionDialogOpen}
        onOpenChange={setTransactionDialogOpen}
        staffMember={viewingStaff}
        transactions={allStaffTransactions.filter(t => t.staffId === viewingStaff?.id)}
        onAddTransaction={handleAddTransaction}
      />}
    </div>
  );
}


const formSchema = z.object({
    id: z.string(),
    name: z.string().min(2, "Name is required"),
    role: z.enum(["Manager", "Chef", "Waiter", "Busboy"]),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(1, "Phone number is required"),
    shift: z.enum(["Morning", "Afternoon", "Night"]),
    avatar: z.string().url("Invalid URL").optional().or(z.literal('')),
    salary: z.coerce.number().min(0, "Salary cannot be negative.").optional(),
    aadharCard: z.string().optional(),
    panCard: z.string().optional(),
    voterId: z.string().optional(),
    carryForwardBalance: z.coerce.number().optional(),
});

export function EditStaffDialog({ isOpen, onOpenChange, staffMember, onSave }: { isOpen: boolean, onOpenChange: (open: boolean) => void, staffMember: StaffMember | null, onSave: (data: StaffMember) => void}) {
    const { toast } = useToast();
    const [isUploading, setIsUploading] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: staffMember || emptyStaffMember,
    });

    React.useEffect(() => {
        const defaults = staffMember ? {...staffMember, carryForwardBalance: staffMember.carryForwardBalance || 0} : emptyStaffMember;
        form.reset(defaults);
    }, [staffMember, form]);

    function onSubmit(values: z.infer<typeof formSchema>) {
        onSave({...values, carryForwardBalance: values.carryForwardBalance || 0});
    }

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const staffId = staffMember?.id || `new-${Date.now()}`;
        const formData = new FormData();
        formData.append('avatar', file);
        formData.append('type', 'staff');
        formData.append('id', staffId);

        const result = await uploadAvatar(formData);
        setIsUploading(false);

        if (result.success && result.filePath) {
            form.setValue('avatar', result.filePath);
            toast({
                title: "Avatar Uploaded!",
                description: "The new avatar has been uploaded. Save changes to apply it.",
            });
        } else {
            toast({
                variant: "destructive",
                title: "Upload Failed",
                description: result.error,
            });
        }
    };


    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{staffMember ? 'Edit Staff Member' : 'Add New Staff Member'}</DialogTitle>
                    <DialogDescription>
                        {staffMember ? 'Update the details for this staff member.' : 'Fill in the details for the new staff member.'}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem><FormLabel>Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="email" render={({ field }) => (
                            <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="john.doe@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="phone" render={({ field }) => (
                            <FormItem><FormLabel>Phone</FormLabel><FormControl><Input placeholder="123-456-7890" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                         <FormField control={form.control} name="role" render={({ field }) => (
                            <FormItem><FormLabel>Role</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Manager">Manager</SelectItem><SelectItem value="Chef">Chef</SelectItem><SelectItem value="Waiter">Waiter</SelectItem><SelectItem value="Busboy">Busboy</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="shift" render={({ field }) => (
                            <FormItem><FormLabel>Shift</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a shift" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Morning">Morning</SelectItem><SelectItem value="Afternoon">Afternoon</SelectItem><SelectItem value="Night">Night</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                        )} />
                         <FormField control={form.control} name="avatar" render={({ field }) => (
                            <FormItem><FormLabel>Avatar URL</FormLabel><FormControl><Input placeholder="https://placehold.co/100x100.png" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormItem>
                            <FormLabel>Upload Image</FormLabel>
                            <div className="flex items-center gap-2">
                                <Input 
                                  type="file" 
                                  className="hidden" 
                                  ref={fileInputRef} 
                                  onChange={handleAvatarUpload}
                                  accept="image/png, image/jpeg"
                                  disabled={isUploading}
                                />
                                <Button 
                                  variant="outline" 
                                  type="button" 
                                  onClick={() => fileInputRef.current?.click()}
                                  disabled={isUploading}
                                >
                                    <Upload className="mr-2 h-4 w-4" />
                                    {isUploading ? "Uploading..." : "Upload"}
                                </Button>
                            </div>
                        </FormItem>
                         <FormField control={form.control} name="salary" render={({ field }) => (
                            <FormItem><FormLabel>Salary</FormLabel><FormControl><Input type="number" step="0.01" placeholder="30000.00" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        {staffMember && <FormField control={form.control} name="carryForwardBalance" render={({ field }) => (
                            <FormItem><FormLabel>Carry Forward Balance</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />}
                        <FormField control={form.control} name="aadharCard" render={({ field }) => (
                            <FormItem><FormLabel>Aadhar Card No.</FormLabel><FormControl><Input placeholder="1234 5678 9012" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="panCard" render={({ field }) => (
                            <FormItem><FormLabel>PAN Card No.</FormLabel><FormControl><Input placeholder="ABCDE1234F" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="voterId" render={({ field }) => (
                            <FormItem><FormLabel>Voter ID No.</FormLabel><FormControl><Input placeholder="XYZ1234567" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <DialogFooter><Button type="submit">Save Changes</Button></DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

const transactionTypes: StaffTransactionType[] = ["Advance", "Daily Wage", "Bonus", "Salary"];
const paymentModes: PaymentMode[] = ["Cash", "Online"];

const transactionFormSchema = z.object({
    amount: z.coerce.number().positive("Amount must be positive"),
    type: z.enum(transactionTypes),
    paymentMode: z.enum(paymentModes),
    notes: z.string().optional(),
});


export function StaffTransactionDialog({ isOpen, onOpenChange, staffMember, transactions, onAddTransaction }: { 
    isOpen: boolean; 
    onOpenChange: (open: boolean) => void; 
    staffMember: StaffMember | null; 
    transactions: StaffTransaction[];
    onAddTransaction: (data: {newTransaction: StaffTransaction, updatedStaffMember: StaffMember}) => void;
}) {
    const { toast } = useToast();
    const { appConfig } = useAppData();
    const form = useForm<z.infer<typeof transactionFormSchema>>({
        resolver: zodResolver(transactionFormSchema),
        defaultValues: { amount: 0, type: "Advance", paymentMode: "Cash", notes: "" },
    });
    const [isHistoryOpen, setHistoryOpen] = React.useState(false);
    
    const monthlyReport = React.useMemo(() => {
        const currentMonthTxs = transactions.filter(tx => {
            const txDate = new Date(tx.date);
            const today = new Date();
            return txDate.getMonth() === today.getMonth() && txDate.getFullYear() === today.getFullYear();
        });

        const grossSalary = staffMember?.salary || 0;
        const carryForward = staffMember?.carryForwardBalance || 0;

        const advances = currentMonthTxs.filter(tx => tx.type === 'Advance').reduce((sum, tx) => sum + tx.amount, 0);
        const dailyWages = currentMonthTxs.filter(tx => tx.type === 'Daily Wage').reduce((sum, tx) => sum + tx.amount, 0);
        const bonuses = currentMonthTxs.filter(tx => tx.type === 'Bonus').reduce((sum, tx) => sum + tx.amount, 0);
        const salariesPaid = currentMonthTxs.filter(tx => tx.type === 'Salary').reduce((sum, tx) => sum + tx.amount, 0);
        
        const totalDeductions = advances + dailyWages;
        const netPayable = grossSalary + carryForward + bonuses - totalDeductions - salariesPaid;

        return { grossSalary, carryForward, totalDeductions, bonuses, salariesPaid, netPayable };
    }, [transactions, staffMember]);

    async function onSubmit(values: z.infer<typeof transactionFormSchema>) {
        if (!staffMember || !appConfig) return;
        
        const result = await addStaffTransaction({ ...values, staffId: staffMember.id }, staffMember, monthlyReport.netPayable);
        onAddTransaction(result);

        toast({
            title: "Transaction Added",
            description: `${values.type} of ${appConfig.currency}${values.amount} recorded for ${staffMember.name}.`,
        });
        form.reset();
    }
    
    if (!staffMember || !appConfig) return null;

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Salary Report: {staffMember.name}</DialogTitle>
                        <DialogDescription>View salary summary and add transactions.</DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid md:grid-cols-2 gap-x-8 flex-1 min-h-0">
                        {/* Left: Report */}
                        <div className="flex flex-col gap-4">
                            <Card>
                                <CardHeader><CardTitle className="text-xl">Current Month Summary</CardTitle></CardHeader>
                                <CardContent className="text-sm space-y-2">
                                    <div className="flex justify-between"><span>Gross Salary:</span> <span className="font-medium">{appConfig.currency}{monthlyReport.grossSalary.toFixed(2)}</span></div>
                                    <div className="flex justify-between"><span>Carry Forward (Last Month):</span> <span className={cn("font-medium", monthlyReport.carryForward >= 0 ? 'text-green-600' : 'text-red-600')}>{appConfig.currency}{monthlyReport.carryForward.toFixed(2)}</span></div>
                                    <div className="flex justify-between"><span>Bonus:</span> <span className="font-medium text-green-600">+{appConfig.currency}{monthlyReport.bonuses.toFixed(2)}</span></div>
                                    <div className="flex justify-between"><span>Deductions (Advance/Daily):</span> <span className="font-medium text-red-600">-{appConfig.currency}{monthlyReport.totalDeductions.toFixed(2)}</span></div>
                                    <div className="flex justify-between"><span>Salary Paid this month:</span> <span className="font-medium">-{appConfig.currency}{monthlyReport.salariesPaid.toFixed(2)}</span></div>
                                    <Separator />
                                    <div className="flex justify-between font-bold text-base"><span>Net Payable:</span> <span>{appConfig.currency}{monthlyReport.netPayable.toFixed(2)}</span></div>
                                </CardContent>
                                <CardFooter>
                                    <Button variant="outline" className="w-full" onClick={() => setHistoryOpen(true)}>
                                        <History className="mr-2 h-4 w-4" /> View Full History
                                    </Button>
                                </CardFooter>
                            </Card>
                        </div>

                        {/* Right: Add Transaction */}
                        <div className="flex flex-col gap-4 mt-4 md:mt-0">
                            <h3 className="font-semibold text-lg">Add New Transaction</h3>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4 border rounded-md bg-muted/50">
                                    <FormField control={form.control} name="type" render={({ field }) => (
                                        <FormItem><FormLabel>Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl><SelectContent>{transactionTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="amount" render={({ field }) => (
                                        <FormItem><FormLabel>Amount</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="paymentMode" render={({ field }) => (
                                        <FormItem><FormLabel>Payment Mode</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select mode" /></SelectTrigger></FormControl><SelectContent>{paymentModes.map(mode => <SelectItem key={mode} value={mode}>{mode}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="notes" render={({ field }) => (
                                        <FormItem><FormLabel>Notes (Optional)</FormLabel><FormControl><Input placeholder="e.g. for personal use" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <Button type="submit" className="w-full">Add Transaction</Button>
                                </form>
                            </Form>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {isHistoryOpen && <TransactionHistoryDialog 
                isOpen={isHistoryOpen} 
                onOpenChange={setHistoryOpen}
                staffMember={staffMember}
                transactions={transactions}
                summary={{
                    grossSalary: monthlyReport.grossSalary,
                    carryForward: monthlyReport.carryForward,
                    totalDeductions: monthlyReport.totalDeductions,
                    bonuses: monthlyReport.bonuses,
                    salariesPaid: monthlyReport.salariesPaid,
                    netPayable: monthlyReport.netPayable,
                }}
            />}
        </>
    );
}

const ITEMS_PER_PAGE = 10;

function TransactionHistoryDialog({
    isOpen, onOpenChange, staffMember, transactions, summary
} : {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    staffMember: StaffMember | null;
    transactions: StaffTransaction[];
    summary: { 
        grossSalary: number, 
        carryForward: number, 
        totalDeductions: number, 
        bonuses: number,
        salariesPaid: number,
        netPayable: number
    }
}) {
    const { appConfig } = useAppData();
    const today = new Date();
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
        from: startOfMonth(today),
        to: endOfMonth(today),
    });
    const [transactionTypeFilter, setTransactionTypeFilter] = React.useState<StaffTransactionType | "All">("All");
    const [currentPage, setCurrentPage] = React.useState(1);
    const [sortConfig, setSortConfig] = React.useState<{ key: keyof StaffTransaction; direction: 'ascending' | 'descending' } | null>({ key: 'date', direction: 'descending' });

    const requestSort = React.useCallback((key: keyof StaffTransaction) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    }, [sortConfig]);
    
    const getSortIcon = React.useCallback((key: keyof StaffTransaction) => {
        if (!sortConfig || sortConfig.key !== key) {
          return <ArrowUpDown className="h-4 w-4" />;
        }
        if (sortConfig.direction === 'ascending') {
          return <ArrowUpDown className="h-4 w-4 text-primary" />; // Could use different icons for up/down
        }
        return <ArrowUpDown className="h-4 w-4 text-primary" />;
      }, [sortConfig]);


    const sortedAndFilteredTransactions = React.useMemo(() => {
        let sortableItems = transactions.filter(tx => {
            const txDate = new Date(tx.date);
            const inRange = dateRange?.from && dateRange?.to && txDate >= startOfMonth(dateRange.from) && txDate <= endOfMonth(dateRange.to);
            const typeMatch = transactionTypeFilter === "All" || tx.type === transactionTypeFilter;
            return inRange && typeMatch;
        });

        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];

                if(sortConfig.key === 'date') {
                    return sortConfig.direction === 'ascending' ? new Date(aValue).getTime() - new Date(bValue).getTime() : new Date(bValue).getTime() - new Date(aValue).getTime();
                }

                if (aValue < bValue) {
                  return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                  return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        
        return sortableItems;
    }, [transactions, dateRange, transactionTypeFilter, sortConfig]);

    const totalPages = Math.ceil(sortedAndFilteredTransactions.length / ITEMS_PER_PAGE);
    const paginatedTransactions = React.useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return sortedAndFilteredTransactions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [sortedAndFilteredTransactions, currentPage]);

    React.useEffect(() => {
        setCurrentPage(1);
    }, [dateRange, transactionTypeFilter]);


    const handleExport = async () => {
        if (!staffMember) return;

        const csvString = await generateStaffTransactionReport(staffMember.id, sortedAndFilteredTransactions, summary);
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `${staffMember.name.replace(' ', '_')}_report.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!staffMember || !appConfig) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl w-full max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Transaction History: {staffMember.name}</DialogTitle>
                    <DialogDescription>View, filter, sort, and export all transactions.</DialogDescription>
                </DialogHeader>

                <div className="flex-1 flex flex-col min-h-0 gap-4">
                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full sm:w-auto justify-start text-left font-normal">
                                    {dateRange?.from ? (dateRange.to ? `${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}`: format(dateRange.from, "LLL dd, y")) : "Pick a date range"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start"><Calendar mode="range" selected={dateRange} onSelect={setDateRange} initialFocus /></PopoverContent>
                        </Popover>
                        <Select value={transactionTypeFilter} onValueChange={(v) => setTransactionTypeFilter(v as any)}>
                            <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Filter by type" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All">All Types</SelectItem>
                                {transactionTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Button variant="outline" onClick={handleExport} className="w-full sm:w-auto"><Download className="mr-2 h-4 w-4" /> Export</Button>
                    </div>

                    {/* Table */}
                    <div className="relative flex-1 overflow-auto border rounded-md">
                        <Table>
                            <TableHeader className="sticky top-0 bg-secondary z-10">
                                <TableRow>
                                    <TableHead>
                                        <Button variant="ghost" onClick={() => requestSort('date')}>Date {getSortIcon('date')}</Button>
                                    </TableHead>
                                    <TableHead>
                                        <Button variant="ghost" onClick={() => requestSort('type')}>Type {getSortIcon('type')}</Button>
                                    </TableHead>
                                    <TableHead>Notes</TableHead>
                                    <TableHead className="text-right">
                                        <Button variant="ghost" onClick={() => requestSort('amount')}>Amount {getSortIcon('amount')}</Button>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedTransactions.length > 0 ? paginatedTransactions.map(tx => (
                                    <TableRow key={tx.id}>
                                        <TableCell className="whitespace-nowrap">{format(new Date(tx.date), "dd-MMM-yy")}</TableCell>
                                        <TableCell><Badge variant="outline">{tx.type}</Badge></TableCell>
                                        <TableCell className="text-xs text-muted-foreground truncate max-w-[100px] sm:max-w-[200px]">{tx.notes}</TableCell>
                                        <TableCell className={cn("text-right font-medium whitespace-nowrap", ['Advance', 'Daily Wage', 'Salary'].includes(tx.type)  ? 'text-red-600' : 'text-green-600')}>{appConfig.currency}{tx.amount.toFixed(2)}</TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">No transactions found for the selected filters.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                     {/* Pagination */}
                    <div className="flex items-center justify-end space-x-2 py-4">
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
                </div>
            </DialogContent>
        </Dialog>
    );
}

    
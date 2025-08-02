
"use client";

import * as React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { StaffMember } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Mail, Phone, Clock, PlusCircle, Edit, Trash2, DollarSign, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaff, saveStaff } from "@/app/actions";
import { appConfig } from "@/lib/config";

const roleColors: Record<StaffMember['role'], string> = {
    Manager: "bg-red-500 text-white",
    Chef: "bg-orange-500 text-white",
    Waiter: "bg-blue-500 text-white",
    Busboy: "bg-green-500 text-white",
};

const emptyStaffMember: StaffMember = { id: "", name: "", role: "Waiter", email: "", phone: "", shift: "Morning", avatar: "", salary: 0, aadharCard: "", panCard: "", voterId: "" };

export function StaffManagement() {
  const [staff, setStaff] = React.useState<StaffMember[]>([]);
  const [isDialogOpen, setDialogOpen] = React.useState(false);
  const [editingStaff, setEditingStaff] = React.useState<StaffMember | null>(null);

  React.useEffect(() => {
    getStaff().then(setStaff);
  }, []);

  const handleEdit = React.useCallback((member: StaffMember) => {
    setEditingStaff(member);
    setDialogOpen(true);
  }, []);
  
  const handleAddNew = React.useCallback(() => {
    setEditingStaff(null);
    setDialogOpen(true);
  }, []);
  
  const handleDelete = React.useCallback((staffId: string) => {
    setStaff(prevStaff => {
        const updatedStaff = prevStaff.filter(member => member.id !== staffId);
        saveStaff(updatedStaff);
        return updatedStaff;
    });
  }, []);

  const handleSave = React.useCallback((staffData: StaffMember) => {
    setStaff(prevStaff => {
        let updatedStaff;
        if (editingStaff) {
          updatedStaff = prevStaff.map(member => member.id === staffData.id ? staffData : member);
        } else {
          updatedStaff = [...prevStaff, { ...staffData, id: `STAFF${prevStaff.length + 1}` }];
        }
        saveStaff(updatedStaff);
        return updatedStaff;
    });
    setDialogOpen(false);
    setEditingStaff(null);
  }, [editingStaff]);

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
        {staff.map((member) => (
          <Card key={member.id} className="flex flex-col">
            <CardHeader className="items-center text-center">
                <Avatar className="h-20 w-20">
                    <AvatarImage src={member.avatar || "https://placehold.co/100x100.png"} alt={member.name} />
                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <CardTitle>{member.name}</CardTitle>
                    <Badge className={cn("mt-1", roleColors[member.role])}>{member.role}</Badge>
                </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${member.email}`} className="text-sm hover:underline truncate">
                  {member.email}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{member.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Shift: {member.shift}</span>
              </div>
               <div className="flex items-center gap-3">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Salary: {appConfig.currency}{member.salary?.toFixed(2) ?? 'N/A'}</span>
              </div>
            </CardContent>
            <div className="flex justify-end p-2 border-t">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(member)}>
                    <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(member.id)}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
          </Card>
        ))}
      </div>
      <EditStaffDialog
        isOpen={isDialogOpen}
        onOpenChange={setDialogOpen}
        staffMember={editingStaff}
        onSave={handleSave}
      />
    </div>
  );
}


const formSchema = z.object({
    id: z.string(),
    name: z.string().min(2, "Name is required"),
    role: z.enum(["Manager", "Chef", "Waiter", "Busboy"]),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(10, "Invalid phone number"),
    shift: z.enum(["Morning", "Afternoon", "Night"]),
    avatar: z.string().url().optional().or(z.literal('')),
    salary: z.coerce.number().min(0, "Salary cannot be negative.").optional(),
    aadharCard: z.string().optional(),
    panCard: z.string().optional(),
    voterId: z.string().optional(),
});

function EditStaffDialog({ isOpen, onOpenChange, staffMember, onSave }: { isOpen: boolean, onOpenChange: (open: boolean) => void, staffMember: StaffMember | null, onSave: (data: StaffMember) => void}) {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: staffMember || emptyStaffMember,
    });

    React.useEffect(() => {
        form.reset(staffMember || emptyStaffMember);
    }, [staffMember, form]);

    function onSubmit(values: z.infer<typeof formSchema>) {
        onSave(values);
    }

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
                         <FormField control={form.control} name="role" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Role</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="Manager">Manager</SelectItem>
                                        <SelectItem value="Chef">Chef</SelectItem>
                                        <SelectItem value="Waiter">Waiter</SelectItem>
                                        <SelectItem value="Busboy">Busboy</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="shift" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Shift</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select a shift" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="Morning">Morning</SelectItem>
                                        <SelectItem value="Afternoon">Afternoon</SelectItem>
                                        <SelectItem value="Night">Night</SelectItem>
                                    </SelectContent>
                                </Select>
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
                         <FormField control={form.control} name="salary" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Salary</FormLabel>
                                <FormControl><Input type="number" step="0.01" placeholder="30000.00" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="aadharCard" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Aadhar Card No.</FormLabel>
                                <FormControl><Input placeholder="1234 5678 9012" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="panCard" render={({ field }) => (
                            <FormItem>
                                <FormLabel>PAN Card No.</FormLabel>
                                <FormControl><Input placeholder="ABCDE1234F" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="voterId" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Voter ID No.</FormLabel>
                                <FormControl><Input placeholder="XYZ1234567" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <DialogFooter>
                            <Button type="submit">Save Changes</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

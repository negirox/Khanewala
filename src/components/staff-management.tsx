"use client";

import * as React from "react";
import { initialStaff } from "@/lib/data";
import type { StaffMember } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Mail, Phone, Clock } from "lucide-react";

const roleColors: Record<StaffMember['role'], string> = {
    Manager: "bg-red-500 text-white",
    Chef: "bg-orange-500 text-white",
    Waiter: "bg-blue-500 text-white",
    Busboy: "bg-green-500 text-white",
};

export function StaffManagement() {
  const [staff, setStaff] = React.useState<StaffMember[]>(initialStaff);

  return (
    <div className="flex flex-col">
      <h1 className="text-2xl font-bold font-headline mb-4">Staff Management</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {staff.map((member) => (
          <Card key={member.id} className="flex flex-col">
            <CardHeader className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                    <AvatarImage src={member.avatar} alt={member.name} />
                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 text-center">
                    <CardTitle>{member.name}</CardTitle>
                    <Badge className={cn("mt-1", roleColors[member.role])}>{member.role}</Badge>
                </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${member.email}`} className="text-sm hover:underline">
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
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function cn(...classes: string[]) {
    return classes.filter(Boolean).join(' ');
}


"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Order } from "@/lib/types";
import { format } from "date-fns";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { appConfig } from "@/lib/config";
import { getArchivedOrders } from "@/app/actions";

export function ArchiveDashboard() {
  const [archivedOrders, setArchivedOrders] = React.useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = React.useState("");

  React.useEffect(() => {
    getArchivedOrders().then(setArchivedOrders);
  }, []);

  const filteredOrders = React.useMemo(() => {
    if (!searchTerm) return archivedOrders;
    return archivedOrders.filter(order => 
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(order.tableNumber).includes(searchTerm)
    );
  }, [searchTerm, archivedOrders]);

  return (
    <div className="flex flex-col gap-6">
      {/* Completed Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Archived Orders</CardTitle>
          <CardDescription>
            A complete history of all served orders.
          </CardDescription>
           <div className="pt-4">
            <Input 
                placeholder="Search by Order ID or Table..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
           </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Table</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead className="text-right">Total Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{order.tableNumber}</TableCell>
                    <TableCell>
                      {format(new Date(order.createdAt), "PPP p")}
                    </TableCell>
                    <TableCell>
                      {order.items.map(i => i.quantity).reduce((a, b) => a + b, 0)}
                    </TableCell>
                    <TableCell>
                        {order.discount > 0 ? <Badge variant="secondary">{order.discount}%</Badge> : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {appConfig.currency}{order.total.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No matching orders found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

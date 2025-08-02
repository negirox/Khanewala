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
import { Badge } from "@/components/ui/badge";
import { initialArchivedOrders } from "@/lib/data";
import type { Order } from "@/lib/types";
import { format } from "date-fns";
import { DollarSign, ShoppingBag, Receipt } from "lucide-react";
import { appConfig } from "@/lib/config";

export function Dashboard() {
  const [archivedOrders, setArchivedOrders] =
    React.useState<Order[]>(initialArchivedOrders);

  const stats = React.useMemo(() => {
    const totalSales = archivedOrders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = archivedOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
    return {
      totalSales,
      totalOrders,
      avgOrderValue,
    };
  }, [archivedOrders]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold font-headline">Today's Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {appConfig.currency}{stats.totalSales.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              from {stats.totalOrders} orders
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completed Orders
            </CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              orders served today
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Order Value
            </CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {appConfig.currency}{stats.avgOrderValue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">per order</p>
          </CardContent>
        </Card>
      </div>

      {/* Completed Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Completed Orders</CardTitle>
          <CardDescription>
            A list of all orders marked as served today.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Table</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {archivedOrders.length > 0 ? (
                archivedOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{order.tableNumber}</TableCell>
                    <TableCell>
                      {format(order.createdAt, "HH:mm")}
                    </TableCell>
                    <TableCell>
                      {order.items.map(i => i.quantity).reduce((a, b) => a + b, 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      {appConfig.currency}{order.total.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No completed orders yet.
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

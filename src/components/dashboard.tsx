
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
import type { Order, MenuItem } from "@/lib/types";
import { format, subDays, startOfDay } from "date-fns";
import { DollarSign, ShoppingBag, Receipt, BarChart, PieChart, ArrowUpDown } from "lucide-react";
import { appConfig } from "@/lib/config";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart as RechartsBarChart, Pie, PieChart as RechartsPieChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { getArchivedOrders } from "@/app/actions";

const chartColors = ["#2563eb", "#f97316", "#22c55e", "#ef4444", "#8b5cf6", "#14b8a6", "#d946ef"];


export function Dashboard() {
  const [archivedOrders, setArchivedOrders] = React.useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [sortConfig, setSortConfig] = React.useState<{ key: keyof Order; direction: 'ascending' | 'descending' } | null>({ key: 'createdAt', direction: 'descending' });

  React.useEffect(() => {
    getArchivedOrders().then(orders => setArchivedOrders(orders.map(o => ({...o, createdAt: new Date(o.createdAt)}))));
  }, []);


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

  const dailyRevenue = React.useMemo(() => {
    const data: { date: string, total: number }[] = [];
    for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dayStart = startOfDay(date);
        
        const dayString = format(dayStart, "MMM d");
        
        const total = archivedOrders
            .filter(order => format(new Date(order.createdAt), "MMM d") === dayString)
            .reduce((sum, order) => sum + order.total, 0);

        data.push({ date: format(dayStart, "eee"), total });
    }
    return data;
  }, [archivedOrders]);
  
  const salesByCategory = React.useMemo(() => {
    const categoryMap: { [key: string]: number } = {};
    archivedOrders.forEach(order => {
        order.items.forEach(item => {
            const category = item.menuItem.category;
            const itemTotal = item.menuItem.price * item.quantity;
            categoryMap[category] = (categoryMap[category] || 0) + itemTotal;
        })
    });
    return Object.entries(categoryMap).map(([name, value], index) => ({
        name,
        value,
        fill: chartColors[index % chartColors.length]
    })).sort((a,b) => b.value - a.value);

  }, [archivedOrders]);

  const sortedAndFilteredOrders = React.useMemo(() => {
    let sortableItems = [...archivedOrders];

    if (searchTerm) {
      sortableItems = sortableItems.filter(order =>
        order.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

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
  }, [archivedOrders, searchTerm, sortConfig]);

  const requestSort = (key: keyof Order) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof Order) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    if (sortConfig.direction === 'ascending') {
      return <ArrowUpDown className="h-4 w-4 text-primary" />;
    }
    return <ArrowUpDown className="h-4 w-4 text-primary" />;
  }


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
      
      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
         <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><BarChart className="h-5 w-5 text-muted-foreground"/>Revenue (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
                <ChartContainer config={{}} className="h-[250px] w-full">
                    <RechartsBarChart data={dailyRevenue} accessibilityLayer>
                        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                        <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `${appConfig.currency}${value}`} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="total" radius={4}>
                            {dailyRevenue.map((_entry, index) => (
                                <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                            ))}
                        </Bar>
                    </RechartsBarChart>
                </ChartContainer>
            </CardContent>
        </Card>
         <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><PieChart className="h-5 w-5 text-muted-foreground"/>Sales by Category</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
                 <ChartContainer config={{}} className="h-[250px] w-full">
                    <RechartsPieChart>
                         <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                        <Pie data={salesByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                             const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                             const x  = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                             const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                             return (
                                <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold">
                                    {`${(percent * 100).toFixed(0)}%`}
                                </text>
                            );
                        }}/>
                    </RechartsPieChart>
                </ChartContainer>
            </CardContent>
        </Card>
      </div>


      {/* Completed Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>
            A list of the most recent orders completed today.
          </CardDescription>
          <div className="pt-4">
             <Input 
                placeholder="Search by Order ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                   <Button variant="ghost" onClick={() => requestSort('id')}>
                        Order ID {getSortIcon('id')}
                    </Button>
                </TableHead>
                <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('tableNumber')}>
                        Table {getSortIcon('tableNumber')}
                    </Button>
                </TableHead>
                <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('createdAt')}>
                        Time {getSortIcon('createdAt')}
                    </Button>
                </TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">
                    <Button variant="ghost" onClick={() => requestSort('total')}>
                        Amount {getSortIcon('total')}
                    </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAndFilteredOrders.length > 0 ? (
                sortedAndFilteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{order.tableNumber}</TableCell>
                    <TableCell>
                      {format(new Date(order.createdAt), "HH:mm")}
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

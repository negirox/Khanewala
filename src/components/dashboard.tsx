
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
import type { Order, MenuItem } from "@/lib/types";
import { format, subDays, startOfDay, getYear, getMonth, set, startOfWeek, endOfWeek } from "date-fns";
import { DollarSign, ShoppingBag, Receipt, BarChart, PieChart, ArrowUpDown, ChevronLeft, ChevronRight, Clock, Utensils, LineChart } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart as RechartsBarChart, Pie, PieChart as RechartsPieChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell, Legend, Line as RechartsLine, LineChart as RechartsLineChart } from "recharts";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useAppData } from "@/hooks/use-app-data";
import { Skeleton } from "./ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";


const chartColors = ["#2563eb", "#f97316", "#22c55e", "#ef4444", "#8b5cf6", "#14b8a6", "#d946ef"];
const ITEMS_PER_PAGE = 10;
const currentYear = getYear(new Date());
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
const months = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
];

function DashboardLoading() {
    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-bold font-headline">Dashboard</h1>
            <div className="grid gap-4 md:grid-cols-3">
                <Card><CardHeader><Skeleton className="h-4 w-24" /></CardHeader><CardContent><Skeleton className="h-8 w-32" /><Skeleton className="h-4 w-40 mt-2" /></CardContent></Card>
                <Card><CardHeader><Skeleton className="h-4 w-24" /></CardHeader><CardContent><Skeleton className="h-8 w-32" /><Skeleton className="h-4 w-40 mt-2" /></CardContent></Card>
                <Card><CardHeader><Skeleton className="h-4 w-24" /></CardHeader><CardContent><Skeleton className="h-8 w-32" /><Skeleton className="h-4 w-40 mt-2" /></CardContent></Card>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
                <Card><CardHeader><Skeleton className="h-5 w-48" /></CardHeader><CardContent><Skeleton className="h-[250px] w-full" /></CardContent></Card>
                <Card><CardHeader><Skeleton className="h-5 w-48" /></CardHeader><CardContent><Skeleton className="h-[250px] w-full" /></CardContent></Card>
            </div>
             <div className="grid gap-6 md:grid-cols-2">
                <Card><CardHeader><Skeleton className="h-5 w-48" /></CardHeader><CardContent><Skeleton className="h-[250px] w-full" /></CardContent></Card>
                <Card><CardHeader><Skeleton className="h-5 w-48" /></CardHeader><CardContent><Skeleton className="h-[250px] w-full" /></CardContent></Card>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Recent Orders</CardTitle>
                    <CardDescription>A list of the most recent orders completed.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-48 w-full" />
                </CardContent>
            </Card>
        </div>
    )
}

export function Dashboard() {
  const { archivedOrders, loading, appConfig } = useAppData();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [sortConfig, setSortConfig] = React.useState<{ key: keyof Order; direction: 'ascending' | 'descending' } | null>({ key: 'createdAt', direction: 'descending' });
  const [currentPage, setCurrentPage] = React.useState(1);
  const [selectedMonth, setSelectedMonth] = React.useState<string>(String(getMonth(new Date())));
  const [selectedYear, setSelectedYear] = React.useState<string>(String(getYear(new Date())));
  
  const filteredOrders = React.useMemo(() => {
    return archivedOrders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return getMonth(orderDate).toString() === selectedMonth && getYear(orderDate).toString() === selectedYear;
    });
  }, [archivedOrders, selectedMonth, selectedYear]);
  
  const stats = React.useMemo(() => {
    const totalSales = filteredOrders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = filteredOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
    return {
      totalSales,
      totalOrders,
      avgOrderValue,
    };
  }, [filteredOrders]);

  const dailyRevenue = React.useMemo(() => {
    const dataMap: { [key: string]: number } = {};
    filteredOrders.forEach(order => {
        const day = format(new Date(order.createdAt), "yyyy-MM-dd");
        dataMap[day] = (dataMap[day] || 0) + order.total;
    });
    return Object.entries(dataMap).map(([date, total]) => ({
        date: format(new Date(date), "MMM d"),
        total,
    }));
  }, [filteredOrders]);

  const weeklyRevenue = React.useMemo(() => {
    const dataMap: { [key: string]: number } = {};
    filteredOrders.forEach(order => {
      const weekStart = format(startOfWeek(new Date(order.createdAt)), "yyyy-MM-dd");
      dataMap[weekStart] = (dataMap[weekStart] || 0) + order.total;
    });
    return Object.entries(dataMap)
      .map(([week, total]) => ({
        week: `Week of ${format(new Date(week), "MMM d")}`,
        total,
      }))
      .sort((a, b) => new Date(a.week.replace('Week of ', '')).getTime() - new Date(b.week.replace('Week of ', '')).getTime());
  }, [filteredOrders]);
  
  const salesByCategory = React.useMemo(() => {
    const categoryMap: { [key: string]: number } = {};
    filteredOrders.forEach(order => {
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
  }, [filteredOrders]);

   const salesByHour = React.useMemo(() => {
    const data: { hour: string, sales: number }[] = Array.from({length: 24}, (_, i) => ({
        hour: `${String(i).padStart(2, '0')}:00`,
        sales: 0
    }));

    filteredOrders.forEach(order => {
        const hour = new Date(order.createdAt).getHours();
        data[hour].sales += order.total;
    });

    return data.filter(d => d.sales > 0);
  }, [filteredOrders]);

  const topSellingItems = React.useMemo(() => {
    const itemMap: { [key: string]: { name: string, quantity: number, revenue: number } } = {};
    
    filteredOrders.forEach(order => {
        order.items.forEach(item => {
            if (!itemMap[item.menuItem.id]) {
                itemMap[item.menuItem.id] = { name: item.menuItem.name, quantity: 0, revenue: 0 };
            }
            itemMap[item.menuItem.id].quantity += item.quantity;
            itemMap[item.menuItem.id].revenue += item.menuItem.price * item.quantity;
        });
    });

    return Object.values(itemMap)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10);
  }, [filteredOrders]);

  const requestSort = React.useCallback((key: keyof Order) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  }, [sortConfig]);

  const sortedAndFilteredOrdersTable = React.useMemo(() => {
    let sortableItems = [...filteredOrders];

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
  }, [filteredOrders, searchTerm, sortConfig]);

  const totalPages = Math.ceil(sortedAndFilteredOrdersTable.length / ITEMS_PER_PAGE);
  const paginatedOrders = React.useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedAndFilteredOrdersTable.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedAndFilteredOrdersTable, currentPage]);

  const getSortIcon = React.useCallback((key: keyof Order) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return <ArrowUpDown className="h-4 w-4 text-primary" />;
  }, [sortConfig]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedMonth, selectedYear]);

  if (loading || !appConfig) {
      return <DashboardLoading />
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold font-headline">Dashboard</h1>
        <div className="flex items-center gap-2">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select Month" />
                </SelectTrigger>
                <SelectContent>
                    {months.map((month, index) => (
                        <SelectItem key={month} value={String(index)}>{month}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
             <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent>
                     {years.map(year => (
                        <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
      </div>

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
              for selected period
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
              orders in selected period
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
                <CardTitle className="flex items-center gap-2"><BarChart className="h-5 w-5 text-muted-foreground"/>Daily Revenue</CardTitle>
                 <CardDescription>Total revenue for each day in the selected month.</CardDescription>
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
            <CardTitle className="flex items-center gap-2">
              <LineChart className="h-5 w-5 text-muted-foreground" />
              Weekly Revenue
            </CardTitle>
            <CardDescription>
              Total revenue for each week in the selected month.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[250px] w-full">
              <RechartsLineChart data={weeklyRevenue}>
                <XAxis dataKey="week" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => value.replace('Week of ', '')} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => `${appConfig.currency}${value}`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <RechartsLine type="monotone" dataKey="total" stroke={chartColors[1]} strokeWidth={2} dot={false} />
              </RechartsLineChart>
            </ChartContainer>
          </CardContent>
        </Card>
         <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><PieChart className="h-5 w-5 text-muted-foreground"/>Sales by Category</CardTitle>
                 <CardDescription>Revenue distribution across different menu categories.</CardDescription>
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
                        <Legend/>
                    </RechartsPieChart>
                </ChartContainer>
            </CardContent>
        </Card>
         <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-muted-foreground"/>Hourly Sales Performance</CardTitle>
                 <CardDescription>Revenue generated during each hour of the day.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={{}} className="h-[250px] w-full">
                    <RechartsBarChart data={salesByHour}>
                        <XAxis dataKey="hour" tickLine={false} axisLine={false} tickMargin={8} />
                        <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `${appConfig.currency}${value}`} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="sales" radius={4} fill={chartColors[0]}/>
                    </RechartsBarChart>
                </ChartContainer>
            </CardContent>
        </Card>
         <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Utensils className="h-5 w-5 text-muted-foreground"/>Top Selling Items</CardTitle>
                <CardDescription>Top 10 menu items by quantity sold.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={{}} className="h-[250px] w-full">
                     <RechartsBarChart data={topSellingItems} layout="vertical">
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={120} tick={{fontSize: 12}} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="quantity" radius={4} fill={chartColors[1]}>
                             {topSellingItems.map((_entry, index) => (
                                <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                            ))}
                        </Bar>
                    </RechartsBarChart>
                </ChartContainer>
            </CardContent>
        </Card>
      </div>

      {/* Completed Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders in Period</CardTitle>
          <CardDescription>
            A list of all orders completed in the selected month and year.
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
          <div className="border rounded-md">
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
                          Date {getSortIcon('createdAt')}
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
                {paginatedOrders.length > 0 ? (
                  paginatedOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>{order.tableNumber || 'N/A'}</TableCell>
                      <TableCell>
                        {format(new Date(order.createdAt), "dd MMM, HH:mm")}
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
        </CardContent>
      </Card>
    </div>
  );

    

    
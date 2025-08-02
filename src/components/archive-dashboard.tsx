
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
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { appConfig } from "@/lib/config";
import { getArchivedOrders, getArchiveFileSize } from "@/app/actions";
import { ArrowUpDown, ChevronLeft, ChevronRight, AlertTriangle, Archive, Printer } from "lucide-react";
import { Progress } from "./ui/progress";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle as DialogTitlePrimitive } from "./ui/dialog";
import { BillView } from "./bill-view";

const ITEMS_PER_PAGE = 10;

function ArchiveCapacityIndicator() {
  const [fileStats, setFileStats] = React.useState<{size: number; limit: number} | null>(null);

  React.useEffect(() => {
    getArchiveFileSize().then(setFileStats);
  }, []);

  if (!fileStats || appConfig.dataSource !== 'csv') {
    return null; // Don't show indicator if not using CSV or stats not loaded
  }

  const percentage = (fileStats.size / fileStats.limit) * 100;
  const sizeInMB = (fileStats.size / (1024 * 1024)).toFixed(2);
  const limitInMB = (fileStats.limit / (1024 * 1024)).toFixed(2);
  
  return (
    <Card className="mb-6">
       <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg"><Archive className="h-5 w-5"/> Archive Storage</CardTitle>
       </CardHeader>
       <CardContent>
          <div className="space-y-2">
            <Progress value={percentage} />
            <div className="flex justify-between text-sm text-muted-foreground">
                <span>
                    Using {sizeInMB} MB / {limitInMB} MB
                </span>
                <span>{percentage.toFixed(2)}% Full</span>
            </div>
          </div>
          {percentage > 90 && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Warning: Archive Capacity Approaching Limit</AlertTitle>
              <AlertDescription>
                The current archive file is nearly full. It will be automatically rotated into a new file soon.
              </AlertDescription>
            </Alert>
          )}
       </CardContent>
    </Card>
  )

}


export function ArchiveDashboard() {
  const [archivedOrders, setArchivedOrders] = React.useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [sortConfig, setSortConfig] = React.useState<{ key: keyof Order; direction: 'ascending' | 'descending' } | null>({ key: 'createdAt', direction: 'descending' });
  const [currentPage, setCurrentPage] = React.useState(1);
  const [printingOrder, setPrintingOrder] = React.useState<Order | null>(null);

  React.useEffect(() => {
    getArchivedOrders().then(orders => setArchivedOrders(orders.map(o => ({ ...o, createdAt: new Date(o.createdAt) }))));
  }, []);

  const requestSort = React.useCallback((key: keyof Order) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  }, [sortConfig]);

  const getSortIcon = React.useCallback((key: keyof Order) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="h-4 w-4 ml-2" />;
    }
    return <ArrowUpDown className="h-4 w-4 ml-2 text-primary" />;
  }, [sortConfig]);

  const sortedAndFilteredOrders = React.useMemo(() => {
    let sortableItems = [...archivedOrders];

    if (searchTerm) {
      sortableItems = sortableItems.filter(order =>
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(order.tableNumber).includes(searchTerm)
      );
    }
    
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (sortConfig.key === 'createdAt') {
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
  }, [archivedOrders, searchTerm, sortConfig]);

  const totalPages = Math.ceil(sortedAndFilteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = React.useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedAndFilteredOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedAndFilteredOrders, currentPage]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="flex flex-col gap-6">
       <ArchiveCapacityIndicator />
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
                    <Button variant="ghost" onClick={() => requestSort('id')}>Order ID {getSortIcon('id')}</Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('tableNumber')}>Table {getSortIcon('tableNumber')}</Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('createdAt')}>Date & Time {getSortIcon('createdAt')}</Button>
                  </TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>
                     <Button variant="ghost" onClick={() => requestSort('discount')}>Discount {getSortIcon('discount')}</Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button variant="ghost" onClick={() => requestSort('total')}>Total Amount {getSortIcon('total')}</Button>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedOrders.length > 0 ? (
                  paginatedOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>{order.tableNumber || 'N/A'}</TableCell>
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
                      <TableCell className="text-right">
                         <Button variant="ghost" size="icon" onClick={() => setPrintingOrder(order)}>
                            <Printer className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
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

      <Dialog open={!!printingOrder} onOpenChange={(open) => !open && setPrintingOrder(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitlePrimitive>Print Bill</DialogTitlePrimitive>
          </DialogHeader>
          {printingOrder && <BillView order={printingOrder} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

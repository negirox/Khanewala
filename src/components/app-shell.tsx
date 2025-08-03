
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  ClipboardList,
  Users,
  LayoutDashboard,
  Archive,
  Users2,
  Contact,
  ChevronDown,
  Shield,
  Settings,
  PlusCircle,
  UtensilsCrossed,
} from "lucide-react";

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarInset,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "./ui/collapsible";
import { cn } from "@/lib/utils";
import { defaultAppConfig } from "@/lib/config";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import { OrderForm } from "./order-form";
import { createNewOrder, saveTables } from "@/app/actions";
import type { Order } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useAppData } from "@/hooks/use-app-data";
import Image from "next/image";

const operationalNavItems = [
  { href: "/orders", icon: ClipboardList, label: "Orders" },
  { href: "/archive", icon: Archive, label: "Archive" },
  { href: "/tables", icon: Users, label: "Tables" },
];

const allAdminNavItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", configKey: "dashboard" },
  { href: "/menu", icon: BookOpen, label: "Menu", configKey: "menu" },
  { href: "/staff", icon: Users2, label: "Staff", configKey: "staff" },
  { href: "/customers", icon: Contact, label: "Customers", configKey: "customers" },
  { href: "/settings", icon: Settings, label: "Settings", configKey: "settings" },
];

function AdminMenu() {
    const pathname = usePathname();
    const { state } = useSidebar();
    const { appConfig } = useAppData();
    
    // Filter admin items based on config
    const adminNavItems = allAdminNavItems.filter(item => 
      appConfig?.enabledAdminSections[item.configKey as keyof typeof appConfig.enabledAdminSections]
    );

    const isAnyAdminItemActive = adminNavItems.some(item => pathname.startsWith(item.href));

    if (state === 'collapsed') {
        return (
             <>
                {adminNavItems.map(item => (
                    <SidebarMenuItem key={item.href}>
                         <Tooltip>
                            <TooltipTrigger asChild>
                                <SidebarMenuButton asChild isActive={pathname.startsWith(item.href)} className="justify-center">
                                    <Link href={item.href}>
                                        <item.icon />
                                    </Link>
                                </SidebarMenuButton>
                            </TooltipTrigger>
                            <TooltipContent side="right" align="center">{item.label}</TooltipContent>
                        </Tooltip>
                    </SidebarMenuItem>
                ))}
             </>
        )
    }

    return (
        <Collapsible defaultOpen={isAnyAdminItemActive}>
            <SidebarMenuItem>
            <CollapsibleTrigger asChild>
                <SidebarMenuButton
                className="group/menu-item justify-between"
                isActive={isAnyAdminItemActive}
                >
                    <div className="flex items-center gap-2">
                    <Shield />
                    <span>Admin</span>
                    </div>
                    <ChevronDown className={cn("transition-transform group-data-[state=open]/menu-item:rotate-180")} />
                </SidebarMenuButton>
            </CollapsibleTrigger>
            </SidebarMenuItem>
            <CollapsibleContent asChild>
            <SidebarMenuSub>
                {adminNavItems.map(item => (
                        <SidebarMenuItem key={item.href}>
                        <SidebarMenuSubButton asChild isActive={pathname.startsWith(item.href)}>
                            <Link href={item.href}>
                                <item.icon />
                                <span>{item.label}</span>
                            </Link>
                        </SidebarMenuSubButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenuSub>
            </CollapsibleContent>
        </Collapsible>
    )
}

function NewOrderDialog() {
  const [isNewOrderDialogOpen, setNewOrderDialogOpen] = React.useState(false);
  const { allCustomers, allMenuItems, allTables, activeOrders, archivedOrders, refreshData } = useAppData();
  const { toast } = useToast();

  const handleNewOrder = React.useCallback(async (newOrderData: Omit<Order, 'id' | 'createdAt'>) => {
    
    const { newOrder } = await createNewOrder(newOrderData, activeOrders, archivedOrders, allCustomers);
    
    // Also update table status to occupied
    if (newOrder.tableNumber) {
        const updatedTables = allTables.map(table => 
            table.id === newOrder.tableNumber
            ? { ...table, status: 'occupied', orderId: newOrder.id }
            : table
        );
        await saveTables(updatedTables);
    }

    if (newOrder.pointsEarned) {
         toast({
            title: "Loyalty Points Added!",
            description: `${newOrder.customerName} earned ${newOrder.pointsEarned} points.`,
        });
    }

    toast({
        title: "Order Created",
        description: `Order ${newOrder.id} has been successfully created.`,
    });

    setNewOrderDialogOpen(false);
    await refreshData(); // This will re-fetch all data and update the context

  }, [activeOrders, archivedOrders, allCustomers, allTables, toast, refreshData]);

  return (
    <Dialog open={isNewOrderDialogOpen} onOpenChange={setNewOrderDialogOpen}>
        <DialogTrigger asChild>
        <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Order
        </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <OrderForm allMenuItems={allMenuItems} allCustomers={allCustomers} allTables={allTables} onSubmit={handleNewOrder} onCancel={() => setNewOrderDialogOpen(false)} />
        </DialogContent>
    </Dialog>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { appConfig } = useAppData();

  // Hide shell on super admin pages
  if (pathname.startsWith('/super-admin')) {
    return <main className="p-4 md:p-6">{children}</main>;
  }

  const adminNavItems = allAdminNavItems.filter(item => 
    appConfig?.enabledAdminSections[item.configKey as keyof typeof appConfig.enabledAdminSections]
  );
  const allNavItems = [...operationalNavItems, ...adminNavItems];
  
  const isOrdersPage = pathname.startsWith('/orders');

  if (!appConfig) {
      return <div>Loading...</div>
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar collapsible="icon" className="border-r bg-sidebar">
          <SidebarHeader>
            <div className="flex h-14 items-center gap-2 p-2 justify-start group-data-[collapsible=icon]:justify-center">
              {appConfig.logo && appConfig.logo !== '/logo.png' ? 
                <Image src={appConfig.logo} alt="Logo" width={32} height={32} className="shrink-0" />
                : <UtensilsCrossed className="h-8 w-8 text-primary shrink-0" />
              }
              <h1 className="text-xl font-bold font-headline group-data-[collapsible=icon]:hidden whitespace-nowrap">
                {appConfig.title}
              </h1>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {operationalNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(item.href)}
                    tooltip={item.label}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
               <AdminMenu />
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <header className="flex h-14 items-center gap-4 border-b bg-card/80 backdrop-blur-sm px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30">
            <SidebarTrigger className="md:hidden" />
            <div className="flex-1">
               <h1 className="font-headline text-lg font-semibold">
                {allNavItems.find(item => pathname.startsWith(item.href))?.label}
               </h1>
            </div>
            {isOrdersPage && <NewOrderDialog />}
          </header>
          <main className="flex-1 p-4 md:p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

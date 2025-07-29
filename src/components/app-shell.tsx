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
import { appConfig } from "@/lib/config";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

const operationalNavItems = [
  { href: "/orders", icon: ClipboardList, label: "Orders" },
  { href: "/archive", icon: Archive, label: "Archive" },
  { href: "/tables", icon: Users, label: "Tables" },
];

const adminNavItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/menu", icon: BookOpen, label: "Menu" },
  { href: "/staff", icon: Users2, label: "Staff" },
  { href: "/customers", icon: Contact, label: "Customers" },
];

function AdminMenu() {
    const pathname = usePathname();
    const { state } = useSidebar();
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

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar collapsible="icon" className="border-r bg-sidebar">
          <SidebarHeader>
            <div className="flex h-14 items-center gap-2 p-2 justify-start group-data-[collapsible=icon]:justify-center">
              <appConfig.logo className="h-8 w-8 text-primary shrink-0" />
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
                {[...operationalNavItems, ...adminNavItems].find(item => pathname.startsWith(item.href))?.label || 'Dashboard'}
               </h1>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

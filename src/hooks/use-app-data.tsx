
"use client";

import * as React from "react";
import { getActiveOrders, getArchivedOrders, getCustomers, getMenuItems, getStaff, getStaffTransactions, getTables, getAppConfig } from "@/app/actions";
import type { Order, MenuItem, Customer, StaffMember, Table, StaffTransaction, AppConfigData } from "@/lib/types";
import type { LucideIcon } from "lucide-react";

interface AppDataContextType {
    activeOrders: Order[];
    archivedOrders: Order[];
    allMenuItems: MenuItem[];
    allCustomers: Customer[];
    allStaff: StaffMember[];
    allTables: Table[];
    allStaffTransactions: StaffTransaction[];
    appConfig: (AppConfigData & { logoIcon: LucideIcon }) | null;
    loading: boolean;
    refreshData: () => Promise<void>;
    setActiveOrders: React.Dispatch<React.SetStateAction<Order[]>>;
    setArchivedOrders: React.Dispatch<React.SetStateAction<Order[]>>;
    setAllCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
    setAllTables: React.Dispatch<React.SetStateAction<Table[]>>;
}

const AppDataContext = React.createContext<AppDataContextType | undefined>(undefined);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
    const [loading, setLoading] = React.useState(true);
    const [activeOrders, setActiveOrders] = React.useState<Order[]>([]);
    const [archivedOrders, setArchivedOrders] = React.useState<Order[]>([]);
    const [allMenuItems, setAllMenuItems] = React.useState<MenuItem[]>([]);
    const [allCustomers, setAllCustomers] = React.useState<Customer[]>([]);
    const [allStaff, setAllStaff] = React.useState<StaffMember[]>([]);
    const [allTables, setAllTables] = React.useState<Table[]>([]);
    const [allStaffTransactions, setAllStaffTransactions] = React.useState<StaffTransaction[]>([]);
    const [appConfig, setAppConfig] = React.useState<(AppConfigData & { logoIcon: LucideIcon }) | null>(null);

    const fetchData = React.useCallback(async () => {
        setLoading(true);
        try {
            const [
                active,
                archived,
                menuItems,
                customers,
                staff,
                tables,
                staffTransactions,
                config,
            ] = await Promise.all([
                getActiveOrders(),
                getArchivedOrders(),
                getMenuItems(),
                getCustomers(),
                getStaff(),
                getTables(),
                getStaffTransactions(),
                getAppConfig(),
            ]);

            setActiveOrders(active.map(o => ({ ...o, createdAt: new Date(o.createdAt) })));
            setArchivedOrders(archived.map(o => ({ ...o, createdAt: new Date(o.createdAt) })));
            setAllMenuItems(menuItems);
            setAllCustomers(customers);
            setAllStaff(staff);
            setAllTables(tables);
            setAllStaffTransactions(staffTransactions);
            
            // This is a bit of a hack as we can't import the icon on the server
            const { UtensilsCrossed } = await import('lucide-react');
            setAppConfig({ ...config, logoIcon: UtensilsCrossed });

        } catch (error) {
            console.error("Failed to fetch app data:", error);
            // Handle error appropriately, maybe show a toast
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchData();
    }, [fetchData]);

    const value = {
        activeOrders,
        archivedOrders,
        allMenuItems,
        allCustomers,
        allStaff,
        allTables,
        allStaffTransactions,
        appConfig,
        loading,
        refreshData: fetchData,
        setActiveOrders,
        setArchivedOrders,
        setAllCustomers,
        setAllTables,
    };

    return (
        <AppDataContext.Provider value={value}>
            {children}
        </AppDataContext.Provider>
    );
}

export function useAppData() {
    const context = React.useContext(AppDataContext);
    if (context === undefined) {
        throw new Error("useAppData must be used within an AppDataProvider");
    }
    return context;
}


"use client";

import * as React from "react";
import { getActiveOrders, getArchivedOrders, getCustomers, getMenuItems, getStaff, getStaffTransactions, getTables } from "@/app/actions";
import type { Order, MenuItem, Customer, StaffMember, Table, StaffTransaction, AppConfigData } from "@/lib/types";

interface InitialData {
    activeOrders: Order[];
    archivedOrders: Order[];
    allMenuItems: MenuItem[];
    allCustomers: Customer[];
    allStaff: StaffMember[];
    allTables: Table[];
    allStaffTransactions: StaffTransaction[];
}

interface AppDataContextType {
    activeOrders: Order[];
    archivedOrders: Order[];
    allMenuItems: MenuItem[];
    allCustomers: Customer[];
    allStaff: StaffMember[];
    allTables: Table[];
    allStaffTransactions: StaffTransaction[];
    appConfig: AppConfigData | null;
    loading: boolean;
    refreshData: () => Promise<void>;
    setActiveOrders: React.Dispatch<React.SetStateAction<Order[]>>;
    setArchivedOrders: React.Dispatch<React.SetStateAction<Order[]>>;
    setAllCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
    setAllTables: React.Dispatch<React.SetStateAction<Table[]>>;
}

const AppDataContext = React.createContext<AppDataContextType | undefined>(undefined);

export function AppDataProvider({ 
    children, 
    initialConfig,
    initialData
}: { 
    children: React.ReactNode, 
    initialConfig: AppConfigData,
    initialData: InitialData
}) {
    const [loading, setLoading] = React.useState(false);
    const [activeOrders, setActiveOrders] = React.useState<Order[]>(initialData.activeOrders);
    const [archivedOrders, setArchivedOrders] = React.useState<Order[]>(initialData.archivedOrders);
    const [allMenuItems, setAllMenuItems] = React.useState<MenuItem[]>(initialData.allMenuItems);
    const [allCustomers, setAllCustomers] = React.useState<Customer[]>(initialData.allCustomers);
    const [allStaff, setAllStaff] = React.useState<StaffMember[]>(initialData.allStaff);
    const [allTables, setAllTables] = React.useState<Table[]>(initialData.allTables);
    const [allStaffTransactions, setAllStaffTransactions] = React.useState<StaffTransaction[]>(initialData.allStaffTransactions);
    const [appConfig, setAppConfig] = React.useState<AppConfigData | null>(initialConfig);

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
            ] = await Promise.all([
                getActiveOrders(),
                getArchivedOrders(),
                getMenuItems(),
                getCustomers(),
                getStaff(),
                getTables(),
                getStaffTransactions(),
            ]);

            setActiveOrders(active.map(o => ({ ...o, createdAt: new Date(o.createdAt) })));
            setArchivedOrders(archived.map(o => ({ ...o, createdAt: new Date(o.createdAt) })));
            setAllMenuItems(menuItems);
            setAllCustomers(customers);
            setAllStaff(staff);
            setAllTables(tables);
            setAllStaffTransactions(staffTransactions.map(tx => ({...tx, date: new Date(tx.date)})));
            
        } catch (error) {
            console.error("Failed to fetch app data:", error);
            // Handle error appropriately, maybe show a toast
        } finally {
            setLoading(false);
        }
    }, []);

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

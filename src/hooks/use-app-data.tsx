
"use client";

import * as React from "react";
import { getActiveOrders, getArchivedOrders, getCustomers, getMenuItems, getStaff, getStaffTransactions, getTables } from "@/app/actions";
import type { Order, MenuItem, Customer, StaffMember, Table, StaffTransaction } from "@/lib/types";

interface AppDataContextType {
    activeOrders: Order[];
    archivedOrders: Order[];
    allMenuItems: MenuItem[];
    allCustomers: Customer[];
    allStaff: StaffMember[];
    allTables: Table[];
    allStaffTransactions: StaffTransaction[];
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
            setAllStaffTransactions(staffTransactions);

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

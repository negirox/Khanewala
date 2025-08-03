
import { AppShell } from '@/components/app-shell';
import { AppDataProvider } from '@/hooks/use-app-data';
import { getActiveOrders, getArchivedOrders, getCustomers, getMenuItems, getStaff, getStaffTransactions, getTables } from "@/app/actions";
import { appConfigPromise } from '@/lib/config';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const appConfig = await appConfigPromise;
  
  // Fetch all data on the server
  const [
    activeOrders,
    archivedOrders,
    menuItems,
    customers,
    staff,
    tables,
    staffTransactions
  ] = await Promise.all([
    getActiveOrders(),
    getArchivedOrders(),
    getMenuItems(),
    getCustomers(),
    getStaff(),
    getTables(),
    getStaffTransactions(),
  ]);

  const initialData = {
    activeOrders: activeOrders.map(o => ({ ...o, createdAt: new Date(o.createdAt) })),
    archivedOrders: archivedOrders.map(o => ({ ...o, createdAt: new Date(o.createdAt) })),
    allMenuItems: menuItems,
    allCustomers: customers,
    allStaff: staff,
    allTables: tables,
    allStaffTransactions: staffTransactions.map(tx => ({...tx, date: new Date(tx.date)})),
  };

  return (
    <AppDataProvider initialConfig={appConfig} initialData={initialData}>
      <AppShell>{children}</AppShell>
    </AppDataProvider>
  );
}

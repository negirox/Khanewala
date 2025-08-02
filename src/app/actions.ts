
'use server';

import type { Order, MenuItem, Customer, StaffMember, Table, StaffTransaction, StaffTransactionType } from '@/lib/types';
import { loyaltyService } from '@/services/loyalty-service';
import { whatsappService } from '@/services/whatsapp-service';
import Papa from 'papaparse';
import fs from 'fs/promises';
import path from 'path';
import { csvRepository } from '@/services/csv-repository';
import { apiRepository } from '@/services/api-repository';
import { appConfig } from '@/lib/config';
import { brevoService } from '@/services/brevo-service';

// Data Repository Switch
const dataRepository = appConfig.dataSource === 'csv' ? csvRepository : apiRepository;


// Menu Items
export async function getMenuItems(): Promise<MenuItem[]> {
  return dataRepository.getMenuItems();
}

export async function saveMenuItems(items: MenuItem[]): Promise<void> {
  return dataRepository.saveMenuItems(items);
}

// Orders
export async function getActiveOrders(): Promise<Order[]> {
  return dataRepository.getActiveOrders();
}

export async function getArchivedOrders(): Promise<Order[]> {
    return dataRepository.getArchivedOrders();
}

export async function saveAllOrders(activeOrders: Order[], archivedOrders: Order[]): Promise<void> {
    // Before saving, check if the CSV archive needs to be rotated.
    if (appConfig.dataSource === 'csv') {
        await csvRepository.checkAndRotateArchive();
    }
    return dataRepository.saveAllOrders(activeOrders, archivedOrders);
}

export async function createNewOrder(newOrderData: Omit<Order, 'id' | 'createdAt'>, activeOrders: Order[], archivedOrders: Order[], allCustomers: Customer[]) {
    let finalOrderData = { ...newOrderData };
    let updatedCustomers = [...allCustomers];
    
    // Handle Loyalty Points Earning
    if (newOrderData.customerId) {
        const customer = allCustomers.find(c => c.id === newOrderData.customerId);
        if (customer) {
            // Earn points on the final total
            const { updatedCustomer, pointsEarned } = loyaltyService.addPointsForOrder(customer, finalOrderData.total);
            finalOrderData.pointsEarned = pointsEarned;
            
            // Send WhatsApp confirmation
            const tempOrder = { ...finalOrderData, id: 'temp', createdAt: new Date() }
            whatsappService.sendOrderConfirmation(updatedCustomer, tempOrder as Order);

            // Update customer in state and save
            updatedCustomers = allCustomers.map(c => c.id === customer.id ? updatedCustomer : c);
            await dataRepository.saveCustomers(updatedCustomers);
        }
    }

    const newOrder: Order = {
        ...finalOrderData,
        // Using timestamp and random number for a more unique ID
        id: `ORD-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`,
        createdAt: new Date(),
    };
    const newActiveOrders = [newOrder, ...activeOrders];
    await dataRepository.saveAllOrders(newActiveOrders, archivedOrders);

    // Return the state that the client needs to update itself
    return { newActiveOrders, updatedCustomers, newOrder };
}


// Staff
export async function getStaff(): Promise<StaffMember[]> {
    return dataRepository.getStaff();
}

export async function saveStaff(staff: StaffMember[]): Promise<void> {
    return dataRepository.saveStaff(staff);
}

// Staff Transactions
export async function getStaffTransactions(): Promise<StaffTransaction[]> {
    return dataRepository.getStaffTransactions();
}

export async function addStaffTransaction(
    transaction: Omit<StaffTransaction, 'id' | 'date'>, 
    staffMember: StaffMember, 
    currentMonthNetPayable: number
): Promise<{newTransaction: StaffTransaction, updatedStaffMember: StaffMember}> {
    const allTransactions = await getStaffTransactions();
    const allStaff = await getStaff();

    const newTransaction: StaffTransaction = {
        ...transaction,
        id: `TXN_${Date.now()}`,
        date: new Date(),
    };
    const updatedTransactions = [...allTransactions, newTransaction];
    await dataRepository.saveStaffTransactions(updatedTransactions);

    let updatedStaffMember = { ...staffMember };

    // If a salary payment was made, update the carry forward balance
    if (transaction.type === 'Salary') {
        const remainingBalance = currentMonthNetPayable - transaction.amount;
        updatedStaffMember.carryForwardBalance = remainingBalance;
        
        const updatedStaffList = allStaff.map(s => s.id === staffMember.id ? updatedStaffMember : s);
        await dataRepository.saveStaff(updatedStaffList);
    }
    
    return { newTransaction, updatedStaffMember };
}

export async function generateStaffTransactionReport(
    staffId: string, 
    transactions: StaffTransaction[],
    summary: { 
        grossSalary: number, 
        carryForward: number, 
        totalDeductions: number, 
        bonuses: number,
        salariesPaid: number,
        netPayable: number
    }
): Promise<string> {
    const transactionData = transactions.map(tx => ({
        "Transaction ID": tx.id,
        "Date": tx.date.toISOString().split('T')[0],
        "Type": tx.type,
        "Amount": tx.amount,
        "Payment Mode": tx.paymentMode,
        "Notes": tx.notes || ''
    }));

    const reportCsv = Papa.unparse(transactionData);

    const summaryData = [
        {"Key": "Gross Salary", "Value": summary.grossSalary},
        {"Key": "Carry Forward from Last Month", "Value": summary.carryForward},
        {"Key": "Total Bonus", "Value": summary.bonuses},
        {"Key": "Total Deductions (Advance + Daily)", "Value": summary.totalDeductions},
        {"Key": "Total Salary Paid this month", "Value": summary.salariesPaid},
        {"Key": "Final Net Payable this month", "Value": summary.netPayable},
    ];

    const summaryCsv = Papa.unparse(summaryData, { header: false });

    return `${reportCsv}\n\nTransaction Summary\n${summaryCsv}`;
}



// Tables
export async function getTables(): Promise<Table[]> {
    return dataRepository.getTables();
}

export async function saveTables(tables: Table[]): Promise<void> {
    return dataRepository.saveTables(tables);
}

// Customers
export async function getCustomers(): Promise<Customer[]> {
    return dataRepository.getCustomers();
}

export async function saveCustomers(customers: Customer[]): Promise<void> {
    return dataRepository.saveCustomers(customers);
}


export async function addNewCustomer(customerData: Omit<Customer, 'id'>): Promise<{success: boolean, newCustomer: Customer | null}> {
    try {
        const allCustomers = await getCustomers();
        const newCustomer: Customer = {
            ...customerData,
            id: `CUST-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`
        };

        const updatedCustomers = [...allCustomers, newCustomer];
        await dataRepository.saveCustomers(updatedCustomers);
        
        // After successfully saving, send the welcome email
        await brevoService.sendWelcomeEmail(newCustomer);
        
        return { success: true, newCustomer };

    } catch (error) {
        console.error("Error adding new customer:", error);
        return { success: false, newCustomer: null };
    }
}


// This was in the old actions file, keeping it here.
import { getMenuRecommendations as getMenuRecommendationsAI, type MenuRecommendationInput } from '@/ai/flows/menu-recommendation';

export async function getMenuRecommendations(input: MenuRecommendationInput) {
  try {
    const result = await getMenuRecommendationsAI(input);
    return { success: true, data: result };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Failed to get AI recommendations. Please try again later.' };
  }
}

// Super Admin Login
export async function validateSuperAdminLogin(credentials: {username: string, password: string}): Promise<{success: boolean}> {
    try {
        const configPath = path.join(process.cwd(), 'adminconfig.json');
        const configFile = await fs.readFile(configPath, 'utf8');
        const adminConfig = JSON.parse(configFile);

        if (credentials.username === adminConfig.username && credentials.password === adminConfig.password) {
            return { success: true };
        }
        return { success: false };
    } catch (error) {
        console.error("Error reading admin config:", error);
        return { success: false };
    }
}

// Archive File Size
export async function getArchiveFileSize(): Promise<{size: number; limit: number}> {
    if (appConfig.dataSource !== 'csv') {
        return { size: 0, limit: appConfig.archiveFileLimit };
    }
    try {
        const stats = await fs.stat(csvRepository.getArchivePath());
        return { size: stats.size, limit: appConfig.archiveFileLimit };
    } catch (error: any) {
        // If the file doesn't exist, its size is 0.
        if (error.code === 'ENOENT') {
            return { size: 0, limit: appConfig.archiveFileLimit };
        }
        console.error("Error getting archive file size:", error);
        // Return a non-zero limit to avoid division by zero errors on the client.
        return { size: 0, limit: appConfig.archiveFileLimit };
    }
}


'use server';

import { csvRepository } from '@/services/csv-repository';
import type { Order, MenuItem, Customer, StaffMember, Table, StaffTransaction, StaffTransactionType } from '@/lib/types';
import { loyaltyService } from '@/services/loyalty-service';
import { whatsappService } from '@/services/whatsapp-service';
import Papa from 'papaparse';


// Menu Items
export async function getMenuItems(): Promise<MenuItem[]> {
  return csvRepository.getMenuItems();
}

export async function saveMenuItems(items: MenuItem[]): Promise<void> {
  return csvRepository.saveMenuItems(items);
}

// Orders
export async function getActiveOrders(): Promise<Order[]> {
  return csvRepository.getActiveOrders();
}

export async function getArchivedOrders(): Promise<Order[]> {
    return csvRepository.getArchivedOrders();
}

export async function saveAllOrders(activeOrders: Order[], archivedOrders: Order[]): Promise<void> {
    return csvRepository.saveAllOrders(activeOrders, archivedOrders);
}

export async function createNewOrder(newOrderData: Omit<Order, 'id' | 'createdAt'>, activeOrders: Order[], archivedOrders: Order[], allCustomers: Customer[]) {
    let finalOrderData = { ...newOrderData };
    let updatedCustomers = [...allCustomers];
    
    // Handle Loyalty Points
    if (newOrderData.customerId) {
        const customer = allCustomers.find(c => c.id === newOrderData.customerId);
        if (customer) {
            const { updatedCustomer, pointsEarned } = loyaltyService.addPointsForOrder(customer, newOrderData.total);
            finalOrderData.pointsEarned = pointsEarned;
            
            // Send WhatsApp confirmation
            const tempOrder = { ...finalOrderData, id: 'temp', createdAt: new Date() }
            whatsappService.sendOrderConfirmation(customer, tempOrder as Order);

            // Update customer in state and save
            updatedCustomers = allCustomers.map(c => c.id === customer.id ? updatedCustomer : c);
            await csvRepository.saveCustomers(updatedCustomers);
        }
    }

    const newOrder: Order = {
        ...finalOrderData,
        // Using timestamp and random number for a more unique ID
        id: `ORD-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`,
        createdAt: new Date(),
    };
    const newActiveOrders = [newOrder, ...activeOrders];
    await csvRepository.saveAllOrders(newActiveOrders, archivedOrders);

    // Return the state that the client needs to update itself
    return { newActiveOrders, updatedCustomers, newOrder };
}


// Staff
export async function getStaff(): Promise<StaffMember[]> {
    return csvRepository.getStaff();
}

export async function saveStaff(staff: StaffMember[]): Promise<void> {
    return csvRepository.saveStaff(staff);
}

// Staff Transactions
export async function getStaffTransactions(): Promise<StaffTransaction[]> {
    return csvRepository.getStaffTransactions();
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
    await csvRepository.saveStaffTransactions(updatedTransactions);

    let updatedStaffMember = { ...staffMember };

    // If a salary payment was made, update the carry forward balance
    if (transaction.type === 'Salary') {
        const remainingBalance = currentMonthNetPayable - transaction.amount;
        updatedStaffMember.carryForwardBalance = remainingBalance;
        
        const updatedStaffList = allStaff.map(s => s.id === staffMember.id ? updatedStaffMember : s);
        await csvRepository.saveStaff(updatedStaffList);
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
    return csvRepository.getTables();
}

export async function saveTables(tables: Table[]): Promise<void> {
    return csvRepository.saveTables(tables);
}

// Customers
export async function getCustomers(): Promise<Customer[]> {
    return csvRepository.getCustomers();
}

export async function saveCustomers(customers: Customer[]): Promise<void> {
    return csvRepository.saveCustomers(customers);
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

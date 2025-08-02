
'use server';

import { csvRepository } from '@/services/csv-repository';
import type { Order, MenuItem, Customer, StaffMember, Table, StaffTransaction } from '@/lib/types';
import { loyaltyService } from '@/services/loyalty-service';
import { whatsappService } from '@/services/whatsapp-service';

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
        id: `ORD${(Math.random() * 1000).toFixed(0).padStart(3, '0')}`,
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

export async function addStaffTransaction(transaction: Omit<StaffTransaction, 'id' | 'date'>): Promise<StaffTransaction> {
    const allTransactions = await getStaffTransactions();
    const newTransaction: StaffTransaction = {
        ...transaction,
        id: `TXN_${Date.now()}`,
        date: new Date(),
    };
    const updatedTransactions = [...allTransactions, newTransaction];
    await csvRepository.saveStaffTransactions(updatedTransactions);
    return newTransaction;
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

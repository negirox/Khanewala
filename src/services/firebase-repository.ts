
/**
 * @fileoverview
 * This file contains the FirebaseRepository class, which is responsible for
 * handling all data operations by reading from and writing to the
 * Firebase Realtime Database.
 */

import type { MenuItem, Order, Table, StaffMember, Customer, StaffTransaction } from '@/lib/types';
import { database } from '@/lib/firebase';
import { ref, get, set, child } from 'firebase/database';

const dbRef = ref(database);

class FirebaseRepository {
  private async readData<T>(path: string): Promise<T[]> {
    try {
      const snapshot = await get(child(dbRef, path));
      if (snapshot.exists()) {
        const data = snapshot.val();
        // Firebase returns data as an object, convert it to an array
        return Array.isArray(data) ? data : Object.values(data);
      }
      return [];
    } catch (error) {
      console.error(`Error reading from Firebase path "${path}":`, error);
      return [];
    }
  }

  private async writeData<T>(path: string, data: T): Promise<void> {
    try {
      await set(ref(database, path), data);
    } catch (error) {
      console.error(`Error writing to Firebase path "${path}":`, error);
      throw error;
    }
  }

  private createIdMap<T extends { id: any }>(items: T[]): Record<string, T> {
    return items.reduce((acc, item) => {
        acc[item.id] = item;
        return acc;
    }, {} as Record<string, T>);
  }
  
  // Menu Items
  async getMenuItems(): Promise<MenuItem[]> {
    return this.readData<MenuItem>('menu');
  }

  async saveMenuItems(items: MenuItem[]): Promise<void> {
    await this.writeData('menu', this.createIdMap(items));
  }

  // Orders
  async getActiveOrders(): Promise<Order[]> {
    const orders = await this.readData<Order>('orders/active');
    // Convert date strings back to Date objects
    return orders.map(o => ({ ...o, createdAt: new Date(o.createdAt) }));
  }

  async getArchivedOrders(): Promise<Order[]> {
    const orders = await this.readData<Order>('orders/archived');
    // Convert date strings back to Date objects
    return orders.map(o => ({ ...o, createdAt: new Date(o.createdAt) }));
  }

  async saveAllOrders(activeOrders: Order[], archivedOrders: Order[]): Promise<void> {
    await this.writeData('orders/active', this.createIdMap(activeOrders));
    await this.writeData('orders/archived', this.createIdMap(archivedOrders));
  }

  // Staff
  async getStaff(): Promise<StaffMember[]> {
    return this.readData<StaffMember>('staff');
  }

  async saveStaff(staff: StaffMember[]): Promise<void> {
    await this.writeData('staff', this.createIdMap(staff));
  }

  // Staff Transactions
  async getStaffTransactions(): Promise<StaffTransaction[]> {
    const txs = await this.readData<StaffTransaction>('staff_transactions');
    return txs.map(tx => ({...tx, date: new Date(tx.date)}));
  }

  async saveStaffTransactions(transactions: StaffTransaction[]): Promise<void> {
    await this.writeData('staff_transactions', this.createIdMap(transactions));
  }

  // Tables
  async getTables(): Promise<Table[]> {
    return this.readData<Table>('tables');
  }

  async saveTables(tables: Table[]): Promise<void> {
    await this.writeData('tables', this.createIdMap(tables));
  }

  // Customers
  async getCustomers(): Promise<Customer[]> {
    return this.readData<Customer>('customers');
  }

  async saveCustomers(customers: Customer[]): Promise<void> {
    await this.writeData('customers', this.createIdMap(customers));
  }
}

export const firebaseRepository = new FirebaseRepository();

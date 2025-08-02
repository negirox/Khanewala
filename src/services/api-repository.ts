/**
 * @fileoverview
 * This file contains the ApiRepository class, which is responsible for
 * handling all data operations by making requests to a remote API.
 *
 * NOTE: This is a placeholder implementation. It currently uses mock data
 * for demonstration purposes and does not perform actual API calls.
 */
import type { MenuItem, Order, Table, StaffMember, Customer, StaffTransaction } from '@/lib/types';

// In-memory store for the mock API
let mockMenuItems: MenuItem[] = [];
let mockActiveOrders: Order[] = [];
let mockArchivedOrders: Order[] = [];
let mockTables: Table[] = [];
let mockStaff: StaffMember[] = [];
let mockCustomers: Customer[] = [];
let mockStaffTransactions: StaffTransaction[] = [];


class ApiRepository {
  // Menu Items
  async getMenuItems(): Promise<MenuItem[]> {
    console.log('API: Fetching menu items...');
    return Promise.resolve(mockMenuItems);
  }
  async saveMenuItems(items: MenuItem[]): Promise<void> {
    console.log('API: Saving menu items...');
    mockMenuItems = items;
    return Promise.resolve();
  }

  // Orders
  async getActiveOrders(): Promise<Order[]> {
    console.log('API: Fetching active orders...');
    return Promise.resolve(mockActiveOrders);
  }
  
  async getArchivedOrders(): Promise<Order[]> {
    console.log('API: Fetching archived orders...');
    return Promise.resolve(mockArchivedOrders);
  }

  async saveAllOrders(activeOrders: Order[], archivedOrders: Order[]): Promise<void> {
      console.log('API: Saving all orders...');
      mockActiveOrders = activeOrders;
      mockArchivedOrders = archivedOrders;
      return Promise.resolve();
  }

  // Staff
  async getStaff(): Promise<StaffMember[]> {
    console.log('API: Fetching staff...');
    return Promise.resolve(mockStaff);
  }
  async saveStaff(staff: StaffMember[]): Promise<void> {
      console.log('API: Saving staff...');
      mockStaff = staff;
      return Promise.resolve();
  }

  // Staff Transactions
  async getStaffTransactions(): Promise<StaffTransaction[]> {
      console.log('API: Fetching staff transactions...');
      return Promise.resolve(mockStaffTransactions);
  }
  async saveStaffTransactions(transactions: StaffTransaction[]): Promise<void> {
      console.log('API: Saving staff transactions...');
      mockStaffTransactions = transactions;
      return Promise.resolve();
  }
  
  // Tables
  async getTables(): Promise<Table[]> {
      console.log('API: Fetching tables...');
      return Promise.resolve(mockTables);
  }
  async saveTables(tables: Table[]): Promise<void> {
      console.log('API: Saving tables...');
      mockTables = tables;
      return Promise.resolve();
  }

  // Customers
    async getCustomers(): Promise<Customer[]> {
        console.log('API: Fetching customers...');
        return Promise.resolve(mockCustomers);
    }
    async saveCustomers(customers: Customer[]): Promise<void> {
        console.log('API: Saving customers...');
        mockCustomers = customers;
        return Promise.resolve();
    }
}

export const apiRepository = new ApiRepository();

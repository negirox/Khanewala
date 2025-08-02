/**
 * @fileoverview
 * This file contains the CsvRepository class, which is responsible for
 * handling all data operations by reading from and writing to CSV files
 * stored in the `/data` directory.
 */
import type { MenuItem, Order, Table, StaffMember, Customer } from '@/lib/types';
import Papa from 'papaparse';
import fs from 'fs/promises';
import path from 'path';

// Helper function to get the path to the CSV file in the `data` directory.
const getCSVPath = (fileName: string) => path.join(process.cwd(), 'data', fileName);

// Helper function to read and parse a CSV file.
async function readCsv<T>(fileName: string): Promise<T[]> {
  try {
    const filePath = getCSVPath(fileName);
    const fileContent = await fs.readFile(filePath, 'utf8');
    const parsed = Papa.parse<T>(fileContent, { 
      header: true, 
      dynamicTyping: true,
      skipEmptyLines: true,
    });
    if (parsed.errors.length > 0) {
      console.error(`Errors parsing ${fileName}:`, parsed.errors);
    }
    return parsed.data;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.warn(`CSV file not found: ${fileName}. Returning empty array.`);
      return [];
    }
    console.error(`Error reading CSV file ${fileName}:`, error);
    throw error;
  }
}

// Helper function to write data to a CSV file.
async function writeCsv<T extends object>(fileName: string, data: T[]): Promise<void> {
  try {
    const filePath = getCSVPath(fileName);
    const csvString = Papa.unparse(data);
    await fs.writeFile(filePath, csvString, 'utf8');
  } catch (error) {
    console.error(`Error writing CSV file ${fileName}:`, error);
    throw error;
  }
}


class CsvRepository {
  private allMenuItems: Promise<MenuItem[]>;

  constructor() {
    this.allMenuItems = this.getMenuItems();
  }

  // Menu Items
  async getMenuItems(): Promise<MenuItem[]> {
    return readCsv<MenuItem>('menu.csv');
  }

  async saveMenuItems(items: MenuItem[]): Promise<void> {
    await writeCsv('menu.csv', items);
    this.allMenuItems = Promise.resolve(items); // Update cached menu items
  }
  
  private async mapOrderItems(order: any): Promise<Order> {
      const menuItems = await this.allMenuItems;
      
      let parsedItems;
      try {
        // The 'items' field is stored as a JSON string in the CSV.
        parsedItems = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
      } catch (e) {
        console.error(`Failed to parse items for order ${order.id}:`, order.items);
        parsedItems = [];
      }

      const items = parsedItems.map((item: any) => {
        const menuItem = menuItems.find(m => m.id == item.menuItem.id);
        return {
            ...item,
            menuItem: menuItem || item.menuItem, // Fallback to stored item if not in current menu
        };
      });
      return { ...order, items, createdAt: new Date(order.createdAt) };
  }

  // Orders
  async getActiveOrders(): Promise<Order[]> {
    const rawOrders = await readCsv<any>('orders_active.csv');
    return Promise.all(rawOrders.map(o => this.mapOrderItems(o)));
  }
  
  async getArchivedOrders(): Promise<Order[]> {
    const rawOrders = await readCsv<any>('orders_archived.csv');
    return Promise.all(rawOrders.map(o => this.mapOrderItems(o)));
  }

  async saveAllOrders(activeOrders: Order[], archivedOrders: Order[]): Promise<void> {
    const sanitizeOrderForCsv = (order: Order) => ({
      ...order,
      // Stringify the 'items' array for CSV storage.
      items: JSON.stringify(order.items.map(item => ({
        quantity: item.quantity,
        menuItem: { id: item.menuItem.id } // Only store ID to reduce redundancy
      }))),
    });

    await writeCsv('orders_active.csv', activeOrders.map(sanitizeOrderForCsv));
    await writeCsv('orders_archived.csv', archivedOrders.map(sanitizeOrderForCsv));
  }

  // Staff
  async getStaff(): Promise<StaffMember[]> {
    return readCsv<StaffMember>('staff.csv');
  }

  async saveStaff(staff: StaffMember[]): Promise<void> {
    await writeCsv('staff.csv', staff);
  }
  
  // Tables
  async getTables(): Promise<Table[]> {
    return readCsv<Table>('tables.csv');
  }

  async saveTables(tables: Table[]): Promise<void> {
    await writeCsv('tables.csv', tables);
  }

  // Customers
  async getCustomers(): Promise<Customer[]> {
    return readCsv<Customer>('customers.csv');
  }

  async saveCustomers(customers: Customer[]): Promise<void> {
    await writeCsv('customers.csv', customers);
  }
}

export const csvRepository = new CsvRepository();


'use server';

import type { Order, MenuItem, Customer, StaffMember, Table, StaffTransaction, StaffTransactionType, AppConfigData } from '@/lib/types';
import { defaultAppConfig } from '@/lib/types';
import Papa from 'papaparse';
import { csvRepository } from '@/services/csv-repository';
import { revalidatePath } from 'next/cache';

const dataRepository = csvRepository;


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
    await dataRepository.saveAllOrders(activeOrders, archivedOrders);
    // After saving, check if the archive needs to be rotated.
    await csvRepository.checkAndRotateArchive();
}

export async function createNewOrder(newOrderData: Omit<Order, 'id' | 'createdAt'>, activeOrders: Order[], archivedOrders: Order[], allCustomers: Customer[]) {
    // Lazy load services to avoid bundling server-only code where it's not needed.
    const { loyaltyService } = await import('@/services/loyalty-service');
    const { whatsappService } = await import('@/services/whatsapp-service');
    
    let finalOrderData = { ...newOrderData };
    let updatedCustomers = [...allCustomers];
    const config = await getAppConfig();
    
    // Handle Loyalty Points Earning
    if (newOrderData.customerId) {
        const customer = allCustomers.find(c => c.id === newOrderData.customerId);
        if (customer) {
            // Earn points on the final total
            const { updatedCustomer, pointsEarned } = loyaltyService.addPointsForOrder(customer, finalOrderData.total, config.loyalty);
            finalOrderData.pointsEarned = pointsEarned;
            
            // Send WhatsApp confirmation
            const tempOrder = { ...finalOrderData, id: 'temp', createdAt: new Date() }
            whatsappService.sendOrderConfirmation(updatedCustomer, tempOrder as Order, config);

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

export async function addNewCustomer(customerData: Omit<Customer, 'id' | 'loyaltyPoints'>) {
    const { brevoService } = await import('@/services/brevo-service');
    const customers = await getCustomers();
    const newCustomer: Customer = {
        ...customerData,
        id: `CUST-${Date.now()}`,
        loyaltyPoints: 0,
    };
    const updatedCustomers = [...customers, newCustomer];
    await saveCustomers(updatedCustomers);
    
    // Send welcome email
    const appConfig = await getAppConfig();
    await brevoService.sendWelcomeEmail(newCustomer, appConfig);
    
    return newCustomer;
}


// AI Recommendations
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
    const { readAdminConfigFile } = await import('@/services/file-system-service');
    try {
        const adminConfig = await readAdminConfigFile();
        if (credentials.username === adminConfig.username && credentials.password === adminConfig.password) {
            return { success: true };
        }
        return { success: false };
    } catch (error) {
        console.error("Error reading admin config:", error);
        return { success: false };
    }
}


// App Settings
export async function getAppConfig(): Promise<AppConfigData> {
    const { readAppConfigFile } = await import('@/services/file-system-service');
    const customConfig = await readAppConfigFile();
    // Merge default and custom config
    const mergedConfig = {
      ...defaultAppConfig,
      ...customConfig,
      enabledAdminSections: {
        ...defaultAppConfig.enabledAdminSections,
        ...customConfig.enabledAdminSections,
      },
      loyalty: {
          ...defaultAppConfig.loyalty,
          ...customConfig.loyalty,
      }
    };
    return mergedConfig;
}

export async function saveAppSettings(settings: AppConfigData): Promise<{ success: boolean, error?: string }> {
    const { writeAppConfigFile } = await import('@/services/file-system-service');
    try {
        await writeAppConfigFile(settings);
        // Revalidate the cache for the entire site to reflect changes
        revalidatePath('/', 'layout');
        return { success: true };
    } catch (error: any) {
        console.error("Error saving app settings:", error);
        return { success: false, error: error.message };
    }
}

export async function uploadLogo(formData: FormData): Promise<{ success: boolean; filePath?: string; error?: string }> {
    const { saveUploadedLogo } = await import('@/services/file-system-service');
    const file = formData.get('logo') as File;

    if (!file) {
        return { success: false, error: 'No file uploaded.' };
    }

    try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const filePath = await saveUploadedLogo(buffer);
        return { success: true, filePath: `${filePath}?v=${Date.now()}` }; // Add version query to bust cache
    } catch (error: any) {
        console.error('Error uploading logo:', error);
        return { success: false, error: 'Failed to save logo.' };
    }
}

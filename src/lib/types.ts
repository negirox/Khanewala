
export type OrderStatus = "received" | "preparing" | "ready" | "served" | "archived";

export type MenuCategory = "Appetizers" | "Main Courses" | "Desserts" | "Beverages" | "Breads" | "Rice & Biryani" | "Indian Chinese";

export type MenuItem = {
  id: string;
  name: string;
  price: number;
  category: MenuCategory;
  description?: string;
  image?: string;
  "data-ai-hint"?: string;
};

export type OrderItem = {
  menuItem: MenuItem;
  quantity: number;
};

export type Order = {
  id: string;
  tableNumber?: number;
  items: OrderItem[];
  status: OrderStatus;
  subtotal: number;
  discount: number; // Percentage
  total: number;
  createdAt: Date;
  customerId?: string;
  customerName?: string;
  pointsEarned?: number;
  pointsRedeemed?: number;
  redeemedValue?: number;
};

export type Table = {
  id: number;
  status: "available" | "occupied" | "reserved";
  capacity: number;
  orderId?: string;
};

export type StaffMember = {
  id: string;
  name: string;
  role: "Manager" | "Chef" | "Waiter" | "Busboy";
  email: string;
  phone: string;
  shift: "Morning" | "Afternoon" | "Night";
  avatar?: string;
  salary?: number;
  aadharCard?: string;
  panCard?: string;
  voterId?: string;
  carryForwardBalance: number;
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  loyaltyPoints: number;
};

export type AppTheme = 'default' | 'ocean' | 'sunset' | 'mint' | 'plum';
export type AppFont = 'pt-sans' | 'roboto-slab';
export type AppDataSource = 'csv' | 'firebase';

export type StaffTransactionType = "Advance" | "Daily Wage" | "Bonus" | "Salary";
export type PaymentMode = "Cash" | "Online";

export type StaffTransaction = {
    id: string;
    staffId: string;
    date: Date;
    amount: number;
    type: StaffTransactionType;
    paymentMode: PaymentMode;
    notes?: string;
};

export const defaultAppConfig: AppConfigData = {
    title: "KhaneWala",
    logo: "/logo.png",
    theme: 'default' as const,
    font: 'pt-sans' as const,
    dataSource: "firebase" as const,
    currency: "Rs.",
    gstNumber: "27ABCDE1234F1Z5",
    maxDiscount: 25,
    ownerName: "Admin",
    phone: "9876543210",
    address: "123 Spice Street, Flavor Town",
    enabledAdminSections: {
        dashboard: true,
        menu: true,
        staff: true,
        customers: true,
        settings: true,
    },
    loyalty: {
        pointsPerCurrencyUnit: 0.01,
        currencyUnitPerPoint: 1,
    },
    archiveFileLimit: 5 * 1024 * 1024, // 5MB
};


export interface AppConfigData {
  title: string;
  logo: string;
  theme: AppTheme;
  font: AppFont;
  dataSource: AppDataSource;
  ownerName: string;
  phone: string;
  address: string;
  enabledAdminSections: {
      dashboard: boolean;
      menu: boolean;
      staff: boolean;
      customers: boolean;
      settings: boolean;
  };
  gstNumber?: string;
  currency: string;
  maxDiscount: number;
  loyalty: {
      pointsPerCurrencyUnit: number;
      currencyUnitPerPoint: number;
  };
  archiveFileLimit: number;
}

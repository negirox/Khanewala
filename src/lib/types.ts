
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
  tableNumber: number;
  items: OrderItem[];
  status: OrderStatus;
  subtotal: number;
  discount: number; // Percentage
  total: number;
  createdAt: Date;
  customerId?: string;
  customerName?: string;
  pointsEarned?: number;
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

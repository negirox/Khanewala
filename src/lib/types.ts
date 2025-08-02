
export type OrderStatus = "received" | "preparing" | "ready" | "served" | "archived";

export type MenuItem = {
  id: string;
  name: string;
  price: number;
  category: "Appetizers" | "Main Courses" | "Desserts" | "Beverages";
  description?: string;
  image?: string;
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

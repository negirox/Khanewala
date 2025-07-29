export type OrderStatus = "received" | "preparing" | "ready" | "served";

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
};

export type Table = {
  id: number;
  status: "available" | "occupied" | "reserved";
  capacity: number;
  orderId?: string;
};

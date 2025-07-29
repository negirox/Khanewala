import type { MenuItem, Order, Table } from "./types";

export const menuItems: MenuItem[] = [
  { id: "1", name: "Samosa", price: 5.99, category: "Appetizers", description: "Crispy pastry filled with spiced potatoes and peas.", image: "https://placehold.co/600x400.png" },
  { id: "2", name: "Pakora", price: 6.99, category: "Appetizers", description: "Mixed vegetables dipped in gram flour batter and deep-fried.", image: "https://placehold.co/600x400.png" },
  { id: "3", name: "Butter Chicken", price: 15.99, category: "Main Courses", description: "Grilled chicken simmered in a creamy tomato sauce.", image: "https://placehold.co/600x400.png" },
  { id: "4", name: "Palak Paneer", price: 14.99, category: "Main Courses", description: "Indian cheese cubes in a smooth spinach sauce.", image: "https://placehold.co/600x400.png" },
  { id: "5", name: "Chole Bhature", price: 13.99, category: "Main Courses", description: "Spicy chickpea curry served with fluffy fried bread.", image: "https://placehold.co/600x400.png" },
  { id: "6", name: "Gulab Jamun", price: 4.99, category: "Desserts", description: "Soft, spongy balls made of milk solids, soaked in rose-scented syrup.", image: "https://placehold.co/600x400.png" },
  { id: "7", name: "Rasmalai", price: 5.99, category: "Desserts", description: "Cottage cheese dumplings soaked in sweetened, thickened milk.", image: "https://placehold.co/600x400.png" },
  { id: "8", name: "Mango Lassi", price: 4.50, category: "Beverages", description: "A refreshing yogurt-based drink with mango pulp.", image: "https://placehold.co/600x400.png" },
  { id: "9", name: "Masala Chai", price: 2.99, category: "Beverages", description: "Spiced milk tea with a blend of aromatic herbs.", image: "https://placehold.co/600x400.png" },
];

export const initialOrders: Order[] = [
  {
    id: "ORD001",
    tableNumber: 3,
    items: [
      { menuItem: menuItems[2], quantity: 2 },
      { menuItem: menuItems[7], quantity: 2 },
    ],
    status: "preparing",
    total: 43.96,
    createdAt: new Date(Date.now() - 10 * 60000), // 10 minutes ago
  },
  {
    id: "ORD002",
    tableNumber: 5,
    items: [
        { menuItem: menuItems[3], quantity: 1 },
        { menuItem: menuItems[0], quantity: 1 }
    ],
    status: "received",
    total: 20.98,
    createdAt: new Date(Date.now() - 5 * 60000), // 5 minutes ago
  },
  {
    id: "ORD003",
    tableNumber: 1,
    items: [
      { menuItem: menuItems[0], quantity: 2 },
      { menuItem: menuItems[4], quantity: 1 },
      { menuItem: menuItems[8], quantity: 2 },
    ],
    status: "received",
    total: 31.95,
    createdAt: new Date(Date.now() - 2 * 60000), // 2 minutes ago
  },
  {
    id: "ORD004",
    tableNumber: 8,
    items: [
      { menuItem: menuItems[5], quantity: 4 }
    ],
    status: "ready",
    total: 19.96,
    createdAt: new Date(Date.now() - 15 * 60000), // 15 minutes ago
  },
    {
    id: "ORD005",
    tableNumber: 2,
    items: [
      { menuItem: menuItems[1], quantity: 1 },
      { menuItem: menuItems[3], quantity: 1 },
    ],
    status: "served",
    total: 21.98,
    createdAt: new Date(Date.now() - 30 * 60000), // 30 minutes ago
  },
];

export const tables: Table[] = [
  { id: 1, status: "occupied", capacity: 4, orderId: "ORD003" },
  { id: 2, status: "occupied", capacity: 2, orderId: "ORD005" },
  { id: 3, status: "occupied", capacity: 4, orderId: "ORD001" },
  { id: 4, status: "available", capacity: 6 },
  { id: 5, status: "occupied", capacity: 2, orderId: "ORD002" },
  { id: 6, status: "available", capacity: 4 },
  { id: 7, status: "reserved", capacity: 8 },
  { id: 8, status: "occupied", capacity: 2, orderId: "ORD004" },
  { id: 9, status: "available", capacity: 4 },
  { id: 10, status: "available", capacity: 4 },
  { id: 11, status: "available", capacity: 2 },
  { id: 12, status: "reserved", capacity: 6 },
];

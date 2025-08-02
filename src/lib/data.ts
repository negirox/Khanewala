
import type { MenuItem, Order, Table, StaffMember, Customer } from "./types";
import { subDays } from 'date-fns';

export const menuItems: MenuItem[] = [
  { id: "1", name: "Samosa", price: 60, category: "Appetizers", description: "Crispy pastry filled with spiced potatoes and peas.", image: "https://placehold.co/600x400.png", "data-ai-hint": "samosa pastry" },
  { id: "2", name: "Pakora", price: 80, category: "Appetizers", description: "Mixed vegetables dipped in gram flour batter and deep-fried.", image: "https://placehold.co/600x400.png", "data-ai-hint": "pakora fritter" },
  { id: "3", name: "Butter Chicken", price: 450, category: "Main Courses", description: "Grilled chicken simmered in a creamy tomato sauce.", image: "https://placehold.co/600x400.png", "data-ai-hint": "butter chicken" },
  { id: "4", name: "Palak Paneer", price: 380, category: "Main Courses", description: "Indian cheese cubes in a smooth spinach sauce.", image: "https://placehold.co/600x400.png", "data-ai-hint": "palak paneer" },
  { id: "5", name: "Chole Bhature", price: 250, category: "Main Courses", description: "Spicy chickpea curry served with fluffy fried bread.", image: "https://placehold.co/600x400.png", "data-ai-hint": "chole bhature" },
  { id: "6", name: "Gulab Jamun", price: 100, category: "Desserts", description: "Soft, spongy balls made of milk solids, soaked in rose-scented syrup.", image: "https://placehold.co/600x400.png", "data-ai-hint": "gulab jamun" },
  { id: "7", name: "Rasmalai", price: 120, category: "Desserts", description: "Cottage cheese dumplings soaked in sweetened, thickened milk.", image: "https://placehold.co/600x400.png", "data-ai-hint": "rasmalai dessert" },
  { id: "8", name: "Mango Lassi", price: 150, category: "Beverages", description: "A refreshing yogurt-based drink with mango pulp.", image: "https://placehold.co/600x400.png", "data-ai-hint": "mango lassi" },
  { id: "9", name: "Masala Chai", price: 50, category: "Beverages", description: "Spiced milk tea with a blend of aromatic herbs.", image: "https://placehold.co/600x400.png", "data-ai-hint": "masala chai" },
];

export let initialOrders: Order[] = [
  {
    id: "ORD001",
    tableNumber: 3,
    items: [
      { menuItem: menuItems[2], quantity: 2 }, // 2x Butter Chicken = 900
      { menuItem: menuItems[7], quantity: 2 }, // 2x Rasmalai = 240
    ],
    status: "preparing",
    subtotal: 1140,
    discount: 10,
    total: 1026,
    createdAt: new Date(Date.now() - 10 * 60000), // 10 minutes ago
    customerId: "CUST01",
    customerName: "John Doe",
  },
  {
    id: "ORD002",
    tableNumber: 5,
    items: [
        { menuItem: menuItems[3], quantity: 1 }, // 1x Palak Paneer = 380
        { menuItem: menuItems[0], quantity: 1 }  // 1x Samosa = 60
    ],
    status: "received",
    subtotal: 440,
    discount: 0,
    total: 440,
    createdAt: new Date(Date.now() - 5 * 60000), // 5 minutes ago
  },
  {
    id: "ORD003",
    tableNumber: 1,
    items: [
      { menuItem: menuItems[0], quantity: 2 }, // 2x Samosa = 120
      { menuItem: menuItems[4], quantity: 1 }, // 1x Chole Bhature = 250
      { menuItem: menuItems[8], quantity: 2 }, // 2x Masala Chai = 100
    ],
    status: "received",
    subtotal: 470,
    discount: 0,
    total: 470,
    createdAt: new Date(Date.now() - 2 * 60000), // 2 minutes ago
  },
  {
    id: "ORD004",
    tableNumber: 8,
    items: [
      { menuItem: menuItems[5], quantity: 4 } // 4x Gulab Jamun = 400
    ],
    status: "ready",
    subtotal: 400,
    discount: 0,
    total: 400,
    createdAt: new Date(Date.now() - 15 * 60000), // 15 minutes ago
    customerId: "CUST02",
    customerName: "Jane Smith",
  },
];

const generatePastOrder = (daysAgo: number, id: string): Order => {
    const itemsCount = Math.floor(Math.random() * 3) + 1;
    const orderItems = Array.from({ length: itemsCount }, () => {
        const menuItem = menuItems[Math.floor(Math.random() * menuItems.length)];
        return { menuItem, quantity: Math.floor(Math.random() * 2) + 1 };
    });
    const subtotal = orderItems.reduce((acc, item) => acc + item.menuItem.price * item.quantity, 0);
    const discount = Math.random() > 0.8 ? 10 : 0;
    const total = subtotal * (1 - discount / 100);

    return {
        id,
        tableNumber: Math.floor(Math.random() * 12) + 1,
        items: orderItems,
        status: "archived",
        subtotal,
        discount,
        total,
        createdAt: subDays(new Date(), daysAgo),
    };
};

export let initialArchivedOrders: Order[] = [
    generatePastOrder(0, "ORD005"),
    generatePastOrder(0, "ORD006"),
    generatePastOrder(1, "ORD007"),
    generatePastOrder(1, "ORD008"),
    generatePastOrder(2, "ORD009"),
    generatePastOrder(3, "ORD010"),
    generatePastOrder(4, "ORD011"),
    generatePastOrder(5, "ORD012"),
    generatePastOrder(6, "ORD013"),
    generatePastOrder(6, "ORD014"),
];


export const tables: Table[] = [
  { id: 1, status: "occupied", capacity: 4, orderId: "ORD003" },
  { id: 2, status: "available", capacity: 2 },
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

export const initialStaff: StaffMember[] = [
  { id: "STAFF01", name: "Alice Johnson", role: "Manager", email: "alice@khanewala.com", phone: "123-456-7890", shift: "Morning", avatar: "https://placehold.co/100x100.png", salary: 50000 },
  { id: "STAFF02", name: "Bob Williams", role: "Chef", email: "bob@khanewala.com", phone: "123-456-7891", shift: "Afternoon", avatar: "https://placehold.co/100x100.png", salary: 45000 },
  { id: "STAFF03", name: "Charlie Brown", role: "Waiter", email: "charlie@khanewala.com", phone: "123-456-7892", shift: "Morning", avatar: "https://placehold.co/100x100.png", salary: 30000 },
  { id: "STAFF04", name: "Diana Prince", role: "Waiter", email: "diana@khanewala.com", phone: "123-456-7893", shift: "Night", avatar: "https://placehold.co/100x100.png", salary: 32000 },
  { id: "STAFF05", name: "Eve Adams", role: "Busboy", email: "eve@khanewala.com", phone: "123-456-7894", shift: "Afternoon", avatar: "https://placehold.co/100x100.png", salary: 25000 },
];

export const initialCustomers: Customer[] = [
  { id: "CUST01", name: "John Doe", email: "john.d@email.com", phone: "555-0101", avatar: "https://placehold.co/100x100.png", loyaltyPoints: 150 },
  { id: "CUST02", name: "Jane Smith", email: "jane.s@email.com", phone: "555-0102", avatar: "https://placehold.co/100x100.png", loyaltyPoints: 75 },
  { id: "CUST03", name: "Peter Jones", email: "peter.j@email.com", phone: "555-0103", avatar: "https://placehold.co/100x100.png", loyaltyPoints: 20 },
];

    
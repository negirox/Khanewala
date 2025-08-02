# 🍽️ Khanewala - Restaurant Management & Food Delivery System

**Khanewala** is a modern restaurant management and food delivery platform inspired by **Swiggy**. It allows users to explore restaurants, place food orders, make online payments, and track deliveries in real time — all in one powerful, scalable system.

---

## 🚀 Features

### 👨‍🍳 Customer App
- Login/Signup with Email or OTP
- Browse restaurants & dishes by category/location
- Add items to cart & place orders
- Real-time order tracking (with map integration)
- Online payment support (Razorpay, Stripe, etc.)
- Apply coupon codes & get order confirmation

### 🍱 Restaurant Partner App
- Secure login for restaurant owners
- Add/edit food items, categories, images, pricing
- Manage inventory and availability
- Accept/reject/prepare incoming orders
- View analytics (daily sales, reviews, etc.)

### 🛵 Delivery Boy App
- Login and view assigned deliveries
- Real-time delivery updates: picked up, on the way, delivered
- GPS-enabled delivery tracking
- Delivery history and earnings reports

### 🧑‍💼 Admin Panel
- Admin dashboard with KPIs: Orders, Revenue, Active Users
- Manage customers, restaurants, and delivery agents
- Approve restaurant applications
- Create categories, banners, and offers
- Manage static content (Terms, About, etc.)

---

## 🧩 Tech Stack

| Layer           | Technology             |
|----------------|------------------------|
| Frontend       | React.js + Tailwind CSS |
| Backend        | Node.js + Express       |
| Database       | MongoDB + Mongoose      |
| Realtime       | Socket.io (Live Tracking) |
| Auth           | JWT + Bcrypt            |
| Payment        | Razorpay or Stripe API  |
| Deployment     | Vercel / Render / DigitalOcean |

---

## 🛠️ Installation Steps

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/khanewala.git
cd khanewala

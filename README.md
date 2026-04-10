# 🍔 FoodRush — Food Delivery App

A full-stack food delivery application that connects customers with local restaurants for seamless online ordering and real-time delivery tracking.

## ✨ Features

### Customer
- Browse restaurants by cuisine, rating, or distance
- Search for specific dishes or restaurants
- Real-time order tracking with live map
- Secure checkout with multiple payment options
- Order history and reorder functionality
- Reviews and ratings for restaurants

### Restaurant
- Dashboard to manage menu items and availability
- Incoming order notifications
- Order status management (accept, prepare, ready)
- Sales analytics and reports

### Delivery
- Driver app with route optimization
- Real-time earnings tracker
- Delivery history

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Tailwind CSS, React Router |
| Backend | Node.js, Express |
| Database |MongoDB |
| Auth | JWT, bcrypt |
| Payments | Stripe |
| Real-time | Socket.io |
| Maps | Google Maps API |
| Storage | AWS S3 |
| Deployment | Netlify (frontend), Render (backend) |

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- MongoDB
- npm or yarn

### Installation

1. **Clone the repository**

```bash
cd FoodRush
```

2. **Install dependencies**

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

3. **Set up environment variables**

```bash
cp .env.example .env
# Fill in your values (see Environment Variables section)
```
4. **Start the development servers**
```bash
# In the server directory
npm run dev

# In the client directory (new terminal)
npm run dev
```
## 📁 Project Structure

```
fooddash/
├── client/                  # React frontend
│   ├── public/
│   │   └── _redirects       # Netlify SPA routing fix
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Route-level pages
│   │   ├── hooks/           # Custom React hooks
│   │   ├── context/         # Global state (Auth, Cart)
│   │   ├── services/        # API call functions
│   │   └── utils/           # Helper functions
│   └── vite.config.js
│
├── server/                  # Express backend
│   ├── controllers/         # Route handlers
│   ├── middleware/          # Auth, error handling
│   ├── models/              # Database models
│   ├── routes/              # API route definitions
│   ├── services/            # Business logic
│   └── index.js
│
└── README.md

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/forgot-password` | Send reset email |
| POST | `/api/auth/reset-password/:token` | Reset password |

### Restaurants
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/restaurants` | List all restaurants |
| GET | `/api/restaurants/:id` | Get restaurant details |
| GET | `/api/restaurants/:id/menu` | Get menu items |

### Orders
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/orders` | Place a new order |
| GET | `/api/orders/:id` | Get order details |
| PATCH | `/api/orders/:id/status` | Update order status |
| GET | `/api/orders/history` | Get user's order history |

### Payments
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/payments/intent` | Create Stripe payment intent |
| POST | `/api/payments/webhook` | Stripe webhook handler |

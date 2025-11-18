# 🚀 Complete Testing Setup Guide

## Prerequisites

1. PostgreSQL database running
2. Node.js installed
3. Postman installed

## 📋 Step-by-Step Setup

### 1. Database Setup

```bash
# Make sure PostgreSQL is running
# Update .env file with your database connection string
# Example: DB_SQL_URL=postgresql://username:password@localhost:5432/inventory_db
```

### 2. Install Dependencies & Setup

```bash
cd f:\Coding\justoo\justoo\inventory\backend
npm install
npx drizzle-kit push  # Create database tables
```

### 3. Create Test Users

```bash
# Option 1: Create all test users at once
npm run create:test-users

# Option 2: Create users individually
node createUser.js --username admin --email admin@inventory.com --password admin123 --role admin
node createUser.js --username viewer --email viewer@inventory.com --password viewer123 --role viewer
```

### 4. Start the Server

```bash
npm run dev
```

### 5. Import Postman Collection

1. Open Postman
2. Click "Import" button
3. Select `Inventory_API_Postman_Collection.json`
4. Import `Inventory_API_Environment.postman_environment.json` as environment
5. Select the "Inventory API Environment" in the environment dropdown

## 🔐 User Credentials

### Admin User (Full Access)

- **Username:** `admin`
- **Email:** `admin@inventory.com`
- **Password:** `admin123`
- **Role:** `admin`
- **Can do:** Everything - view, add, edit, delete items, manage orders

### Viewer User (Read-Only + Orders)

- **Username:** `viewer`
- **Email:** `viewer@inventory.com`
- **Password:** `viewer123`
- **Role:** `viewer`
- **Can do:** View inventory items, place orders, view their own orders

## 🧪 Testing Workflow in Postman

### Phase 1: Authentication

1. **Run "Login Admin"** - This will automatically save the admin token
2. **Run "Login Viewer"** - This will automatically save the viewer token
3. **Test "Get Profile"** for both users

### Phase 2: Inventory Management

1. **Test "Get Available Units"** (public endpoint)
2. **Test "Get All Items"** with both admin and viewer tokens
3. **Test "Add Item (Admin Only)"** - Should work with admin token
4. **Test "Add Item (Viewer - Should Fail)"** - Should return 403
5. **Test "Get Item by ID"** using the created item
6. **Test "Update Item"** with admin token
7. **Test all stock status endpoints** (in-stock, out-of-stock, low-stock)

### Phase 3: Order Management

1. **Test "Check Stock Availability"**
2. **Test "Place Order"** with viewer token
3. **Test "Get All Orders"** with both tokens (viewer sees only their orders, admin sees all)
4. **Test "Get Order by ID"**
5. **Test "Cancel Order"** with admin token (viewer should get 403)
6. **Test "Bulk Update Stock"** with admin token

### Phase 4: Permission Testing

1. Try accessing admin-only endpoints with viewer token
2. Try accessing without any token
3. Test with expired/invalid tokens

## 📊 Expected Responses

### Successful Login Response:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@inventory.com",
      "role": "admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h"
  }
}
```

### Permission Denied Response:

```json
{
  "success": false,
  "message": "Insufficient permissions"
}
```

### Authentication Required Response:

```json
{
  "success": false,
  "message": "Access token required"
}
```

## 🔧 Troubleshooting

### Database Connection Issues

- Ensure PostgreSQL is running
- Check your .env file has correct DB_SQL_URL
- Run `npx drizzle-kit push` to create tables

### User Creation Issues

- Make sure database tables are created first
- Check if users already exist (script will skip existing users)

### Authentication Issues

- Token expires in 24 hours - login again if needed
- Make sure Authorization header format is: `Bearer <token>`

### Permission Issues

- Admin role: Can do everything
- Viewer role: Can only view data and manage their own orders

## 📈 API Endpoints Summary

### Public Endpoints (No Auth Required):

- `GET /health` - Health check
- `GET /api/inventory/units` - Get available units

### Authentication Endpoints:

- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/profile` - Get profile
- `PUT /api/auth/change-password` - Change password

### Inventory Endpoints (Auth Required):

- `GET /api/inventory/items` - List items (all users)
- `POST /api/inventory/items` - Add item (admin only)
- `PUT /api/inventory/items/:id` - Update item (admin only)
- `DELETE /api/inventory/items/:id` - Delete item (admin only)
- `GET /api/inventory/stock/*` - Stock status (all users)

### Order Endpoints (Auth Required):

- `GET /api/orders` - List orders (own orders for viewer, all for admin)
- `POST /api/orders/place-order` - Place order (all users)
- `POST /api/orders/cancel-order` - Cancel order (admin only)
- `POST /api/orders/bulk-update` - Bulk update stock (admin only)

Happy Testing! 🎉

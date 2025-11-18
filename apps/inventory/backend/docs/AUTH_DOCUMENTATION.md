# Authentication API Documentation

## Authentication Endpoints

### 1. Login

- **POST** `/api/auth/login`
- **Body:**

```json
{
  "username": "admin", // Can be username or email
  "password": "admin123"
}
```

- **Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@inventory.com",
      "role": "admin",
      "isActive": 1,
      "lastLogin": "2025-01-01T12:00:00.000Z",
      "createdAt": "2025-01-01T10:00:00.000Z",
      "updatedAt": "2025-01-01T12:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h"
  }
}
```

### 2. Logout

- **POST** `/api/auth/logout`
- **Headers:** `Authorization: Bearer <token>`
- **Response:**

```json
{
  "success": true,
  "message": "Logout successful"
}
```

### 3. Get Profile

- **GET** `/api/auth/profile`
- **Headers:** `Authorization: Bearer <token>`
- **Response:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "admin",
    "email": "admin@inventory.com",
    "role": "admin",
    "isActive": 1,
    "lastLogin": "2025-01-01T12:00:00.000Z",
    "createdAt": "2025-01-01T10:00:00.000Z",
    "updatedAt": "2025-01-01T12:00:00.000Z"
  }
}
```

## Authentication Usage

### Making Authenticated Requests

Include the JWT token in the Authorization header:

```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Example Login Flow:

```bash
# 1. Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'

# 2. Use token for authenticated requests
curl -X GET http://localhost:3001/api/inventory/items \
  -H "Authorization: Bearer <your-token-here>"
```

### Token Expiration

- Default expiration: 24 hours
- When a token expires, you'll receive a 403 response
- You need to login again to get a new token

## Updated Inventory API Endpoints

All inventory endpoints now require authentication. Here are the updated access requirements:

### Public Endpoints (No Authentication):

- `GET /api/inventory/units` - Get available units

### Authenticated Endpoints (All Roles):

- `GET /api/inventory/items` - List all items
- `GET /api/inventory/items/:id` - Get specific item
- `GET /api/inventory/stock/in-stock` - In-stock items
- `GET /api/inventory/stock/out-of-stock` - Out-of-stock items
- `GET /api/inventory/stock/low-stock` - Low stock items
- `GET /api/inventory/dashboard/stats` - Dashboard statistics

### Manager/Admin Only:

- `POST /api/inventory/items` - Add new item
- `PUT /api/inventory/items/:id` - Update item
- `DELETE /api/inventory/items/:id` - Delete item

## Updated Order API Endpoints

### All Authenticated Users:

- `POST /api/orders/place-order` - Process order
- `POST /api/orders/check-availability` - Check stock availability

### Manager/Admin Only:

- `POST /api/orders/cancel-order` - Cancel order
- `POST /api/orders/bulk-update` - Bulk update quantities

## Setup Instructions

### 1. Run Database Migrations

```bash
npx drizzle-kit push
```

### 2. Seed Admin User

```bash
npm run seed:admin
```

### 3. Start Server

```bash
npm run dev
```

### Default Admin Credentials:

- **Username:** admin
- **Password:** admin123
- **Email:** admin@inventory.com
- **Role:** admin

⚠️ **Important:** Change the default password after first login!

## Error Responses for Authentication

### 401 Unauthorized (No token or invalid credentials):

```json
{
  "success": false,
  "message": "Access token required"
}
```

### 403 Forbidden (Invalid/expired token or insufficient permissions):

```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

```json
{
  "success": false,
  "message": "Insufficient permissions"
}
```

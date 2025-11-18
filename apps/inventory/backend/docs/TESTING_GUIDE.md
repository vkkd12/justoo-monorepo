# 🧪 Testing Guide - User Creation & Authentication

## Quick Start - Create Test Users

### Option 1: Create All Test Users at Once (Recommended)

```bash
npm run create:test-users
```

This creates 5 test users:

- **admin** (admin123) - Full access
- **viewer1** (viewer123) - View-only access
- **john** (john123) - View-only access
- **sarah** (sarah123) - View-only access
- **testadmin** (test123) - Full access

### Option 2: Interactive User Creation

```bash
npm run create:user-interactive
```

Follow the prompts to create a custom user.

### Option 3: Command Line User Creation

```bash
npm run create:user -- --username testuser --email test@example.com --password test123 --role viewer
```

## 🔐 Test Credentials

After running `npm run create:test-users`, you can use these credentials:

| Username  | Password  | Role   | Permissions                 |
| --------- | --------- | ------ | --------------------------- |
| admin     | admin123  | admin  | Full access                 |
| viewer1   | viewer123 | viewer | View inventory & own orders |
| john      | john123   | viewer | View inventory & own orders |
| sarah     | sarah123  | viewer | View inventory & own orders |
| testadmin | test123   | admin  | Full access                 |

## 🚀 Testing the API

### 1. Start the Server

```bash
npm run dev
```

### 2. Test Login (Get Token)

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "manager1",
    "password": "manager123"
  }'
```

**Response Example:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 2,
      "username": "manager1",
      "email": "manager1@inventory.com",
      "role": "manager",
      "isActive": 1
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h"
  }
}
```

### 3. Test Protected Endpoints

Use the token from login response:

```bash
# View all items (any authenticated user)
curl -X GET http://localhost:3001/api/inventory/items \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Add new item (manager/admin only)
curl -X POST http://localhost:3001/api/inventory/items \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Apple",
    "description": "Fresh red apples for testing",
    "price": 150.50,
    "quantity": 100,
    "minStockLevel": 10,
    "unit": "kg",
    "category": "Fruits"
  }'
```

## 📋 Complete Testing Workflow

### Step 1: Setup Database and Users

```bash
# 1. Make sure your database is running and .env is configured
# 2. Run migrations
npx drizzle-kit push

# 3. Create test users
npm run create:test-users

# 4. Start server
npm run dev
```

### Step 2: Test Different User Roles

#### **Test as Employee (sarah)**

```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "sarah", "password": "sarah123"}'

# Should work: View items
curl -X GET http://localhost:3001/api/inventory/items \
  -H "Authorization: Bearer TOKEN"

# Should fail: Add item (403 Forbidden)
curl -X POST http://localhost:3001/api/inventory/items \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test", "price": 100, "unit": "pieces"}'
```

#### **Test as Manager (john)**

```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "john", "password": "john123"}'

# Should work: Add item
curl -X POST http://localhost:3001/api/inventory/items \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Manager Test Item",
    "price": 200,
    "quantity": 50,
    "unit": "pieces"
  }'
```

#### **Test as Admin**

```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# Can do everything - test any endpoint
```

### Step 3: Test Order Operations

```bash
# Check stock availability (any authenticated user)
curl -X POST http://localhost:3001/api/orders/check-availability \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"itemId": 1, "requiredQuantity": 5}
    ]
  }'

# Place order (any authenticated user)
curl -X POST http://localhost:3001/api/orders/place-order \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderItems": [
      {"itemId": 1, "quantity": 3}
    ]
  }'
```

## 🛠 Troubleshooting

### Common Issues:

1. **"User already exists"** - The user creation script skips existing users
2. **"Access token required"** - Include `Authorization: Bearer TOKEN` header
3. **"Insufficient permissions"** - User role doesn't have required permissions
4. **"Invalid or expired token"** - Login again to get a new token

### Reset Users:

If you need to start fresh, you can delete users from the database:

```sql
DELETE FROM users WHERE username != 'admin';
```

### View Current Users:

```sql
SELECT id, username, email, role, isActive FROM users;
```

## 📊 Permission Testing Matrix

Test these scenarios to verify your role-based access:

| Endpoint                      | Employee | Manager | Admin | Expected Result  |
| ----------------------------- | -------- | ------- | ----- | ---------------- |
| GET /api/inventory/items      | ✅       | ✅      | ✅    | 200 OK           |
| POST /api/inventory/items     | ❌       | ✅      | ✅    | 403 for employee |
| DELETE /api/inventory/items/1 | ❌       | ✅      | ✅    | 403 for employee |
| POST /api/orders/place-order  | ✅       | ✅      | ✅    | 200 OK           |
| POST /api/orders/cancel-order | ❌       | ✅      | ✅    | 403 for employee |
| POST /api/orders/bulk-update  | ❌       | ✅      | ✅    | 403 for employee |

## 🎯 API Testing Tools

### Using curl (Command Line)

Examples provided above

### Using Postman

1. Import the API endpoints
2. Set up environment variables for base URL and token
3. Create requests for each endpoint
4. Test different user roles

### Using Thunder Client (VS Code Extension)

1. Install Thunder Client extension
2. Create new requests
3. Set Authorization header: `Bearer {{token}}`
4. Test all endpoints

Happy testing! 🚀

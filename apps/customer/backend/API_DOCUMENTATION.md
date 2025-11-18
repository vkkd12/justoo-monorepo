# Justoo Customer Backend API Documentation

This documentation provides comprehensive details for testing the Justoo Customer Backend API using Postman or any other API testing tool.

## Base Configuration

**Base URL:** `http://localhost:8080`  
**Default Port:** 8080  
**Environment:** development

## Authentication

The API uses JWT tokens for authentication. Tokens can be provided in two ways:

1. **Cookie** (Recommended): `token` cookie is automatically set on login
2. **Header**: `Authorization: Bearer <token>`

### Global Headers for Postman Collection:

```
Content-Type: application/json
Accept: application/json
```

---

## 📊 Health Check

### Check API Status

- **Endpoint:** `GET /health`
- **Authentication:** None required
- **Description:** Check if the API server is running

**Response Example:**

```json
{
  "status": "OK",
  "message": "Customer Backend is running",
  "timestamp": "2025-09-19T10:30:00.000Z",
  "environment": "development"
}
```

---

## 🔐 Authentication Endpoints

### 1. Register Customer

- **Endpoint:** `POST /api/auth/register`
- **Authentication:** None required
- **Content-Type:** `application/json`

**Request Body:**

```json
{
  "name": "John Doe",
  "phone": "+919876543210",
  "email": "john.doe@example.com",
  "password": "password123"
}
```

**Required Fields:** `name`, `phone`, `password`  
**Optional Fields:** `email`

**Success Response (201):**

```json
{
  "success": true,
  "message": "Customer registered successfully",
  "data": {
    "customer": {
      "id": 1,
      "name": "John Doe",
      "phone": "+919876543210",
      "email": "john.doe@example.com",
      "status": "active",
      "isActive": 1,
      "createdAt": "2025-09-19T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. Login Customer

- **Endpoint:** `POST /api/auth/login`
- **Authentication:** None required

**Request Body:**

```json
{
  "phone": "+919876543210",
  "password": "password123"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "customer": {
      "id": 1,
      "name": "John Doe",
      "phone": "+919876543210",
      "email": "john.doe@example.com",
      "status": "active"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 3. Get Profile

- **Endpoint:** `GET /api/auth/profile`
- **Authentication:** Required

**Success Response (200):**

```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "id": 1,
    "name": "John Doe",
    "phone": "+919876543210",
    "email": "john.doe@example.com",
    "profileImage": null,
    "dateOfBirth": null,
    "gender": null,
    "totalOrders": 0,
    "totalSpent": 0,
    "preferredPaymentMethod": null,
    "createdAt": "2025-09-19T10:30:00.000Z"
  }
}
```

### 4. Update Profile

- **Endpoint:** `PUT /api/auth/profile`
- **Authentication:** Required

**Request Body:**

```json
{
  "name": "John Updated",
  "email": "john.updated@example.com",
  "dateOfBirth": "1990-01-15",
  "gender": "male",
  "profileImage": "https://example.com/profile.jpg"
}
```

### 5. Change Password

- **Endpoint:** `PUT /api/auth/change-password`
- **Authentication:** Required

**Request Body:**

```json
{
  "currentPassword": "password123",
  "newPassword": "newpassword123"
}
```

### 6. Logout

- **Endpoint:** `POST /api/auth/logout`
- **Authentication:** Required

**Success Response (200):**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 🛍️ Items Endpoints

### 1. Get All Items

- **Endpoint:** `GET /api/items`
- **Authentication:** Optional (for personalization)

**Query Parameters:**

- `page` (default: 1) - Page number
- `limit` (default: 20) - Items per page
- `category` - Filter by category
- `search` - Search in name/description
- `minPrice` - Minimum price filter
- `maxPrice` - Maximum price filter
- `sortBy` (default: 'name') - Sort field (name, price, createdAt, quantity)
- `sortOrder` (default: 'asc') - Sort order (asc, desc)
- `inStock` (default: true) - Show only in-stock items

**Example:** `GET /api/items?page=1&limit=10&category=Electronics&sortBy=price&sortOrder=desc`

**Success Response (200):**

```json
{
  "success": true,
  "message": "Items retrieved successfully",
  "data": {
    "items": [
      {
        "id": 1,
        "name": "Smartphone",
        "description": "Latest smartphone with advanced features",
        "price": 25000,
        "discount": 2000,
        "category": "Electronics",
        "unit": "piece",
        "quantity": 50,
        "image": "smartphone.jpg",
        "isActive": 1,
        "createdAt": "2025-09-19T10:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 100,
      "itemsPerPage": 20,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### 2. Get Item by ID

- **Endpoint:** `GET /api/items/{id}`
- **Authentication:** None required

**Example:** `GET /api/items/1`

### 3. Get Categories

- **Endpoint:** `GET /api/items/categories`
- **Authentication:** None required

**Success Response (200):**

```json
{
  "success": true,
  "message": "Categories retrieved successfully",
  "data": [
    {
      "category": "Electronics",
      "count": 25,
      "totalItems": 150
    },
    {
      "category": "Groceries",
      "count": 50,
      "totalItems": 300
    }
  ]
}
```

### 4. Get Featured Items

- **Endpoint:** `GET /api/items/featured`
- **Authentication:** None required

**Query Parameters:**

- `limit` (default: 10) - Number of featured items

### 5. Search Items

- **Endpoint:** `GET /api/items/search`
- **Authentication:** None required

**Query Parameters:**

- `q` (required) - Search query (minimum 2 characters)
- `limit` (default: 20) - Number of results

**Example:** `GET /api/items/search?q=smartphone&limit=10`

### 6. Get Items by Category

- **Endpoint:** `GET /api/items/category/{category}`
- **Authentication:** None required

**Example:** `GET /api/items/category/Electronics?page=1&limit=10`

### 7. Get Item Suggestions

- **Endpoint:** `GET /api/items/suggestions`
- **Authentication:** Optional (provides personalized suggestions if authenticated)

**Query Parameters:**

- `limit` (default: 10) - Number of suggestions

---

## 🛒 Cart Endpoints

**Note:** All cart endpoints require authentication.

### 1. Get Cart

- **Endpoint:** `GET /api/cart`
- **Authentication:** Required

**Success Response (200):**

```json
{
  "success": true,
  "message": "Cart retrieved successfully",
  "data": {
    "items": [
      {
        "id": 1,
        "name": "Smartphone",
        "price": 25000,
        "discount": 2000,
        "unit": "piece",
        "quantity": 2,
        "totalPrice": 50000,
        "image": "smartphone.jpg",
        "availableQuantity": 50
      }
    ],
    "total": 50000,
    "itemCount": 2
  }
}
```

### 2. Add Item to Cart

- **Endpoint:** `POST /api/cart/add`
- **Authentication:** Required

**Request Body:**

```json
{
  "itemId": 1,
  "quantity": 2
}
```

### 3. Update Cart Item

- **Endpoint:** `PUT /api/cart/item/{itemId}`
- **Authentication:** Required

**Request Body:**

```json
{
  "quantity": 3
}
```

**Example:** `PUT /api/cart/item/1`

### 4. Remove Item from Cart

- **Endpoint:** `DELETE /api/cart/item/{itemId}`
- **Authentication:** Required

**Example:** `DELETE /api/cart/item/1`

### 5. Clear Cart

- **Endpoint:** `DELETE /api/cart`
- **Authentication:** Required

### 6. Get Cart Summary

- **Endpoint:** `GET /api/cart/summary`
- **Authentication:** Required

**Success Response (200):**

```json
{
  "success": true,
  "message": "Cart summary retrieved successfully",
  "data": {
    "items": [...],
    "subtotal": 50000,
    "deliveryFee": 0,
    "taxAmount": 2500,
    "total": 52500,
    "itemCount": 2,
    "freeDeliveryThreshold": 100
  }
}
```

---

## 📦 Order Endpoints

**Note:** All order endpoints require authentication.

### 1. Create Order

- **Endpoint:** `POST /api/orders`
- **Authentication:** Required

**Request Body:**

```json
{
  "deliveryAddressId": 1,
  "paymentMethod": "cash",
  "specialInstructions": "Please ring the bell twice",
  "notes": "Urgent delivery"
}
```

**Success Response (201):**

```json
{
  "success": true,
  "message": "Order placed successfully",
  "data": {
    "order": {
      "id": 1,
      "customerId": 1,
      "status": "placed",
      "totalAmount": 52500,
      "itemCount": 2,
      "orderPlacedAt": "2025-09-19T10:30:00.000Z",
      "estimatedDeliveryTime": "2025-09-19T11:30:00.000Z",
      "items": [...],
      "deliveryAddress": {...},
      "payment": {...}
    },
    "orderNumber": "ORD-1726747800000-123",
    "estimatedDelivery": 60
  }
}
```

### 2. Get Customer Orders

- **Endpoint:** `GET /api/orders`
- **Authentication:** Required

**Query Parameters:**

- `page` (default: 1) - Page number
- `limit` (default: 10) - Orders per page
- `status` - Filter by order status
- `sortBy` (default: 'orderPlacedAt') - Sort field
- `sortOrder` (default: 'desc') - Sort order

**Example:** `GET /api/orders?page=1&limit=5&status=delivered`

### 3. Get Order by ID

- **Endpoint:** `GET /api/orders/{orderId}`
- **Authentication:** Required

**Example:** `GET /api/orders/1`

### 4. Cancel Order

- **Endpoint:** `PUT /api/orders/{orderId}/cancel`
- **Authentication:** Required

**Example:** `PUT /api/orders/1/cancel`

### 5. Get Order Statistics

- **Endpoint:** `GET /api/orders/stats`
- **Authentication:** Required

**Success Response (200):**

```json
{
  "success": true,
  "message": "Order statistics retrieved successfully",
  "data": {
    "overview": {
      "totalOrders": 15,
      "totalSpent": 75000,
      "avgOrderValue": 5000,
      "lastOrderDate": "2025-09-19T10:30:00.000Z"
    },
    "statusBreakdown": [
      { "status": "delivered", "count": 10 },
      { "status": "placed", "count": 3 },
      { "status": "cancelled", "count": 2 }
    ]
  }
}
```

---

## 📍 Address Endpoints

**Note:** All address endpoints require authentication.

### 1. Get Customer Addresses

- **Endpoint:** `GET /api/addresses`
- **Authentication:** Required

**Success Response (200):**

```json
{
  "success": true,
  "message": "Addresses retrieved successfully",
  "data": [
    {
      "id": 1,
      "customerId": 1,
      "type": "home",
      "label": "Home",
      "fullAddress": "123 Main Street, Downtown, City",
      "landmark": "Near Central Mall",
      "latitude": 28.6139,
      "longitude": 77.209,
      "pincode": "110001",
      "city": "Delhi",
      "state": "Delhi",
      "country": "India",
      "isDefault": 1,
      "isActive": 1,
      "createdAt": "2025-09-19T10:30:00.000Z"
    }
  ]
}
```

### 2. Add Address

- **Endpoint:** `POST /api/addresses`
- **Authentication:** Required

**Request Body:**

```json
{
  "type": "home",
  "label": "Home",
  "fullAddress": "123 Main Street, Downtown, City",
  "landmark": "Near Central Mall",
  "latitude": 28.6139,
  "longitude": 77.209,
  "pincode": "110001",
  "city": "Delhi",
  "state": "Delhi",
  "country": "India",
  "isDefault": false
}
```

**Required Fields:** `fullAddress`
**Optional Fields:** All others

### 3. Get Address by ID

- **Endpoint:** `GET /api/addresses/{addressId}`
- **Authentication:** Required

**Example:** `GET /api/addresses/1`

### 4. Update Address

- **Endpoint:** `PUT /api/addresses/{addressId}`
- **Authentication:** Required

**Request Body:** Same as Add Address

### 5. Delete Address

- **Endpoint:** `DELETE /api/addresses/{addressId}`
- **Authentication:** Required

**Example:** `DELETE /api/addresses/1`

### 6. Set Default Address

- **Endpoint:** `PUT /api/addresses/{addressId}/default`
- **Authentication:** Required

**Example:** `PUT /api/addresses/1/default`

### 7. Get Default Address

- **Endpoint:** `GET /api/addresses/default`
- **Authentication:** Required

### 8. Validate Address

- **Endpoint:** `GET /api/addresses/validate`
- **Authentication:** Required

**Query Parameters:**

- `latitude` (required) - Address latitude
- `longitude` (required) - Address longitude

**Example:** `GET /api/addresses/validate?latitude=28.6139&longitude=77.2090`

**Success Response (200):**

```json
{
  "success": true,
  "message": "Address validation completed",
  "data": {
    "isValid": true,
    "inServiceArea": true,
    "nearestZone": {
      "id": 1,
      "name": "Central Delhi",
      "distance": 2.5,
      "estimatedDeliveryTime": 60,
      "baseDeliveryFee": 40
    }
  }
}
```

---

## 🧪 Postman Testing Setup

### 1. Environment Variables

Create a new environment in Postman with these variables:

```
baseUrl: http://localhost:8080
token: {{authToken}} (will be set automatically after login)
```

### 2. Pre-request Scripts for Authentication

For endpoints requiring authentication, add this pre-request script:

```javascript
// Check if we have a token
if (!pm.environment.get("token")) {
  console.log("No token found. Please login first.");
}
```

### 3. Test Scripts for Login/Register

Add this test script to login/register requests to automatically store the token:

```javascript
pm.test("Login successful", function () {
  pm.response.to.have.status(200);

  const responseJson = pm.response.json();
  if (responseJson.success && responseJson.data.token) {
    pm.environment.set("token", responseJson.data.token);
    console.log("Token saved successfully");
  }
});
```

### 4. Authorization Header Setup

For authenticated endpoints, set the Authorization header to:

```
Bearer {{token}}
```

---

## 🚨 Common Error Responses

### Authentication Errors

```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

### Validation Errors

```json
{
  "success": false,
  "message": "Name, phone, and password are required"
}
```

### Not Found Errors

```json
{
  "success": false,
  "message": "Item not found"
}
```

### Server Errors

```json
{
  "success": false,
  "message": "Failed to retrieve items"
}
```

---

## 📝 Testing Workflow

### 1. Basic Flow

1. **Health Check** - Verify API is running
2. **Register** - Create new customer account
3. **Login** - Get authentication token
4. **Get Profile** - Verify authentication works

### 2. Shopping Flow

1. **Get Items** - Browse available items
2. **Add to Cart** - Add items to cart
3. **Get Cart** - Verify cart contents
4. **Add Address** - Create delivery address
5. **Create Order** - Place an order
6. **Get Orders** - View order history

### 3. Management Flow

1. **Update Profile** - Modify customer details
2. **Manage Addresses** - Add/update/delete addresses
3. **Change Password** - Update security credentials
4. **Logout** - Clear session

---

## 🔧 Environment Configuration

Make sure these environment variables are set in your `.env` file:

```env
PORT=8080
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
FRONTEND_URL=http://localhost:3000
DATABASE_URL=your_database_connection_string
```

## 📊 Rate Limiting

The API has rate limiting configured:

- **Limit:** 100 requests per 15 minutes per IP
- **Response:** 429 Too Many Requests when exceeded

---

This documentation covers all available endpoints in the Justoo Customer Backend API. Use this as a reference when setting up your Postman collection for comprehensive API testing.

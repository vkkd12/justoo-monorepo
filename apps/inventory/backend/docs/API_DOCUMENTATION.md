# Inventory Management API Documentation

## Base URL

```
http://localhost:3001
```

## Authentication

Currently, no authentication is implemented. Add authentication middleware as needed.

## Units Enum

The system supports the following fixed units:

- `kg` - Kilograms
- `grams` - Grams
- `ml` - Milliliters
- `litre` - Litres
- `pieces` - Individual pieces
- `dozen` - Dozen (12 pieces)
- `packet` - Packet
- `bottle` - Bottle
- `can` - Can

## API Endpoints

### Inventory Management

#### 1. Add New Item

- **POST** `/api/inventory/items`
- **Body:**

```json
{
  "name": "Apple",
  "description": "Fresh red apples",
  "price": 150.5,
  "quantity": 100,
  "minStockLevel": 10,
  "discount": 5.0,
  "unit": "kg",
  "category": "Fruits"
}
```

#### 2. Get All Items

- **GET** `/api/inventory/items`
- **Query Parameters:**
  - `page` (default: 1)
  - `limit` (default: 20)
  - `search` - Search by item name
  - `category` - Filter by category
  - `stockStatus` - `in-stock`, `out-of-stock`, `low-stock`, `all`
  - `includeInactive` - `true`/`false` (default: false)

#### 3. Get Item by ID

- **GET** `/api/inventory/items/:id`

#### 4. Update Item

- **PUT** `/api/inventory/items/:id`
- **Body:** (All fields optional)

```json
{
  "name": "Updated Apple",
  "price": 160.0,
  "quantity": 80,
  "isActive": true
}
```

#### 5. Delete Item

- **DELETE** `/api/inventory/items/:id`
- **Query Parameters:**
  - `permanent=true` - For hard delete (default: soft delete)

#### 6. Get In-Stock Items

- **GET** `/api/inventory/stock/in-stock`
- **Query Parameters:** `page`, `limit`, `search`, `category`

#### 7. Get Out-of-Stock Items

- **GET** `/api/inventory/stock/out-of-stock`
- **Query Parameters:** `page`, `limit`, `search`, `category`

#### 8. Get Low Stock Items

- **GET** `/api/inventory/stock/low-stock`
- **Query Parameters:** `page`, `limit`, `search`, `category`

#### 9. Get Available Units

- **GET** `/api/inventory/units`

#### 10. Get Dashboard Statistics

- **GET** `/api/inventory/dashboard/stats`
- **Response:**

```json
{
  "success": true,
  "data": {
    "totalItems": 150,
    "inStockItems": 120,
    "outOfStockItems": 10,
    "lowStockItems": 20,
    "totalInventoryValue": "125000.50"
  }
}
```

### Order Management

#### 1. Process Order Placement

- **POST** `/api/orders/place-order`
- **Body:**

```json
{
  "orderItems": [
    {
      "itemId": 1,
      "quantity": 5
    },
    {
      "itemId": 2,
      "quantity": 3
    }
  ]
}
```

#### 2. Process Order Cancellation

- **POST** `/api/orders/cancel-order`
- **Body:**

```json
{
  "orderItems": [
    {
      "itemId": 1,
      "quantity": 5
    },
    {
      "itemId": 2,
      "quantity": 3
    }
  ]
}
```

#### 3. Bulk Update Quantities

- **POST** `/api/orders/bulk-update`
- **Body:**

```json
{
  "updates": [
    {
      "itemId": 1,
      "quantity": 50,
      "operation": "add"
    },
    {
      "itemId": 2,
      "quantity": 100,
      "operation": "set"
    },
    {
      "itemId": 3,
      "quantity": 10,
      "operation": "subtract"
    }
  ]
}
```

- **Operations:**
  - `set` - Set quantity to exact value
  - `add` - Add to current quantity
  - `subtract` - Subtract from current quantity

#### 4. Check Stock Availability

- **POST** `/api/orders/check-availability`
- **Body:**

```json
{
  "items": [
    {
      "itemId": 1,
      "requiredQuantity": 10
    },
    {
      "itemId": 2,
      "requiredQuantity": 5
    }
  ]
}
```

### Utility

#### Health Check

- **GET** `/health`

## Database Schema

### Items Table

```sql
CREATE TABLE items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  quantity INTEGER DEFAULT 0,
  min_stock_level INTEGER DEFAULT 10,
  discount DECIMAL(5,2) DEFAULT 0.00,
  unit unit_enum NOT NULL,
  category VARCHAR(100),
  is_active INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message (in development mode)"
}
```

## Success Responses

All successful responses include:

```json
{
  "success": true,
  "message": "Operation description",
  "data": {
    /* response data */
  },
  "pagination": {
    /* pagination info for list endpoints */
  }
}
```

## Usage Examples

### Adding an Item

```bash
curl -X POST http://localhost:3001/api/inventory/items \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Organic Bananas",
    "description": "Fresh organic bananas",
    "price": 80.00,
    "quantity": 50,
    "minStockLevel": 5,
    "unit": "kg",
    "category": "Fruits"
  }'
```

### Processing an Order

```bash
curl -X POST http://localhost:3001/api/orders/place-order \
  -H "Content-Type: application/json" \
  -d '{
    "orderItems": [
      {"itemId": 1, "quantity": 3},
      {"itemId": 2, "quantity": 2}
    ]
  }'
```

### Checking Low Stock Items

```bash
curl "http://localhost:3001/api/inventory/stock/low-stock?page=1&limit=10"
```

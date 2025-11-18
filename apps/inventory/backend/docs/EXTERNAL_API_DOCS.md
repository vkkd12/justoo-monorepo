# Order API for External Backend Integration

This API allows external backend services (like mobile applications) to interact with the inventory system without authentication requirements.

## Base URL

```
http://localhost:3001/api/orders
```

## Available Endpoints

### 1. Place Order

**POST** `/place-order`

Place a new order and automatically update inventory quantities.

**Request Body:**

```json
{
  "orderItems": [
    {
      "itemId": 1,
      "quantity": 5
    },
    {
      "itemId": 2,
      "quantity": 2
    }
  ],
  "notes": "Order from mobile app",
  "externalUserId": 123,
  "externalOrderId": "MOB-2024-001"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Order processed. 2 items updated successfully.",
  "data": {
    "order": {
      "id": 1,
      "userId": 123,
      "status": "placed",
      "totalAmount": "150.00",
      "itemCount": 2,
      "notes": "Order from mobile app | External Order ID: MOB-2024-001"
    },
    "successful": [...],
    "failed": []
  }
}
```

### 2. Cancel Order

**POST** `/cancel-order`

Cancel an order and restore inventory quantities.

**Request Body:**

```json
{
  "orderItems": [
    {
      "itemId": 1,
      "quantity": 5
    }
  ]
}
```

### 3. Check Stock Availability

**POST** `/check-availability`

Check if items are available before placing an order.

**Request Body:**

```json
{
  "items": [
    {
      "itemId": 1,
      "requiredQuantity": 5
    },
    {
      "itemId": 2,
      "requiredQuantity": 10
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "allAvailable": false,
    "stockCheck": [
      {
        "itemId": 1,
        "itemName": "Product A",
        "currentQuantity": 15,
        "requiredQuantity": 5,
        "isAvailable": true,
        "shortfall": 0
      },
      {
        "itemId": 2,
        "itemName": "Product B",
        "currentQuantity": 5,
        "requiredQuantity": 10,
        "isAvailable": false,
        "shortfall": 5
      }
    ],
    "unavailableItems": [
      {
        "itemId": 2,
        "reason": "Insufficient stock. Available: 5, Required: 10"
      }
    ]
  }
}
```

### 4. Get All Orders

**GET** `/?page=1&limit=20&status=placed&userId=123`

Retrieve orders with optional filtering.

**Query Parameters:**

- `page` (optional): Page number for pagination
- `limit` (optional): Number of orders per page
- `status` (optional): Filter by order status (placed, cancelled, completed)
- `userId` (optional): Filter by specific user ID
- `externalUserId` (optional): Filter by external user ID

### 5. Get Order by ID

**GET** `/:id?userId=123`

Get a specific order by its internal ID.

**Query Parameters:**

- `userId` (optional): Verify order belongs to specific user
- `externalUserId` (optional): Verify order belongs to external user

### 6. Get Order by External ID

**GET** `/external/:externalId`

Get an order using the external order ID provided during order placement.

**Example:**

```
GET /external/MOB-2024-001
```

### 7. Bulk Update Quantities

**POST** `/bulk-update`

Update multiple item quantities at once (for restocking).

**Request Body:**

```json
{
  "updates": [
    {
      "itemId": 1,
      "quantity": 100,
      "operation": "set"
    },
    {
      "itemId": 2,
      "quantity": 50,
      "operation": "add"
    },
    {
      "itemId": 3,
      "quantity": 10,
      "operation": "subtract"
    }
  ]
}
```

**Operations:**

- `set`: Set quantity to exact value
- `add`: Add to current quantity
- `subtract`: Subtract from current quantity

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

## Integration Notes

1. **No Authentication Required**: All endpoints are accessible without tokens or authentication headers.

2. **External Order Tracking**: Use `externalOrderId` in order placement to track orders from your system.

3. **User Identification**: Use `externalUserId` to associate orders with your users.

4. **Inventory Updates**: Orders automatically update inventory quantities. Always check availability before placing orders.

5. **Error Handling**: Handle partial failures in order processing - some items may succeed while others fail.

6. **Order Status**: Orders start with "placed" status. Update status using your business logic as needed.

# Rider Backend API Documentation

## Overview

The Rider Backend provides comprehensive APIs for delivery rider management, order handling, notifications, and delivery operations.

## Base URL

```
http://localhost:3006/api
```

## Authentication

All endpoints (except authentication) require JWT token in Authorization header:

```
Authorization: Bearer <jwt_token>
```

---

## 1. Authentication Endpoints

### POST /auth/login

Login for riders.

**Request Body:**

```json
{
  "email": "rider@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "success": true,
  "token": "jwt_token_here",
  "rider": {
    "id": 1,
    "name": "John Doe",
    "email": "rider@example.com",
    "status": "active"
  }
}
```

### POST /auth/register

Register new rider account.

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "rider@example.com",
  "password": "password123",
  "phone": "+1234567890",
  "vehicleType": "motorcycle",
  "vehicleNumber": "ABC123"
}
```

---

## 2. Rider Management Endpoints

### GET /rider/profile

Get rider's profile information.

**Response:**

```json
{
  "success": true,
  "rider": {
    "id": 1,
    "name": "John Doe",
    "email": "rider@example.com",
    "phone": "+1234567890",
    "vehicleType": "motorcycle",
    "vehicleNumber": "ABC123",
    "status": "active"
  }
}
```

### PUT /rider/profile

Update rider's profile information.

**Request Body:**

```json
{
  "name": "John Doe Updated",
  "phone": "+1234567890",
  "vehicleType": "car",
  "vehicleNumber": "XYZ789"
}
```

### PUT /rider/password

Change rider's password.

**Request Body:**

```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

### PUT /rider/status

Update rider's availability status.

**Request Body:**

```json
{
  "status": "active" // active, busy, inactive
}
```

### GET /rider/stats

Get rider's delivery statistics and earnings.

**Response:**

```json
{
  "success": true,
  "stats": {
    "totalDeliveries": 150,
    "completedDeliveries": 145,
    "cancelledDeliveries": 5,
    "totalEarnings": 2500.0,
    "averageRating": 4.8,
    "todayDeliveries": 8
  }
}
```

---

## 3. Order Management Endpoints

### GET /orders/current

Get the current order assigned to the rider.

### GET /orders/assigned

Get all orders assigned to the rider with pagination.

**Query Parameters:**

- `status` (optional): Filter by order status
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

### GET /orders/completed

Get all completed orders for the rider with pagination.

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

### GET /orders/:orderId

Get detailed information about a specific order.

### POST /orders/:orderId/accept

Accept an order assignment.

### PUT /orders/:orderId/status

Update order status.

**Request Body:**

```json
{
  "status": "out_for_delivery", // confirmed, preparing, ready, out_for_delivery, delivered, cancelled
  "notes": "Optional notes"
}
```

---

## 4. Delivery Management Endpoints

### POST /delivery/:orderId/start

Start delivery for an order.

**Request Body:**

```json
{
  "estimatedDeliveryTime": "2024-01-15T14:30:00Z"
}
```

### POST /delivery/:orderId/complete

Mark delivery as completed.

**Request Body:**

```json
{
  "deliveryNotes": "Delivered successfully",
  "customerSignature": "base64_encoded_signature",
  "deliveryPhoto": "base64_encoded_photo"
}
```

### POST /delivery/:orderId/fail

Mark delivery as failed.

**Request Body:**

```json
{
  "failureReason": "Customer not available",
  "failureNotes": "Called customer multiple times"
}
```

### PUT /delivery/:orderId/progress

Update delivery progress and location.

**Request Body:**

```json
{
  "latitude": 40.7128,
  "longitude": -74.006,
  "progressNotes": "Arriving in 5 minutes"
}
```

### GET /delivery/history

Get delivery history for the rider.

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by delivery status

### GET /delivery/stats

Get delivery statistics for the rider.

**Query Parameters:**

- `period` (optional): day, week, month, year (default: month)

**Response:**

```json
{
  "success": true,
  "stats": {
    "totalDeliveries": 45,
    "successfulDeliveries": 42,
    "failedDeliveries": 2,
    "cancelledDeliveries": 1,
    "averageDeliveryTime": 25.5,
    "totalEarnings": 180.0
  },
  "period": "month"
}
```

---

## 5. Notification Endpoints

### GET /notifications

Get rider's notifications with pagination.

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

### GET /notifications/count

Get unread notification count.

**Response:**

```json
{
  "success": true,
  "unreadCount": 5
}
```

### PUT /notifications/:id/read

Mark specific notification as read.

### PUT /notifications/read-all

Mark all notifications as read.

### DELETE /notifications/:id

Delete a notification.

---

## Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

### Common HTTP Status Codes:

- `200` - Success
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `404` - Not Found
- `500` - Internal Server Error

---

## Data Models

### Order Status Flow:

1. `placed` → `confirmed` → `preparing` → `ready` → `out_for_delivery` → `delivered`
2. Any status can transition to `cancelled` or `failed`

### Rider Status:

- `active` - Available for deliveries
- `busy` - Currently on delivery
- `inactive` - Not available

### Vehicle Types:

- `motorcycle`
- `bicycle`
- `car`
- `truck`

---

## Rate Limiting

- Authentication endpoints: 5 requests per minute
- Other endpoints: 100 requests per minute per rider

## WebSocket Support

Real-time updates available for:

- New order assignments
- Order status changes
- Notification delivery

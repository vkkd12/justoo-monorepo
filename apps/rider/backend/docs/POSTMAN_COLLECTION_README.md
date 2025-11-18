# Rider Backend Postman Collection

This Postman collection contains all the API endpoints for testing the Rider Backend application.

## 📋 Collection Overview

The collection is organized into the following folders:

### 🔐 Authentication

- **Register Rider** - Create a new rider account
- **Login Rider** - Authenticate and get JWT token (automatically saves token for other requests)

### 👤 Rider Management

- **Get Rider Profile** - Retrieve current rider's profile information
- **Update Rider Profile** - Update rider's personal and vehicle information
- **Update Rider Password** - Change rider's password
- **Update Rider Status** - Update availability status (active/busy/inactive)
- **Get Rider Statistics** - Get delivery statistics and earnings

### 📦 Order Management

- **Get Current Order** - Get the currently assigned order
- **Get Assigned Orders** - Get all orders assigned to the rider (with pagination)
- **Get Completed Orders** - Get delivery history (with pagination)
- **Get Order Details** - Get detailed information about a specific order
- **Accept Order** - Accept an order assignment
- **Update Order Status** - Update order status in the delivery workflow

### 🚚 Delivery Management

- **Start Delivery** - Begin delivery process for an order
- **Complete Delivery** - Mark delivery as successfully completed
- **Fail Delivery** - Mark delivery as failed with reason
- **Update Delivery Progress** - Update delivery progress and notes
- **Get Delivery History** - Get rider's delivery history
- **Get Delivery Statistics** - Get detailed delivery statistics

### 🔔 Notifications

- **Get Notifications** - Get paginated list of notifications
- **Get Notification Count** - Get count of unread notifications
- **Mark Notification as Read** - Mark specific notification as read
- **Mark All Notifications as Read** - Mark all notifications as read
- **Delete Notification** - Delete a specific notification

## 🚀 Getting Started

### 1. Import the Collection

1. Open Postman
2. Click "Import" button
3. Select "File" tab
4. Choose `Rider_Backend_Postman_Collection.json`
5. Click "Import"

### 2. Set Environment Variables

The collection uses the following variables (automatically managed):

- `{{base_url}}` - API base URL (default: `http://localhost:3006/api`)
- `{{auth_token}}` - JWT authentication token (auto-saved after login)
- `{{rider_id}}` - Current rider ID (auto-saved after login)
- `{{order_id}}` - Order ID for testing (set manually)
- `{{notification_id}}` - Notification ID for testing (set manually)

### 3. Test the APIs

#### Authentication Flow:

1. **First, register a rider** using "Register Rider" request
2. **Then login** using "Login Rider" request (this automatically saves the auth token)
3. **All other requests** will now use the saved authentication token

#### Testing Order Flow:

1. Use "Get Assigned Orders" to see available orders
2. Copy an order ID and set it as `{{order_id}}` variable
3. Test order operations like "Accept Order", "Update Order Status"
4. Test delivery operations in the Delivery Management folder

#### Testing Notifications:

1. Use "Get Notifications" to see current notifications
2. Copy a notification ID and set it as `{{notification_id}}` variable
3. Test notification operations

## 📝 Request Examples

### Authentication

```json
// Register
{
  "name": "John Doe",
  "email": "rider@example.com",
  "password": "password123",
  "phone": "+1234567890",
  "vehicleType": "motorcycle",
  "vehicleNumber": "ABC123"
}

// Login
{
  "email": "rider@example.com",
  "password": "password123"
}
```

### Order Status Updates

```json
{
  "status": "out_for_delivery",
  "notes": "Order picked up and en route to customer"
}
```

### Delivery Completion

```json
{
  "deliveryNotes": "Delivered successfully to customer",
  "customerSignature": "base64_encoded_signature",
  "deliveryPhoto": "base64_encoded_photo"
}
```

## 🔧 Environment Setup

Make sure your Rider Backend server is running on `http://localhost:3006` before testing.

If your server runs on a different port, update the `{{base_url}}` variable in Postman.

## 📊 Response Format

All successful responses follow this format:

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

Error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

## 🏷️ Status Codes

- `200` - Success
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `404` - Not Found
- `500` - Internal Server Error

## 📋 Testing Checklist

- [ ] Register a new rider account
- [ ] Login and verify token is saved
- [ ] Get rider profile information
- [ ] Update rider profile
- [ ] Update rider status
- [ ] Get rider statistics
- [ ] Get assigned orders
- [ ] Accept an order (if available)
- [ ] Update order status
- [ ] Start delivery
- [ ] Complete delivery
- [ ] Get delivery history
- [ ] Get notifications
- [ ] Mark notifications as read

## 🔍 Troubleshooting

1. **401 Unauthorized**: Make sure you've logged in first and the token is saved
2. **404 Not Found**: Check that the order/notification ID exists
3. **400 Bad Request**: Verify request body format matches the examples
4. **Connection Refused**: Ensure the backend server is running on the correct port

## 📞 Support

For API documentation, refer to `RIDER_API_DOCUMENTATION.md` in the backend folder.

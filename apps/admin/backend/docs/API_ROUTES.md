# API Routes Documentation - Admin Backend Only

## Authentication Routes (/api/auth)
- `POST /login` - Admin/SuperAdmin login with JWT token  
- `POST /logout` - Admin logout with token cleanup
- `GET /profile` - Get current admin profile (requires auth)
- `POST /refresh` - Refresh authentication token

## Admin Management Routes (/api/admin)
- `POST /add` - Add new admin/inventory_admin (superadmin only)
- `DELETE /:id` - Remove admin (superadmin only)
- `GET /` - Get all admins with pagination (any admin)
- `GET /users` - Get all users from admins table (any admin)
- `DELETE /users/:id` - Delete user from admins table (superadmin only)
- `GET /analytics/dashboard` - Get complete dashboard analytics (any admin)
- `GET /analytics/users` - Get user analytics (any admin)
- `GET /analytics/orders` - Get order analytics (any admin)
- `GET /analytics/inventory` - Get inventory analytics (any admin)
- `GET /analytics/payments` - Get payment analytics (any admin)

## Inventory Routes (/api/inventory) - Admin Dashboard
- `GET /` - Get all inventory items with pagination (admin only)
  - `page=1` - Page number
  - `limit=10` - Items per page
  - `category=` - Filter by category
  - `sortBy=name` - Sort field
  - `sortOrder=asc` - Sort direction
  - `search=` - Search term
- `GET /analytics` - Get inventory analytics and insights (admin only)
  - `startDate=` - Start date filter
  - `endDate=` - End date filter
  - `category=` - Category filter
- `GET /low-stock` - Get items with low stock levels (admin only)
  - `threshold=10` - Stock threshold

## Rider Routes (/api/riders) - Separate Riders Table  
*Note: Riders are stored in dedicated 'riders' table*
- `GET /` - Get all riders with search and pagination (admin only)
  - `page=1` - Page number
  - `limit=10` - Items per page
  - `isActive=1` - Filter by active status
  - `sortBy=username` - Sort field
  - `sortOrder=asc` - Sort direction
  - `search=` - Search term
- `POST /` - Add new rider (admin only)
- `GET /:id` - Get rider details by ID (admin only)
- `PUT /:id` - Update rider information (admin only)
- `DELETE /:id` - Remove rider (soft delete, admin only)
- `PUT /:id/password` - Change rider password (admin only)
- `GET /analytics` - Get rider performance analytics (admin only)
  - `startDate=` - Start date filter
  - `endDate=` - End date filter
  - `riderId=` - Specific rider filter

## Order Routes (/api/orders) - View Only
- `GET /` - Get all orders with filtering options (admin only)
  - `page=1` - Page number
  - `limit=10` - Items per page
  - `status=` - Filter by order status
  - `userId=` - Filter by user ID
  - `startDate=` - Start date filter
  - `endDate=` - End date filter
  - `sortBy=createdAt` - Sort field
  - `sortOrder=desc` - Sort direction
- `GET /analytics` - Get order analytics and insights (admin only)
  - `startDate=` - Start date filter
  - `endDate=` - End date filter
  - `status=` - Status filter
- `GET /:id` - Get order details by ID (admin only)

## Base URL
- Local: `http://localhost:3000`
- All routes require admin authentication
- Only superadmin/admin/inventory_admin can access this backend
- Separate tables: 'admins' for admin users, 'riders' for delivery personnel

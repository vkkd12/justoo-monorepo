# Inventory Management System

A comprehensive inventory management system built with Next.js frontend and Express.js backend, designed for instant delivery platforms.

## 🚀 Features

### Backend Features

- **Authentication & Authorization**: JWT-based auth with role-based access (Admin/Viewer)
- **Inventory Management**: CRUD operations for inventory items
- **Order Processing**: Order placement and cancellation with automatic stock updates
- **Stock Management**: Low stock alerts, out-of-stock tracking
- **External API Integration**: No-auth endpoints for external backend integration
- **Real-time Stock Updates**: Automatic quantity adjustments on orders

### Frontend Features

- **Responsive Dashboard**: Modern, mobile-friendly interface
- **Role-based UI**: Different views for admin and viewer roles
- **Real-time Updates**: Live inventory status and notifications
- **Comprehensive Reporting**: Analytics and reporting dashboard
- **Form Validation**: Client-side validation with error handling
- **Search & Filtering**: Advanced search and filtering capabilities

## 📋 Prerequisites

- Node.js (v18 or higher)
- pnpm (v8 or higher)
- PostgreSQL database (or Neon DB)

## 🛠️ Installation & Setup

### Backend Setup

1. **Navigate to backend directory:**

   ```bash
   cd inventory/backend
   ```

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Environment Configuration:**

   - Copy `.env.example` to `.env`
   - Update database URL and JWT secret in `.env`:

   ```env
   DB_SQL_URL=postgresql://username:password@localhost:5432/inventory_db
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   JWT_EXPIRES_IN=24h
   PORT=3001
   NODE_ENV=development
   ```

4. **Database Setup:**

   ```bash
   # Run migrations to create tables
   npx drizzle-kit push

   # Create test users (admin and viewer)
   pnpm run create:minimal-users
   ```

5. **Start the backend server:**

   ```bash
   pnpm start
   # or for development with auto-reload
   pnpm dev
   ```

   The backend API will be available at `http://localhost:3001`

### Frontend Setup

1. **Navigate to frontend directory:**

   ```bash
   cd inventory/frontend
   ```

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Environment Configuration:**

   - Create `.env.local` file:

   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001/api
   ```

4. **Start the frontend development server:**

   ```bash
   pnpm dev
   ```

   The frontend will be available at `http://localhost:3000`

## 🔐 Test Credentials

After running the user creation script, you can use these credentials:

- **Admin User:**

  - Username: `admin`
  - Password: `admin123`
  - Access: Full CRUD operations on inventory, orders, and system settings

- **Viewer User:**
  - Username: `viewer`
  - Password: `viewer123`
  - Access: Read-only access to inventory and their own orders

## 🗂️ Project Structure

```
inventory/
├── backend/                 # Express.js API server
│   ├── controllers/         # Route controllers
│   ├── routes/             # API routes
│   ├── middleware/         # Authentication & authorization
│   ├── db/                 # Database schema and connection
│   ├── conf/              # Configuration files
│   └── docs/              # API documentation
├── frontend/               # Next.js React application
│   ├── app/               # App router pages
│   ├── components/        # Reusable React components
│   ├── contexts/          # React contexts (Auth, etc.)
│   ├── lib/               # Utility functions and API client
│   └── public/            # Static assets
```

## 🔧 API Endpoints

### Authentication Routes

- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/change-password` - Change password

### Inventory Routes (Admin only for write operations)

- `GET /api/inventory` - List all items
- `POST /api/inventory` - Add new item
- `PUT /api/inventory/:id` - Update item
- `DELETE /api/inventory/:id` - Delete item
- `GET /api/inventory/dashboard` - Get dashboard stats
- `GET /api/inventory/in-stock` - Get in-stock items
- `GET /api/inventory/out-of-stock` - Get out-of-stock items
- `GET /api/inventory/low-stock` - Get low-stock items

### Order Routes (No authentication required for external integration)

- `GET /api/orders` - List orders
- `POST /api/orders/place-order` - Place new order
- `POST /api/orders/cancel-order` - Cancel order
- `POST /api/orders/check-availability` - Check stock availability
- `POST /api/orders/bulk-update` - Bulk update quantities

## 📊 Database Schema

### Users Table

- Authentication and role management
- Roles: admin, viewer

### Items Table

- Inventory items with pricing and stock info
- Units: kg, grams, ml, litre, pieces, dozen, packet, bottle, can

### Orders Table

- Order history and tracking
- Links to users and contains order metadata

### Order Items Table

- Individual items within orders
- Tracks quantities and prices at time of order

## 🚀 Development

### Running in Development Mode

1. **Start Backend:**

   ```bash
   cd backend && pnpm dev
   ```

2. **Start Frontend:**
   ```bash
   cd frontend && pnpm dev
   ```

### Testing API with Postman

1. Import the Postman collection: `backend/Inventory_API_Postman_Collection.json`
2. Import the environment: `backend/Inventory_API_Environment.postman_environment.json`
3. Follow the testing guide: `backend/POSTMAN_TESTING_GUIDE.md`

## 🔒 Security Features

- JWT token-based authentication
- Role-based access control
- Password hashing with bcrypt
- Input validation and sanitization
- CORS protection
- Environment variable configuration

## 📈 Monitoring & Analytics

- Dashboard with key metrics
- Stock level monitoring
- Order tracking and history
- Export capabilities for reports

## 🤝 External Integration

The system supports external backend integration through no-auth API endpoints for:

- Order placement from mobile applications
- Stock level checking
- Order tracking by external ID
- Bulk inventory updates

See `backend/EXTERNAL_API_DOCS.md` for detailed integration guide.

## 📝 Additional Documentation

- `backend/API_DOCUMENTATION.md` - Complete API reference
- `backend/AUTH_DOCUMENTATION.md` - Authentication guide
- `backend/TESTING_GUIDE.md` - Testing instructions
- `backend/EXTERNAL_API_DOCS.md` - External integration guide

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error:**

   - Verify database URL in `.env`
   - Ensure PostgreSQL is running
   - Check database credentials

2. **Authentication Issues:**

   - Verify JWT_SECRET is set in `.env`
   - Ensure users are created using the creation script

3. **CORS Issues:**

   - Check NEXT_PUBLIC_API_URL in frontend `.env.local`
   - Verify backend CORS configuration

4. **Port Conflicts:**
   - Backend default: 3001
   - Frontend default: 3000
   - Change PORT in respective `.env` files if needed

## 📜 License

This project is licensed under the ISC License.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

---

For support or questions, please check the documentation files or create an issue in the repository.

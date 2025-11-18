# Justoo Customer Backend

A comprehensive backend API for the Justoo 10-minute delivery platform's customer-facing operations.

## Features

- **Customer Authentication**: Register, login, profile management
- **Item Browsing**: Browse items by category, search, and filters
- **Shopping Cart**: Add, update, remove items from cart
- **Order Management**: Place orders, track status, order history
- **Address Management**: Manage delivery addresses
- **Real-time Updates**: WebSocket support for order tracking

## Tech Stack

- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT with bcrypt password hashing
- **Validation**: Express-validator
- **Security**: Helmet, CORS, Rate limiting
- **Real-time**: WebSocket support

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- pnpm package manager

### Installation

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Environment Setup:**

   ```bash
   cp .env.example .env
   ```

   Update the `.env` file with your configuration:

   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/justoo_db
   JWT_SECRET=your-super-secret-jwt-key-here
   FRONTEND_URL=http://localhost:3000
   ```

3. **Database Setup:**

   ```bash
   # Push schema to database
   pnpm run db:push

   # Optional: Seed with sample data
   pnpm run db:seed
   ```

4. **Start the server:**

   ```bash
   # Development mode
   pnpm run dev

   # Production mode
   pnpm run start
   ```

The server will start on `http://localhost:8080`

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new customer
- `POST /api/auth/login` - Customer login
- `GET /api/auth/profile` - Get customer profile
- `PUT /api/auth/profile` - Update customer profile
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/logout` - Logout

### Items

- `GET /api/items` - Get items with filters
- `GET /api/items/categories` - Get all categories
- `GET /api/items/featured` - Get featured items
- `GET /api/items/search` - Search items
- `GET /api/items/suggestions` - Get personalized suggestions
- `GET /api/items/category/:category` - Get items by category
- `GET /api/items/:id` - Get item details

### Cart

- `GET /api/cart` - Get customer's cart
- `GET /api/cart/summary` - Get cart summary for checkout
- `POST /api/cart/add` - Add item to cart
- `PUT /api/cart/item/:itemId` - Update cart item quantity
- `DELETE /api/cart/item/:itemId` - Remove item from cart
- `DELETE /api/cart` - Clear cart

### Orders

- `POST /api/orders` - Place new order
- `GET /api/orders` - Get customer's orders
- `GET /api/orders/stats` - Get order statistics
- `GET /api/orders/:orderId` - Get order details
- `PUT /api/orders/:orderId/cancel` - Cancel order

### Addresses

- `GET /api/addresses` - Get customer's addresses
- `GET /api/addresses/default` - Get default address
- `GET /api/addresses/validate` - Validate address coordinates
- `GET /api/addresses/:addressId` - Get address by ID
- `POST /api/addresses` - Add new address
- `PUT /api/addresses/:addressId` - Update address
- `PUT /api/addresses/:addressId/default` - Set as default address
- `DELETE /api/addresses/:addressId` - Delete address

## Data Models

### Customer

- User authentication and profile information
- Order history and preferences
- Multiple delivery addresses

### Items

- Product catalog with categories
- Pricing and inventory management
- Search and filtering capabilities

### Cart

- Temporary storage for order items
- Quantity management and validation
- Price calculations

### Orders

- Complete order lifecycle management
- Payment processing integration
- Delivery tracking

### Addresses

- Multiple delivery addresses per customer
- Geolocation validation
- Delivery zone assignment

## Security Features

- JWT authentication with secure cookies
- Password hashing with bcrypt
- Rate limiting on API endpoints
- CORS protection
- Input validation and sanitization
- SQL injection prevention with parameterized queries

## Development

### Available Scripts

- `pnpm run dev` - Start development server with hot reload
- `pnpm run start` - Start production server
- `pnpm run build` - Build for production
- `pnpm run db:push` - Push database schema changes
- `pnpm run db:studio` - Open Drizzle Studio for database management

### Project Structure

```
src/
├── config/           # Database and environment configuration
├── controllers/      # Business logic for each feature
├── middlewares/      # Authentication and validation middleware
├── routes/          # API route definitions
├── utils/           # Helper functions and utilities
└── server.js        # Main application entry point
```

## Deployment

1. Set environment variables for production
2. Run database migrations
3. Build the application
4. Start the server

## Contributing

1. Follow the existing code structure
2. Add proper error handling
3. Include input validation
4. Write clear commit messages
5. Test your changes thoroughly

## License

This project is part of the Justoo delivery platform.

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

2. **Database Setup:**

   ```bash
   # Push schema to database
   pnpm run db:push

   # Optional: Seed with sample data
   pnpm run db:seed
   ```

3. **Start the gateway server:**

   From the root of the monorepo:

   ```bash
   # Start the unified gateway
   pnpm start
   ```

The customer API will be available at `http://localhost:3000/customer/api`



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

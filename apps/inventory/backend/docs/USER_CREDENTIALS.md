# 🔐 User Credentials for Testing

## Created Users

### Admin User

- **Username:** `admin`
- **Email:** `admin@inventory.com`
- **Password:** `admin123`
- **Role:** `admin`
- **Permissions:** Full access to all endpoints

### Viewer User

- **Username:** `viewer`
- **Email:** `viewer@inventory.com`
- **Password:** `viewer123`
- **Role:** `viewer`
- **Permissions:** Can view inventory items and their own orders

## Quick Start

1. Start your database server
2. Run: `npx drizzle-kit push` to create tables
3. Run: `npm run create:test-users` to create these users
4. Start server: `npm run dev`
5. Use the Postman collection to test the API

## Manual User Creation Commands

If the script doesn't work, you can create users manually after the database is running:

```bash
node createUser.js --username admin --email admin@inventory.com --password admin123 --role admin
node createUser.js --username viewer --email viewer@inventory.com --password viewer123 --role viewer
```

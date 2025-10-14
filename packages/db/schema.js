import { pgTable, serial, varchar, integer, numeric, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';

// Enums
export const adminRole = pgEnum('admin_role', ['superadmin', 'admin', 'inventory_admin', 'viewer']);
export const inventoryUserRole = pgEnum('inventory_user_role', ['admin', 'user']);
export const orderStatus = pgEnum('order_status', ['placed', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled']);
export const paymentMethod = pgEnum('payment_method', ['cash', 'upi', 'card', 'wallet', 'online']);
export const paymentStatus = pgEnum('payment_status', ['pending', 'completed', 'failed', 'refunded']);
export const riderStatus = pgEnum('rider_status', ['active', 'inactive', 'busy', 'suspended']);
export const customerStatus = pgEnum('customer_status', ['active', 'inactive', 'suspended', 'banned']);
export const addressType = pgEnum('address_type', ['home', 'work', 'other']);
export const deliveryZoneStatus = pgEnum('delivery_zone_status', ['active', 'inactive', 'maintenance']);
export const notificationType = pgEnum('notification_type', ['email', 'sms', 'push', 'whatsapp']);

// Tables
export const justooAdmins = pgTable('justoo_admins', {
    id: serial('id').primaryKey(),
    username: varchar('username', { length: 100 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    password: varchar('password', { length: 255 }).notNull(),
    role: adminRole('role').default('viewer').notNull(),
    isActive: integer('is_active').default(1).notNull(),
    lastLogin: timestamp('last_login'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const inventoryUsers = pgTable('inventory_users', {
    id: serial('id').primaryKey(),
    username: varchar('username', { length: 100 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    password: varchar('password', { length: 255 }).notNull(),
    role: inventoryUserRole('role').default('user').notNull(),
    isActive: integer('is_active').default(1).notNull(),
    lastLogin: timestamp('last_login'),
    createdBy: integer('created_by'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const items = pgTable('items', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    name: varchar('name', { length: 255 }).notNull(),
    price: numeric('price', { precision: 10, scale: 2 }).notNull(),
    quantity: integer('quantity').default(0).notNull(),
    discount: numeric('discount', { precision: 5, scale: 2 }).default('0.00'),
    unit: varchar('unit', { length: 50 }).notNull(),
    description: text('description'),
    image: varchar('image', { length: 500 }), // Cloudinary image URL
    imagePublicId: varchar('image_public_id', { length: 255 }), // Cloudinary public ID for deletion
    minStockLevel: integer('min_stock_level').default(10).notNull(),
    category: varchar('category', { length: 100 }),
    isActive: integer('is_active').default(1).notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const orders = pgTable('orders', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    customerId: integer('customer_id').notNull(),
    deliveryAddressId: integer('delivery_address_id'),
    status: orderStatus('status').default('placed').notNull(),
    totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
    itemCount: integer('item_count').notNull(),
    subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
    deliveryFee: numeric('delivery_fee', { precision: 8, scale: 2 }).default('0.00'),
    taxAmount: numeric('tax_amount', { precision: 8, scale: 2 }).default('0.00'),
    discountAmount: numeric('discount_amount', { precision: 8, scale: 2 }).default('0.00'),
    notes: text('notes'),
    specialInstructions: text('special_instructions'),
    riderId: integer('rider_id'),
    deliveryZoneId: integer('delivery_zone_id'),
    estimatedDeliveryTime: timestamp('estimated_delivery_time'),
    actualDeliveryTime: timestamp('actual_delivery_time'),
    deliveredAt: timestamp('delivered_at'),
    orderPlacedAt: timestamp('order_placed_at').defaultNow(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const orderItems = pgTable('order_items', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    orderId: integer('order_id').notNull(),
    itemId: integer('item_id').notNull(),
    itemName: varchar('item_name', { length: 255 }).notNull(),
    quantity: integer('quantity').notNull(),
    unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
    totalPrice: numeric('total_price', { precision: 10, scale: 2 }).notNull(),
    unit: varchar('unit', { length: 50 }).notNull(),
    createdAt: timestamp('created_at').defaultNow(),
});

export const justooPayments = pgTable('justoo_payments', {
    id: serial('id').primaryKey(),
    orderId: integer('order_id').notNull(),
    amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
    method: paymentMethod('method').notNull(),
    status: paymentStatus('status').default('pending').notNull(),
    transactionId: varchar('transaction_id', { length: 255 }),
    gatewayResponse: varchar('gateway_response', { length: 500 }),
    paidAt: timestamp('paid_at'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const justooRiders = pgTable('justoo_riders', {
    id: serial('id').primaryKey(),
    username: varchar('username', { length: 100 }).notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    email: varchar('email', { length: 255 }),
    phone: varchar('phone', { length: 20 }).notNull(),
    password: varchar('password', { length: 255 }),
    vehicleType: varchar('vehicle_type', { length: 50 }).notNull(),
    vehicleNumber: varchar('vehicle_number', { length: 50 }).notNull(),
    licenseNumber: varchar('license_number', { length: 100 }),
    status: riderStatus('status').default('active').notNull(),
    totalDeliveries: integer('total_deliveries').default(0).notNull(),
    rating: integer('rating').default(5),
    isActive: integer('is_active').default(1).notNull(),
    lastLogin: timestamp('last_login'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// Customer Management Tables
export const customers = pgTable('customers', {
    id: serial('id').primaryKey(),
    phone: varchar('phone', { length: 20 }).notNull().unique(),
    email: varchar('email', { length: 255 }),
    name: varchar('name', { length: 255 }).notNull(),
    password: varchar('password', { length: 255 }).notNull(),
    profileImage: varchar('profile_image', { length: 500 }),
    dateOfBirth: timestamp('date_of_birth'),
    gender: varchar('gender', { length: 20 }),
    status: customerStatus('status').default('active').notNull(),
    totalOrders: integer('total_orders').default(0).notNull(),
    totalSpent: numeric('total_spent', { precision: 10, scale: 2 }).default('0.00'),
    averageRating: numeric('average_rating', { precision: 3, scale: 2 }).default('0.00'),
    lastOrderDate: timestamp('last_order_date'),
    lastLogin: timestamp('last_login'),
    preferredPaymentMethod: paymentMethod('preferred_payment_method'),
    isActive: integer('is_active').default(1).notNull(),
    emailVerified: integer('email_verified').default(0).notNull(),
    phoneVerified: integer('phone_verified').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const customerAddresses = pgTable('customer_addresses', {
    id: serial('id').primaryKey(),
    customerId: integer('customer_id').notNull(),
    type: addressType('type').default('home').notNull(),
    label: varchar('label', { length: 100 }), // e.g., "Home", "Office", "Mom's Place"
    fullAddress: text('full_address').notNull(),
    landmark: varchar('landmark', { length: 255 }),
    latitude: numeric('latitude', { precision: 10, scale: 8 }),
    longitude: numeric('longitude', { precision: 11, scale: 8 }),
    pincode: varchar('pincode', { length: 10 }),
    city: varchar('city', { length: 100 }),
    state: varchar('state', { length: 100 }),
    country: varchar('country', { length: 100 }).default('India'),
    isDefault: integer('is_default').default(0).notNull(),
    isActive: integer('is_active').default(1).notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const deliveryZones = pgTable('delivery_zones', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    code: varchar('code', { length: 20 }).notNull().unique(),
    description: text('description'),
    centerLatitude: numeric('center_latitude', { precision: 10, scale: 8 }),
    centerLongitude: numeric('center_longitude', { precision: 11, scale: 8 }),
    radiusKm: numeric('radius_km', { precision: 5, scale: 2 }).default('5.00'),
    estimatedDeliveryTime: integer('estimated_delivery_time').default(10).notNull(), // in minutes
    baseDeliveryFee: numeric('base_delivery_fee', { precision: 8, scale: 2 }).default('0.00'),
    status: deliveryZoneStatus('status').default('active').notNull(),
    operatingHours: varchar('operating_hours', { length: 100 }), // e.g., "06:00-23:00"
    isActive: integer('is_active').default(1).notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const customerNotifications = pgTable('customer_notifications', {
    id: serial('id').primaryKey(),
    customerId: integer('customer_id').notNull(),
    type: notificationType('type').notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    message: text('message').notNull(),
    data: text('data'), // JSON string for additional data
    isRead: integer('is_read').default(0).notNull(),
    sentAt: timestamp('sent_at').defaultNow(),
    readAt: timestamp('read_at'),
    createdAt: timestamp('created_at').defaultNow(),
});

export const riderNotifications = pgTable('rider_notifications', {
    id: serial('id').primaryKey(),
    riderId: integer('rider_id').notNull(),
    type: notificationType('type').notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    message: text('message').notNull(),
    data: text('data'), // JSON string for additional data
    isRead: integer('is_read').default(0).notNull(),
    sentAt: timestamp('sent_at').defaultNow(),
    readAt: timestamp('read_at'),
    createdAt: timestamp('created_at').defaultNow(),
});

// Aliases for backward compatibility
export const justoo_admins = justooAdmins;
export const justoo_riders = justooRiders;
export const justoo_payments = justooPayments;
export const order_items = orderItems;
export const inventory_users = inventoryUsers;
export const users = inventoryUsers;

// New table aliases
export const customer_addresses = customerAddresses;
export const delivery_zones = deliveryZones;
export const customer_notifications = customerNotifications;
export const rider_notifications = riderNotifications;

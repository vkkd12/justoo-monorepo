// Type declarations for @justoo/db
declare module "@justoo/db" {
  import { PgEnum, PgTableWithColumns } from "drizzle-orm/pg-core";
  import { InferSelectModel, InferInsertModel } from "drizzle-orm";

  // Enums
  export const adminRole: PgEnum<
    ["superadmin", "admin", "inventory_admin", "viewer"]
  >;
  export const inventoryUserRole: PgEnum<["admin", "user"]>;
  export const orderStatus: PgEnum<
    [
      "placed",
      "confirmed",
      "preparing",
      "ready",
      "out_for_delivery",
      "delivered",
      "cancelled"
    ]
  >;
  export const paymentMethod: PgEnum<
    ["cash", "upi", "card", "wallet", "online"]
  >;
  export const paymentStatus: PgEnum<
    ["pending", "completed", "failed", "refunded"]
  >;
  export const riderStatus: PgEnum<["active", "inactive", "busy", "suspended"]>;
  export const customerStatus: PgEnum<
    ["active", "inactive", "suspended", "banned"]
  >;
  export const addressType: PgEnum<["home", "work", "other"]>;
  export const deliveryZoneStatus: PgEnum<
    ["active", "inactive", "maintenance"]
  >;
  export const notificationType: PgEnum<["email", "sms", "push", "whatsapp"]>;

  // Tables
  export const justooAdmins: any;
  export const inventoryUsers: any;
  export const items: any;
  export const orders: any;
  export const orderItems: any;
  export const justooPayments: any;
  export const justooRiders: any;
  export const customers: any;
  export const customerAddresses: any;
  export const deliveryZones: any;
  export const customerNotifications: any;

  // Aliases for backward compatibility
  export const justoo_riders: typeof justooRiders;
  export const justoo_payments: typeof justooPayments;
  export const order_items: typeof orderItems;
  export const inventory_users: typeof inventoryUsers;
  export const users: typeof inventoryUsers;

  // New table aliases
  export const customer_addresses: typeof customerAddresses;
  export const delivery_zones: typeof deliveryZones;
  export const customer_notifications: typeof customerNotifications;

  // Type exports for better TypeScript support
  export type AdminRole = "superadmin" | "admin" | "inventory_admin" | "viewer";
  export type InventoryUserRole = "admin" | "user";
  export type OrderStatus =
    | "placed"
    | "confirmed"
    | "preparing"
    | "ready"
    | "out_for_delivery"
    | "delivered"
    | "cancelled";
  export type PaymentMethod = "cash" | "upi" | "card" | "wallet" | "online";
  export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";
  export type RiderStatus = "active" | "inactive" | "busy" | "suspended";
  export type CustomerStatus = "active" | "inactive" | "suspended" | "banned";
  export type AddressType = "home" | "work" | "other";
  export type DeliveryZoneStatus = "active" | "inactive" | "maintenance";
  export type NotificationType = "email" | "sms" | "push" | "whatsapp";

  // Table type exports
  export type JustooAdmin = {
    id: number;
    username: string;
    email: string;
    password: string;
    role: AdminRole;
    isActive: number;
    lastLogin: Date | null;
    createdAt: Date;
    updatedAt: Date;
  };

  export type InventoryUser = {
    id: number;
    username: string;
    email: string;
    password: string;
    role: InventoryUserRole;
    isActive: number;
    lastLogin: Date | null;
    createdBy: number | null;
    createdAt: Date;
    updatedAt: Date;
  };

  export type Item = {
    id: number;
    name: string;
    price: string;
    quantity: number;
    discount: string;
    unit: string;
    description: string | null;
    minStockLevel: number;
    category: string | null;
    isActive: number;
    createdAt: Date;
    updatedAt: Date;
  };

  export type Order = {
    id: number;
    customerId: number;
    deliveryAddressId: number | null;
    status: OrderStatus;
    totalAmount: string;
    itemCount: number;
    subtotal: string;
    deliveryFee: string;
    taxAmount: string;
    discountAmount: string;
    notes: string | null;
    specialInstructions: string | null;
    riderId: number | null;
    deliveryZoneId: number | null;
    estimatedDeliveryTime: Date | null;
    actualDeliveryTime: Date | null;
    deliveredAt: Date | null;
    orderPlacedAt: Date;
    createdAt: Date;
    updatedAt: Date;
  };

  export type OrderItem = {
    id: number;
    orderId: number;
    itemId: number;
    itemName: string;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
    unit: string;
    createdAt: Date;
  };

  export type JustooPayment = {
    id: number;
    orderId: number;
    amount: string;
    method: PaymentMethod;
    status: PaymentStatus;
    transactionId: string | null;
    gatewayResponse: string | null;
    paidAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  };

  export type JustooRider = {
    id: number;
    username: string;
    name: string;
    email: string | null;
    phone: string;
    password: string | null;
    vehicleType: string;
    vehicleNumber: string;
    licenseNumber: string | null;
    status: RiderStatus;
    totalDeliveries: number;
    rating: number | null;
    isActive: number;
    lastLogin: Date | null;
    createdAt: Date;
    updatedAt: Date;
  };

  export type Customer = {
    id: number;
    phone: string;
    email: string | null;
    name: string;
    profileImage: string | null;
    dateOfBirth: Date | null;
    gender: string | null;
    status: CustomerStatus;
    totalOrders: number;
    totalSpent: string;
    averageRating: string;
    lastOrderDate: Date | null;
    preferredPaymentMethod: PaymentMethod | null;
    isActive: number;
    emailVerified: number;
    phoneVerified: number;
    createdAt: Date;
    updatedAt: Date;
  };

  export type CustomerAddress = {
    id: number;
    customerId: number;
    type: AddressType;
    label: string | null;
    fullAddress: string;
    landmark: string | null;
    latitude: number | null;
    longitude: number | null;
    pincode: string | null;
    city: string | null;
    state: string | null;
    country: string;
    isDefault: number;
    isActive: number;
    createdAt: Date;
    updatedAt: Date;
  };

  export type DeliveryZone = {
    id: number;
    name: string;
    code: string;
    description: string | null;
    centerLatitude: number | null;
    centerLongitude: number | null;
    radiusKm: string;
    estimatedDeliveryTime: number;
    baseDeliveryFee: string;
    status: DeliveryZoneStatus;
    operatingHours: string | null;
    isActive: number;
    createdAt: Date;
    updatedAt: Date;
  };

  export type CustomerNotification = {
    id: number;
    customerId: number;
    type: NotificationType;
    title: string;
    message: string;
    data: string | null;
    isRead: number;
    sentAt: Date;
    readAt: Date | null;
    createdAt: Date;
  };
}

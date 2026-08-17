import { pgTable, serial, text, timestamp, numeric, integer, boolean, uuid } from "drizzle-orm/pg-core";

// 1. Tenants (B2B Workshops subscribing to BengkelOS)
export const workshops = pgTable("workshops", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  ownerName: text("owner_name").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 2. Customers
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  workshopId: integer("workshop_id").references(() => workshops.id).notNull(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 3. Vehicles (Mobil Pelanggan)
export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  plateNumber: text("plate_number").notNull().unique(), // No. Polisi
  brand: text("brand").notNull(), // Toyota, Honda, etc.
  model: text("model").notNull(), // Avanza, Civic, etc.
  year: integer("year"),
  transmission: text("transmission"), // Manual / Matic
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 4. Inventory / Spareparts (Gudang Bengkel)
export const inventoryParts = pgTable("inventory_parts", {
  id: serial("id").primaryKey(),
  workshopId: integer("workshop_id").references(() => workshops.id).notNull(),
  partCode: text("part_code").notNull(),
  name: text("name").notNull(),
  category: text("category"), // Oli, Filter, Kaki-kaki, Rem, dll.
  stock: integer("stock").default(0).notNull(),
  minStock: integer("min_stock").default(5).notNull(),
  buyPrice: numeric("buy_price", { precision: 12, scale: 2 }).notNull(),
  sellPrice: numeric("sell_price", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 5. Service Orders (SPK / Job Order)
export const serviceOrders = pgTable("service_orders", {
  id: serial("id").primaryKey(),
  workshopId: integer("workshop_id").references(() => workshops.id).notNull(),
  spkNumber: text("spk_number").notNull().unique(),
  vehicleId: integer("vehicle_id").references(() => vehicles.id).notNull(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  complaints: text("complaints").notNull(), // Keluhan pelanggan
  mechanicNotes: text("mechanic_notes"), // Catatan mekanik / diagnosa
  status: text("status").default("pending").notNull(), // pending, in_progress, qc_ready, completed, invoiced, cancelled
  kmCurrent: integer("km_current"),
  estimatedTotal: numeric("estimated_total", { precision: 12, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 6. Job Parts (Sparepart yang dipakai di SPK)
export const jobParts = pgTable("job_parts", {
  id: serial("id").primaryKey(),
  serviceOrderId: integer("service_order_id").references(() => serviceOrders.id).notNull(),
  partId: integer("part_id").references(() => inventoryParts.id).notNull(),
  qty: integer("qty").notNull(),
  priceAtTime: numeric("price_at_time", { precision: 12, scale: 2 }).notNull(),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
});

// 7. Job Services (Jasa / Service labor di SPK)
export const jobServices = pgTable("job_services", {
  id: serial("id").primaryKey(),
  serviceOrderId: integer("service_order_id").references(() => serviceOrders.id).notNull(),
  serviceName: text("service_name").notNull(), // e.g. Tune Up 4 Silinder, Ganti Oli
  cost: numeric("cost", { precision: 12, scale: 2 }).notNull(),
  mechanicName: text("mechanic_name"),
});

// 8. Invoices & Payments (POS / Kasir)
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  serviceOrderId: integer("service_order_id").references(() => serviceOrders.id).notNull(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
  discount: numeric("discount", { precision: 12, scale: 2 }).default("0").notNull(),
  finalAmount: numeric("final_amount", { precision: 12, scale: 2 }).notNull(),
  paymentStatus: text("payment_status").default("unpaid").notNull(), // unpaid, paid
  paymentMethod: text("payment_method"), // cash, qris, transfer
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

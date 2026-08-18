import express from "express";
import * as dotenv from "dotenv";
import { db } from "../db/index.js";
import { serviceOrders, inventoryParts, invoices, vehicles, customers } from "../db/schema.js";
import { eq } from "drizzle-orm";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: "BengkelOS API", timestamp: new Date() });
});

// 1. SPK (Service Orders) Endpoints
app.get("/api/spk", async (req, res) => {
  try {
    const orders = await db.select().from(serviceOrders);
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/spk", async (req, res) => {
  try {
    const { workshopId, spkNumber, vehicleId, customerId, complaints, kmCurrent, estimatedTotal } = req.body;
    const [newOrder] = await db.insert(serviceOrders).values({
      workshopId,
      spkNumber,
      vehicleId,
      customerId,
      complaints,
      kmCurrent,
      estimatedTotal: estimatedTotal || "0",
      status: "pending"
    }).returning();
    res.status(201).json(newOrder);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Inventory Endpoints
app.get("/api/inventory", async (req, res) => {
  try {
    const parts = await db.select().from(inventoryParts);
    res.json(parts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/inventory", async (req, res) => {
  try {
    const { workshopId, partCode, name, category, stock, minStock, buyPrice, sellPrice } = req.body;
    const [newPart] = await db.insert(inventoryParts).values({
      workshopId,
      partCode,
      name,
      category,
      stock: stock || 0,
      minStock: minStock || 5,
      buyPrice,
      sellPrice
    }).returning();
    res.status(201).json(newPart);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. POS / Invoices Endpoints
app.post("/api/pos/checkout", async (req, res) => {
  try {
    const { serviceOrderId, invoiceNumber, totalAmount, discount, paymentMethod } = req.body;
    const finalAmount = (parseFloat(totalAmount) - parseFloat(discount || 0)).toString();
    
    // Create Invoice
    const [invoice] = await db.insert(invoices).values({
      serviceOrderId,
      invoiceNumber,
      totalAmount,
      discount: discount || "0",
      finalAmount,
      paymentStatus: "paid",
      paymentMethod,
      paidAt: new Date()
    }).returning();

    // Update SPK status to invoiced/completed
    await db.update(serviceOrders)
      .set({ status: "invoiced" })
      .where(eq(serviceOrders.id, serviceOrderId));

    res.status(201).json({ message: "Checkout successful", invoice });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`BengkelOS API server running on port ${PORT}`);
});

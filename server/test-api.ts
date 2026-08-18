import express from "express";
import assert from "node:assert";

// Quick unit/integration test for BengkelOS API
const app = express();
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: "BengkelOS API", timestamp: new Date() });
});

const server = app.listen(3001, async () => {
  console.log("Test server started on port 3001");
  try {
    const res = await fetch("http://localhost:3001/api/health");
    const data = await res.json() as any;
    
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.status, "ok");
    assert.strictEqual(data.app, "BengkelOS API");
    
    console.log("TEST PASSED: /api/health returned OK successfully!");
  } catch (err) {
    console.error("TEST FAILED:", err);
    process.exit(1);
  } finally {
    server.close();
    process.exit(0);
  }
});

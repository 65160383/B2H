/**
 * Integration Tests — Products API
 * Suite 5: GET  /api/products
 * Suite 6: GET  /api/products/:id
 * Suite 7: POST /api/products  (authenticated)
 * Suite 8: DELETE /api/products/:id (authenticated)
 * Suite 9: GET /_health
 */

jest.mock("../../config/db", () => ({
  pool: { execute: jest.fn() },
}));

const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../../app");
const { pool } = require("../../config/db");
const { JWT_SECRET } = require("../../middlewares/auth");

// Helper: generate a valid JWT for a test user
function makeToken(userId = 1, role = "user") {
  return jwt.sign({ user_id: userId, email: `u${userId}@go.buu.ac.th` }, JWT_SECRET);
}

// Helper: mock authenticateJWT DB lookup (pool.execute for user check)
function mockAuthUser(userId = 1, role = "user", status = "active") {
  pool.execute.mockResolvedValueOnce([[{ user_id: userId, role, status }]]);
}

// ══════════════════════════════════════════════════════════════════╗
// Suite 5 — GET /api/products
// ══════════════════════════════════════════════════════════════════╝
describe("Suite 5 | GET /api/products", () => {
  beforeEach(() => jest.clearAllMocks());

  test("IT-15 public list → 200 with products array", async () => {
    pool.execute.mockResolvedValueOnce([
      [
        { product_id: 1, title: "หนังสือ", price: 100, img_url: null, status: null },
        { product_id: 2, title: "เสื้อ", price: 50, img_url: null, status: null },
      ],
    ]);
    const res = await request(app).get("/api/products");
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.products)).toBe(true);
    expect(res.body.products.length).toBe(2);
  });

  test("IT-16 with ?show_sold=1 → 200 includes sold items", async () => {
    pool.execute.mockResolvedValueOnce([
      [{ product_id: 3, title: "สินค้าขายแล้ว", price: 200, status: "sold" }],
    ]);
    const res = await request(app).get("/api/products?show_sold=1");
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test("IT-17 DB error → 500", async () => {
    pool.execute.mockRejectedValueOnce(new Error("DB connection failed"));
    const res = await request(app).get("/api/products");
    expect(res.statusCode).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════╗
// Suite 6 — GET /api/products/:id
// ══════════════════════════════════════════════════════════════════╝
describe("Suite 6 | GET /api/products/:id", () => {
  beforeEach(() => jest.clearAllMocks());

  test("IT-18 valid product id → 200 product detail", async () => {
    pool.execute.mockResolvedValueOnce([
      [
        {
          product_id: 1,
          title: "หนังสือเรียน",
          price: 250,
          img_url: "/uploads/book.jpg",
          seller_email: "s@go.buu.ac.th",
          first_name: "ผู้ขาย",
          last_name: null,
        },
      ],
    ]);
    const res = await request(app).get("/api/products/1");
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.product).toHaveProperty("title", "หนังสือเรียน");
    expect(res.body.product.images).toContain("/uploads/book.jpg");
  });

  test("IT-19 product not found → 404", async () => {
    pool.execute.mockResolvedValueOnce([[]]); // no rows
    const res = await request(app).get("/api/products/9999");
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════╗
// Suite 7 — POST /api/products (authenticated create)
// ══════════════════════════════════════════════════════════════════╝
describe("Suite 7 | POST /api/products", () => {
  beforeEach(() => jest.clearAllMocks());

  test("IT-20 no JWT token → 401", async () => {
    const res = await request(app)
      .post("/api/products")
      .send({ title: "สินค้า", price: 100 });
    expect(res.statusCode).toBe(401);
  });

  test("IT-21 missing title with valid token → 400", async () => {
    const token = makeToken(1);
    mockAuthUser(1);
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({ price: 100 });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test("IT-22 valid product data → 200 created", async () => {
    const token = makeToken(1);
    mockAuthUser(1);
    pool.execute
      .mockResolvedValueOnce([{ insertId: 77 }])  // INSERT product
      .mockResolvedValue([{}]);                    // optional UPDATE img
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "หนังสือการ์ตูน", price: 80, description: "ยังดีอยู่" });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.product_id).toBe(77);
  });
});

// ══════════════════════════════════════════════════════════════════╗
// Suite 8 — DELETE /api/products/:id (authenticated delete)
// ══════════════════════════════════════════════════════════════════╝
describe("Suite 8 | DELETE /api/products/:id", () => {
  beforeEach(() => jest.clearAllMocks());

  test("IT-23 no token → 401", async () => {
    const res = await request(app).delete("/api/products/1");
    expect(res.statusCode).toBe(401);
  });

  test("IT-24 not owner → 403 Forbidden", async () => {
    const token = makeToken(99); // user 99
    mockAuthUser(99);
    pool.execute.mockResolvedValueOnce([[{ seller_id: 1, img_url: null }]]); // owned by user 1
    const res = await request(app)
      .delete("/api/products/1")
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(403);
  });

  test("IT-25 owner deletes own product → 200", async () => {
    const token = makeToken(1);
    mockAuthUser(1);
    pool.execute
      .mockResolvedValueOnce([[{ seller_id: 1, img_url: null }]]) // SELECT
      .mockResolvedValueOnce([{}])                                  // DELETE product
      .mockResolvedValueOnce([{}]);                                 // DELETE images
    const res = await request(app)
      .delete("/api/products/1")
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.deleted).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════╗
// Suite 9 — Health Check / Utility
// ══════════════════════════════════════════════════════════════════╝
describe("Suite 9 | Health & Utility endpoints", () => {
  test("IT-26 GET /_health → 200 { ok: true }", async () => {
    const res = await request(app).get("/_health");
    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body).toHaveProperty("uptime");
  });

  test("IT-27 GET unknown route → 404", async () => {
    const res = await request(app).get("/api/nonexistent-route-xyz");
    expect(res.statusCode).toBe(404);
  });
});

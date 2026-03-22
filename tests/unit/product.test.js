/**
 * Unit Tests — Product Controller
 * Tests for: listProducts, getProduct, createProduct, deleteProduct
 */

jest.mock("../../config/db", () => ({
  pool: { execute: jest.fn() },
}));

const { pool } = require("../../config/db");
const productController = require("../../controllers/productController");

function mockReqRes(body = {}, params = {}, query = {}, auth = null, files = []) {
  const req = { body, params, query, auth, files };
  const res = {
    _status: 200,
    _body: null,
    status(code) { this._status = code; return this; },
    json(data)   { this._body = data; return this; },
  };
  return { req, res };
}

// ══════════════════════════════════════════════════════════════╗
// TC-U18 ~ TC-U20  listProducts()
// ══════════════════════════════════════════════════════════════╝

describe("TC-U18~U20 | listProducts()", () => {
  beforeEach(() => jest.clearAllMocks());

  // TC-U18: returns product array on success
  test("TC-U18 listProducts() → 200 with products array", async () => {
    pool.execute.mockResolvedValueOnce([
      [
        { product_id: 1, title: "หนังสือเรียน", price: 200, img_url: null },
        { product_id: 2, title: "คอมพิวเตอร์", price: 5000, img_url: "/uploads/img.jpg" },
      ],
    ]);
    const { req, res } = mockReqRes();
    await productController.listProducts(req, res);
    expect(res._status).toBe(200);
    expect(res._body.success).toBe(true);
    expect(Array.isArray(res._body.products)).toBe(true);
    expect(res._body.products).toHaveLength(2);
  });

  // TC-U19: show_sold=1 query includes sold items
  test("TC-U19 listProducts with show_sold=1 → 200", async () => {
    pool.execute.mockResolvedValueOnce([[{ product_id: 3, title: "ขายแล้ว", price: 100 }]]);
    const { req, res } = mockReqRes({}, {}, { show_sold: "1" });
    await productController.listProducts(req, res);
    expect(res._body.success).toBe(true);
  });

  // TC-U20: DB error → 500
  test("TC-U20 DB error in listProducts → 500", async () => {
    pool.execute.mockRejectedValueOnce(new Error("DB down"));
    const { req, res } = mockReqRes();
    await productController.listProducts(req, res);
    expect(res._status).toBe(500);
    expect(res._body.success).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════╗
// TC-U21 ~ TC-U22  getProduct()
// ══════════════════════════════════════════════════════════════╝

describe("TC-U21~U22 | getProduct()", () => {
  beforeEach(() => jest.clearAllMocks());

  // TC-U21: product not found → 404
  test("TC-U21 product not found → 404", async () => {
    pool.execute.mockResolvedValueOnce([[]]); // empty result
    const { req, res } = mockReqRes({}, { id: "999" });
    await productController.getProduct(req, res);
    expect(res._status).toBe(404);
    expect(res._body.success).toBe(false);
  });

  // TC-U22: product found → 200 with product data
  test("TC-U22 valid product id → 200 with product", async () => {
    pool.execute.mockResolvedValueOnce([
      [
        {
          product_id: 1,
          title: "หนังสือเรียน",
          price: 200,
          img_url: "/uploads/book.jpg",
          seller_email: "s@go.buu.ac.th",
          first_name: "ผู้ขาย",
          last_name: null,
        },
      ],
    ]);
    const { req, res } = mockReqRes({}, { id: "1" });
    await productController.getProduct(req, res);
    expect(res._status).toBe(200);
    expect(res._body.success).toBe(true);
    expect(res._body.product.title).toBe("หนังสือเรียน");
    expect(res._body.product.images).toContain("/uploads/book.jpg");
  });
});

// ══════════════════════════════════════════════════════════════╗
// TC-U23 ~ TC-U26  createProduct()
// ══════════════════════════════════════════════════════════════╝

describe("TC-U23~U26 | createProduct()", () => {
  beforeEach(() => jest.clearAllMocks());

  // TC-U23: missing title → 400
  test("TC-U23 missing title → 400", async () => {
    const { req, res } = mockReqRes(
      { price: 100 },       // no title
      {}, {}, { user_id: 1 }
    );
    await productController.createProduct(req, res);
    expect(res._status).toBe(400);
    expect(res._body.success).toBe(false);
  });

  // TC-U24: missing price → 400
  test("TC-U24 missing price → 400", async () => {
    const { req, res } = mockReqRes(
      { title: "สินค้า" },  // no price
      {}, {}, { user_id: 1 }
    );
    await productController.createProduct(req, res);
    expect(res._status).toBe(400);
  });

  // TC-U25: negative price → 400
  test("TC-U25 negative price → 400", async () => {
    const { req, res } = mockReqRes(
      { title: "สินค้า", price: -50 },
      {}, {}, { user_id: 1 }
    );
    await productController.createProduct(req, res);
    expect(res._status).toBe(400);
  });

  // TC-U26: no auth (user_id missing) → 401
  test("TC-U26 no auth user_id → 401", async () => {
    const { req, res } = mockReqRes({ title: "สินค้า", price: 100 });
    await productController.createProduct(req, res);
    expect(res._status).toBe(401);
  });
});

// ══════════════════════════════════════════════════════════════╗
// TC-U27 ~ TC-U29  deleteProduct()
// ══════════════════════════════════════════════════════════════╝

describe("TC-U27~U29 | deleteProduct()", () => {
  beforeEach(() => jest.clearAllMocks());

  // TC-U27: no auth → 401
  test("TC-U27 deleteProduct without auth → 401", async () => {
    const { req, res } = mockReqRes({}, { id: "1" });
    await productController.deleteProduct(req, res);
    expect(res._status).toBe(401);
  });

  // TC-U28: product not found → 404
  test("TC-U28 product not found → 404", async () => {
    pool.execute.mockResolvedValueOnce([[]]); // empty
    const { req, res } = mockReqRes({}, { id: "99" }, {}, { user_id: 1 });
    await productController.deleteProduct(req, res);
    expect(res._status).toBe(404);
  });

  // TC-U29: different owner → 403 Forbidden
  test("TC-U29 not owner → 403 Forbidden", async () => {
    pool.execute.mockResolvedValueOnce([
      [{ seller_id: 5, img_url: null }],  // owned by user 5
    ]);
    const { req, res } = mockReqRes({}, { id: "1" }, {}, { user_id: 99 }); // different user
    await productController.deleteProduct(req, res);
    expect(res._status).toBe(403);
    expect(res._body.success).toBe(false);
  });
});

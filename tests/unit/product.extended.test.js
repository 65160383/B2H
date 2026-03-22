/**
 * Unit Tests — Product Controller (Extended)
 * Covers: updateProduct, getSellerInterested, getSellerProducts,
 *         updateProductStatus, cancelSale, getFavorites, toggleFavorite,
 *         getInterests, addInterest, toggleInterest, getUserHistory,
 *         addReview, getSellerReviews, createReport,
 *         adminGetReports, updateReportStatus, adminDeleteProduct,
 *         adminSetUserStatus, adminDeleteReview
 */

jest.mock("../../config/db", () => ({
  pool: { execute: jest.fn() },
}));

const { pool } = require("../../config/db");
const pc = require("../../controllers/productController");

function mock(body = {}, params = {}, query = {}, auth = null, files = []) {
  const req = { body, params, query, auth, files };
  const res = {
    _status: 200,
    _body: null,
    status(c) { this._status = c; return this; },
    json(d)   { this._body = d; return this; },
  };
  return { req, res };
}

// ══════════════════════════════════════════════════════════════╗
// updateProduct
// ══════════════════════════════════════════════════════════════╝
describe("updateProduct()", () => {
  beforeEach(() => jest.clearAllMocks());

  test("no auth → 401", async () => {
    const { req, res } = mock({ title: "new" }, { id: "1" });
    await pc.updateProduct(req, res);
    expect(res._status).toBe(401);
  });

  test("product not found → 404", async () => {
    pool.execute.mockResolvedValueOnce([[]]); // SELECT → empty
    const { req, res } = mock({ title: "new" }, { id: "99" }, {}, { user_id: 1 });
    await pc.updateProduct(req, res);
    expect(res._status).toBe(404);
  });

  test("not owner → 403", async () => {
    pool.execute.mockResolvedValueOnce([[{ seller_id: 5 }]]);
    const { req, res } = mock({ title: "new" }, { id: "1" }, {}, { user_id: 99 });
    await pc.updateProduct(req, res);
    expect(res._status).toBe(403);
  });

  test("invalid price → 400", async () => {
    pool.execute.mockResolvedValueOnce([[{ seller_id: 1 }]]);
    const { req, res } = mock({ price: "abc" }, { id: "1" }, {}, { user_id: 1 });
    await pc.updateProduct(req, res);
    expect(res._status).toBe(400);
  });

  test("success → 200", async () => {
    pool.execute
      .mockResolvedValueOnce([[{ seller_id: 1 }]])  // SELECT
      .mockResolvedValueOnce([{}]);                   // UPDATE
    const { req, res } = mock(
      { title: "Updated", price: 300 },
      { id: "1" }, {}, { user_id: 1 }
    );
    await pc.updateProduct(req, res);
    expect(res._status).toBe(200);
    expect(res._body.success).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════╗
// getSellerInterested
// ══════════════════════════════════════════════════════════════╝
describe("getSellerInterested()", () => {
  beforeEach(() => jest.clearAllMocks());

  test("no rows → 200 with empty array", async () => {
    pool.execute.mockResolvedValueOnce([[]]); // no interests
    const { req, res } = mock({}, { id: "1" });
    await pc.getSellerInterested(req, res);
    expect(res._status).toBe(200);
    expect(res._body.interested).toEqual([]);
  });

  test("rows grouped → 200", async () => {
    pool.execute.mockResolvedValueOnce([
      [
        {
          product_id: 1, title: "หนังสือ", product_img: null, product_status: null,
          buyer_id: null, user_id: 10, email: "u@go.buu.ac.th",
          first_name: "ผู้", last_name: "สนใจ", profile_image: null,
          contact_facebook: null, contact_line: null, contact_instagram: null,
        },
      ],
    ]);
    const { req, res } = mock({}, { id: "1" });
    await pc.getSellerInterested(req, res);
    expect(res._body.success).toBe(true);
    expect(res._body.interested).toHaveLength(1);
  });
});

// ══════════════════════════════════════════════════════════════╗
// getSellerProducts
// ══════════════════════════════════════════════════════════════╝
describe("getSellerProducts()", () => {
  beforeEach(() => jest.clearAllMocks());

  test("seller not found → 404", async () => {
    pool.execute.mockResolvedValueOnce([[]]); // no seller
    const { req, res } = mock({}, { id: "99" });
    await pc.getSellerProducts(req, res);
    expect(res._status).toBe(404);
  });

  test("seller found → 200 with products", async () => {
    pool.execute
      .mockResolvedValueOnce([[{ user_id: 1, email: "s@go.buu.ac.th", first_name: "ผู้ขาย", last_name: null }]])
      .mockResolvedValueOnce([[{ product_id: 5, title: "สินค้า" }]]);
    const { req, res } = mock({}, { id: "1" });
    await pc.getSellerProducts(req, res);
    expect(res._body.success).toBe(true);
    expect(Array.isArray(res._body.products)).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════╗
// updateProductStatus
// ══════════════════════════════════════════════════════════════╝
describe("updateProductStatus()", () => {
  beforeEach(() => jest.clearAllMocks());

  test("no auth → 401", async () => {
    const { req, res } = mock({ status: "sold" }, { id: "1" });
    await pc.updateProductStatus(req, res);
    expect(res._status).toBe(401);
  });

  test("missing status → 400", async () => {
    const { req, res } = mock({}, { id: "1" }, {}, { user_id: 1 });
    await pc.updateProductStatus(req, res);
    expect(res._status).toBe(400);
  });

  test("product not found → 404", async () => {
    pool.execute.mockResolvedValueOnce([[]]); // no product
    const { req, res } = mock({ status: "sold" }, { id: "99" }, {}, { user_id: 1 });
    await pc.updateProductStatus(req, res);
    expect(res._status).toBe(404);
  });

  test("not seller → 403", async () => {
    pool.execute.mockResolvedValueOnce([[{ seller_id: 5, buyer_id: null }]]);
    const { req, res } = mock({ status: "sold" }, { id: "1" }, {}, { user_id: 99 });
    await pc.updateProductStatus(req, res);
    expect(res._status).toBe(403);
  });

  test("valid update → 200", async () => {
    pool.execute
      .mockResolvedValueOnce([[{ seller_id: 1, buyer_id: null }]])
      .mockResolvedValueOnce([{}]); // UPDATE
    const { req, res } = mock({ status: "sold", buyer_id: 2 }, { id: "1" }, {}, { user_id: 1 });
    await pc.updateProductStatus(req, res);
    expect(res._body.success).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════╗
// cancelSale
// ══════════════════════════════════════════════════════════════╝
describe("cancelSale()", () => {
  beforeEach(() => jest.clearAllMocks());

  test("no auth → 401", async () => {
    const { req, res } = mock({}, { id: "1" });
    await pc.cancelSale(req, res);
    expect(res._status).toBe(401);
  });

  test("product not found → 404", async () => {
    pool.execute.mockResolvedValueOnce([[]]); // no product
    const { req, res } = mock({}, { id: "99" }, {}, { user_id: 1 });
    await pc.cancelSale(req, res);
    expect(res._status).toBe(404);
  });

  test("not seller → 403", async () => {
    pool.execute.mockResolvedValueOnce([[{ seller_id: 5 }]]);
    const { req, res } = mock({}, { id: "1" }, {}, { user_id: 99 });
    await pc.cancelSale(req, res);
    expect(res._status).toBe(403);
  });

  test("success → 200", async () => {
    pool.execute
      .mockResolvedValueOnce([[{ seller_id: 1 }]])
      .mockResolvedValueOnce([{}])  // UPDATE
      .mockResolvedValueOnce([{}]); // DELETE interests
    const { req, res } = mock({}, { id: "1" }, {}, { user_id: 1 });
    await pc.cancelSale(req, res);
    expect(res._body.success).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════╗
// getFavorites
// ══════════════════════════════════════════════════════════════╝
describe("getFavorites()", () => {
  beforeEach(() => jest.clearAllMocks());

  test("no auth → 401", async () => {
    const { req, res } = mock();
    await pc.getFavorites(req, res);
    expect(res._status).toBe(401);
  });

  test("returns favorites list → 200", async () => {
    pool.execute.mockResolvedValueOnce([[{ product_id: 1, title: "สินค้า" }]]);
    const { req, res } = mock({}, {}, {}, { user_id: 1 });
    await pc.getFavorites(req, res);
    expect(res._body.success).toBe(true);
    expect(Array.isArray(res._body.products)).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════╗
// toggleFavorite
// ══════════════════════════════════════════════════════════════╝
describe("toggleFavorite()", () => {
  beforeEach(() => jest.clearAllMocks());

  test("no auth → 401", async () => {
    const { req, res } = mock({ product_id: 1 }, { id: "1" });
    await pc.toggleFavorite(req, res);
    expect(res._status).toBe(401);
  });

  test("missing product_id in body → 400", async () => {
    const { req, res } = mock({}, { id: "1" }, {}, { user_id: 1 });
    await pc.toggleFavorite(req, res);
    expect(res._status).toBe(400);
  });

  test("product not in DB → 404", async () => {
    pool.execute.mockResolvedValueOnce([[]]); // product not found
    const { req, res } = mock({ product_id: 99 }, { id: "99" }, {}, { user_id: 1 });
    await pc.toggleFavorite(req, res);
    expect(res._status).toBe(404);
  });

  test("adds favorite if not yet added → 200 added:true", async () => {
    pool.execute
      .mockResolvedValueOnce([[{ product_id: 1 }]])  // product exists
      .mockResolvedValueOnce([[]])                   // not in favorites
      .mockResolvedValueOnce([{}]);                  // INSERT
    const { req, res } = mock({ product_id: 1 }, {}, {}, { user_id: 1 });
    await pc.toggleFavorite(req, res);
    expect(res._body.added).toBe(true);
  });

  test("removes favorite if already added → 200 removed:true", async () => {
    pool.execute
      .mockResolvedValueOnce([[{ product_id: 1 }]])          // product exists
      .mockResolvedValueOnce([[{ favorite_id: 7 }]])          // already in favorites
      .mockResolvedValueOnce([{}]);                           // DELETE
    const { req, res } = mock({ product_id: 1 }, {}, {}, { user_id: 1 });
    await pc.toggleFavorite(req, res);
    expect(res._body.removed).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════╗
// getInterests
// ══════════════════════════════════════════════════════════════╝
describe("getInterests()", () => {
  beforeEach(() => jest.clearAllMocks());

  test("no auth → 401", async () => {
    const { req, res } = mock();
    await pc.getInterests(req, res);
    expect(res._status).toBe(401);
  });

  test("returns list → 200", async () => {
    pool.execute.mockResolvedValueOnce([[{ product_id: 3 }]]);
    const { req, res } = mock({}, {}, {}, { user_id: 1 });
    await pc.getInterests(req, res);
    expect(res._body.success).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════╗
// toggleInterest
// ══════════════════════════════════════════════════════════════╝
describe("toggleInterest()", () => {
  beforeEach(() => jest.clearAllMocks());

  test("no auth → 401", async () => {
    const { req, res } = mock({ product_id: 1 }, { id: "1" });
    await pc.toggleInterest(req, res);
    expect(res._status).toBe(401);
  });

  test("missing product_id → 400", async () => {
    const { req, res } = mock({}, { id: "1" }, {}, { user_id: 1 });
    await pc.toggleInterest(req, res);
    expect(res._status).toBe(400);
  });

  test("product not found → 404", async () => {
    pool.execute.mockResolvedValueOnce([[]]); // product missing
    const { req, res } = mock({ product_id: 99 }, {}, {}, { user_id: 1 });
    await pc.toggleInterest(req, res);
    expect(res._status).toBe(404);
  });

  test("adds interest → 200 added:true", async () => {
    pool.execute
      .mockResolvedValueOnce([[{ product_id: 1 }]])   // product exists
      .mockResolvedValueOnce([[]])                    // no existing interest
      .mockResolvedValueOnce([{}]);                   // INSERT
    const { req, res } = mock({ product_id: 1 }, {}, {}, { user_id: 1 });
    await pc.toggleInterest(req, res);
    expect(res._body.added).toBe(true);
  });

  test("removes interest → 200 removed:true", async () => {
    pool.execute
      .mockResolvedValueOnce([[{ product_id: 1 }]])        // product exists
      .mockResolvedValueOnce([[{ interest_id: 5 }]])        // existing interest
      .mockResolvedValueOnce([{}]);                         // DELETE
    const { req, res } = mock({ product_id: 1 }, {}, {}, { user_id: 1 });
    await pc.toggleInterest(req, res);
    expect(res._body.removed).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════╗
// getUserHistory
// ══════════════════════════════════════════════════════════════╝
describe("getUserHistory()", () => {
  beforeEach(() => jest.clearAllMocks());

  test("no auth → 401", async () => {
    const { req, res } = mock();
    await pc.getUserHistory(req, res);
    expect(res._status).toBe(401);
  });

  test("success → 200 with purchases and sales", async () => {
    pool.execute
      .mockResolvedValueOnce([[{ product_id: 1 }]])  // purchases
      .mockResolvedValueOnce([[{ product_id: 2 }]]); // sales
    const { req, res } = mock({}, {}, {}, { user_id: 1 });
    await pc.getUserHistory(req, res);
    expect(res._body.success).toBe(true);
    expect(res._body).toHaveProperty("purchases");
    expect(res._body).toHaveProperty("sales");
  });
});

// ══════════════════════════════════════════════════════════════╗
// addReview
// ══════════════════════════════════════════════════════════════╝
describe("addReview()", () => {
  beforeEach(() => jest.clearAllMocks());

  test("no auth → 401", async () => {
    const { req, res } = mock({ product_id: 1, seller_id: 2, rating: 5 });
    await pc.addReview(req, res);
    expect(res._status).toBe(401);
  });

  test("missing fields → 400", async () => {
    const { req, res } = mock({ product_id: 1 }, {}, {}, { user_id: 1 });
    await pc.addReview(req, res);
    expect(res._status).toBe(400);
  });

  test("invalid rating (out of range) → 400", async () => {
    const { req, res } = mock(
      { product_id: 1, seller_id: 2, rating: 6 }, {}, {}, { user_id: 1 }
    );
    await pc.addReview(req, res);
    expect(res._status).toBe(400);
  });

  test("product not found → 404", async () => {
    pool.execute.mockResolvedValueOnce([[]]); // product missing
    const { req, res } = mock(
      { product_id: 99, seller_id: 2, rating: 4 }, {}, {}, { user_id: 1 }
    );
    await pc.addReview(req, res);
    expect(res._status).toBe(404);
  });

  test("product not sold yet → 400", async () => {
    pool.execute.mockResolvedValueOnce([
      [{ product_id: 1, seller_id: 2, buyer_id: 1, status: "available" }],
    ]);
    const { req, res } = mock(
      { product_id: 1, seller_id: 2, rating: 5 }, {}, {}, { user_id: 1 }
    );
    await pc.addReview(req, res);
    expect(res._status).toBe(400);
  });

  test("not buyer → 403", async () => {
    pool.execute.mockResolvedValueOnce([
      [{ product_id: 1, seller_id: 2, buyer_id: 99, status: "sold" }],
    ]); // buyer_id != user_id
    const { req, res } = mock(
      { product_id: 1, seller_id: 2, rating: 5 }, {}, {}, { user_id: 1 }
    );
    await pc.addReview(req, res);
    expect(res._status).toBe(403);
  });

  test("valid review → 200", async () => {
    pool.execute
      .mockResolvedValueOnce([
        [{ product_id: 1, seller_id: 2, buyer_id: 1, status: "sold" }],
      ])
      .mockResolvedValueOnce([{}]); // INSERT
    const { req, res } = mock(
      { product_id: 1, seller_id: 2, rating: 4, comment: "ดีมาก" }, {}, {}, { user_id: 1 }
    );
    await pc.addReview(req, res);
    expect(res._body.success).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════╗
// getSellerReviews
// ══════════════════════════════════════════════════════════════╝
describe("getSellerReviews()", () => {
  beforeEach(() => jest.clearAllMocks());

  test("returns reviews → 200", async () => {
    pool.execute.mockResolvedValueOnce([
      [{ review_id: 1, rating: 5, comment: "เยี่ยม" }],
    ]);
    const { req, res } = mock({}, { id: "1" });
    await pc.getSellerReviews(req, res);
    expect(res._body.success).toBe(true);
    expect(Array.isArray(res._body.reviews)).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════╗
// createReport
// ══════════════════════════════════════════════════════════════╝
describe("createReport()", () => {
  beforeEach(() => jest.clearAllMocks());

  test("no auth → 401", async () => {
    const { req, res } = mock({ target_type: "product", target_id: 1, reason: "spam" });
    await pc.createReport(req, res);
    expect(res._status).toBe(401);
  });

  test("missing target fields → 400", async () => {
    const { req, res } = mock({ reason: "spam" }, {}, {}, { user_id: 1 });
    await pc.createReport(req, res);
    expect(res._status).toBe(400);
  });

  test("missing reason → 400", async () => {
    const { req, res } = mock(
      { target_type: "product", target_id: 1 }, {}, {}, { user_id: 1 }
    );
    await pc.createReport(req, res);
    expect(res._status).toBe(400);
  });

  test("success → 200", async () => {
    pool.execute.mockResolvedValueOnce([{ insertId: 10 }]); // INSERT
    const { req, res } = mock(
      { target_type: "product", target_id: 1, reason: "ของปลอม" }, {}, {}, { user_id: 1 }
    );
    await pc.createReport(req, res);
    expect(res._body.success).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════╗
// updateReportStatus
// ══════════════════════════════════════════════════════════════╝
describe("updateReportStatus()", () => {
  beforeEach(() => jest.clearAllMocks());

  test("missing status → 400", async () => {
    const { req, res } = mock({}, { id: "1" }, {}, { user_id: 1 });
    await pc.updateReportStatus(req, res);
    expect(res._status).toBe(400);
  });

  test("invalid status value → 400", async () => {
    const { req, res } = mock({ status: "unknown" }, { id: "1" }, {}, { user_id: 1 });
    await pc.updateReportStatus(req, res);
    expect(res._status).toBe(400);
  });

  test("valid update → 200", async () => {
    pool.execute.mockResolvedValueOnce([{}]); // UPDATE
    const { req, res } = mock({ status: "reviewed" }, { id: "1" }, {}, { user_id: 1 });
    await pc.updateReportStatus(req, res);
    expect(res._body.success).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════╗
// adminDeleteProduct
// ══════════════════════════════════════════════════════════════╝
describe("adminDeleteProduct()", () => {
  beforeEach(() => jest.clearAllMocks());

  test("product not found → 404", async () => {
    pool.execute.mockResolvedValueOnce([[]]); // SELECT → empty
    const { req, res } = mock({}, { id: "999" }, {}, { user_id: 1 });
    await pc.adminDeleteProduct(req, res);
    expect(res._status).toBe(404);
  });

  test("success → 200", async () => {
    pool.execute
      .mockResolvedValueOnce([[{ img_url: null }]])        // SELECT product
      .mockResolvedValueOnce([{}])                          // DELETE product
      .mockResolvedValueOnce([{}])                          // DELETE product_images
      .mockResolvedValueOnce([[]])                          // SELECT reports
    const { req, res } = mock({}, { id: "1" }, {}, { user_id: 1 });
    await pc.adminDeleteProduct(req, res);
    expect(res._body.success).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════╗
// adminSetUserStatus
// ══════════════════════════════════════════════════════════════╝
describe("adminSetUserStatus()", () => {
  beforeEach(() => jest.clearAllMocks());

  test("missing fields → 400", async () => {
    const { req, res } = mock({}, { id: "1" }, {}, { user_id: 1 });
    await pc.adminSetUserStatus(req, res);
    expect(res._status).toBe(400);
  });

  test("invalid action → 400", async () => {
    const { req, res } = mock({ action: "delete" }, { id: "1" }, {}, { user_id: 1 });
    await pc.adminSetUserStatus(req, res);
    expect(res._status).toBe(400);
  });

  test("suspend user → 200", async () => {
    pool.execute.mockResolvedValueOnce([{}]); // UPDATE
    const { req, res } = mock({ action: "suspend" }, { id: "2" }, {}, { user_id: 1 });
    await pc.adminSetUserStatus(req, res);
    expect(res._body.success).toBe(true);
  });

  test("activate user → 200", async () => {
    pool.execute.mockResolvedValueOnce([{}]); // UPDATE
    const { req, res } = mock({ action: "activate" }, { id: "2" }, {}, { user_id: 1 });
    await pc.adminSetUserStatus(req, res);
    expect(res._body.success).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════╗
// adminDeleteReview
// ══════════════════════════════════════════════════════════════╝
describe("adminDeleteReview()", () => {
  beforeEach(() => jest.clearAllMocks());

  test("success → 200", async () => {
    pool.execute.mockResolvedValueOnce([{}]); // DELETE
    const { req, res } = mock({}, { id: "5" });
    await pc.adminDeleteReview(req, res);
    expect(res._body.success).toBe(true);
  });
});

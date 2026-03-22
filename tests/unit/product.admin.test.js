/**
 * Unit Tests — Product Controller (Admin & Edge Cases)
 * Covers: adminGetReports, addInterest (already-exists path),
 *         createReport (fallback INSERT), getSellerInterested (error path),
 *         cancelSale (non-fatal interest-delete), DB error paths
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
// adminGetReports — basic path
// ══════════════════════════════════════════════════════════════╝
describe("adminGetReports()", () => {
  beforeEach(() => jest.clearAllMocks());

  test("returns paginated reports → 200", async () => {
    pool.execute
      .mockResolvedValueOnce([[{ total: 1 }]])  // COUNT(*)
      .mockResolvedValueOnce([[]])              // SHOW COLUMNS attachments (none)
      .mockResolvedValueOnce([[]])              // SHOW COLUMNS admin_note (none)
      .mockResolvedValueOnce([
        [
          {
            report_id: 1,
            reporter_id: 2,
            target_type: "product",
            target_id: 3,
            reason: "spam",
            status: "pending",
            create_time: new Date(),
            reporter_email: "u@go.buu.ac.th",
            reporter_first: "ผู้",
            reporter_last: "รายงาน",
            reporter_avatar: null,
            product_title: "หนังสือ",
            product_img: null,
            target_user_id: null,
            target_user_email: null,
            target_first: null,
            target_last: null,
          },
        ],
      ]); // main SELECT

    const { req, res } = mock({}, {}, { limit: "10", page: "1" }, { user_id: 1 });
    await pc.adminGetReports(req, res);
    expect(res._status).toBe(200);
    expect(res._body.success).toBe(true);
    expect(Array.isArray(res._body.reports)).toBe(true);
    expect(res._body.total).toBe(1);
  });

  test("DB error → 500", async () => {
    pool.execute.mockRejectedValueOnce(new Error("DB broken"));
    const { req, res } = mock({}, {}, {}, { user_id: 1 });
    await pc.adminGetReports(req, res);
    expect(res._status).toBe(500);
    expect(res._body.success).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════╗
// addInterest — already-exists path
// ══════════════════════════════════════════════════════════════╝
describe("addInterest() — already interested path", () => {
  beforeEach(() => jest.clearAllMocks());

  test("no auth → 401", async () => {
    const { req, res } = mock({ product_id: 1 });
    await pc.addInterest(req, res);
    expect(res._status).toBe(401);
  });

  test("already interested → 200 added:false", async () => {
    pool.execute
      .mockResolvedValueOnce([[{ product_id: 1 }]])      // product exists
      .mockResolvedValueOnce([[{ interest_id: 3 }]]);    // already interested
    const { req, res } = mock({ product_id: 1 }, {}, {}, { user_id: 1 });
    await pc.addInterest(req, res);
    expect(res._body.added).toBe(false);
  });

  test("not yet interested → 200 added:true", async () => {
    pool.execute
      .mockResolvedValueOnce([[{ product_id: 1 }]])      // product exists
      .mockResolvedValueOnce([[]])                        // not interested
      .mockResolvedValueOnce([{}]);                       // INSERT
    const { req, res } = mock({ product_id: 1 }, {}, {}, { user_id: 1 });
    await pc.addInterest(req, res);
    expect(res._body.added).toBe(true);
  });

  test("product not found → 404", async () => {
    pool.execute.mockResolvedValueOnce([[]]); // product not found
    const { req, res } = mock({ product_id: 99 }, {}, {}, { user_id: 1 });
    await pc.addInterest(req, res);
    expect(res._status).toBe(404);
  });
});

// ══════════════════════════════════════════════════════════════╗
// createReport — INSERT fallback path
// ══════════════════════════════════════════════════════════════╝
describe("createReport() — fallback INSERT path", () => {
  beforeEach(() => jest.clearAllMocks());

  test("first INSERT fails, fallback INSERT succeeds → 200", async () => {
    pool.execute
      .mockRejectedValueOnce(new Error("Unknown column 'attachments'"))  // first INSERT throws
      .mockResolvedValueOnce([{ insertId: 5 }]);  // fallback INSERT succeeds
    const { req, res } = mock(
      { target_type: "user", target_id: 3, reason: "ไม่เหมาะสม" }, {}, {}, { user_id: 1 }
    );
    await pc.createReport(req, res);
    expect(res._body.success).toBe(true);
  });

  test("both INSERTs fail → 500", async () => {
    pool.execute
      .mockRejectedValueOnce(new Error("DB error 1"))   // first INSERT
      .mockRejectedValueOnce(new Error("DB error 2"));  // fallback INSERT
    const { req, res } = mock(
      { target_type: "product", target_id: 1, reason: "มีปัญหา" }, {}, {}, { user_id: 1 }
    );
    await pc.createReport(req, res);
    expect(res._status).toBe(500);
    expect(res._body.success).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════╗
// Error-path coverage: DB failures on various functions
// ══════════════════════════════════════════════════════════════╝
describe("DB error paths — 500 responses", () => {
  beforeEach(() => jest.clearAllMocks());

  test("getSellerInterested DB error → 500", async () => {
    pool.execute.mockRejectedValueOnce(new Error("DB error"));
    const { req, res } = mock({}, { id: "1" });
    await pc.getSellerInterested(req, res);
    expect(res._status).toBe(500);
  });

  test("getSellerProducts DB error → 500", async () => {
    pool.execute
      .mockResolvedValueOnce([[{ user_id: 1, email: "s@go.buu.ac.th" }]]) // seller found
      .mockRejectedValueOnce(new Error("DB error")); // products query fails
    const { req, res } = mock({}, { id: "1" });
    await pc.getSellerProducts(req, res);
    expect(res._status).toBe(500);
  });

  test("getFavorites DB error → 500", async () => {
    pool.execute.mockRejectedValueOnce(new Error("DB error"));
    const { req, res } = mock({}, {}, {}, { user_id: 1 });
    await pc.getFavorites(req, res);
    expect(res._status).toBe(500);
  });

  test("getInterests DB error → 500", async () => {
    pool.execute.mockRejectedValueOnce(new Error("DB error"));
    const { req, res } = mock({}, {}, {}, { user_id: 1 });
    await pc.getInterests(req, res);
    expect(res._status).toBe(500);
  });

  test("getUserHistory DB error → 500", async () => {
    pool.execute.mockRejectedValueOnce(new Error("DB error"));
    const { req, res } = mock({}, {}, {}, { user_id: 1 });
    await pc.getUserHistory(req, res);
    expect(res._status).toBe(500);
  });

  test("getSellerReviews DB error → 500", async () => {
    pool.execute.mockRejectedValueOnce(new Error("DB error"));
    const { req, res } = mock({}, { id: "1" });
    await pc.getSellerReviews(req, res);
    expect(res._status).toBe(500);
  });

  test("updateProduct DB error → 500", async () => {
    pool.execute
      .mockResolvedValueOnce([[{ seller_id: 1 }]])  // SELECT succeeds
      .mockRejectedValueOnce(new Error("DB error")); // UPDATE fails
    const { req, res } = mock({ title: "x" }, { id: "1" }, {}, { user_id: 1 });
    await pc.updateProduct(req, res);
    expect(res._status).toBe(500);
  });

  test("cancelSale DB error → 500", async () => {
    pool.execute.mockRejectedValueOnce(new Error("DB error")); // SELECT fails
    const { req, res } = mock({}, { id: "1" }, {}, { user_id: 1 });
    await pc.cancelSale(req, res);
    expect(res._status).toBe(500);
  });

  test("addReview DB error → 500", async () => {
    pool.execute
      .mockResolvedValueOnce([
        [{ product_id: 1, seller_id: 2, buyer_id: 1, status: "sold" }],
      ])
      .mockRejectedValueOnce(new Error("DB error")); // INSERT fails
    const { req, res } = mock(
      { product_id: 1, seller_id: 2, rating: 4 }, {}, {}, { user_id: 1 }
    );
    await pc.addReview(req, res);
    expect(res._status).toBe(500);
  });

  test("adminDeleteReview DB error → 500", async () => {
    pool.execute.mockRejectedValueOnce(new Error("DB error"));
    const { req, res } = mock({}, { id: "1" });
    await pc.adminDeleteReview(req, res);
    expect(res._status).toBe(500);
  });

  test("adminSetUserStatus DB error → 500", async () => {
    pool.execute.mockRejectedValueOnce(new Error("DB error"));
    const { req, res } = mock({ action: "suspend" }, { id: "2" }, {}, { user_id: 1 });
    await pc.adminSetUserStatus(req, res);
    expect(res._status).toBe(500);
  });
});

// updateProductStatus — cancelSale interest delete failure (non-fatal)
describe("cancelSale — non-fatal interest delete failure", () => {
  beforeEach(() => jest.clearAllMocks());

  test("interest DELETE fails but sale still cancelled → 200", async () => {
    pool.execute
      .mockResolvedValueOnce([[{ seller_id: 1 }]])   // SELECT product
      .mockResolvedValueOnce([{}])                    // UPDATE product
      .mockRejectedValueOnce(new Error("interests table missing")); // DELETE interests fails
    const { req, res } = mock({}, { id: "1" }, {}, { user_id: 1 });
    await pc.cancelSale(req, res);
    expect(res._body.success).toBe(true); // Still succeeds (non-fatal)
  });
});

// seller mismatch in addReview
describe("addReview — seller mismatch", () => {
  beforeEach(() => jest.clearAllMocks());

  test("seller_id mismatch → 400", async () => {
    pool.execute.mockResolvedValueOnce([
      [{ product_id: 1, seller_id: 999, buyer_id: 1, status: "sold" }], // seller is 999 not 2
    ]);
    const { req, res } = mock(
      { product_id: 1, seller_id: 2, rating: 5 }, {}, {}, { user_id: 1 }
    );
    await pc.addReview(req, res);
    expect(res._status).toBe(400);
  });
});

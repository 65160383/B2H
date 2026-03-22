/**
 * Unit Tests — Auth Middleware
 * Tests for: authenticateJWT, requireRole
 */

jest.mock("../../config/db", () => ({
  pool: { execute: jest.fn() },
}));

const { pool } = require("../../config/db");
const jwt = require("jsonwebtoken");
const { authenticateJWT, requireRole, JWT_SECRET } = require("../../middlewares/auth");

function mockReqRes(headers = {}) {
  const req = { headers };
  const res = {
    _status: 200,
    _body: null,
    status(code) { this._status = code; return this; },
    json(data)   { this._body = data; return this; },
  };
  const next = jest.fn();
  return { req, res, next };
}

// ══════════════════════════════════════════════════════════════╗
// TC-U30 ~ TC-U32  authenticateJWT()
// ══════════════════════════════════════════════════════════════╝

describe("TC-U30~U32 | authenticateJWT()", () => {
  beforeEach(() => jest.clearAllMocks());

  // TC-U30: no Authorization header → 401
  test("TC-U30 missing Authorization header → 401", async () => {
    const { req, res, next } = mockReqRes({});
    await authenticateJWT(req, res, next);
    expect(res._status).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  // TC-U31: malformed token → 401
  test("TC-U31 malformed Bearer token → 401", async () => {
    const { req, res, next } = mockReqRes({ authorization: "Bearer invalidtoken" });
    await authenticateJWT(req, res, next);
    expect(res._status).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  // TC-U32: valid token + active user → next() called
  test("TC-U32 valid JWT + active user → calls next()", async () => {
    const token = jwt.sign({ user_id: 7, email: "u@go.buu.ac.th" }, JWT_SECRET);
    pool.execute.mockResolvedValueOnce([
      [{ user_id: 7, role: "user", status: "active" }],
    ]);

    const { req, res, next } = mockReqRes({ authorization: `Bearer ${token}` });
    await authenticateJWT(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.auth).toMatchObject({ user_id: 7 });
  });
});

// ══════════════════════════════════════════════════════════════╗
// TC-U33 ~ TC-U35  requireRole()
// ══════════════════════════════════════════════════════════════╝

describe("TC-U33~U35 | requireRole()", () => {
  beforeEach(() => jest.clearAllMocks());

  // TC-U33: no auth user → 403
  test("TC-U33 no req.auth and no req.user → 403", async () => {
    const middleware = requireRole("admin");
    const req = { headers: {} };
    const res = {
      _status: 200,
      _body: null,
      status(c) { this._status = c; return this; },
      json(d) { this._body = d; return this; },
    };
    const next = jest.fn();
    await middleware(req, res, next);
    expect(res._status).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });

  // TC-U34: correct role when req.user already loaded by authenticateJWT
  test("TC-U34 req.user with correct role → next()", async () => {
    const middleware = requireRole("admin");
    const req = {
      headers: {},
      user: { role: "admin", status: "active" },
      auth: { user_id: 1 },
    };
    const res = {
      _status: 200,
      status(c) { this._status = c; return this; },
      json() { return this; },
    };
    const next = jest.fn();
    await middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  // TC-U35: user role does not match required role → 403
  test("TC-U35 user role mismatch → 403 Insufficient role", async () => {
    const middleware = requireRole("admin");
    const req = {
      headers: {},
      user: { role: "user", status: "active" },
      auth: { user_id: 1 },
    };
    const res = {
      _status: 200,
      _body: null,
      status(c) { this._status = c; return this; },
      json(d) { this._body = d; return this; },
    };
    const next = jest.fn();
    await middleware(req, res, next);
    expect(res._status).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });
});

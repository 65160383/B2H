/**
 * Unit Tests — Auth Middleware (Extended)
 * Covers edge cases: user not found after valid JWT,
 * suspended user after valid JWT, DB error in JWT auth,
 * requireRole fallback DB path (no req.user pre-loaded)
 */

jest.mock("../../config/db", () => ({
  pool: { execute: jest.fn() },
}));

const { pool } = require("../../config/db");
const jwt = require("jsonwebtoken");
const { authenticateJWT, requireRole, JWT_SECRET } = require("../../middlewares/auth");

function mkReqRes(headers = {}, auth = null, user = null) {
  const req = { headers, auth, user };
  const res = {
    _status: 200,
    _body: null,
    status(c) { this._status = c; return this; },
    json(d)   { this._body = d; return this; },
  };
  const next = jest.fn();
  return { req, res, next };
}

describe("authenticateJWT() — extended edge cases", () => {
  beforeEach(() => jest.clearAllMocks());

  // valid JWT but user deleted from DB → 401
  test("valid JWT but user not found in DB → 401", async () => {
    const token = jwt.sign({ user_id: 99, email: "x@go.buu.ac.th" }, JWT_SECRET);
    pool.execute.mockResolvedValueOnce([[]]); // no user row
    const { req, res, next } = mkReqRes({ authorization: `Bearer ${token}` });
    await authenticateJWT(req, res, next);
    expect(res._status).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  // valid JWT but suspended account → 403
  test("valid JWT but suspended user → 403", async () => {
    const token = jwt.sign({ user_id: 5, email: "b@go.buu.ac.th" }, JWT_SECRET);
    pool.execute.mockResolvedValueOnce([[{ user_id: 5, role: "user", status: "banned" }]]);
    const { req, res, next } = mkReqRes({ authorization: `Bearer ${token}` });
    await authenticateJWT(req, res, next);
    expect(res._status).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });

  // DB throws during user lookup → 500
  test("DB error during user lookup → 500", async () => {
    const token = jwt.sign({ user_id: 3, email: "c@go.buu.ac.th" }, JWT_SECRET);
    pool.execute.mockRejectedValueOnce(new Error("DB timeout"));
    const { req, res, next } = mkReqRes({ authorization: `Bearer ${token}` });
    await authenticateJWT(req, res, next);
    expect(res._status).toBe(500);
    expect(next).not.toHaveBeenCalled();
  });
});

describe("requireRole() — fallback DB path (no req.user pre-loaded)", () => {
  beforeEach(() => jest.clearAllMocks());

  // req.auth set but no req.user → falls through to DB lookup
  test("req.auth present, no req.user, DB finds active user with correct role → next()", async () => {
    const middleware = requireRole("admin");
    pool.execute.mockResolvedValueOnce([[{ role: "admin", status: "active" }]]);
    const req = { headers: {}, auth: { user_id: 1 }, user: null };
    const res = {
      _status: 200,
      status(c) { this._status = c; return this; },
      json() { return this; },
    };
    const next = jest.fn();
    await middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  // req.auth present but DB user not found → 403
  test("req.auth present, no req.user, DB user not found → 403", async () => {
    const middleware = requireRole("admin");
    pool.execute.mockResolvedValueOnce([[]]); // no user
    const req = { headers: {}, auth: { user_id: 99 }, user: null };
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

  // req.auth present, DB user found but wrong role → 403
  test("req.auth present, DB user has wrong role → 403", async () => {
    const middleware = requireRole("admin");
    pool.execute.mockResolvedValueOnce([[{ role: "user", status: "active" }]]);
    const req = { headers: {}, auth: { user_id: 2 }, user: null };
    const res = {
      _status: 200,
      _body: null,
      status(c) { this._status = c; return this; },
      json(d) { this._body = d; return this; },
    };
    const next = jest.fn();
    await middleware(req, res, next);
    expect(res._status).toBe(403);
  });

  // DB throws → 500
  test("requireRole DB throws → 500", async () => {
    const middleware = requireRole("admin");
    pool.execute.mockRejectedValueOnce(new Error("DB gone"));
    const req = { headers: {}, auth: { user_id: 1 }, user: null };
    const res = {
      _status: 200,
      status(c) { this._status = c; return this; },
      json() { return this; },
    };
    const next = jest.fn();
    await middleware(req, res, next);
    expect(res._status).toBe(500);
  });
});

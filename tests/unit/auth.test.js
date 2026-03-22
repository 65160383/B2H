/**
 * Unit Tests — Auth Controller
 * Tests for: isUniversityEmail, register, login, universityAuth
 */

// ── Mock DB pool before requiring the controller ──────────────────────────────
jest.mock("../../config/db", () => ({
  pool: { execute: jest.fn() },
}));

jest.mock("bcryptjs", () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

const { pool } = require("../../config/db");
const bcrypt = require("bcryptjs");

// Helper: build a mock req/res pair
function mockReqRes(body = {}, headers = {}) {
  const req = { body, headers };
  const res = {
    _status: 200,
    _body: null,
    status(code) {
      this._status = code;
      return this;
    },
    json(data) {
      this._body = data;
      return this;
    },
  };
  return { req, res };
}

// ── Import the module under test ───────────────────────────────────────────────
// We need to access `isUniversityEmail` which is not exported, so we test it
// indirectly via register/login. For direct access we re-export it in a helper.
// Instead, load via the controller's exported functions.
const authController = require("../../controllers/authController");

// ══════════════════════════════════════════════════════════════════╗
// TC-U01 ~ TC-U04  isUniversityEmail (tested via register endpoint)
// ══════════════════════════════════════════════════════════════════╝

describe("TC-U01~U04 | isUniversityEmail validation (via register)", () => {
  beforeEach(() => jest.clearAllMocks());

  // TC-U01: valid BUU email accepted
  test("TC-U01 valid BUU email @go.buu.ac.th → proceeds past domain check", async () => {
    pool.execute
      .mockResolvedValueOnce([[]])            // SELECT → no duplicate
      .mockResolvedValueOnce([{ insertId: 1 }]); // INSERT
    bcrypt.hash.mockResolvedValueOnce("hashedpw");

    const { req, res } = mockReqRes({
      email: "student@go.buu.ac.th",
      password: "Pass1234",
    });
    await authController.register(req, res);

    expect(res._status).toBe(200);
    expect(res._body.success).toBe(true);
  });

  // TC-U02: gmail rejected
  test("TC-U02 gmail email → 403 Forbidden", async () => {
    const { req, res } = mockReqRes({
      email: "user@gmail.com",
      password: "Pass1234",
    });
    await authController.register(req, res);
    expect(res._status).toBe(403);
    expect(res._body.success).toBe(false);
  });

  // TC-U03: no domain at all
  test("TC-U03 email without @ → 403 Forbidden", async () => {
    const { req, res } = mockReqRes({ email: "notanemail", password: "pw" });
    await authController.register(req, res);
    expect(res._status).toBe(403);
  });

  // TC-U04: null email → 400
  test("TC-U04 null email → 400 Bad Request", async () => {
    const { req, res } = mockReqRes({ email: null, password: "pw" });
    await authController.register(req, res);
    expect(res._status).toBe(400);
  });
});

// ══════════════════════════════════════════════════════════════╗
// TC-U05 ~ TC-U09  register()
// ══════════════════════════════════════════════════════════════╝

describe("TC-U05~U09 | register()", () => {
  beforeEach(() => jest.clearAllMocks());

  // TC-U05: missing email
  test("TC-U05 missing email → 400", async () => {
    const { req, res } = mockReqRes({ password: "pw" });
    await authController.register(req, res);
    expect(res._status).toBe(400);
    expect(res._body.success).toBe(false);
  });

  // TC-U06: missing password
  test("TC-U06 missing password → 400", async () => {
    const { req, res } = mockReqRes({ email: "a@go.buu.ac.th" });
    await authController.register(req, res);
    expect(res._status).toBe(400);
    expect(res._body.success).toBe(false);
  });

  // TC-U07: non-university email
  test("TC-U07 non-university email → 403", async () => {
    const { req, res } = mockReqRes({
      email: "user@yahoo.com",
      password: "pw",
    });
    await authController.register(req, res);
    expect(res._status).toBe(403);
  });

  // TC-U08: duplicate email
  test("TC-U08 duplicate email → 400", async () => {
    pool.execute.mockResolvedValueOnce([[{ user_id: 1 }]]); // SELECT → found
    const { req, res } = mockReqRes({
      email: "existing@go.buu.ac.th",
      password: "pw",
    });
    await authController.register(req, res);
    expect(res._status).toBe(400);
    expect(res._body.success).toBe(false);
  });

  // TC-U09: successful registration
  test("TC-U09 valid input → 200 success", async () => {
    pool.execute
      .mockResolvedValueOnce([[]])             // SELECT → no duplicate
      .mockResolvedValueOnce([{ insertId: 42 }]); // INSERT
    bcrypt.hash.mockResolvedValueOnce("hashed");

    const { req, res } = mockReqRes({
      email: "new@go.buu.ac.th",
      password: "password123",
      first_name: "สมชาย",
      last_name: "ใจดี",
    });
    await authController.register(req, res);
    expect(res._status).toBe(200);
    expect(res._body.success).toBe(true);
    expect(res._body.user_id).toBe(42);
  });
});

// ══════════════════════════════════════════════════════════════╗
// TC-U10 ~ TC-U14  login()
// ══════════════════════════════════════════════════════════════╝

describe("TC-U10~U14 | login()", () => {
  beforeEach(() => jest.clearAllMocks());

  // TC-U10: missing credentials
  test("TC-U10 missing email and password → 400", async () => {
    const { req, res } = mockReqRes({});
    await authController.login(req, res);
    expect(res._status).toBe(400);
    expect(res._body.success).toBe(false);
  });

  // TC-U11: unknown email
  test("TC-U11 email not found → 401", async () => {
    pool.execute.mockResolvedValueOnce([[]]); // no user found
    const { req, res } = mockReqRes({
      email: "ghost@go.buu.ac.th",
      password: "pw",
    });
    await authController.login(req, res);
    expect(res._status).toBe(401);
    expect(res._body.success).toBe(false);
  });

  // TC-U12: wrong password
  test("TC-U12 wrong password → 401", async () => {
    pool.execute.mockResolvedValueOnce([
      [{ user_id: 1, email: "u@go.buu.ac.th", password: "hashed", status: "active" }],
    ]);
    bcrypt.compare.mockResolvedValueOnce(false); // password mismatch

    const { req, res } = mockReqRes({
      email: "u@go.buu.ac.th",
      password: "wrongpw",
    });
    await authController.login(req, res);
    expect(res._status).toBe(401);
  });

  // TC-U13: suspended account
  test("TC-U13 suspended account → 403", async () => {
    pool.execute.mockResolvedValueOnce([
      [{ user_id: 2, email: "u@go.buu.ac.th", password: "hashed", status: "banned" }],
    ]);
    bcrypt.compare.mockResolvedValueOnce(true); // password correct

    const { req, res } = mockReqRes({
      email: "u@go.buu.ac.th",
      password: "pw",
    });
    await authController.login(req, res);
    expect(res._status).toBe(403);
    expect(res._body.success).toBe(false);
  });

  // TC-U14: successful login — token returned
  test("TC-U14 valid credentials → 200 with token", async () => {
    pool.execute.mockResolvedValueOnce([
      [
        {
          user_id: 5,
          email: "ok@go.buu.ac.th",
          first_name: "ทดสอบ",
          last_name: "ระบบ",
          password: "hashed",
          status: "active",
        },
      ],
    ]);
    bcrypt.compare.mockResolvedValueOnce(true);

    const { req, res } = mockReqRes({
      email: "ok@go.buu.ac.th",
      password: "correctpw",
    });
    await authController.login(req, res);
    expect(res._status).toBe(200);
    expect(res._body.success).toBe(true);
    expect(res._body).toHaveProperty("token");
  });
});

// ══════════════════════════════════════════════════════════════╗
// TC-U15 ~ TC-U17  universityAuth()
// ══════════════════════════════════════════════════════════════╝

describe("TC-U15~U17 | universityAuth()", () => {
  beforeEach(() => jest.clearAllMocks());

  // TC-U15: missing email
  test("TC-U15 missing email → 400", async () => {
    const { req, res } = mockReqRes({});
    await authController.universityAuth(req, res);
    expect(res._status).toBe(400);
  });

  // TC-U16: non-BUU email
  test("TC-U16 non-university email → 403", async () => {
    const { req, res } = mockReqRes({ email: "x@hotmail.com" });
    await authController.universityAuth(req, res);
    expect(res._status).toBe(403);
  });

  // TC-U17: existing active user → token issued
  test("TC-U17 existing active university user → 200 token", async () => {
    pool.execute.mockResolvedValueOnce([
      [
        {
          user_id: 10,
          email: "s@go.buu.ac.th",
          first_name: "สมหมาย",
          last_name: null,
          role: "user",
          status: "active",
        },
      ],
    ]);

    const { req, res } = mockReqRes({ email: "s@go.buu.ac.th" });
    await authController.universityAuth(req, res);
    expect(res._status).toBe(200);
    expect(res._body.success).toBe(true);
    expect(res._body).toHaveProperty("token");
  });
});

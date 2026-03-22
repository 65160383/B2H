/**
 * Integration Tests — Auth API
 * Suite 1: POST /api/register
 * Suite 2: POST /api/login
 * Suite 3: GET  /api/me
 * Uses supertest; DB pool is mocked to avoid a real MySQL connection.
 */

jest.mock("../../config/db", () => ({
  pool: { execute: jest.fn() },
}));

jest.mock("bcryptjs", () => ({
  hash: jest.fn().mockResolvedValue("hashedpw"),
  compare: jest.fn(),
}));

const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../../app");
const { pool } = require("../../config/db");
const bcrypt = require("bcryptjs");
const { JWT_SECRET } = require("../../middlewares/auth");

// ══════════════════════════════════════════════════════════════════╗
// Suite 1 — POST /api/register
// ══════════════════════════════════════════════════════════════════╝
describe("Suite 1 | POST /api/register", () => {
  beforeEach(() => jest.clearAllMocks());

  test("IT-01 missing body → 400", async () => {
    const res = await request(app).post("/api/register").send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test("IT-02 non-BUU email → 403", async () => {
    const res = await request(app)
      .post("/api/register")
      .send({ email: "x@gmail.com", password: "pw" });
    expect(res.statusCode).toBe(403);
  });

  test("IT-03 duplicate email → 400", async () => {
    pool.execute.mockResolvedValueOnce([[{ user_id: 1 }]]);
    const res = await request(app)
      .post("/api/register")
      .send({ email: "dup@go.buu.ac.th", password: "pw" });
    expect(res.statusCode).toBe(400);
  });

  test("IT-04 valid registration → 200 + user_id", async () => {
    pool.execute
      .mockResolvedValueOnce([[]])               // no duplicate
      .mockResolvedValueOnce([{ insertId: 55 }]); // insert
    const res = await request(app)
      .post("/api/register")
      .send({ email: "new@go.buu.ac.th", password: "Secure123" });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user_id).toBe(55);
  });
});

// ══════════════════════════════════════════════════════════════════╗
// Suite 2 — POST /api/login
// ══════════════════════════════════════════════════════════════════╝
describe("Suite 2 | POST /api/login", () => {
  beforeEach(() => jest.clearAllMocks());

  test("IT-05 missing credentials → 400", async () => {
    const res = await request(app).post("/api/login").send({});
    expect(res.statusCode).toBe(400);
  });

  test("IT-06 unknown user → 401", async () => {
    pool.execute.mockResolvedValueOnce([[]]); // no rows
    const res = await request(app)
      .post("/api/login")
      .send({ email: "ghost@go.buu.ac.th", password: "pw" });
    expect(res.statusCode).toBe(401);
  });

  test("IT-07 wrong password → 401", async () => {
    pool.execute.mockResolvedValueOnce([
      [{ user_id: 1, email: "u@go.buu.ac.th", password: "h", status: "active" }],
    ]);
    bcrypt.compare.mockResolvedValueOnce(false);
    const res = await request(app)
      .post("/api/login")
      .send({ email: "u@go.buu.ac.th", password: "wrong" });
    expect(res.statusCode).toBe(401);
  });

  test("IT-08 valid credentials → 200 + JWT token", async () => {
    pool.execute.mockResolvedValueOnce([
      [
        {
          user_id: 9,
          email: "ok@go.buu.ac.th",
          first_name: "Test",
          last_name: "User",
          password: "hashed",
          status: "active",
        },
      ],
    ]);
    bcrypt.compare.mockResolvedValueOnce(true);
    const res = await request(app)
      .post("/api/login")
      .send({ email: "ok@go.buu.ac.th", password: "correctpw" });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty("token");
    // token must be a valid JWT
    const decoded = jwt.verify(res.body.token, JWT_SECRET);
    expect(decoded.user_id).toBe(9);
  });
});

// ══════════════════════════════════════════════════════════════════╗
// Suite 3 — GET /api/me (read authenticated user profile)
// ══════════════════════════════════════════════════════════════════╝
describe("Suite 3 | GET /api/me", () => {
  beforeEach(() => jest.clearAllMocks());

  test("IT-09 no token → loggedIn: false", async () => {
    const res = await request(app).get("/api/me");
    expect(res.statusCode).toBe(200);
    expect(res.body.loggedIn).toBe(false);
  });

  test("IT-10 invalid token → loggedIn: false", async () => {
    const res = await request(app)
      .get("/api/me")
      .set("Authorization", "Bearer notavalidjwt");
    expect(res.body.loggedIn).toBe(false);
  });

  test("IT-11 valid token for active user → loggedIn: true with profile", async () => {
    const token = jwt.sign({ user_id: 3, email: "p@go.buu.ac.th" }, JWT_SECRET);
    pool.execute.mockResolvedValueOnce([
      [
        {
          user_id: 3,
          first_name: "พิม",
          last_name: "ใจดี",
          email: "p@go.buu.ac.th",
          role: "user",
          status: "active",
          profile_image: null,
          contact_facebook: null,
          contact_line: null,
          contact_instagram: null,
        },
      ],
    ]);
    const res = await request(app)
      .get("/api/me")
      .set("Authorization", `Bearer ${token}`);
    expect(res.body.loggedIn).toBe(true);
    expect(res.body.user.email).toBe("p@go.buu.ac.th");
  });
});

// ══════════════════════════════════════════════════════════════════╗
// Suite 4 — POST /api/auth/university
// ══════════════════════════════════════════════════════════════════╝
describe("Suite 4 | POST /api/auth/university", () => {
  beforeEach(() => jest.clearAllMocks());

  test("IT-12 no email → 400", async () => {
    const res = await request(app).post("/api/auth/university").send({});
    expect(res.statusCode).toBe(400);
  });

  test("IT-13 non-BUU email → 403", async () => {
    const res = await request(app)
      .post("/api/auth/university")
      .send({ email: "x@yahoo.com" });
    expect(res.statusCode).toBe(403);
  });

  test("IT-14 BUU email auto-creates user and returns token → 200", async () => {
    pool.execute
      .mockResolvedValueOnce([[]])               // SELECT → no user
      .mockResolvedValueOnce([{ insertId: 20 }]) // INSERT
      .mockResolvedValueOnce([
        [
          {
            user_id: 20,
            email: "n@go.buu.ac.th",
            first_name: "นิรนาม",
            last_name: null,
            role: "user",
            status: "active",
          },
        ],
      ]);                                         // SELECT new user
    const res = await request(app)
      .post("/api/auth/university")
      .send({ email: "n@go.buu.ac.th", name: "นิรนาม" });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("token");
  });
});

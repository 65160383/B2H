/**
 * Unit Tests — Auth Controller (Extended)
 * Covers: updateMe, uploadAvatar, logout, adminGetUsers
 */

jest.mock("../../config/db", () => ({
  pool: { execute: jest.fn() },
}));

const { pool } = require("../../config/db");
const authController = require("../../controllers/authController");

function mock(body = {}, headers = {}, auth = null, file = null) {
  const req = { body, headers, auth, file };
  const res = {
    _status: 200,
    _body: null,
    status(c) { this._status = c; return this; },
    json(d)   { this._body = d; return this; },
  };
  return { req, res };
}

// ══════════════════════════════════════════════════════════════╗
// updateMe
// ══════════════════════════════════════════════════════════════╝
describe("updateMe()", () => {
  beforeEach(() => jest.clearAllMocks());

  test("no auth → 401", async () => {
    const { req, res } = mock({ name: "ทดสอบ" });
    await authController.updateMe(req, res);
    expect(res._status).toBe(401);
  });

  test("valid update → 200 with user", async () => {
    pool.execute
      .mockResolvedValueOnce([{}])  // UPDATE
      .mockResolvedValueOnce([
        [{ user_id: 1, first_name: "ทดสอบ", last_name: null, email: "t@go.buu.ac.th", role: "user" }],
      ]); // SELECT
    const { req, res } = mock(
      { name: "ทดสอบ", contact_facebook: "fb/test" },
      {},
      { user_id: 1 }
    );
    await authController.updateMe(req, res);
    expect(res._status).toBe(200);
    expect(res._body.success).toBe(true);
    expect(res._body.user).toHaveProperty("email");
  });
});

// ══════════════════════════════════════════════════════════════╗
// uploadAvatar
// ══════════════════════════════════════════════════════════════╝
describe("uploadAvatar()", () => {
  beforeEach(() => jest.clearAllMocks());

  test("no auth → 401", async () => {
    const { req, res } = mock({}, {}, null, { filename: "avatar.jpg" });
    await authController.uploadAvatar(req, res);
    expect(res._status).toBe(401);
  });

  test("no file uploaded → 400", async () => {
    const { req, res } = mock({}, {}, { user_id: 1 }, null);
    await authController.uploadAvatar(req, res);
    expect(res._status).toBe(400);
  });

  test("valid upload → 200 with profile_image url", async () => {
    pool.execute
      .mockResolvedValueOnce([{}])  // UPDATE avatar_url
      .mockResolvedValueOnce([
        [{ user_id: 1, first_name: "ทดสอบ", last_name: null, email: "t@go.buu.ac.th", role: "user" }],
      ]); // SELECT
    const { req, res } = mock({}, {}, { user_id: 1 }, { filename: "avatar-123.jpg" });
    await authController.uploadAvatar(req, res);
    expect(res._status).toBe(200);
    expect(res._body.success).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════╗
// logout
// ══════════════════════════════════════════════════════════════╝
describe("logout()", () => {
  test("always returns success:true", () => {
    const { req, res } = mock();
    authController.logout(req, res);
    expect(res._body.success).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════╗
// adminGetUsers
// ══════════════════════════════════════════════════════════════╝
describe("adminGetUsers()", () => {
  beforeEach(() => jest.clearAllMocks());

  test("DB success → 200 with users array", async () => {
    pool.execute.mockResolvedValueOnce([
      [
        { user_id: 1, email: "a@go.buu.ac.th", role: "user", status: "active" },
        { user_id: 2, email: "b@go.buu.ac.th", role: "user", status: "active" },
      ],
    ]);
    const { req, res } = mock();
    await authController.adminGetUsers(req, res);
    expect(res._status).toBe(200);
    expect(res._body.success).toBe(true);
    expect(res._body.users).toHaveLength(2);
  });

  test("DB error → 500", async () => {
    pool.execute.mockRejectedValueOnce(new Error("DB error"));
    const { req, res } = mock();
    await authController.adminGetUsers(req, res);
    expect(res._status).toBe(500);
    expect(res._body.success).toBe(false);
  });
});

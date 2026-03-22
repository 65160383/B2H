const jwt = require("jsonwebtoken");
const { pool } = require("../config/db");

const JWT_SECRET = process.env.JWT_SECRET || "b2h-demo-jwt-secret";

async function authenticateJWT(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Missing token" });
  }
  const token = auth.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    // check user exists and status
    try {
      const [rows] = await pool.execute(
        "SELECT user_id, role, status FROM users WHERE user_id = ?",
        [payload.user_id],
      );
      const user = rows && rows[0];
      if (!user)
        return res
          .status(401)
          .json({ success: false, message: "Invalid token" });
      if (user.status && user.status !== "active")
        return res
          .status(403)
          .json({ success: false, message: "บัญชีถูกระงับ" });
      // attach both token payload and user record to request
      req.auth = payload;
      req.user = user;
      return next();
    } catch (dbErr) {
      console.error("authenticateJWT db error", dbErr);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
}

function requireRole(role) {
  return async (req, res, next) => {
    try {
      // prefer user loaded by authenticateJWT to avoid extra DB lookup
      if (req.user) {
        if (!req.user || req.user.status !== "active")
          return res.status(403).json({ success: false, message: "Forbidden" });
        if (role && req.user.role !== role)
          return res
            .status(403)
            .json({ success: false, message: "Insufficient role" });
        return next();
      }
      const userId = req.auth && req.auth.user_id;
      if (!userId)
        return res.status(403).json({ success: false, message: "Forbidden" });
      const [rows] = await pool.execute(
        "SELECT role, status FROM users WHERE user_id = ?",
        [userId],
      );
      const user = rows && rows[0];
      if (!user || user.status !== "active")
        return res.status(403).json({ success: false, message: "Forbidden" });
      if (role && user.role !== role)
        return res
          .status(403)
          .json({ success: false, message: "Insufficient role" });
      req.user = user;
      next();
    } catch (err) {
      console.error("Role check error", err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  };
}

module.exports = { authenticateJWT, requireRole, JWT_SECRET };

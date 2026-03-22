const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const {
  universityAuth,
  register,
  login,
  me,
  updateMe,
  uploadAvatar,
  logout,
  adminGetUsers,
} = require("../controllers/authController");
const { authenticateJWT, requireRole } = require("../middlewares/auth");

// Multer setup for avatar upload
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) =>
    cb(null, path.join(__dirname, "../public/uploads")),
  filename: (req, file, cb) =>
    cb(
      null,
      `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`
    ),
});
const avatarUpload = multer({ storage: avatarStorage });

router.post("/api/auth/university", universityAuth);
router.post("/api/register", register);
router.post("/api/login", login);
router.get("/api/me", me);
router.put("/api/me", authenticateJWT, updateMe);
router.post(
  "/api/me/avatar",
  authenticateJWT,
  avatarUpload.single("avatar"),
  uploadAvatar
);
router.post("/api/logout", logout);
router.get(
  "/api/admin/users",
  authenticateJWT,
  requireRole("admin"),
  adminGetUsers
);

module.exports = router;


const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getSellerInterested,
  getFavorites,
  toggleFavorite,
  getSellerProducts,
  updateProductStatus,
  getInterests,
  addInterest,
  toggleInterest,
  cancelSale,
  getUserHistory,
  addReview,
  getSellerReviews,
  createReport,
  adminGetReports,
  updateReportStatus,
  adminDeleteProduct,
  adminSetUserStatus,
  adminDeleteReview,
} = require("../controllers/productController");
const { authenticateJWT, requireRole } = require("../middlewares/auth");

// Multer setup for product images
const productStorage = multer.diskStorage({
  destination: (req, file, cb) =>
    cb(null, path.join(__dirname, "../public/uploads")),
  filename: (req, file, cb) =>
    cb(
      null,
      `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`,
    ),
});
const productUpload = multer({ storage: productStorage });

// Public routes
router.get("/api/products", listProducts);
router.get("/api/products/:id", getProduct);
router.get("/api/seller/:id/products", getSellerProducts);
router.get("/api/seller/:id/interested", getSellerInterested);
router.get("/api/seller/:id/reviews", getSellerReviews);

// Authenticated routes
router.post(
  "/api/products",
  authenticateJWT,
  productUpload.array("images", 5),
  createProduct,
);
router.put(
  "/api/products/:id",
  authenticateJWT,
  productUpload.array("images", 5),
  updateProduct,
);
router.delete("/api/products/:id", authenticateJWT, deleteProduct);
router.put("/api/products/:id/status", authenticateJWT, updateProductStatus);
router.post("/api/products/:id/cancel-sale", authenticateJWT, cancelSale);
router.post("/api/products/:id/reviews", authenticateJWT, addReview);
router.post(
  "/api/products/:id/report",
  authenticateJWT,
  productUpload.array("attachments", 5),
  createReport,
);

// Favorites
router.get("/api/favorites", authenticateJWT, getFavorites);
router.post("/api/favorites/:id", authenticateJWT, toggleFavorite);

// Interests
router.get("/api/interests", authenticateJWT, getInterests);
router.post("/api/interests/:id", authenticateJWT, toggleInterest);

// History
router.get("/api/history", authenticateJWT, getUserHistory);

// Admin routes
router.get(
  "/api/admin/reports",
  authenticateJWT,
  requireRole("admin"),
  adminGetReports,
);
router.put(
  "/api/admin/reports/:id",
  authenticateJWT,
  requireRole("admin"),
  updateReportStatus,
);
router.delete(
  "/api/admin/products/:id",
  authenticateJWT,
  requireRole("admin"),
  adminDeleteProduct,
);
router.put(
  "/api/admin/users/:id/status",
  authenticateJWT,
  requireRole("admin"),
  adminSetUserStatus,
);
router.delete(
  "/api/admin/reviews/:id",
  authenticateJWT,
  requireRole("admin"),
  adminDeleteReview,
);

module.exports = router;

const path = require("path");
const fs = require("fs");
const { pool } = require("../config/db");

async function listProducts(req, res) {
  try {
    // By default, exclude products with status = 'sold' from public listing.
    // Allow callers to include sold items with ?show_sold=1
    const showSold =
      req.query &&
      (req.query.show_sold === "1" ||
        String(req.query.show_sold).toLowerCase() === "true");
    const sql = showSold
      ? "SELECT p.*, p.img_url AS img_url FROM product p ORDER BY p.create_time DESC LIMIT 100"
      : "SELECT p.*, p.img_url AS img_url FROM product p WHERE (p.status IS NULL OR p.status <> 'sold') ORDER BY p.create_time DESC LIMIT 100";
    const [rows] = await pool.execute(sql);
    res.json({ success: true, products: rows });
  } catch (err) {
    console.error("Products error", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

async function getProduct(req, res) {
  const id = req.params.id;
  try {
    const [rows] = await pool.execute(
      "SELECT p.*, u.email AS seller_email, u.first_name, u.last_name FROM product p JOIN users u ON p.seller_id = u.user_id WHERE p.product_id = ?",
      [id],
    );
    const product = rows && rows[0];
    if (!product)
      return res.status(404).json({ success: false, message: "Not found" });
    const images = [];
    if (product.img_url) images.push(product.img_url);
    product.images = images;
    const sellerName = [product.first_name, product.last_name]
      .filter(Boolean)
      .join(" ");
    product.seller_name = sellerName || product.seller_email || null;
    res.json({ success: true, product });
  } catch (err) {
    console.error("Product detail error", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

async function createProduct(req, res) {
  const { title, description, price, contact, category } = req.body || {};
  if (!title || !price)
    return res
      .status(400)
      .json({ success: false, message: "กรุณากรอกชื่อสินค้าและราคา" });
  const userId = req.auth && req.auth.user_id;
  if (!userId)
    return res.status(401).json({ success: false, message: "ไม่พบผู้ใช้" });
  const priceNum = Number(price);
  if (Number.isNaN(priceNum) || priceNum < 0)
    return res
      .status(400)
      .json({ success: false, message: "กรุณากรอกราคาให้ถูกต้อง" });
  try {
    const [r] = await pool.execute(
      "INSERT INTO product (seller_id, title, description, price, contact, category) VALUES (?, ?, ?, ?, ?, ?)",
      [
        userId,
        title,
        description || null,
        priceNum,
        contact || null,
        category || null,
      ],
    );
    const productId = r.insertId;
    const files = req.files || [];
    const imageUrls = [];
    for (const file of files) {
      const url = `/uploads/${file.filename}`;
      imageUrls.push(url);
    }
    if (imageUrls.length) {
      try {
        await pool.execute(
          "UPDATE product SET img_url = ? WHERE product_id = ?",
          [imageUrls[0], productId],
        );
      } catch (e) {
        /* ignore */
      }
    }
    res.json({ success: true, product_id: productId, images: imageUrls });
  } catch (err) {
    console.error("Create product error", err);
    res
      .status(500)
      .json({ success: false, message: "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์" });
  }
}

async function updateProduct(req, res) {
  const id = req.params.id;
  const userId = req.auth && req.auth.user_id;
  if (!userId)
    return res.status(401).json({ success: false, message: "ไม่พบผู้ใช้" });
  const { title, description, price, contact, category } = req.body || {};
  try {
    const [rows] = await pool.execute(
      "SELECT seller_id FROM product WHERE product_id = ?",
      [id],
    );
    const prod = rows && rows[0];
    if (!prod)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    if (Number(prod.seller_id) !== Number(userId))
      return res.status(403).json({ success: false, message: "Forbidden" });
    let priceNum = null;
    if (price !== undefined && price !== null && price !== "") {
      priceNum = Number(price);
      if (Number.isNaN(priceNum) || priceNum < 0)
        return res
          .status(400)
          .json({ success: false, message: "กรุณากรอกราคาให้ถูกต้อง" });
    }
    await pool.execute(
      "UPDATE product SET title = ?, description = ?, price = ?, contact = ?, category = ? WHERE product_id = ?",
      [
        title || null,
        description || null,
        priceNum,
        contact || null,
        category || null,
        id,
      ],
    );
    const files = req.files || [];
    const imageUrls = [];
    for (const file of files) {
      const url = `/uploads/${file.filename}`;
      imageUrls.push(url);
    }
    if (imageUrls.length) {
      try {
        await pool.execute(
          "UPDATE product SET img_url = ? WHERE product_id = ?",
          [imageUrls[0], id],
        );
      } catch (e) {
        /* ignore */
      }
    }
    res.json({ success: true, product_id: id, images: imageUrls });
  } catch (err) {
    console.error("Update product error", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

async function deleteProduct(req, res) {
  const id = req.params.id;
  const userId = req.auth && req.auth.user_id;
  if (!userId)
    return res.status(401).json({ success: false, message: "ไม่พบผู้ใช้" });
  try {
    const [rows] = await pool.execute(
      "SELECT seller_id, img_url FROM product WHERE product_id = ?",
      [id],
    );
    const prod = rows && rows[0];
    if (!prod)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    if (Number(prod.seller_id) !== Number(userId))
      return res.status(403).json({ success: false, message: "Forbidden" });
    try {
      if (
        prod.img_url &&
        typeof prod.img_url === "string" &&
        prod.img_url.startsWith("/uploads/")
      ) {
        const filePath = path.join(
          __dirname,
          "..",
          "public",
          prod.img_url.replace(/^\//, ""),
        );
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    } catch (e) {
      /* ignore */
    }
    await pool.execute("DELETE FROM product WHERE product_id = ?", [id]);
    try {
      await pool.execute("DELETE FROM product_images WHERE product_id = ?", [
        id,
      ]);
    } catch (e) {
      /* ignore */
    }
    res.json({ success: true, deleted: true });
  } catch (err) {
    console.error("Delete product error", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

async function getSellerInterested(req, res) {
  const sellerId = req.params.id;
  try {
    // Read from interests table (people who expressed intent to buy)
    const [rows] = await pool.execute(
      `SELECT p.product_id, p.title, p.img_url AS product_img, p.status AS product_status, p.buyer_id,
              i.user_id AS user_id, u.email, u.first_name, u.last_name, u.avatar_url AS profile_image,
              u.contact_facebook, u.contact_line, u.contact_instagram
       FROM product p
       JOIN interests i ON i.product_id = p.product_id
       JOIN users u ON u.user_id = i.user_id
       WHERE p.seller_id = ?
       ORDER BY p.product_id, i.interest_id DESC`,
      [sellerId],
    );

    // group results by product
    const map = new Map();
    for (const r of rows) {
      const pid = r.product_id;
      if (!map.has(pid)) {
        map.set(pid, {
          product_id: pid,
          title: r.title,
          product_img: r.product_img,
          product_status: r.product_status,
          buyer_id: r.buyer_id || null,
          users: [],
        });
      } else {
        // ensure buyer_id is captured if present on subsequent rows
        const entry = map.get(pid);
        if (!entry.buyer_id && r.buyer_id) entry.buyer_id = r.buyer_id;
      }
      map.get(pid).users.push({
        user_id: r.user_id,
        email: r.email,
        name: [r.first_name, r.last_name].filter(Boolean).join(" ") || r.email,
        profile_image: r.profile_image,
        contact_facebook: r.contact_facebook,
        contact_line: r.contact_line,
        contact_instagram: r.contact_instagram,
      });
    }

    res.json({ success: true, interested: Array.from(map.values()) });
  } catch (err) {
    console.error("Get seller interested error", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

async function getSellerProducts(req, res) {
  const sellerId = req.params.id;
  try {
    const [users] = await pool.execute(
      "SELECT user_id, email, first_name, last_name, avatar_url AS profile_image, contact_facebook, contact_line, contact_instagram FROM users WHERE user_id = ?",
      [sellerId],
    );
    const seller = users && users[0];
    if (!seller)
      return res
        .status(404)
        .json({ success: false, message: "Seller not found" });

    // By default, hide products whose status is 'sold' from the public seller listing.
    // Callers can request sold items by passing ?show_sold=1.
    const showSold =
      req.query &&
      (req.query.show_sold === "1" ||
        String(req.query.show_sold).toLowerCase() === "true");
    const productsQuery = showSold
      ? "SELECT product_id, seller_id, title, description, price, contact, category, img_url, status, buyer_id FROM product WHERE seller_id = ? ORDER BY create_time DESC"
      : "SELECT product_id, seller_id, title, description, price, contact, category, img_url, status, buyer_id FROM product WHERE seller_id = ? AND (status IS NULL OR status <> 'sold') ORDER BY create_time DESC";
    const [products] = await pool.execute(productsQuery, [sellerId]);

    res.json({ success: true, seller, products });
  } catch (err) {
    console.error("Get seller products error", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

async function updateProductStatus(req, res) {
  const id = req.params.id;
  const userId = req.auth && req.auth.user_id;
  if (!userId)
    return res.status(401).json({ success: false, message: "ไม่พบผู้ใช้" });
  const { status, buyer_id } = req.body || {};
  if (!status)
    return res.status(400).json({ success: false, message: "Missing status" });
  try {
    const [rows] = await pool.execute(
      "SELECT seller_id, buyer_id FROM product WHERE product_id = ?",
      [id],
    );
    const prod = rows && rows[0];
    if (!prod)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    // Only seller can change status
    if (Number(prod.seller_id) !== Number(userId))
      return res.status(403).json({ success: false, message: "Forbidden" });
    // Determine buyer_id to persist:
    // - If request provides buyer_id, use it
    // - Otherwise, if changing to 'sold', preserve any existing buyer_id on the product
    // - Otherwise set to NULL
    let buyerIdVal = null;
    if (buyer_id !== undefined) {
      buyerIdVal = buyer_id;
    } else if (String(status) === "sold") {
      buyerIdVal = prod.buyer_id !== undefined ? prod.buyer_id : null;
    } else {
      buyerIdVal = null;
    }

    await pool.execute(
      "UPDATE product SET status = ?, buyer_id = ? WHERE product_id = ?",
      [status, buyerIdVal, id],
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Update product status error", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

// Cancel sale: seller can cancel the in-progress sale and revert product to available
async function cancelSale(req, res) {
  const id = req.params.id;
  const userId = req.auth && req.auth.user_id;
  if (!userId)
    return res.status(401).json({ success: false, message: "ไม่พบผู้ใช้" });
  try {
    const [rows] = await pool.execute(
      "SELECT seller_id FROM product WHERE product_id = ?",
      [id],
    );
    const prod = rows && rows[0];
    if (!prod)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    if (Number(prod.seller_id) !== Number(userId))
      return res.status(403).json({ success: false, message: "Forbidden" });

    // revert product to available and clear buyer_id
    await pool.execute(
      "UPDATE product SET status = 'available', buyer_id = NULL WHERE product_id = ?",
      [id],
    );

    // Remove any interests for this product so the interested list is cleared
    try {
      await pool.execute("DELETE FROM interests WHERE product_id = ?", [id]);
    } catch (e) {
      // non-fatal
      console.warn(
        "Failed to delete interests for product",
        id,
        e && e.message,
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Cancel sale error", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

async function getFavorites(req, res) {
  const userId = req.auth && req.auth.user_id;
  if (!userId)
    return res.status(401).json({ success: false, message: "ไม่พบผู้ใช้" });
  try {
    const [rows] = await pool.execute(
      `SELECT p.*, f.favorite_id FROM favorites f JOIN product p ON p.product_id = f.product_id WHERE f.user_id = ? ORDER BY f.favorite_id DESC`,
      [userId],
    );
    res.json({ success: true, products: rows });
  } catch (err) {
    console.error("Get favorites error", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

async function toggleFavorite(req, res) {
  const userId = req.auth && req.auth.user_id;
  if (!userId)
    return res.status(401).json({ success: false, message: "ไม่พบผู้ใช้" });
  const productId =
    req.body && (req.body.product_id || req.body.productId || req.body.id);
  if (!productId)
    return res
      .status(400)
      .json({ success: false, message: "Missing product_id" });
  try {
    // ensure product exists
    const [pr] = await pool.execute(
      "SELECT product_id FROM product WHERE product_id = ?",
      [productId],
    );
    if (!pr || pr.length === 0)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    const [rows] = await pool.execute(
      "SELECT favorite_id FROM favorites WHERE user_id = ? AND product_id = ?",
      [userId, productId],
    );
    if (rows && rows.length) {
      // remove
      await pool.execute("DELETE FROM favorites WHERE favorite_id = ?", [
        rows[0].favorite_id,
      ]);
      return res.json({ success: true, removed: true });
    }

    // add
    await pool.execute(
      "INSERT INTO favorites (user_id, product_id) VALUES (?, ?)",
      [userId, productId],
    );
    return res.json({ success: true, added: true });
  } catch (err) {
    console.error("Toggle favorite error", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

// Interests API (separate from favorites)

async function getInterests(req, res) {
  const userId = req.auth && req.auth.user_id;
  if (!userId)
    return res.status(401).json({ success: false, message: "ไม่พบผู้ใช้" });
  try {
    const [rows] = await pool.execute(
      `SELECT p.*, i.interest_id FROM interests i JOIN product p ON p.product_id = i.product_id WHERE i.user_id = ? ORDER BY i.interest_id DESC`,
      [userId],
    );
    res.json({ success: true, products: rows });
  } catch (err) {
    console.error("Get interests error", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

async function addInterest(req, res) {
  const userId = req.auth && req.auth.user_id;
  if (!userId)
    return res.status(401).json({ success: false, message: "ไม่พบผู้ใช้" });
  const productId =
    req.body && (req.body.product_id || req.body.productId || req.body.id);
  if (!productId)
    return res
      .status(400)
      .json({ success: false, message: "Missing product_id" });
  try {
    const [pr] = await pool.execute(
      "SELECT product_id FROM product WHERE product_id = ?",
      [productId],
    );
    if (!pr || pr.length === 0)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    const [rows] = await pool.execute(
      "SELECT interest_id FROM interests WHERE user_id = ? AND product_id = ?",
      [userId, productId],
    );
    if (rows && rows.length) return res.json({ success: true, added: false });
    await pool.execute(
      "INSERT INTO interests (user_id, product_id) VALUES (?, ?)",
      [userId, productId],
    );
    return res.json({ success: true, added: true });
  } catch (err) {
    console.error("Add interest error", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

async function toggleInterest(req, res) {
  const userId = req.auth && req.auth.user_id;
  if (!userId)
    return res.status(401).json({ success: false, message: "ไม่พบผู้ใช้" });
  const productId =
    req.body && (req.body.product_id || req.body.productId || req.body.id);
  if (!productId)
    return res
      .status(400)
      .json({ success: false, message: "Missing product_id" });
  try {
    const [pr] = await pool.execute(
      "SELECT product_id FROM product WHERE product_id = ?",
      [productId],
    );
    if (!pr || pr.length === 0)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    const [rows] = await pool.execute(
      "SELECT interest_id FROM interests WHERE user_id = ? AND product_id = ?",
      [userId, productId],
    );
    if (rows && rows.length) {
      await pool.execute("DELETE FROM interests WHERE interest_id = ?", [
        rows[0].interest_id,
      ]);
      return res.json({ success: true, removed: true });
    }
    await pool.execute(
      "INSERT INTO interests (user_id, product_id) VALUES (?, ?)",
      [userId, productId],
    );
    return res.json({ success: true, added: true });
  } catch (err) {
    console.error("Toggle interest error", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

// Get purchase and sale history for authenticated user
async function getUserHistory(req, res) {
  const userId = req.auth && req.auth.user_id;
  if (!userId)
    return res.status(401).json({ success: false, message: "ไม่พบผู้ใช้" });
  try {
    // Purchases: products where this user was the buyer and status = 'sold'
    const [purchases] = await pool.execute(
      `SELECT p.product_id, p.title, p.price, p.img_url, p.create_time, p.seller_id, u.first_name AS seller_first, u.last_name AS seller_last, u.email AS seller_email
       FROM product p
       LEFT JOIN users u ON u.user_id = p.seller_id
       WHERE p.buyer_id = ? AND p.status = 'sold'
       ORDER BY p.create_time DESC`,
      [userId],
    );

    // Sales: products where this user was the seller and status = 'sold'
    const [sales] = await pool.execute(
      `SELECT p.product_id, p.title, p.price, p.img_url, p.create_time, p.buyer_id, u.first_name AS buyer_first, u.last_name AS buyer_last, u.email AS buyer_email
       FROM product p
       LEFT JOIN users u ON u.user_id = p.buyer_id
       WHERE p.seller_id = ? AND p.status = 'sold'
       ORDER BY p.create_time DESC`,
      [userId],
    );

    res.json({ success: true, purchases, sales });
  } catch (err) {
    console.error("Get user history error", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

// Add a review for a seller (only buyer of the product can review)
async function addReview(req, res) {
  const userId = req.auth && req.auth.user_id;
  if (!userId)
    return res.status(401).json({ success: false, message: "ไม่พบผู้ใช้" });
  const { product_id, seller_id, rating, comment } = req.body || {};
  if (!product_id || !seller_id || rating === undefined)
    return res.status(400).json({ success: false, message: "Missing fields" });
  const ratingNum = Number(rating);
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5)
    return res.status(400).json({ success: false, message: "Invalid rating" });
  try {
    // verify product exists and was sold to this user
    const [rows] = await pool.execute(
      "SELECT product_id, buyer_id, seller_id, status FROM product WHERE product_id = ?",
      [product_id],
    );
    const prod = rows && rows[0];
    if (!prod)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    if (String(prod.seller_id) !== String(seller_id))
      return res
        .status(400)
        .json({ success: false, message: "Seller mismatch" });
    if (prod.status !== "sold")
      return res
        .status(400)
        .json({ success: false, message: "Product not sold yet" });
    if (String(prod.buyer_id) !== String(userId))
      return res
        .status(403)
        .json({ success: false, message: "Only buyer can submit review" });

    // Insert review
    await pool.execute(
      "INSERT INTO reviews (reviewer_id, seller_id, product_id, rating, comment) VALUES (?, ?, ?, ?, ?)",
      [userId, seller_id, product_id, ratingNum, comment || null],
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Add review error", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

// Get reviews for a seller
async function getSellerReviews(req, res) {
  const sellerId = req.params.id;
  try {
    const [rows] = await pool.execute(
      `SELECT r.review_id, r.reviewer_id, r.seller_id, r.product_id, r.rating, r.comment, r.create_time,
              u.first_name AS reviewer_first, u.last_name AS reviewer_last, u.email AS reviewer_email, u.avatar_url AS reviewer_avatar,
              p.title AS product_title, p.img_url AS product_img
       FROM reviews r
       LEFT JOIN users u ON u.user_id = r.reviewer_id
       LEFT JOIN product p ON p.product_id = r.product_id
       WHERE r.seller_id = ?
       ORDER BY r.create_time DESC`,
      [sellerId],
    );
    res.json({ success: true, reviews: rows });
  } catch (err) {
    console.error("Get seller reviews error", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

// Create a report (allow attachments)
async function createReport(req, res) {
  const userId = req.auth && req.auth.user_id;
  if (!userId)
    return res.status(401).json({ success: false, message: "ไม่พบผู้ใช้" });
  try {
    // Form data comes through req.body when multer parses it
    let { target_type, target_id, product_id, category, reason } =
      req.body || {};

    // Ensure target_id and target_type are set
    target_type = target_type || "user";
    target_id = target_id || product_id; // fallback to product_id if target_id not set

    if (!target_type || !target_id) {
      return res.status(400).json({
        success: false,
        message:
          "Missing fields: target_type=" +
          target_type +
          ", target_id=" +
          target_id,
      });
    }

    const reasonText = reason && String(reason).trim();
    if (!reasonText)
      return res
        .status(400)
        .json({ success: false, message: "โปรดระบุรายละเอียดการรายงาน" });

    // process uploaded files (if any)
    const files = req.files || [];
    const attachments = files.map((f) => `/uploads/${f.filename}`);

    try {
      await pool.execute(
        "INSERT INTO report (reporter_id, target_type, target_id, reason, attachments) VALUES (?, ?, ?, ?, ?)",
        [
          userId,
          target_type,
          target_id,
          reasonText || null,
          attachments.length ? JSON.stringify(attachments) : null,
        ],
      );
      return res.json({ success: true });
    } catch (e) {
      console.error(
        "Insert report error, will retry without attachments if applicable",
        e && e.message,
      );
      // Some DBs may not have the attachments column (migration not applied). Try fallback insert without attachments.
      try {
        await pool.execute(
          "INSERT INTO report (reporter_id, target_type, target_id, reason) VALUES (?, ?, ?, ?)",
          [userId, target_type, target_id, reasonText || null],
        );
        return res.json({ success: true });
      } catch (e2) {
        console.error("Fallback insert report error", e2 && e2.message);
        return res.status(500).json({
          success: false,
          message: "Server error while saving report",
        });
      }
    }
  } catch (err) {
    console.error("Create report error", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

// Admin: list reports with reporter and target info
async function adminGetReports(req, res) {
  try {
    // pagination support
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "10")));
    const page = Math.max(1, parseInt(req.query.page || "1"));
    const offset = (page - 1) * limit;

    // total count
    const [countRows] = await pool.execute(
      "SELECT COUNT(*) AS total FROM report",
    );
    const total = (countRows && countRows[0] && countRows[0].total) || 0;
    // detect whether attachments column exists to avoid unknown-column errors
    const [colRows] = await pool.execute(
      "SHOW COLUMNS FROM report LIKE 'attachments'",
    );
    const hasAttachments = Array.isArray(colRows) && colRows.length > 0;

    // Some MySQL setups may not accept parameter placeholders for LIMIT; inject numeric values safely
    const safeOffset = Number(offset) || 0;
    const safeLimit = Number(limit) || 10;
    const attachmentsSelect = hasAttachments ? "r.attachments," : "";
    // include admin review columns if present
    const [adminColRows] = await pool.execute(
      "SHOW COLUMNS FROM report LIKE 'admin_note'",
    );
    const hasAdminCols = Array.isArray(adminColRows) && adminColRows.length > 0;
    const adminSelect = hasAdminCols
      ? "r.admin_note, r.reviewed_by, r.review_time,"
      : "";
    const sql = `SELECT r.report_id, r.reporter_id, r.target_type, r.target_id, r.reason, ${attachmentsSelect} ${adminSelect} r.status, r.create_time,
              rep.email AS reporter_email, rep.first_name AS reporter_first, rep.last_name AS reporter_last, rep.avatar_url AS reporter_avatar,
              p.title AS product_title, p.img_url AS product_img,
              t.user_id AS target_user_id, t.email AS target_user_email, t.first_name AS target_first, t.last_name AS target_last
       FROM report r
       LEFT JOIN users rep ON rep.user_id = r.reporter_id
       LEFT JOIN product p ON (r.target_type = 'product' AND p.product_id = r.target_id)
       LEFT JOIN users t ON (r.target_type = 'user' AND t.user_id = r.target_id)
       ORDER BY r.create_time DESC
       LIMIT ${safeOffset}, ${safeLimit}`;
    const [rows] = await pool.execute(sql);

    const reports = rows.map((r) => {
      let attachments = null;
      try {
        if (r.attachments) attachments = JSON.parse(r.attachments);
      } catch (e) {
        attachments = null;
      }
      const out = {
        report_id: r.report_id,
        reporter_id: r.reporter_id,
        reporter_email: r.reporter_email,
        reporter_name:
          [r.reporter_first, r.reporter_last].filter(Boolean).join(" ") ||
          r.reporter_email,
        reporter_avatar: r.reporter_avatar || null,
        target_type: r.target_type,
        target_id: r.target_id,
        product_title: r.product_title || null,
        product_img: r.product_img || null,
        target_user_id: r.target_user_id || null,
        target_user_email: r.target_user_email || null,
        target_user_name:
          [r.target_first, r.target_last].filter(Boolean).join(" ") ||
          r.target_user_email,
        reason: r.reason,
        attachments: attachments,
        status: r.status,
        create_time: r.create_time,
      };
      if (hasAdminCols) {
        out.admin_note = r.admin_note || null;
        out.reviewed_by = r.reviewed_by || null;
        out.review_time = r.review_time || null;
      }
      return out;
    });

    res.json({ success: true, reports, total, page, limit });
  } catch (err) {
    console.error(
      "Admin get reports error",
      err && (err.stack || err.message || err),
    );
    res.status(500).json({
      success: false,
      message: (err && err.message) || "Server error",
    });
  }
}

// Admin: update report status (reviewed / rejected)
async function updateReportStatus(req, res) {
  const id = req.params.id;
  const { status } = req.body || {};
  if (!id)
    return res
      .status(400)
      .json({ success: false, message: "Missing report id" });
  if (!status || !["pending", "reviewed", "rejected"].includes(status))
    return res.status(400).json({ success: false, message: "Invalid status" });
  try {
    const adminNote = (req.body && req.body.admin_note) || null;
    const reviewerId = req.auth && req.auth.user_id;
    // update status and record admin note and reviewer/time
    await pool.execute(
      "UPDATE report SET status = ?, admin_note = ?, reviewed_by = ?, review_time = CURRENT_TIMESTAMP WHERE report_id = ?",
      [status, adminNote, reviewerId || null, id],
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Update report status error", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

// Admin: delete a product by id
async function adminDeleteProduct(req, res) {
  const id = req.params.id;
  if (!id)
    return res
      .status(400)
      .json({ success: false, message: "Missing product id" });
  try {
    // remove product image file if stored under /uploads/
    const [rows] = await pool.execute(
      "SELECT img_url FROM product WHERE product_id = ?",
      [id],
    );
    const prod = rows && rows[0];
    if (!prod)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    try {
      if (
        prod.img_url &&
        typeof prod.img_url === "string" &&
        prod.img_url.startsWith("/uploads/")
      ) {
        const filePath = path.join(
          __dirname,
          "..",
          "public",
          prod.img_url.replace(/^\//, ""),
        );
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    } catch (e) {
      /* ignore file errors */
    }
    await pool.execute("DELETE FROM product WHERE product_id = ?", [id]);
    try {
      await pool.execute("DELETE FROM product_images WHERE product_id = ?", [
        id,
      ]);
    } catch (e) {
      /* ignore */
    }
    // Also delete any reports that reference this product, and remove attachments if present
    try {
      const [repRows] = await pool.execute(
        "SELECT report_id, attachments FROM report WHERE target_type = 'product' AND target_id = ?",
        [id],
      );
      if (Array.isArray(repRows) && repRows.length) {
        for (const r of repRows) {
          try {
            if (r.attachments) {
              let attachments = null;
              try {
                attachments = JSON.parse(r.attachments);
              } catch (e) {
                attachments = null;
              }
              if (Array.isArray(attachments)) {
                for (const a of attachments) {
                  try {
                    if (typeof a === "string" && a.startsWith("/uploads/")) {
                      const fpath = path.join(
                        __dirname,
                        "..",
                        "public",
                        a.replace(/^\//, ""),
                      );
                      if (fs.existsSync(fpath)) fs.unlinkSync(fpath);
                    }
                  } catch (e) {
                    /* ignore file removal errors */
                  }
                }
              }
            }
          } catch (e) {
            /* ignore per-report errors */
          }
        }
        try {
          await pool.execute(
            "DELETE FROM report WHERE target_type = 'product' AND target_id = ?",
            [id],
          );
        } catch (e) {
          /* ignore delete errors */
        }
      }
    } catch (e) {
      // non-fatal
      console.warn("Failed to cleanup reports for product", id, e && e.message);
    }
    res.json({ success: true });
  } catch (err) {
    console.error("Admin delete product error", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

// Admin: suspend or activate a user
async function adminSetUserStatus(req, res) {
  const id = req.params.id;
  const { action } = req.body || {};
  if (!id || !action)
    return res.status(400).json({ success: false, message: "Missing fields" });
  // Map admin actions to DB status values. Use 'banned' to match existing ENUM schema.
  const allowed = { suspend: "banned", activate: "active" };
  const status = allowed[action];
  if (!status)
    return res.status(400).json({ success: false, message: "Invalid action" });
  try {
    await pool.execute("UPDATE users SET status = ? WHERE user_id = ?", [
      status,
      id,
    ]);
    res.json({ success: true });
  } catch (err) {
    console.error("Admin set user status error", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

// Admin: delete a review
async function adminDeleteReview(req, res) {
  const id = req.params.id;
  if (!id)
    return res
      .status(400)
      .json({ success: false, message: "Missing review id" });
  try {
    await pool.execute("DELETE FROM reviews WHERE review_id = ?", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error("Admin delete review error", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

module.exports = {
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
};

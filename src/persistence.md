# Data Access Layer (Persistence)

## Database Connection — `config/db.js`

```js
const mysql = require("mysql2/promise");

const db = {
  host: "localhost",
  user: "root",
  password: "",
  database: "b2h",
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

const pool = mysql.createPool(db);
module.exports = { pool };
```

**Configuration:**

- Driver: `mysql2/promise` (รองรับ async/await)
- ขนาดพูลการเชื่อมต่อ: 10 การเชื่อมต่อพร้อมกัน
- ทุกคำขอใช้ prepared statements (parameterized) เพื่อป้องกัน SQL injection

---

## UserDAO Operations

### Search User by Email

```js
const [rows] = await pool.execute("SELECT user_id FROM users WHERE email = ?", [
  email,
]);
```

### Register New User

```js
const hash = await bcrypt.hash(password, 10);
const [r] = await pool.execute(
  "INSERT INTO users (email, password, first_name, last_name) VALUES (?, ?, ?, ?)",
  [email, hash, first_name || null, last_name || null],
);
// สสร: r.insertId = user_id ใหม่
```

### Create User via University Auth (auto-account)

```js
const [r] = await pool.execute(
  "INSERT INTO users (first_name, last_name, email) VALUES (?, ?, ?)",
  [firstName, lastName, email],
);
const insertId = r.insertId;
// เลือก SELECT เพื่อผู้ระบีเรฤณ
const [newRows] = await pool.execute(
  "SELECT user_id, email, first_name, last_name, role, status FROM users WHERE user_id = ?",
  [insertId],
);
const user = newRows && newRows[0];
```

### Get Current User Profile

```js
const [rows] = await pool.execute(
  "SELECT user_id, first_name, last_name, email, role, status, avatar_url AS profile_image, contact_facebook, contact_line, contact_instagram FROM users WHERE user_id = ?",
  [user_id],
);
const user = rows && rows[0];
```

### Login — Find User by Email

```js
const [rows] = await pool.execute(
  "SELECT user_id, email, first_name, last_name, password, status FROM users WHERE email = ?",
  [email],
);
const user = rows && rows[0];
// แล้ว: await bcrypt.compare(password, user.password)
```

### Update User Profile

```js
await pool.execute(
  "UPDATE users SET first_name = ?, last_name = ?, avatar_url = ?, contact_facebook = ?, contact_line = ?, contact_instagram = ? WHERE user_id = ?",
  [
    firstName,
    lastName,
    profile_image || null,
    contact_facebook || null,
    contact_line || null,
    contact_instagram || null,
    user_id,
  ],
);
```

### Upload Avatar

```js
const url = `/uploads/${file.filename}`;
await pool.execute("UPDATE users SET avatar_url = ? WHERE user_id = ?", [
  url,
  user_id,
]);
```

### Admin — Get All Users (except admin)

```js
const [rows] = await pool.execute(
  "SELECT user_id, email, role, status, first_name, last_name, avatar_url, create_time FROM users WHERE role <> 'admin' ORDER BY create_time DESC",
);
```

### Admin — Set User Status

```js
const status = allowed[action]; // 'suspended' → 'banned', 'activate' → 'active'
await pool.execute("UPDATE users SET status = ? WHERE user_id = ?", [
  status,
  user_id,
]);
```

---

## ProductDAO Operations

### List All Products (public)

```js
// Default: exclude 'sold' products
const sql =
  "SELECT p.*, p.img_url AS img_url FROM product p WHERE (p.status IS NULL OR p.status <> 'sold') ORDER BY p.create_time DESC LIMIT 100";
const [rows] = await pool.execute(sql);

// With ?show_sold=1
const sqlWithSold =
  "SELECT p.*, p.img_url AS img_url FROM product p ORDER BY p.create_time DESC LIMIT 100";
```

### Get Product Details + Seller Info

```js
const [rows] = await pool.execute(
  "SELECT p.*, u.email AS seller_email, u.first_name, u.last_name FROM product p JOIN users u ON p.seller_id = u.user_id WHERE p.product_id = ?",
  [product_id],
);
const product = rows && rows[0];
```

### Create Product

```js
const [r] = await pool.execute(
  "INSERT INTO product (seller_id, title, description, price, contact, category) VALUES (?, ?, ?, ?, ?, ?)",
  [
    seller_id,
    title,
    description || null,
    price,
    contact || null,
    category || null,
  ],
);
const productId = r.insertId;

// อัปเดช URL รูปคนทรผหลายถ้ีมนีอุื file
const url = `/uploads/${file.filename}`;
await pool.execute("UPDATE product SET img_url = ? WHERE product_id = ?", [
  url,
  productId,
]);
```

### Update Product

```js
// ตรวจสิทธิการเปิดพูล
const [rows] = await pool.execute(
  "SELECT seller_id FROM product WHERE product_id = ?",
  [product_id],
);
if (Number(rows[0].seller_id) !== Number(seller_id)) {
  // Forbidden
}

// อับเดชคำความ
await pool.execute(
  "UPDATE product SET title = ?, description = ?, price = ?, contact = ?, category = ? WHERE product_id = ?",
  [
    title || null,
    description || null,
    price,
    contact || null,
    category || null,
    product_id,
  ],
);

// อัปเดชรูปหากถ้าได้รับ
const url = `/uploads/${file.filename}`;
await pool.execute("UPDATE product SET img_url = ? WHERE product_id = ?", [
  url,
  product_id,
]);
```

### Delete Product

```js
// ชื่อหนื่อ URL รูปสำหรับชื่รอไฟล์
const [rows] = await pool.execute(
  "SELECT seller_id, img_url FROM product WHERE product_id = ?",
  [product_id],
);
const prod = rows && rows[0];

// Delete file from disk
if (prod.img_url && prod.img_url.startsWith("/uploads/")) {
  const filePath = path.join(
    __dirname,
    "..",
    "public",
    prod.img_url.replace(/^\//, ""),
  );
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

// Delete from DB
await pool.execute("DELETE FROM product WHERE product_id = ?", [product_id]);
await pool.execute("DELETE FROM product_images WHERE product_id = ?", [
  product_id,
]);
```

### Get Seller's Products

```js
// ดฆภูมิกของผู้ขาย
const [users] = await pool.execute(
  "SELECT user_id, email, first_name, last_name, avatar_url AS profile_image, contact_facebook, contact_line, contact_instagram FROM users WHERE user_id = ?",
  [seller_id],
);

// ดึงรายเกยวอตของผู้ขาย (exception 'sold' ทำค่านหรือรวม ?show_sold=1)
const productsQuery = showSold
  ? "SELECT product_id, seller_id, title, description, price, contact, category, img_url, status, buyer_id FROM product WHERE seller_id = ? ORDER BY create_time DESC"
  : "SELECT product_id, seller_id, title, description, price, contact, category, img_url, status, buyer_id FROM product WHERE seller_id = ? AND (status IS NULL OR status <> 'sold') ORDER BY create_time DESC";
const [products] = await pool.execute(productsQuery, [seller_id]);
```

### Update Product Status

```js
// รองปลอดสิทธิการเปิดพูล
const [rows] = await pool.execute(
  "SELECT seller_id, buyer_id FROM product WHERE product_id = ?",
  [product_id],
);
if (Number(rows[0].seller_id) !== Number(seller_id)) {
  // Forbidden
}

// Determine buyer_id logic
let buyerIdVal = null;
if (buyer_id !== undefined) {
  buyerIdVal = buyer_id;
} else if (String(status) === "sold") {
  buyerIdVal = rows[0].buyer_id !== undefined ? rows[0].buyer_id : null;
}

await pool.execute(
  "UPDATE product SET status = ?, buyer_id = ? WHERE product_id = ?",
  [status, buyerIdVal, product_id],
);
```

### Cancel Sale

```js
// Revert to 'available', clear buyer_id, delete interests
await pool.execute(
  "UPDATE product SET status = 'available', buyer_id = NULL WHERE product_id = ?",
  [product_id],
);
await pool.execute("DELETE FROM interests WHERE product_id = ?", [product_id]);
```

---

## InterestDAO Operations

### Get User's Favorites

```js
const [rows] = await pool.execute(
  "SELECT p.*, f.favorite_id FROM favorites f JOIN product p ON p.product_id = f.product_id WHERE f.user_id = ? ORDER BY f.favorite_id DESC",
  [user_id],
);
```

### Add Favorite

```js
// ตรวจว่ามาที่แล้ว
const [existing] = await pool.execute(
  "SELECT favorite_id FROM favorites WHERE user_id = ? AND product_id = ?",
  [user_id, product_id],
);
if (existing && existing.length) {
  // มาดูแลวแล้ว
}

// เพิ่มใหม่
await pool.execute(
  "INSERT INTO favorites (user_id, product_id) VALUES (?, ?)",
  [user_id, product_id],
);
```

### Toggle Favorite (remove if exists, add if not)

```js
const [rows] = await pool.execute(
  "SELECT favorite_id FROM favorites WHERE user_id = ? AND product_id = ?",
  [user_id, product_id],
);
if (rows && rows.length) {
  // Remove
  await pool.execute("DELETE FROM favorites WHERE favorite_id = ?", [
    rows[0].favorite_id,
  ]);
  return { success: true, removed: true };
}

// Add
await pool.execute(
  "INSERT INTO favorites (user_id, product_id) VALUES (?, ?)",
  [user_id, product_id],
);
return { success: true, added: true };
```

### Get User's Interests

```js
const [rows] = await pool.execute(
  "SELECT p.*, i.interest_id FROM interests i JOIN product p ON p.product_id = i.product_id WHERE i.user_id = ? ORDER BY i.interest_id DESC",
  [user_id],
);
```

### Add Interest (unique, no duplicates)

```js
// ตรวจหลัง (ไม่อนุญาตให้ซ้ำ)
const [existing] = await pool.execute(
  "SELECT interest_id FROM interests WHERE user_id = ? AND product_id = ?",
  [user_id, product_id],
);
if (existing && existing.length) {
  return { success: true, added: false };
}

// Insert
await pool.execute(
  "INSERT INTO interests (user_id, product_id) VALUES (?, ?)",
  [user_id, product_id],
);
return { success: true, added: true };
```

### Toggle Interest (remove if exists, add if not)

```js
const [rows] = await pool.execute(
  "SELECT interest_id FROM interests WHERE user_id = ? AND product_id = ?",
  [user_id, product_id],
);
if (rows && rows.length) {
  // Remove
  await pool.execute("DELETE FROM interests WHERE interest_id = ?", [
    rows[0].interest_id,
  ]);
  return { success: true, removed: true };
}

// Add
await pool.execute(
  "INSERT INTO interests (user_id, product_id) VALUES (?, ?)",
  [user_id, product_id],
);
return { success: true, added: true };
```

### Get Seller's Interested Users (grouped by product)

```js
const [rows] = await pool.execute(
  `SELECT p.product_id, p.title, p.img_url AS product_img, p.status AS product_status, p.buyer_id,
          i.user_id AS user_id, u.email, u.first_name, u.last_name, u.avatar_url AS profile_image,
          u.contact_facebook, u.contact_line, u.contact_instagram
   FROM product p
   JOIN interests i ON i.product_id = p.product_id
   JOIN users u ON u.user_id = i.user_id
   WHERE p.seller_id = ?
   ORDER BY p.product_id, i.interest_id DESC`,
  [seller_id],
);

// Map results by product_id
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
```

---

## ReviewDAO Operations

### Get User Purchase History

```js
const [purchases] = await pool.execute(
  `SELECT p.product_id, p.title, p.price, p.img_url, p.create_time, p.seller_id,
          u.first_name AS seller_first, u.last_name AS seller_last, u.email AS seller_email
   FROM product p
   LEFT JOIN users u ON u.user_id = p.seller_id
   WHERE p.buyer_id = ? AND p.status = 'sold'
   ORDER BY p.create_time DESC`,
  [user_id],
);
```

### Get User Sale History

```js
const [sales] = await pool.execute(
  `SELECT p.product_id, p.title, p.price, p.img_url, p.create_time, p.buyer_id,
          u.first_name AS buyer_first, u.last_name AS buyer_last, u.email AS buyer_email
   FROM product p
   LEFT JOIN users u ON u.user_id = p.buyer_id
   WHERE p.seller_id = ? AND p.status = 'sold'
   ORDER BY p.create_time DESC`,
  [user_id],
);
```

### Add Review (buyer only, for sold products)

```js
// Verify product, seller, buyer, status
const [rows] = await pool.execute(
  "SELECT product_id, buyer_id, seller_id, status FROM product WHERE product_id = ?",
  [product_id],
);
const prod = rows && rows[0];
if (!prod) throw "Product not found";
if (String(prod.seller_id) !== String(seller_id)) throw "Seller mismatch";
if (prod.status !== "sold") throw "Product not sold yet";
if (String(prod.buyer_id) !== String(user_id)) throw "Only buyer can review";

// Validate rating
const ratingNum = Number(rating);
if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
  throw "Invalid rating";
}

// Insert review
await pool.execute(
  "INSERT INTO reviews (reviewer_id, seller_id, product_id, rating, comment) VALUES (?, ?, ?, ?, ?)",
  [user_id, seller_id, product_id, ratingNum, comment || null],
);
```

### Get Seller's Reviews

```js
const [rows] = await pool.execute(
  `SELECT r.review_id, r.reviewer_id, r.seller_id, r.product_id, r.rating, r.comment, r.create_time,
          u.first_name AS reviewer_first, u.last_name AS reviewer_last, u.email AS reviewer_email, u.avatar_url AS reviewer_avatar,
          p.title AS product_title, p.img_url AS product_img
   FROM reviews r
   LEFT JOIN users u ON u.user_id = r.reviewer_id
   LEFT JOIN product p ON p.product_id = r.product_id
   WHERE r.seller_id = ?
   ORDER BY r.create_time DESC`,
  [seller_id],
);
```

### Admin — Delete Review

```js
await pool.execute("DELETE FROM reviews WHERE review_id = ?", [review_id]);
```

---

## ReportDAO Operations

### Create Report (with attachments)

```js
// Process files
const files = req.files || [];
const attachments = files.map((f) => `/uploads/${f.filename}`);

// Try insert with attachments
try {
  await pool.execute(
    "INSERT INTO report (reporter_id, target_type, target_id, reason, attachments) VALUES (?, ?, ?, ?, ?)",
    [
      user_id,
      target_type,
      target_id,
      reason_text,
      attachments.length ? JSON.stringify(attachments) : null,
    ],
  );
} catch (e) {
  // Fallback: schema may not have attachments column
  await pool.execute(
    "INSERT INTO report (reporter_id, target_type, target_id, reason) VALUES (?, ?, ?, ?)",
    [user_id, target_type, target_id, reason_text],
  );
}
```

### Admin — List Reports (paginated)

```js
// Get total count
const [countRows] = await pool.execute("SELECT COUNT(*) AS total FROM report");
const total = countRows && countRows[0] && countRows[0].total;

// Detect column existence
const [colRows] = await pool.execute(
  "SHOW COLUMNS FROM report LIKE 'attachments'",
);
const hasAttachments = Array.isArray(colRows) && colRows.length > 0;

const [adminCols] = await pool.execute(
  "SHOW COLUMNS FROM report LIKE 'admin_note'",
);
const hasAdminCols = Array.isArray(adminCols) && adminCols.length > 0;

// Build SELECT clause
const attachmentsSelect = hasAttachments ? "r.attachments," : "";
const adminSelect = hasAdminCols
  ? "r.admin_note, r.reviewed_by, r.review_time,"
  : "";

const sql = `SELECT r.report_id, r.reporter_id, r.target_type, r.target_id, r.reason,
        ${attachmentsSelect} ${adminSelect} r.status, r.create_time,
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
```

### Admin — Update Report Status

```js
const allowed = ["pending", "reviewed", "rejected"];
if (!allowed.includes(status)) throw "Invalid status";

const adminNote = req.body && req.body.admin_note;
const reviewerId = req.auth && req.auth.user_id;

await pool.execute(
  "UPDATE report SET status = ?, admin_note = ?, reviewed_by = ?, review_time = CURRENT_TIMESTAMP WHERE report_id = ?",
  [status, adminNote || null, reviewerId || null, report_id],
);
```

---

## AdminDAO Operations

### Admin — Delete Product (with cleanup)

```js
// Get product image URL
const [rows] = await pool.execute(
  "SELECT img_url FROM product WHERE product_id = ?",
  [product_id],
);

// Delete file from disk
if (prod.img_url && prod.img_url.startsWith("/uploads/")) {
  const filePath = path.join(
    __dirname,
    "..",
    "public",
    prod.img_url.replace(/^\//, ""),
  );
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

// Delete from DB
await pool.execute("DELETE FROM product WHERE product_id = ?", [product_id]);
await pool.execute("DELETE FROM product_images WHERE product_id = ?", [
  product_id,
]);

// Delete related reports and their attachments
const [repRows] = await pool.execute(
  "SELECT report_id, attachments FROM report WHERE target_type = 'product' AND target_id = ?",
  [product_id],
);
if (repRows && repRows.length) {
  for (const r of repRows) {
    if (r.attachments) {
      let attachments = null;
      try {
        attachments = JSON.parse(r.attachments);
      } catch (e) {
        attachments = null;
      }
      if (Array.isArray(attachments)) {
        for (const a of attachments) {
          if (typeof a === "string" && a.startsWith("/uploads/")) {
            const fpath = path.join(
              __dirname,
              "..",
              "public",
              a.replace(/^\//, ""),
            );
            if (fs.existsSync(fpath)) fs.unlinkSync(fpath);
          }
        }
      }
    }
  }
  await pool.execute(
    "DELETE FROM report WHERE target_type = 'product' AND target_id = ?",
    [product_id],
  );
}
```

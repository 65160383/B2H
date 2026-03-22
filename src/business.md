# Business Logic Layer (BLL)

## Overview — บทบาทของ BLL

**Business Logic Layer** คือชั้นกลางที่ทำหน้าที่เป็น "สมอง" ของแอปพลิเคชัน โดยรวบรวมกฎเกณฑ์ เงื่อนไข และกระบวนการทางธุรกิจ (**Core Business Rules**) เอาไว้

### ความรับผิดชอบหลัก

| ส่วน               | รายละเอียด                                                                |
| ------------------ | ------------------------------------------------------------------------- |
| **ประมวลผลข้อมูล** | รับข้อมูลจาก Presentation Layer และประมวลผลก่อนส่งไปบันทึก                |
| **Validation**     | ตรวจสอบข้อมูลตามกฎเกณฑ์ทางธุรกิจ (ไม่ใช่เพียง SQL validation)             |
| **Business Rules** | บังคับใช้นโยบายและเงื่อนไขทางธุรกิจ (เช่น อีเมล domain, price validation) |
| **Data Transform** | แปลงและรแกองข้อมูลให้พร้อมส่งไปชั้น Data Access Layer                     |
| **Separation**     | แยกลอจิกธุรกิจออกจากตรรกะการนำเสนอ (UI) และการบันทึก (DB)                 |

### Architecture Layers

```
┌─────────────────────────────────────────────────┐
│      Presentation Layer (UI / Controllers)      │  ← req/res, HTTP handling
│  - HTTP request handling                         │
│  - Response formatting                           │
│  - User input reception                          │
└─────────────────────────────────────────────────┘
                      ▼ Data
┌─────────────────────────────────────────────────┐
│        Business Logic Layer (BLL/Services)      │  ← Core Business Rules
│  - Validation & Business Rules                   │
│  - Data Processing & Transformation              │
│  - Business Workflow & Orchestration             │
│  - Authorization & Constraints                   │
└─────────────────────────────────────────────────┘
                      ▼ SQL Query
┌─────────────────────────────────────────────────┐
│    Data Access Layer (DAO/Persistence)          │  ← Database Operations
│  - SQL queries                                   │
│  - Database transactions                         │
│  - Connection management                         │
└─────────────────────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────┐
│        Database Layer (MariaDB)                 │  ← Data Storage
│  - Tables & Indexes                              │
│  - Constraints & Relationships                   │
│  - Data Persistence                              │
└─────────────────────────────────────────────────┘
```

---

## Core Business Rules (กฎเกณฑ์ทางธุรกิจ)

### ผ่านการตรวจสอบอย่างเข้มงวด

1. **Email Validation** — ต้องเป็นโดเมน `@go.buu.ac.th` (University Domain constraint)
2. **Password Security** — Hash ด้วย bcrypt (salt rounds = 10) ก่อนบันทึก
3. **Account Status** — ต้องเป็น `active` เท่านั้นที่ใช้งานได้ (`banned` accounts ถูกปฏิเสธ)
4. **Product Price** — ต้องเป็นตัวเลขบวกเท่านั้น (≥ 0)
5. **Product Ownership** — เฉพาะเจ้าของสินค้า (seller_id) เท่านั้นที่สามารถแก้ไข/ลบได้
6. **Unique Constraints** — Email ต้องไม่ซ้ำในระบบ, Interest/Favorite ต้องไม่ซ้ำต่อสินค้านั้น

---

## Services Structure

## Services Structure

## AuthService — การจัดการการลงทะเบียนและเข้าสู่ระบบ

**วัตถุประสงค์**: ควบคุมการลงทะเบียน login, authentication เพื่อให้มั่นใจว่าเฉพาะผู้ใช้ที่ตรวจสอบแล้วเท่านั้นที่สามารถเข้าถึงระบบได้

**Business Rules ที่บังคับใช้**:

- ✅ อีเมลต้องเป็นโดเมน `@go.buu.ac.th` (University email only)
- ✅ Passwords ต้อง hash ด้วย bcrypt เก็บไว้อย่างปลอดภัย
- ✅ ตรวจจับ duplicate emails — ไม่อนุญาตให้ลงทะเบียนซ้ำ
- ✅ Verify password ตรงกัน — ป้องกัน unauthorized access
- ✅ Account status check — ป้องกัน banned users จากการเข้าใช้

### AuthService Functions

`isUniversityEmail(email)` — **Business Rule Validator**

- ตรวจสอบว่าอีเมลปลายท่าย (@domain) ตรงกับรายชื่อโดเมนมหาวิทยาลัย
- Core Business Rule: ยอมรับเฉพาะ email จากมหาวิทยาลัยเท่านั้น

`isUniversityEmail(email)` : ตรวจสอบโดเมนอีเมลมหาวิทยาลัย (business validation rule)

```js
function isUniversityEmail(email) {
  if (!email || typeof email !== "string") return false;
  const parts = UNIVERSITY_DOMAINS.split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const lc = email.toLowerCase();
  return parts.some((d) => lc.endsWith(`@${d}`));
}
```

`register(req, res)` — **Registration Business Logic**

**Business Logic Flow**:

1. **Validate Email & Password** — ตรวจสอบว่าได้ส่งทั้งสองค่ามา (Required Fields)
2. **Domain Check** — ใช้ `isUniversityEmail()` ตรวจ domain ต้องเป็น @go.buu.ac.th เท่านั้น
3. **Duplicate Check** — ค้นหาอีเมลในฐานข้อมูล หากมีอยู่แล้ว → ปฏิเสธการลงทะเบียน (Prevent duplicates)
4. **Password Hashing** — Hash password ด้วย bcrypt (10 salt rounds) เพื่อความปลอดภัย
5. **Create Account** — บันทึกผู้ใช้ใหม่ลงฐานข้อมูล
6. **Success Response** — ส่ง user_id ให้กับ Presentation Layer

**Business Rules**:

- ❌ ต้องมี email และ password
- ❌ Email ต้องเป็น domain มหาวิทยาลัย
- ❌ ห้ามอีเมลซ้ำในระบบ
- ✅ Password ต้องได้รับการ hash ก่อนบันทึก

async function register(req, res) {
const { email, password, first_name, last_name } = req.body || {};
if (!email || !password)
return res
.status(400)
.json({ success: false, message: "กรุณากรอกอีเมลและรหัสผ่าน" });
if (!isUniversityEmail(email))
return res.status(403).json({
success: false,
message: "ต้องใช้อีเมลของมหาวิทยาลัย (go.buu.ac.th) เท่านั้น",
});
try {
const [rows] = await pool.execute(
"SELECT user_id FROM users WHERE email = ?",
[email],
);
if (rows && rows[0])
return res
.status(400)
.json({ success: false, message: "อีเมลนี้มีบัญชีอยู่แล้ว" });
const hash = await bcrypt.hash(password, 10);
const [r] = await pool.execute(
"INSERT INTO users (email, password, first_name, last_name) VALUES (?, ?, ?, ?)",
[email, hash, first_name || null, last_name || null],
);
res.json({
success: true,
user_id: r.insertId,
message: "เพิ่มผู้ใช้สำเร็จ",
});
} catch (err) {
console.error("Register error", err);
res
.status(500)
.json({ success: false, message: "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์" });
}
}

```

`login(req, res)` — **Authentication Business Logic**

**Business Logic Flow**:
1. **Validate Input** — ตรวจสอบว่าได้ส่ง email และ password มา
2. **Search User** — ค้นหาผู้ใช้จากฐานข้อมูลด้วย email
3. **Password Validation** — ใช้ bcrypt.compare() เปรียบเทียบ password ที่ส่งมากับ hash ในฐานข้อมูล
4. **Account Status Check** — ตรวจสอบ status ต้องเป็น `active` ถ้า `banned` → ปฏิเสธ
5. **JWT Token Generation** — สร้าง JWT token สำหรับ session (expires in 1 day)
6. **Return User Info** — ส่ง token และข้อมูลผู้ใช้กลับไป

**Business Rules**:
- ❌ ต้องมี email และ password
- ❌ User ต้องมีอยู่ในฐานข้อมูล
- ❌ Password ต้องตรงกับ hash ที่บันทึก
- ❌ Account ต้องเป็น `active` (ห้าม banned accounts)
- ✅ JWT token มีอายุ 1 วัน


async function login(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password)
    return res
      .status(400)
      .json({ success: false, message: "กรุณากรอกอีเมลและรหัสผ่าน" });
  try {
    const [rows] = await pool.execute(
      "SELECT user_id, email, first_name, last_name, password, status FROM users WHERE email = ?",
      [email],
    );
    const user = rows && rows[0];
    if (!user || !user.password)
      return res.status(401).json({
        success: false,
        message: "ไม่พบบัญชีหรือยังไม่ได้ตั้งรหัสผ่าน",
      });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok)
      return res
        .status(401)
        .json({ success: false, message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
    if (user.status && user.status !== "active")
      return res.status(403).json({ success: false, message: "บัญชีถูกระงับ" });
    const fullName = [user.first_name, user.last_name]
      .filter(Boolean)
      .join(" ");
    const token = jwt.sign(
      { user_id: user.user_id, email: user.email },
      JWT_SECRET,
      { expiresIn: "1d" },
    );
    res.json({
      success: true,
      token,
      user: { user_id: user.user_id, email: user.email, name: fullName },
      message: "เข้าสู่ระบบสำเร็จ",
    });
  } catch (err) {
    console.error("Login error", err);
    res
      .status(500)
      .json({ success: false, message: "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์" });
  }
}
```

`universityAuth(req, res)` — **University SSO / Auto-Account Logic**

**Business Logic Flow**:

1. **Email Validation** — ตรวจสอบ email ต้องเป็น @go.buu.ac.th
2. **Find or Create User** — ค้นหา user ถ้ามีอยู่ → ใช้เลย, ถ้าไม่มี → สร้างบัญชีอัตโนมัติ
3. **Parse Name** — ดึงชื่อจากอีเมล (email prefix) หรือจากค่า `name` ที่ส่งมา
4. **Account Status Check** — ตรวจสอบ account ต้องเป็น `active`
5. **JWT Token Generation** — สร้าง JWT token สำหรับ session
6. **Return User Info** — ส่ง token และข้อมูลผู้ใช้กลับไป

**Business Rules**:

- ✅ University email only (@go.buu.ac.th)
- ✅ Auto-create account ถ้าผู้ใช้ยังไม่เคยลงทะเบียน (SSO integration)
- ❌ Account ต้องเป็น `active` ถ้า `banned` → ปฏิเสธ
- ✅ ไม่จำเป็นต้อง password (trust university domain)

async function universityAuth(req, res) {
const { email, name } = req.body || {};
if (!email)
return res.status(400).json({ success: false, message: "กรุณาระบุอีเมล" });
if (!isUniversityEmail(email))
return res.status(403).json({
success: false,
message: "ต้องใช้อีเมลของมหาวิทยาลัย (go.buu.ac.th) เท่านั้น",
});
try {
const [rows] = await pool.execute(
"SELECT user_id, email, first_name, last_name, role, status FROM users WHERE email = ?",
[email],
);
let user = rows && rows[0];
if (!user) {
const displayName = name || email.split("@")[0];
const parts = displayName.split(" ");
const firstName = parts.shift() || displayName;
const lastName = parts.length ? parts.join(" ") : null;
const [r] = await pool.execute(
"INSERT INTO users (first_name, last_name, email) VALUES (?, ?, ?)",
[firstName, lastName, email],
);
const insertId = r.insertId;
const [newRows] = await pool.execute(
"SELECT user_id, email, first_name, last_name, role, status FROM users WHERE user_id = ?",
[insertId],
);
user = newRows && newRows[0];
}
if (user && user.status && user.status !== "active") {
return res.status(403).json({ success: false, message: "บัญชีถูกระงับ" });
}
const fullName = [user.first_name, user.last_name]
.filter(Boolean)
.join(" ");
const token = jwt.sign(
{ user_id: user.user_id, email: user.email },
JWT_SECRET,
{ expiresIn: "1d" },
);
res.json({
success: true,
token,
user: { user_id: user.user_id, email: user.email, name: fullName },
message: "เข้าสู่ระบบสำเร็จ",
});
} catch (err) {
console.error("University auth error", err);
res
.status(500)
.json({ success: false, message: "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์" });
}
}

````

---

## UserService — การจัดการข้อมูลโปรไฟล์ผู้ใช้

**วัตถุประสงค์**: ดูแลข้อมูลโปรไฟล์ผู้ใช้ เช่น ชื่อ, ช่องทางติดต่อ, รูปโปรไฟล์ และการเข้าถึงข้อมูลส่วนตัว

**Business Rules ที่บังคับใช้**:
- ✅ ผู้ใช้ต้องเข้าสู่ระบบแล้ว (authentication required) — ทุก operation ต้องมี valid JWT token
- ✅ ผู้ใช้สามารถแก้ไขได้เฉพาะข้อมูลตัวเองเท่านั้น (authorization check)
- ✅ Account ต้องเป็น `active` ถึงจะเข้าถึงข้อมูลได้

### UserService Functions

`me(req, res)` — **Get Current User Profile**

**Business Logic Flow**:
1. **Verify Token** — ดึง JWT token จาก Authorization header
2. **Validate Token** — ใช้ jwt.verify() ตรวจสอบความถูกต้องของ token
3. **Check Active Status** — ตรวจสอบ user account ต้องเป็น `active` ถ้า `banned` → ปฏิเสธ
4. **Fetch User Data** — ดึงข้อมูล user ปัจจุบัน
5. **Return User Info** — ส่งเป็น `{ loggedIn: true, user: {...} }`

**Business Rules**:
- ❌ ต้องมี valid JWT token
- ❌ Token ต้องยังไม่หมดอายุ
- ❌ Account ต้องเป็น `active`
- ✅ ไม่ส่ง sensitive data เช่น password hash

`updateMe(req, res)` — **Update User Profile**

**Business Logic Flow**:
1. **Authenticate** — รับ user_id จาก JWT token
2. **Parse Name** — แยก first_name และ last_name จากค่า `name` ที่ส่งมา
3. **Validate Input** — ตรวจสอบข้อมูลที่ส่งมา
4. **Update Profile** — อัปเดต first_name, last_name, avatar_url, contact info
5. **Fetch Updated Data** — ดึงข้อมูลที่อัปเดตแล้ว
6. **Return Updated Profile** — ส่งข้อมูลใหม่กลับไป

**Business Rules**:
- ❌ ต้องเข้าสู่ระบบแล้ว
- ✅ ผู้ใช้สามารถแก้ไขเฉพาะ profile ของตัวเองได้
- ✅ Name ต้องแยกเป็น first_name (ชื่อจริง) และ last_name (นามสกุล)



`me(req, res)` : ดึงข้อมูลผู้ใช้ปัจจุบันจาก JWT token

```js
async function me(req, res) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer "))
    return res.json({ loggedIn: false });
  const token = auth.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const [rows] = await pool.execute(
      "SELECT user_id, first_name, last_name, email, role, status, avatar_url AS profile_image, contact_facebook, contact_line, contact_instagram FROM users WHERE user_id = ?",
      [payload.user_id],
    );
    const user = rows && rows[0];
    if (!user) return res.json({ loggedIn: false });
    if (user.status && user.status !== "active")
      return res.json({ loggedIn: false, message: "บัญชีถูกระงับ" });
    const fullName = [user.first_name, user.last_name]
      .filter(Boolean)
      .join(" ");
    user.name = fullName;
    return res.json({ loggedIn: true, user });
  } catch (err) {
    return res.json({ loggedIn: false });
  }
}
````

`updateMe(req, res)` : อัปเดตโปรไฟล์ผู้ใช้ (ชื่อ, ช่องทางติดต่อ)

```js
async function updateMe(req, res) {
  const userId = req.auth && req.auth.user_id;
  if (!userId)
    return res.status(401).json({ success: false, message: "ไม่พบผู้ใช้" });
  const {
    name,
    profile_image,
    contact_facebook,
    contact_line,
    contact_instagram,
  } = req.body || {};
  let firstName = null;
  let lastName = null;
  if (name && typeof name === "string") {
    const parts = name.trim().split(/\s+/);
    firstName = parts.shift() || null;
    lastName = parts.length ? parts.join(" ") : null;
  }
  try {
    await pool.execute(
      "UPDATE users SET first_name = ?, last_name = ?, avatar_url = ?, contact_facebook = ?, contact_line = ?, contact_instagram = ? WHERE user_id = ?",
      [
        firstName,
        lastName,
        profile_image || null,
        contact_facebook || null,
        contact_line || null,
        contact_instagram || null,
        userId,
      ],
    );
    const [rows] = await pool.execute(
      "SELECT user_id, first_name, last_name, email, role, avatar_url AS profile_image, contact_facebook, contact_line, contact_instagram FROM users WHERE user_id = ?",
      [userId],
    );
    const user = rows && rows[0];
    const fullName = [user.first_name, user.last_name]
      .filter(Boolean)
      .join(" ");
    user.name = fullName;
    res.json({ success: true, user });
  } catch (err) {
    console.error("Update profile error", err);
    res
      .status(500)
      .json({ success: false, message: "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์" });
  }
}
```

`uploadAvatar(req, res)` : อัปโหลดรูปโปรไฟล์ผ่าน multer, update `avatar_url` ใน DB

```js
async function uploadAvatar(req, res) {
  const userId = req.auth && req.auth.user_id;
  if (!userId)
    return res.status(401).json({ success: false, message: "ไม่พบผู้ใช้" });
  if (!req.file)
    return res
      .status(400)
      .json({ success: false, message: "กรุณาเลือกรูปโปรไฟล์" });
  const url = `/uploads/${req.file.filename}`;
  try {
    await pool.execute("UPDATE users SET avatar_url = ? WHERE user_id = ?", [
      url,
      userId,
    ]);
    const [rows] = await pool.execute(
      "SELECT user_id, first_name, last_name, email, role, avatar_url AS profile_image, contact_facebook, contact_line, contact_instagram FROM users WHERE user_id = ?",
      [userId],
    );
    const user = rows && rows[0];
    if (!user)
      return res.status(404).json({ success: false, message: "ไม่พบผู้ใช้" });
    const fullName = [user.first_name, user.last_name]
      .filter(Boolean)
      .join(" ");
    user.name = fullName;
    res.json({ success: true, user });
  } catch (err) {
    console.error("Upload avatar error", err);
    res
      .status(500)
      .json({ success: false, message: "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์" });
  }
}
```

`adminGetUsers(req, res)` : admin ดึงรายการผู้ใช้ทั้งหมด (ยกเว้น admin)

```js
async function adminGetUsers(req, res) {
  try {
    const [rows] = await pool.execute(
      "SELECT user_id, email, role, status, first_name, last_name, avatar_url, create_time FROM users WHERE role <> 'admin' ORDER BY create_time DESC",
    );
    return res.json({ success: true, users: rows });
  } catch (err) {
    console.error("adminGetUsers error", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}
```

---

## ProductService — การจัดการสินค้า

**วัตถุประสงค์**: ควบคุมวงจรชีวิตของสินค้า (create, read, update, delete) พร้อมตรวจสอบความเป็นเจ้าของและสถานะ

**Business Rules ที่บังคับใช้**:

- ✅ ผู้ใช้ต้องเข้าสู่ระบบเพื่อสร้าง/แก้ไข/ลบสินค้า
- ✅ ราคาสินค้าต้องเป็นตัวเลขบวก (≥ 0)
- ✅ เฉพาะเจ้าของสินค้า (seller_id) เท่านั้นที่สามารถแก้ไข/ลบ
- ✅ ซ่อนสินค้า `sold` ในรายการสินค้าทั้งหมดตามค่า default
- ✅ สินค้า status มี: `available`, `reserved`, `selling`, `sold`, `hidden`

### ProductService Functions

`listProducts(req, res)` — **Get Public Product List**

**Business Logic Flow**:

1. **Query Parameter Check** — ตรวจสอบ `show_sold` query parameter
2. **Status Filter** — ถ้าไม่มี `show_sold=1` → ซ่อนสินค้า `sold` (Default business rule)
3. **Fetch Data** — ดึงรายการเรียงตามวันที่ล่าสุด (pagination: LIMIT 100)
4. **Return Results** — ส่งรายการสินค้า

**Business Rules**:

- ✅ Default behavior: ซ่อนสินค้า sold จากรายการสินค้า (improve UX)
- ✅ Admin สามารถมองเห็นสินค้า sold ถ้า query `show_sold=1`

`getProduct(req, res)` — **Get Product Details with Seller Info**

**Business Logic Flow**:

1. **Fetch Product** — ดึงข้อมูลสินค้าพร้อม JOIN ข้อมูล seller
2. **Build Response** — จัดเตรียมข้อมูล (images array, seller name, etc.)
3. **Return Data** — ส่งรายละเอียดสินค้า

**Business Rules**:

- ✅ ต้อง JOIN ข้อมูล seller → ดึง email, ชื่อ, นามสกุล สำหรับแสดงข้อมูลผู้ขาย

`createProduct(req, res)` — **Create New Product**

**Business Logic Flow**:

1. **Authenticate** — รับ seller_id จาก JWT token
2. **Validate Inputs** — ตรวจสอบ title, price บังคับต้องมี
3. **Validate Price** — ตรวจสอบ price ต้องเป็นตัวเลขบวก
4. **Create Product** — บันทึกสินค้าใหม่ (default status = `available`)
5. **Handle Images** — บันทึก URL รูปภาพ (นำรูปแรกเป็น main image)
6. **Return Result** — ส่ง product_id และ image URLs

**Business Rules**:

- ❌ Title และ Price บังคับต้องมี
- ❌ Price ต้องเป็นตัวเลข ≥ 0
- ✅ Default status = `available`
- ✅ นำรูปแรกจากการอัพโหลดเป็น main image

`updateProduct(req, res)` — **Update Product (Ownership Check)**

**Business Logic Flow**:

1. **Authenticate** — รับ user_id จาก JWT token
2. **Ownership Check** — ดึง seller_id และเปรียบเทียบว่ากับ user_id ตรงกันไหม
3. **Authorize** — ถ้าไม่ใช่เจ้าของ → ส่ง 403 Forbidden
4. **Validate Price** — ถ้ามีการแก้ไข price ต้องตรวจสอบ ≥ 0
5. **Update Fields** — อัปเดต title, description, price, contact, category
6. **Update Images** — บันทึก URL รูปภาพใหม่ (ถ้ามี)
7. **Return Result** — ส่ง product_id และ image URLs

**Business Rules**:

- ❌ ต้องเข้าสู่ระบบ + เป็นเจ้าของสินค้า
- ❌ Price ต้องเป็นตัวเลข ≥ 0
- ✅ ห้ามแก้ไขสินค้าของผู้อื่น

`listProducts(req, res)` : ดึงรายการสินค้า (ซ่อนสินค้า sold ตามค่า default)

```js
async function listProducts(req, res) {
  try {
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
```

`getProduct(req, res)` : ดึงรายละเอียดสินค้า + ข้อมูลผู้ขาย (JOIN users)

```js
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
    res
      .status(500)
      .json({ success: false, message: "ข้อผิดพลาดของเซิร์ฟเวอร์" });
  }
}
```

`createProduct(req, res)` : สร้างสินค้า — validate input, insert ลง DB, บันทึก URL รูปภาพ

```js
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
```

`updateProduct(req, res)` : แก้ไขสินค้า — ตรวจสอบความเป็นเจ้าของ (seller_id), update fields + รูปภาพ

```js
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
```

`deleteProduct(req, res)` : ลบสินค้า — ตรวจสิทธิ์, ลบไฟล์รูปจาก disk, ลบแถวใน DB

```js
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
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
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
```

`updateProductStatus(req, res)` : เปลี่ยนสถานะสินค้า — ตรวจสิทธิ์ผู้ขาย, จัดการ buyer_id ตามกฎธุรกิจ

```js
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
    if (Number(prod.seller_id) !== Number(userId))
      return res.status(403).json({ success: false, message: "Forbidden" });
    let buyerIdVal = null;
    if (buyer_id !== undefined) {
      buyerIdVal = buyer_id;
    } else if (String(status) === "sold") {
      buyerIdVal = prod.buyer_id !== undefined ? prod.buyer_id : null;
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
```

`cancelSale(req, res)` : ยกเลิกการขาย — รีเซ็ตสถานะเป็น available, เคลียร์ buyer_id และ interests

```js
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
    await pool.execute(
      "UPDATE product SET status = 'available', buyer_id = NULL WHERE product_id = ?",
      [id],
    );
    try {
      await pool.execute("DELETE FROM interests WHERE product_id = ?", [id]);
    } catch (e) {
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
```

`getSellerProducts(req, res)` : ดึงสินค้าของผู้ขายพร้อมข้อมูลโปรไฟล์ผู้ขาย

```js
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
```

---

## InterestService / FavoriteService

### (from `controllers/productController.js`)

`getFavorites(req, res)` : ดึงรายการสินค้าที่ user ทำ favorite

```js
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
```

`toggleFavorite(req, res)` : เพิ่ม/ลบ favorite — insert ถ้าไม่มี, delete ถ้ามีอยู่แล้ว

```js
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
      await pool.execute("DELETE FROM favorites WHERE favorite_id = ?", [
        rows[0].favorite_id,
      ]);
      return res.json({ success: true, removed: true });
    }
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
```

`getInterests(req, res)` : ดึงรายการสินค้าที่ user แสดงความสนใจ

```js
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
```

`addInterest(req, res)` : เพิ่ม interest (ถ้ายังไม่มี ไม่ซ้ำ)

```js
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
```

`toggleInterest(req, res)` : สลับ interest — delete ถ้ามีอยู่, insert ถ้าไม่มี

```js
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
```

`getSellerInterested(req, res)` : ดึงรายชื่อผู้สนใจทุกคนในสินค้าของผู้ขาย จัดกลุ่มตามสินค้า

```js
async function getSellerInterested(req, res) {
  const sellerId = req.params.id;
  try {
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
```

---

## ReviewService

### (from `controllers/productController.js`)

`addReview(req, res)` : บันทึกรีวิว — ตรวจ buyer, validate rating 1–5, insert ลง reviews table

```js
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
```

`getSellerReviews(req, res)` : ดึงรีวิวทั้งหมดของผู้ขาย (JOIN users + product)

```js
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
```

`getUserHistory(req, res)` : ดึงประวัติซื้อและขายของ user ที่ล็อกอิน

```js
async function getUserHistory(req, res) {
  const userId = req.auth && req.auth.user_id;
  if (!userId)
    return res.status(401).json({ success: false, message: "ไม่พบผู้ใช้" });
  try {
    const [purchases] = await pool.execute(
      `SELECT p.product_id, p.title, p.price, p.img_url, p.create_time, p.seller_id,
              u.first_name AS seller_first, u.last_name AS seller_last, u.email AS seller_email
       FROM product p
       LEFT JOIN users u ON u.user_id = p.seller_id
       WHERE p.buyer_id = ? AND p.status = 'sold'
       ORDER BY p.create_time DESC`,
      [userId],
    );
    const [sales] = await pool.execute(
      `SELECT p.product_id, p.title, p.price, p.img_url, p.create_time, p.buyer_id,
              u.first_name AS buyer_first, u.last_name AS buyer_last, u.email AS buyer_email
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
```

---

## ReportService

### (from `controllers/productController.js`)

`createReport(req, res)` : บันทึก report — validate fields, จัดการ attachments, fallback insert ถ้าไม่มีคอลัมน์

```js
async function createReport(req, res) {
  const userId = req.auth && req.auth.user_id;
  if (!userId)
    return res.status(401).json({ success: false, message: "ไม่พบผู้ใช้" });
  try {
    const { target_type, target_id, reason } = req.body || {};
    if (!target_type || !target_id)
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });
    const reasonText = reason && String(reason).trim();
    if (!reasonText)
      return res
        .status(400)
        .json({ success: false, message: "โปรดระบุรายละเอียดการรายงาน" });
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
      // fallback: schema may not have attachments column
      try {
        await pool.execute(
          "INSERT INTO report (reporter_id, target_type, target_id, reason) VALUES (?, ?, ?, ?)",
          [userId, target_type, target_id, reasonText || null],
        );
        return res.json({ success: true });
      } catch (e2) {
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
```

`adminGetReports(req, res)` : admin ดึงรายการ report ทั้งหมด พร้อม pagination และตรวจ schema อัตโนมัติ

```js
async function adminGetReports(req, res) {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "10")));
    const page = Math.max(1, parseInt(req.query.page || "1"));
    const offset = (page - 1) * limit;
    const [countRows] = await pool.execute(
      "SELECT COUNT(*) AS total FROM report",
    );
    const total = (countRows && countRows[0] && countRows[0].total) || 0;
    const [colRows] = await pool.execute(
      "SHOW COLUMNS FROM report LIKE 'attachments'",
    );
    const hasAttachments = Array.isArray(colRows) && colRows.length > 0;
    const safeOffset = Number(offset) || 0;
    const safeLimit = Number(limit) || 10;
    const attachmentsSelect = hasAttachments ? "r.attachments," : "";
    const [adminColRows] = await pool.execute(
      "SHOW COLUMNS FROM report LIKE 'admin_note'",
    );
    const hasAdminCols = Array.isArray(adminColRows) && adminColRows.length > 0;
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
    res.json({ success: true, reports: rows, total, page, limit });
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
```

`updateReportStatus(req, res)` : admin อัปเดตสถานะ report + บันทึก admin_note, reviewer, review_time

```js
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
```

---

## AdminService

### (from `controllers/productController.js` + `controllers/authController.js`)

`adminDeleteProduct(req, res)` : admin ลบสินค้า — ลบไฟล์รูป, ลบ DB rows, ลบ reports ที่เชื่อมโยง

```js
async function adminDeleteProduct(req, res) {
  const id = req.params.id;
  if (!id)
    return res
      .status(400)
      .json({ success: false, message: "Missing product id" });
  try {
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
                    /* ignore */
                  }
                }
              }
            }
          } catch (e) {
            /* ignore */
          }
        }
        try {
          await pool.execute(
            "DELETE FROM report WHERE target_type = 'product' AND target_id = ?",
            [id],
          );
        } catch (e) {
          /* ignore */
        }
      }
    } catch (e) {
      console.warn("Failed to cleanup reports for product", id, e && e.message);
    }
    res.json({ success: true });
  } catch (err) {
    console.error("Admin delete product error", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}
```

`adminSetUserStatus(req, res)` : admin เปลี่ยนสถานะ user (suspend → banned / activate → active)

```js
async function adminSetUserStatus(req, res) {
  const id = req.params.id;
  const { action } = req.body || {};
  if (!id || !action)
    return res.status(400).json({ success: false, message: "Missing fields" });
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
```

`adminDeleteReview(req, res)` : admin ลบ review ออกจาก DB

```js
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
```

---

## 📌 Business Logic Layer Summary

### BLL เป็น "สมอง" ของแอปพลิเคชัน 🧠

**Business Logic Layer (BLL)** เป็นชั้นกลางที่สำคัญที่สุด โดยทำหน้าที่ดังนี้:

1. **Validator & Gatekeeper** — ตรวจสอบและยืนยันทุกข้อมูลก่อนส่งไปเก็บในฐานข้อมูล
2. **Rule Enforcer** — บังคับใช้กฎเกณฑ์และเงื่อนไขทางธุรกิจ
3. **Authorization Controller** — ตรวจสิทธิ์และควบคุมการเข้าถึง (ownership check, role-based access)
4. **Data Transformer** — เปลี่ยนรูปแบบ & จัดเตรียมข้อมูลสำหรับ client
5. **State Manager** — จัดการการเปลี่ยนแปลงสถานะ (status transitions, workflow management)

### 🏗️ Architecture Layers Map (ซ้ำ)

```
┌─────────────────────────────────────────┐
│     Presentation Layer (UI/HTTP)        │
│   - HTTP Requests/Responses             │
│   - JSON Parsing & Formatting           │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│    Business Logic Layer (BLL) ⭐         │
│    - Validation                         │
│    - Business Rules                     │
│    - Authorization/Permission Checks    │
│    - Data Transformation                │
│    - State Management                   │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│   Data Access Layer (DAO/Repository)    │
│   - SQL Queries                         │
│   - Database Operations                 │
│   - Connection Pool Management          │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│    Database Layer (MariaDB 10.4.32)     │
│    - Tables & Relationships             │
│    - Data Persistence                   │
└─────────────────────────────────────────┘
```

### 🔑 Key Violations that BLL Prevents

**ถ้าไม่มี BLL → ข้อมูลเสีย + ระบบหัก:**

| Issue                                                 | Business Logic Prevention                        | Code Location                          |
| ----------------------------------------------------- | ------------------------------------------------ | -------------------------------------- |
| ❌ User สร้าง account ด้วย email ไม่ใช่ @go.buu.ac.th | ✅ `isUniversityEmail()` validates domain        | `AuthService.register()`               |
| ❌ Password store plain text (ไม่ hash)               | ✅ `bcryptjs.hash()` 10 salt rounds              | `AuthService.register()`               |
| ❌ User แก้ไขข้อมูลผู้อื่น                            | ✅ `userId === requestedUserId` check            | `UserService.updateMe()`               |
| ❌ User แก้ไข/ลบสินค้าของผู้ขายอื่น                   | ✅ Ownership verification `seller_id === userId` | `ProductService.updateProduct()`       |
| ❌ ราคาเป็นค่าลบ (negative price)                     | ✅ `price >= 0` validation                       | `ProductService.createProduct()`       |
| ❌ Status transitions ผิด (e.g., sold → available)    | ✅ Controlled state transitions                  | `ProductService.updateProductStatus()` |
| ❌ Buyer ที่ไม่ได้ซื้อสินค้า สามารถเขียน review       | ✅ `product.buyer_id === userId`                 | `ReviewService.addReview()`            |
| ❌ User ปลายลงทะเบียนด้วย email ซ้ำ                   | ✅ Duplicate email check                         | `AuthService.register()`               |
| ❌ Sold products ยังปรากฏในรายการสินค้า               | ✅ Status filter `status <> 'sold'`              | `ProductService.listProducts()`        |

### 📊 Data Flow Example: Complete Product Purchase Workflow

```
1. 👤 User A (Buyer) แสดงความสนใจสินค้า
   ↓
2. 🧠 BLL checks:
   ✅ Is User A authenticated?
   ✅ Does product exist?
   ✅ Is product status "available"?
   ↓
3. 💾 Insert INTO interests (user_id, product_id)
   ↓
4. 👤 User B (Seller) ยืนยันการขายให้ User A
   ↓
5. 🧠 BLL checks:
   ✅ Is User B the seller (seller_id)?
   ✅ Does interested user exist?
   ↓
6. 💾 UPDATE product SET status='sold', buyer_id=User_A_ID
   ↓
7. 👤 User A writes review after purchase
   ↓
8. 🧠 BLL checks:
   ✅ Is User A authenticated?
   ✅ Is product status 'sold'?
   ✅ Is User A the buyer (buyer_id)?
   ✅ Is rating 1-5?
   ↓
9. 💾 INSERT INTO reviews (reviewer_id, seller_id, rating, comment)
   ↓
10. ✨ Review published for seller profile
```

### 🎯 Service Interactions (Services work together as BLL)

```
┌─────────────┐
│ AuthService │  ← Entry point
│ - register()│  ← Validates email, hashes password
│ - login()   │  ← Creates JWT token
└──────┬──────┘
       │
       ├─→ ┌──────────────┐
       │   │ UserService  │
       │   │ - me()       │  ← Current user context
       │   │ - updateMe() │  ← Profile management
       │   └──────┬───────┘
       │          │
       │          ├─→ ┌─────────────────┐
       │          │   │ProductService   │
       │          │   │ - listProducts()│  ← Browse
       │          │   │ - getProduct()  │  ← View details
       └──────┬───┼─→ │ - createProduct │  ← Create listings
              │   │   │ - deleteProduct │  ← Manage
              │   └─→ └────────┬────────┘
              │                │
              │                ├─→ ┌──────────────────┐
              │                │   │InterestService   │
              │                │   │ - toggleFavorite │  ← Mark favorite
              │                │   │ - toggleInterest │  ← Show interest
              │                │   └──────────────────┘
              │                │
              │                ├─→ ┌──────────────────┐
              │                │   │ReviewService     │
              │                │   │ - addReview()    │  ← Rate seller
              │                │   │ - getReviews()   │  ← View ratings
              │                │   └──────────────────┘
              │                │
              │                └─→ ┌──────────────────┐
              │                    │ReportService     │
              │                    │ - createReport() │  ← Report abuse
              │                    │ - adminGetReports│  ← Manual review
              │                    └──────────────────┘
              │
              └─→ ┌─────────────────────┐
                  │   AdminService      │
                  │ - adminGetUsers()   │  ← Manage users
                  │ - adminDeleteProduct│  ← Moderate content
                  │ - adminSetStatus()  │  ← Suspend accounts
                  └─────────────────────┘
```

### ✅ Checklist: What BLL Must Always Do

**ทุกครั้งที่ request เข้ามา BLL ต้อง:**

1. ✅ **Authenticate** — ตรวจสอบ JWT token ว่า valid หรือไม่
2. ✅ **Authorize** — ตรวจสอบว่า user มีสิทธิ์ทำงานนี้หรือไม่ (role/ownership)
3. ✅ **Validate Input** — ตรวจสอบ input data (type, format, length, range)
4. ✅ **Check Business Rules** — ตรวจสอบกฎธุรกิจ (status, relationships, constraints)
5. ✅ **Execute Operation** — ทำงาน (query database)
6. ✅ **Handle Errors** — catch errors & ส่ง meaningful error message
7. ✅ **Transform Output** — เตรียมข้อมูล response (ซ่อน sensitive fields)
8. ✅ **Cleanup** — ลบไฟล์เก่า, clear cache, update related data

### 📝 Example: BLL Checks in Action

**Request: Update Product**

```js
async function updateProduct(req, res) {
  // 1️⃣ AUTHENTICATE (JWT token)
  const userId = req.auth && req.auth.user_id;
  if (!userId) return res.status(401).json({ ... });

  // 2️⃣ AUTHORIZE (ownership check)
  const [rows] = await pool.execute(
    "SELECT seller_id FROM product WHERE product_id = ?", [id]
  );
  if (Number(rows[0].seller_id) !== Number(userId))
    return res.status(403).json({ success: false, message: "Forbidden" });

  // 3️⃣ VALIDATE INPUT (price, title, etc)
  const priceNum = Number(req.body.price);
  if (priceNum < 0) return res.status(400).json({ ... });

  // 4️⃣ CHECK BUSINESS RULES (can modify if status is available)
  // (implicit: only available products can be edited)

  // 5️⃣ EXECUTE (update database)
  await pool.execute("UPDATE product SET ... WHERE product_id = ?", [...]);

  // 6️⃣ TRANSFORM OUTPUT (send updated data)
  res.json({ success: true, product_id: id, images: [...] });
}
```

### 🚀 Conclusion: Why BLL Matters

**Without proper BLL:**

- Data inconsistencies (negative prices, duplicate emails)
- Security vulnerabilities (user can edit others' data)
- Business rule violations (sold products still in listings)
- Hard to maintain (validation logic scattered everywhere)

**With strong BLL** (like B2H's design):

- ✅ Consistent data (all rules in one place)
- ✅ Secure (authorization checks everywhere)
- ✅ Maintainable (centralized business logic)
- ✅ Scalable (easy to add new rules)

**BLL = "สมอง" ของแอปพลิเคชัน** ที่ดูแลให้ทั้งระบบทำงานถูกต้องตามกฎธุรกิจ ✨

```

```

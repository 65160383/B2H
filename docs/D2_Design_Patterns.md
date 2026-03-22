# D2: Design Patterns (B2H)

เอกสารนี้สรุป Design Patterns ที่พบในโค้ดจริงของระบบ B2H พร้อมเหตุผลในการเลือกใช้ และตัวอย่างโค้ดอ้างอิง

---

## 1) Singleton Pattern

**พบที่:** `config/db.js`  
**เหตุผลที่ใช้:**
- ระบบต้องการใช้ connection pool เดียวร่วมกันทั้งแอป เพื่อลด overhead ของการสร้าง connection ซ้ำ
- ป้องกันการกระจายการตั้งค่า DB หลายจุดและทำให้การจัดการทรัพยากรง่ายขึ้น

**ตัวอย่างโค้ด:**
```js
const mysql = require('mysql2/promise');

const db = {
	host: 'localhost',
	user: 'root',
	password: '',
	database: 'b2h',
	port: 3306,
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0,
};

const pool = mysql.createPool(db);

module.exports = { pool };
```

**ผลลัพธ์เชิงสถาปัตยกรรม:**
- ทุก controller/middleware ใช้ `pool` ตัวเดียวกันผ่าน `require("../config/db")`
- สอดคล้องกับแนวคิด shared resource ใน persistence layer

---

## 2) Factory Method Pattern

**พบที่:** `routes/authRoutes.js`, `routes/productRoutes.js`, `config/db.js`  
**เหตุผลที่ใช้:**
- ใช้ฟังก์ชัน factory จาก framework/library เพื่อสร้าง object ที่ config ได้ เช่น Router, Upload Handler, DB Pool
- ลดความซับซ้อนของการประกอบ object ด้วยตนเอง

**ตัวอย่างโค้ด:**
```js
const express = require("express");
const router = express.Router();

const multer = require("multer");
const productStorage = multer.diskStorage({
	destination: (req, file, cb) => cb(null, path.join(__dirname, "../public/uploads")),
	filename: (req, file, cb) =>
		cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`),
});
const productUpload = multer({ storage: productStorage });
```

และ

```js
const pool = mysql.createPool(db);
```

**ผลลัพธ์เชิงสถาปัตยกรรม:**
- โค้ดตั้งค่าแยกจากโค้ดใช้งาน (construction vs usage)
- เพิ่มความยืดหยุ่นในการเปลี่ยน config โดยไม่กระทบ logic หลัก

---

## 3) Observer Pattern (Event-Driven via Express Request Lifecycle)

**พบที่:** การผูก route handlers และ middleware ใน `routes/*.js` และ `app.js`  
**เหตุผลที่ใช้:**
- Express ทำงานแบบ event-driven: เมื่อมี HTTP request เข้ามาตามเงื่อนไข route จะเรียก handlers ที่ลงทะเบียนไว้
- handlers จึงทำหน้าที่คล้าย observers ที่รอฟังเหตุการณ์ตาม path/method

**ตัวอย่างโค้ด:**
```js
router.get("/api/products", listProducts);
router.post(
	"/api/products",
	authenticateJWT,
	productUpload.array("images", 5),
	createProduct
);
```

```js
app.use("/", authRoutes);
app.use("/", productRoutes);
```

**ผลลัพธ์เชิงสถาปัตยกรรม:**
- แยกผู้รับผิดชอบการตอบสนอง event เป็นส่วนย่อยตาม feature
- เพิ่มการขยายระบบโดยเพิ่ม observer (handler/middleware) ใหม่ได้ง่าย

---

## 4) Chain of Responsibility Pattern (Middleware Pipeline)

**พบที่:** `routes/productRoutes.js`, `routes/authRoutes.js`, `middlewares/auth.js`  
**เหตุผลที่ใช้:**
- คำขอหนึ่งรายการถูกส่งผ่าน chain ของ middleware ทีละตัว
- แต่ละตัวรับผิดชอบงานเฉพาะ เช่น ยืนยันตัวตน ตรวจ role จัดการไฟล์ ก่อนถึง business handler

**ตัวอย่างโค้ด:**
```js
router.get(
	"/api/admin/reports",
	authenticateJWT,
	requireRole("admin"),
	adminGetReports
);
```

```js
function requireRole(role) {
	return async (req, res, next) => {
		// validate role
		if (role && req.user.role !== role)
			return res.status(403).json({ success: false, message: "Insufficient role" });
		return next();
	};
}
```

**ผลลัพธ์เชิงสถาปัตยกรรม:**
- ลดการเขียน auth/authorization ซ้ำในทุก controller
- รองรับการ compose policy ตามแต่ละ endpoint ได้ชัดเจน

---

## 5) Strategy Pattern (Parameterized Behavior)

**พบที่:** `middlewares/auth.js`, `controllers/productController.js`  
**เหตุผลที่ใช้:**
- เปลี่ยนพฤติกรรมของ logic ได้จาก parameter หรือ context โดยไม่ต้องแก้โครงสร้างหลัก
- ทำให้รองรับหลาย policy/flow ภายใต้ interface เดียวกัน

**ตัวอย่างโค้ด:**
```js
function requireRole(role) {
	return async (req, res, next) => {
		if (role && req.user.role !== role)
			return res.status(403).json({ success: false, message: "Insufficient role" });
		return next();
	};
}

// ใช้งานด้วย strategy ต่างกัน
requireRole("admin");
```

```js
const showSold = req.query && (req.query.show_sold === "1" || String(req.query.show_sold).toLowerCase() === "true");
const sql = showSold
	? "SELECT ... FROM product ..."
	: "SELECT ... FROM product WHERE (status IS NULL OR status <> 'sold') ...";
```

**ผลลัพธ์เชิงสถาปัตยกรรม:**
- ปรับ policy ตามบทบาทผู้ใช้และ query option ได้ยืดหยุ่น
- ลดการแตก branch กระจัดกระจายหลายไฟล์

---

## สรุป

ระบบ B2H มีการใช้ Design Patterns อย่างน้อย 5 แบบที่เห็นได้ชัดจากโค้ดจริง ได้แก่:
1. Singleton
2. Factory Method
3. Observer (event-driven routing)
4. Chain of Responsibility (middleware)
5. Strategy

Patterns เหล่านี้ช่วยให้ระบบ maintainable, extensible และแยกความรับผิดชอบของแต่ละ layer ได้ดีขึ้นตามเป้าหมายของ D2.

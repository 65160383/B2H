# Cross-Cutting Concerns (ความกังวลที่ตัดขวาง)

## Overview — บทบาทของ Cross-Cutting Concerns

**Cross-Cutting Concerns** คือ **ความกังวล** หรือ **ฟังก์ชันที่จำเป็น** ซึ่ง "**ตัดขวาง**" (Cross-cut) ไปทั่วทุกส่วนของระบบ

### ความหมาย

> **Cross-Cutting Concerns** = Functionality ที่ไม่ได้เป็นส่วนของ Business Logic แต่ต้องมีในทุก layer และทุก operation
>
> ตัวอย่าง: Authentication, Logging, Error Handling, Validation, Security Headers เป็นต้น

### Visual Concept

```
┌─────────────┬─────────────┬─────────────┐
│  AuthRoute  │ ProductRoute│ ReviewRoute │  ← Routes Layer
├─────────────┼─────────────┼─────────────┤
│  Register   │  Create     │  AddReview  │  ← Controllers Layer
├─────────────┼─────────────┼─────────────┤
│  Validation │ Validation  │ Validation  │  ← BLL Layer
│  Auth Check │ Auth Check  │ Auth Check  │
├─────────────┼─────────────┼─────────────┤
│   Log       │   Log       │   Log       │  ← Logging (Cross-cutting!)
│   Error H.  │   Error H.  │   Error H.  │  ← Error Handling (Cross-cutting!)
└─────────────┴─────────────┴─────────────┘
      ↓             ↓             ↓
      └─────────────┴─────────────┘
              Database

=== Cross-cutting Concerns ===
- Authentication Middleware  ━━━━━━━━━━━━━━━━━━━━ ✅ ทะลุผ่านทั้งระบบ
- Error Handling Middleware  ━━━━━━━━━━━━━━━━━━━━ ✅ ทะลุผ่านทั้งระบบ
- Logging Middleware        ━━━━━━━━━━━━━━━━━━━━ ✅ ทะลุผ่านทั้งระบบ
- CORS Headers             ━━━━━━━━━━━━━━━━━━━━ ✅ ทะลุผ่านทั้งระบบ
```

---

## Cross-Cutting Concerns in B2H

### 📋 รายการ Concerns

| Concern                         | ประเภท       | Scope                 | Implementation       |
| ------------------------------- | ------------ | --------------------- | -------------------- |
| **Authentication**              | Security     | ทุก protected request | JWT Middleware       |
| **Authorization**               | Security     | ทุก resource access   | Role/Ownership check |
| **Logging**                     | Monitoring   | ทุก operation         | console.log, logger  |
| **Error Handling**              | Resilience   | ทุก try-catch         | consistent response  |
| **Input Validation**            | Data Quality | ทุก input field       | schema validation    |
| **CORS & Headers**              | Security     | ทุก HTTP response     | security middleware  |
| **Rate Limiting**               | Scalability  | ทุก endpoint          | limiter middleware   |
| **Request/Response Formatting** | Integration  | ทุก API call          | JSON serialization   |

---

## Pattern 1: Authentication Middleware ✅

### ตัวอย่าง: authMiddleware

```js
// middlewares/auth.js

const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Authentication Middleware — ตรวจสอบ JWT token
 * Cross-cutting concern: ทุก protected route ต้องผ่านนี้
 */
async function authMiddleware(req, res, next) {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "ต้องเข้าสู่ระบบก่อน",
      });
    }

    const token = auth.split(" ")[1];
    const payload = jwt.verify(token, JWT_SECRET);

    // ✅ Attach user info to request
    req.auth = {
      user_id: payload.user_id,
      email: payload.email,
    };

    next(); // ให้ request ไปต่อ
  } catch (err) {
    console.error("Auth middleware error:", err.message);
    return res.status(401).json({
      success: false,
      message: "Token ไม่ถูกต้องหรือหมดอายุ",
    });
  }
}

module.exports = authMiddleware;
```

### ใช้งาน: Protected Routes

```js
// routes/productRoutes.js

const router = require("express").Router();
const authMiddleware = require("../middlewares/auth");
const {
  createProduct,
  updateProduct,
} = require("../controllers/productController");

// Cross-cutting: authMiddleware ตัดขวางทุก request
router.post("/products", authMiddleware, createProduct);
router.put("/products/:id", authMiddleware, updateProduct);

module.exports = router;
```

---

## Pattern 2: Error Handling Middleware 🛡️

### ตัวอย่าง: Global Error Handler

```js
// middlewares/errorHandler.js

/**
 * Global Error Handler — จับทุก error หลังจากผ่าน routes
 * Cross-cutting concern: ทุก error ต้องผ่านนี้
 */
function errorHandler(err, req, res, next) {
  console.error("Error caught by error handler:", err);

  // Default error response
  let statusCode = 500;
  let message = "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์";
  let errorCode = "INTERNAL_SERVER_ERROR";

  // Handle specific error types
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = "ข้อมูลที่ส่งมาไม่ถูกต้อง";
    errorCode = "VALIDATION_ERROR";
  } else if (err.name === "UnauthorizedError") {
    statusCode = 401;
    message = "ต้องเข้าสู่ระบบก่อน";
    errorCode = "UNAUTHORIZED";
  } else if (err.status === 403) {
    statusCode = 403;
    message = "คุณไม่มีสิทธิ์เข้าถึง";
    errorCode = "FORBIDDEN";
  } else if (err.status === 404) {
    statusCode = 404;
    message = "ไม่พบข้อมูล";
    errorCode = "NOT_FOUND";
  }

  // Send consistent error response
  res.status(statusCode).json({
    success: false,
    message,
    errorCode,
    timestamp: new Date().toISOString(),
    // Development only:
    ...(process.env.NODE_ENV === "development" && {
      error: err.message,
      stack: err.stack,
    }),
  });
}

module.exports = errorHandler;
```

### ใช้งาน: Server Setup

```js
// server.js

const express = require("express");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/products", require("./routes/productRoutes"));

// ⚠️ Must be LAST — catches all errors from routes above
app.use(errorHandler);

app.listen(3000);
```

---

## Pattern 3: Logging Middleware 📝

### ตัวอย่าง: Request/Response Logger

```js
// middlewares/logger.js

/**
 * Logging Middleware — บันทึกทุก request/response
 * Cross-cutting concern: ทุก HTTP operation
 */
function requestLogger(req, res, next) {
  const startTime = Date.now();

  // Log request
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log("  Headers:", {
    "content-type": req.get("content-type"),
    authorization: req.get("authorization") ? "***" : "none",
  });
  console.log("  Body:", req.body);

  // Log response
  const originalJson = res.json;
  res.json = function (data) {
    const duration = Date.now() - startTime;
    console.log(
      `[${new Date().toISOString()}] Response ${res.statusCode} in ${duration}ms`,
    );
    console.log("  Data:", data);

    return originalJson.call(this, data);
  };

  next();
}

module.exports = requestLogger;
```

### ใช้งาน

```js
// server.js

const requestLogger = require("./middlewares/logger");

app.use(requestLogger); // ตัดขวางทุก request

// ทุก operation จะบันทึก log อัตโนมัติ
```

---

## Pattern 4: Authorization Middleware 🔐

### ตัวอย่าง: Admin-Only Check

```js
// middlewares/auth.js (extended)

/**
 * Admin Authorization Middleware
 * Cross-cutting concern: ทุก admin endpoint ต้องผ่านนี้
 */
async function requireAdmin(req, res, next) {
  try {
    // authMiddleware ต้องทำงาน ก่อนนี้แล้ว
    if (!req.auth) {
      return res.status(401).json({
        success: false,
        message: "ต้องเข้าสู่ระบบก่อน",
      });
    }

    // Check user role
    const [rows] = await pool.execute(
      "SELECT role FROM users WHERE user_id = ?",
      [req.auth.user_id],
    );

    const user = rows?.[0];
    if (!user || user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "เฉพาะ admin เท่านั้น",
      });
    }

    next();
  } catch (err) {
    console.error("Admin check error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}

module.exports = { authMiddleware, requireAdmin };
```

### ใช้งาน: Admin Routes

```js
// routes/adminRoutes.js

const { requireAdmin } = require("../middlewares/auth");

// Cross-cutting: requireAdmin ตัดขวาง admin endpoints
router.get("/admin/users", requireAdmin, adminGetUsers);
router.get("/admin/reports", requireAdmin, adminGetReports);
router.put("/admin/users/:id/status", requireAdmin, adminSetUserStatus);
```

---

## Pattern 5: Input Validation Middleware ✔️

### ตัวอย่าง: Schema Validation

```js
// middlewares/validate.js

/**
 * Schema Validation Middleware
 * Cross-cutting concern: ทุก input ต้องผ่าน validation
 */
function validateSchema(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((d) => ({
        field: d.path.join("."),
        message: d.message,
      }));

      return res.status(400).json({
        success: false,
        message: "ข้อมูลที่ส่งมาไม่ถูกต้อง",
        errors: details,
      });
    }

    // Replace req.body with validated data
    req.body = value;
    next();
  };
}

// Define schemas
const Joi = require("joi");

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  first_name: Joi.string().optional(),
  last_name: Joi.string().optional(),
});

const createProductSchema = Joi.object({
  title: Joi.string().min(3).max(100).required(),
  description: Joi.string().max(500).optional(),
  price: Joi.number().min(0).required(),
  category: Joi.string().optional(),
});

module.exports = {
  validateSchema,
  registerSchema,
  createProductSchema,
};
```

### ใช้งาน: Protected Endpoints

```js
// routes/authRoutes.js

const { validateSchema, registerSchema } = require("../middlewares/validate");

// Cross-cutting: validateSchema ตัดขวาง input validation
router.post("/register", validateSchema(registerSchema), register);
```

---

## Pattern 6: Security Headers Middleware 🛡️

### ตัวอย่าง: Security Headers

```js
// middlewares/security.js

/**
 * Security Headers Middleware
 * Cross-cutting concern: ทุก HTTP response ต้องมี security headers
 */
function securityHeaders(req, res, next) {
  // Prevent clickjacking
  res.setHeader("X-Frame-Options", "DENY");

  // Prevent MIME sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Enable XSS protection
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Content Security Policy
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline'",
  );

  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", process.env.FRONTEND_URL || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");

  // HTTPS enforcement
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains",
  );

  next();
}

module.exports = securityHeaders;
```

### ใช้งาน

```js
// server.js

const securityHeaders = require("./middlewares/security");

app.use(securityHeaders); // ตัดขวางทุก response
```

---

## Pattern 7: Request/Response Formatting ✨

### ตัวอย่าง: Consistent Response Format

```js
// middlewares/responseFormatter.js

/**
 * Response Formatter Middleware
 * Cross-cutting concern: ทุก response ต้องมีรูปแบบเดียวกัน
 */
function responseFormatter(req, res, next) {
  // Override res.json to add metadata
  const originalJson = res.json;

  res.json = function (data) {
    const response = {
      success: data.success !== undefined ? data.success : true,
      data: data.data || data,
      message: data.message || null,
      timestamp: new Date().toISOString(),
      path: req.path,
    };

    return originalJson.call(this, response);
  };

  next();
}

module.exports = responseFormatter;
```

---

## 🏗️ Complete Middleware Stack (Server Setup)

### server.js

```js
const express = require("express");
const app = express();

// Built-in middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== Cross-Cutting Concerns (ตัดขวางทั่วระบบ) =====

// 1. Security Headers (ต้องมาก่อน routes)
const securityHeaders = require("./middlewares/security");
app.use(securityHeaders);

// 2. Request Logging
const requestLogger = require("./middlewares/logger");
app.use(requestLogger);

// 3. Response Formatting
const responseFormatter = require("./middlewares/responseFormatter");
app.use(responseFormatter);

// ===== Routes =====
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));

// ===== Error Handling (ต้องมาหลังสุด!) =====
const errorHandler = require("./middlewares/errorHandler");
app.use(errorHandler);

app.listen(3000, () => console.log("Server running on port 3000"));
```

---

## 📊 Cross-Cutting Concerns Execution Order

```
HTTP Request from Client
    ↓
1️⃣ Security Headers Middleware ━━━ Set CORS, CSP, etc.
    ↓
2️⃣ Request Logger Middleware ━━━━━ Log incoming request
    ↓
3️⃣ JSON Body Parser ━━━━━━━━━━━━ Parse JSON body
    ↓
4️⃣ Response Formatter ━━━━━━━━━━ Prepare response wrapper
    ↓
5️⃣ Route Matching ━━━━━━━━━━━━━━ Find correct handler
    ↓
6️⃣ Auth Middleware (if protected) ━ Verify JWT token
    ↓
7️⃣ Admin Check (if admin-only) ━━━ Check role
    ↓
8️⃣ Validation Middleware ━━━━━━━━ Validate input schema
    ↓
9️⃣ Controller Handler ━━━━━━━━━━━ Process request
    ↓
🔟 BLL Service ━━━━━━━━━━━━━━━━ Business logic
    ↓
1️⃣1️⃣ Database Query ━━━━━━━━━━━━ Persist/fetch data
    ↓
1️⃣2️⃣ Response Formatter ━━━━━━━━ Format as JSON
    ↓
1️⃣3️⃣ HTTP Response ━━━━━━━━━━━━ Send to client
    ↓
1️⃣4️⃣ Error Handler (if error) ━━━ Catch & format error
    ↓
Client receives formatted response
```

---

## 🎯 Benefits of Cross-Cutting Concerns

| Benefit                         | ตัวอย่าง                                              |
| ------------------------------- | ----------------------------------------------------- |
| **DRY (Don't Repeat Yourself)** | Write auth logic once, use everywhere                 |
| **Consistency**                 | All responses have same format                        |
| **Maintainability**             | Change logging logic in one place                     |
| **Security**                    | Add new security rule to all endpoints simultaneously |
| **Separation of Concerns**      | Controllers focus on business logic, not auth         |
| **Testability**                 | Mock middleware for unit tests                        |
| **Scalability**                 | Easy to add new concerns (rate limiting, caching)     |

---

## ⚠️ Common Mistakes

### ❌ Mistake 1: Wrong Middleware Order

```js
// ❌ WRONG — errorHandler comes before routes
app.use(errorHandler);
app.use("/api/products", productRoutes);

// ✅ CORRECT — errorHandler comes last
app.use("/api/products", productRoutes);
app.use(errorHandler);
```

### ❌ Mistake 2: Missing Cross-Cutting Check

```js
// ❌ WRONG — Logging in every controller
async function createProduct(req, res) {
  console.log("Request received"); // ← Repeated in every function!
  // ... logic
}

async function login(req, res) {
  console.log("Request received"); // ← Repeated!
  // ... logic
}

// ✅ CORRECT — Use middleware
app.use(requestLogger); // ← Once, applies to all
```

### ❌ Mistake 3: Business Logic in Middleware

```js
// ❌ WRONG — Business logic in middleware
function customMiddleware(req, res, next) {
  const [rows] = pool.execute("SELECT ... FROM product WHERE ...");
  // ← Too complex! Should be in BLL
  next();
}

// ✅ CORRECT — Middleware handles cross-cutting only
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  // ← Simple, cross-cutting concern only
  next();
}
```

---

## 🚀 Summary

**Cross-Cutting Concerns** = ฟังก์ชันที่ตัดขวางไปทั่วระบบ

### KeyConcerns in B2H:

1. ✅ **Authentication** — JWT verification
2. ✅ **Authorization** — Role/Ownership checks
3. ✅ **Logging** — Request/Response logs
4. ✅ **Error Handling** — Consistent error responses
5. ✅ **Validation** — Input schema validation
6. ✅ **Security Headers** — CORS, CSP, X-Frame-Options
7. ✅ **Response Formatting** — Consistent JSON structure

### Pattern:

```js
// Implement as Middleware
function crossCuttingConcern(req, res, next) {
  // Do something
  next();
}

// Use in Server
app.use(crossCuttingConcern);
```

**ประโยชน์**: Code reusability, Consistency, Security, Maintainability ✨

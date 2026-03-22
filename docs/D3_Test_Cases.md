# D3 Test Cases — B2H Marketplace

**Project:** B2H (Buy to Hand)  
**Version:** 1.0  
**Date:** 2026-03-22

---

## Unit Test Cases

### Module: Auth Controller (`controllers/authController.js`)

| Test Case ID | Description | Input | Expected Output | Status |
|---|---|---|---|---|
| TC-U01 | isUniversityEmail — valid BUU email | `"student@go.buu.ac.th"` | Returns `true`; register proceeds past domain check (200) | ✅ Pass |
| TC-U02 | isUniversityEmail — gmail rejected | `"user@gmail.com"` | 403 Forbidden | ✅ Pass |
| TC-U03 | isUniversityEmail — no domain | `"notanemail"` | 403 Forbidden | ✅ Pass |
| TC-U04 | isUniversityEmail — null email | `null` | 400 Bad Request | ✅ Pass |
| TC-U05 | register() — missing email | `{ password: "pw" }` | 400 `{ success: false }` | ✅ Pass |
| TC-U06 | register() — missing password | `{ email: "a@go.buu.ac.th" }` | 400 `{ success: false }` | ✅ Pass |
| TC-U07 | register() — non-university email | `{ email: "x@yahoo.com", password: "pw" }` | 403 Forbidden | ✅ Pass |
| TC-U08 | register() — duplicate email | `{ email: "existing@go.buu.ac.th", password: "pw" }` (DB returns existing user) | 400 `{ success: false }` | ✅ Pass |
| TC-U09 | register() — success | `{ email: "new@go.buu.ac.th", password: "Pass123", first_name: "สมชาย" }` | 200 `{ success: true, user_id: 42 }` | ✅ Pass |
| TC-U10 | login() — missing credentials | `{}` | 400 `{ success: false }` | ✅ Pass |
| TC-U11 | login() — unknown email | `{ email: "ghost@go.buu.ac.th", password: "pw" }` (DB returns empty) | 401 `{ success: false }` | ✅ Pass |
| TC-U12 | login() — wrong password | `{ email: "u@go.buu.ac.th", password: "wrongpw" }` (bcrypt returns false) | 401 `{ success: false }` | ✅ Pass |
| TC-U13 | login() — suspended account | `{ email: "u@go.buu.ac.th", password: "pw" }` (user.status = "banned") | 403 `{ success: false }` | ✅ Pass |
| TC-U14 | login() — success | `{ email: "ok@go.buu.ac.th", password: "correctpw" }` | 200 `{ success: true, token: "..." }` | ✅ Pass |
| TC-U15 | universityAuth() — missing email | `{}` | 400 `{ success: false }` | ✅ Pass |
| TC-U16 | universityAuth() — non-BUU email | `{ email: "x@hotmail.com" }` | 403 `{ success: false }` | ✅ Pass |
| TC-U17 | universityAuth() — existing active user | `{ email: "s@go.buu.ac.th" }` (DB returns user) | 200 `{ success: true, token: "..." }` | ✅ Pass |

### Module: Product Controller (`controllers/productController.js`)

| Test Case ID | Description | Input | Expected Output | Status |
|---|---|---|---|---|
| TC-U18 | listProducts() — success | GET /api/products (DB returns 2 rows) | 200 `{ success: true, products: [...] }` length=2 | ✅ Pass |
| TC-U19 | listProducts() — show_sold=1 | `query: { show_sold: "1" }` | 200 `{ success: true }` | ✅ Pass |
| TC-U20 | listProducts() — DB error | DB throws Error | 500 `{ success: false }` | ✅ Pass |
| TC-U21 | getProduct() — not found | `params.id = "999"` (DB returns empty) | 404 `{ success: false }` | ✅ Pass |
| TC-U22 | getProduct() — success | `params.id = "1"` (DB returns product row) | 200 `{ success: true, product: { title, images, seller_name } }` | ✅ Pass |
| TC-U23 | createProduct() — missing title | `{ price: 100 }` with auth | 400 `{ success: false }` | ✅ Pass |
| TC-U24 | createProduct() — missing price | `{ title: "สินค้า" }` with auth | 400 `{ success: false }` | ✅ Pass |
| TC-U25 | createProduct() — negative price | `{ title: "สินค้า", price: -50 }` with auth | 400 `{ success: false }` | ✅ Pass |
| TC-U26 | createProduct() — no auth | `{ title: "สินค้า", price: 100 }` no auth | 401 `{ success: false }` | ✅ Pass |
| TC-U27 | deleteProduct() — no auth | `params.id = "1"` no auth | 401 `{ success: false }` | ✅ Pass |
| TC-U28 | deleteProduct() — product not found | `params.id = "99"` (DB empty) with auth | 404 `{ success: false }` | ✅ Pass |
| TC-U29 | deleteProduct() — not owner | `params.id = "1"` (seller_id=5) auth userId=99 | 403 `{ success: false }` | ✅ Pass |

### Module: Auth Middleware (`middlewares/auth.js`)

| Test Case ID | Description | Input | Expected Output | Status |
|---|---|---|---|---|
| TC-U30 | authenticateJWT() — no header | No Authorization header | 401, next() NOT called | ✅ Pass |
| TC-U31 | authenticateJWT() — invalid token | `Authorization: Bearer invalidtoken` | 401, next() NOT called | ✅ Pass |
| TC-U32 | authenticateJWT() — valid JWT + active user | Valid JWT, DB returns active user | `next()` called, `req.auth` set | ✅ Pass |
| TC-U33 | requireRole() — no auth context | `req` has no `.auth` or `.user` | 403, next() NOT called | ✅ Pass |
| TC-U34 | requireRole() — correct role | `req.user = { role: "admin", status: "active" }` | `next()` called | ✅ Pass |
| TC-U35 | requireRole() — wrong role | `req.user = { role: "user", status: "active" }`, role required = "admin" | 403 Insufficient role | ✅ Pass |

---

## Integration Test Cases

### Suite 1 — POST /api/register

| Test Case ID | Description | Input | Expected Output | Status |
|---|---|---|---|---|
| IT-01 | Missing body | `{}` | 400 `{ success: false }` | ✅ Pass |
| IT-02 | Non-BUU email | `{ email: "x@gmail.com", password: "pw" }` | 403 | ✅ Pass |
| IT-03 | Duplicate email | `{ email: "dup@go.buu.ac.th", ... }` (existing user) | 400 | ✅ Pass |
| IT-04 | Valid registration | `{ email: "new@go.buu.ac.th", password: "Secure123" }` | 200 `{ success: true, user_id: 55 }` | ✅ Pass |

### Suite 2 — POST /api/login

| Test Case ID | Description | Input | Expected Output | Status |
|---|---|---|---|---|
| IT-05 | Missing credentials | `{}` | 400 | ✅ Pass |
| IT-06 | Unknown user | `{ email: "ghost@go.buu.ac.th", password: "pw" }` | 401 | ✅ Pass |
| IT-07 | Wrong password | Correct email, wrong password | 401 | ✅ Pass |
| IT-08 | Valid credential | `{ email: "ok@go.buu.ac.th", password: "correctpw" }` | 200 `{ success: true, token: "..." }` | ✅ Pass |

### Suite 3 — GET /api/me

| Test Case ID | Description | Input | Expected Output | Status |
|---|---|---|---|---|
| IT-09 | No token | No Authorization header | 200 `{ loggedIn: false }` | ✅ Pass |
| IT-10 | Invalid token | `Authorization: Bearer badtoken` | 200 `{ loggedIn: false }` | ✅ Pass |
| IT-11 | Valid token — active user | Valid JWT + `Authorization` header | 200 `{ loggedIn: true, user: {...} }` | ✅ Pass |

### Suite 4 — POST /api/auth/university

| Test Case ID | Description | Input | Expected Output | Status |
|---|---|---|---|---|
| IT-12 | No email | `{}` | 400 | ✅ Pass |
| IT-13 | Non-BUU email | `{ email: "x@yahoo.com" }` | 403 | ✅ Pass |
| IT-14 | BUU email (new user) | `{ email: "n@go.buu.ac.th" }` | 200 `{ success: true, token: "..." }` | ✅ Pass |

### Suite 5 — GET /api/products

| Test Case ID | Description | Input | Expected Output | Status |
|---|---|---|---|---|
| IT-15 | Public product list | `GET /api/products` | 200 `{ success: true, products: [...] }` | ✅ Pass |
| IT-16 | Include sold items | `GET /api/products?show_sold=1` | 200 with sold item | ✅ Pass |
| IT-17 | DB error | DB pool throws | 500 `{ success: false }` | ✅ Pass |

### Suite 6 — GET /api/products/:id

| Test Case ID | Description | Input | Expected Output | Status |
|---|---|---|---|---|
| IT-18 | Valid product | `GET /api/products/1` | 200 `{ success: true, product: { title, images } }` | ✅ Pass |
| IT-19 | Product not found | `GET /api/products/9999` | 404 `{ success: false }` | ✅ Pass |

### Suite 7 — POST /api/products

| Test Case ID | Description | Input | Expected Output | Status |
|---|---|---|---|---|
| IT-20 | No JWT | `POST /api/products` without token | 401 | ✅ Pass |
| IT-21 | Missing title | Token + `{ price: 100 }` | 400 | ✅ Pass |
| IT-22 | Valid product | Token + `{ title, price, description }` | 200 `{ success: true, product_id: 77 }` | ✅ Pass |

### Suite 8 — DELETE /api/products/:id

| Test Case ID | Description | Input | Expected Output | Status |
|---|---|---|---|---|
| IT-23 | No token | `DELETE /api/products/1` | 401 | ✅ Pass |
| IT-24 | Not owner | Token userId=99, product owned by userId=1 | 403 | ✅ Pass |
| IT-25 | Owner deletes | Token userId=1, product owned by userId=1 | 200 `{ success: true, deleted: true }` | ✅ Pass |

### Suite 9 — Health & Utility

| Test Case ID | Description | Input | Expected Output | Status |
|---|---|---|---|---|
| IT-26 | Health check | `GET /_health` | 200 `{ ok: true, uptime: ... }` | ✅ Pass |
| IT-27 | Unknown route | `GET /api/nonexistent-route-xyz` | 404 | ✅ Pass |

---

## Test Summary

| Category | Total Cases | Pass | Fail |
|----------|------------|------|------|
| Unit Tests | 35 | 35 | 0 |
| Integration Tests | 27 | 27 | 0 |
| **Total** | **62** | **62** | **0** |

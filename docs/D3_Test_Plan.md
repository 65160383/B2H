# D3 Test Plan — B2H Marketplace

**Project:** B2H (Buy to Hand) — Second-hand goods marketplace for university students  
**Version:** 1.0  
**Date:** 2026-03-22  
**Team:** B2H Development Team

---

## 1. Introduction

### 1.1 Purpose
This test plan describes the testing strategy, scope, objectives, and schedule for the B2H marketplace application. It covers unit tests, integration tests, and User Acceptance Testing (UAT) to ensure that all system components function correctly and meet requirements.

### 1.2 Scope
| Component | Included |
|-----------|----------|
| Auth Controller (`authController.js`) | ✅ |
| Product Controller (`productController.js`) | ✅ |
| Auth Middleware (`middleware/auth.js`) | ✅ |
| REST API routes | ✅ |
| Frontend HTML pages | ❌ (manual UAT only) |
| Database schema | ❌ (mocked in automated tests) |

### 1.3 Objectives
- Achieve **≥ 80% code coverage** across controllers and middleware
- Validate all major user workflows (register, login, buy/sell)
- Identify and document defects before production release

---

## 2. Test Strategy

### 2.1 Testing Levels

| Level | Tool | Target Coverage |
|-------|------|----------------|
| **Unit Tests** | Jest + manual mocks | ≥ 80% |
| **Integration Tests** | Jest + Supertest | All major API endpoints |
| **UAT** | Manual (browser) | 3–5 end-to-end scenarios |

### 2.2 Testing Approach

**Unit Tests**  
Pure function testing. All database calls are mocked via `jest.mock('../../config/db')` so tests are isolated, deterministic, and do not require a running MySQL instance.

**Integration Tests**  
HTTP-level testing using `supertest`. The full Express `app.js` is loaded with DB still mocked. Tests exercise full request → middleware → controller → response chain.

**UAT**  
Manual browser-based testing performed by team members acting as student buyers and sellers. Documented in `D3_UAT_Scenarios.md`.

### 2.3 Tools & Libraries

| Tool | Version | Purpose |
|------|---------|---------|
| Jest | ^29.7.0 | Test runner, assertions, mocking |
| Supertest | ^7.0.0 | HTTP integration testing |
| bcryptjs (mock) | — | Password hashing (mocked in tests) |
| jsonwebtoken | ^9.0.0 | JWT generation for test tokens |

---

## 3. Test Environment

| Item | Detail |
|------|--------|
| OS | Windows 11 |
| Node.js | v24.x |
| Database | MySQL 8 (mocked in automated tests) |
| Test command | `npm test` |
| Coverage command | `npm run test:coverage` |
| Coverage output | `docs/coverage-reports/` |

---

## 4. Test Suite Structure

```
tests/
├── unit/
│   ├── auth.test.js          — 17 unit test cases (TC-U01–U17)
│   ├── product.test.js       — 12 unit test cases (TC-U18–U29)
│   └── middleware.test.js    — 6 unit test cases  (TC-U30–U35)
└── integration/
    ├── auth.integration.test.js     — Suites 1–4 (IT-01–IT-14)
    └── product.integration.test.js  — Suites 5–9 (IT-15–IT-27)
```

**Total unit test cases: 35**  
**Total integration test cases: 27**  
**Total test suites: 9**

---

## 5. Unit Test Plan

### 5.1 auth.test.js — Auth Controller

| Group | Cases | Description |
|-------|-------|-------------|
| isUniversityEmail | TC-U01 – U04 | Email domain validation logic |
| register() | TC-U05 – U09 | Registration validation and DB interaction |
| login() | TC-U10 – U14 | Login validation, password check, token issuance |
| universityAuth() | TC-U15 – U17 | SSO-style university email login |

### 5.2 product.test.js — Product Controller

| Group | Cases | Description |
|-------|-------|-------------|
| listProducts() | TC-U18 – U20 | Product listing, query filters, error handling |
| getProduct() | TC-U21 – U22 | Single product detail, 404 handling |
| createProduct() | TC-U23 – U26 | Input validation, auth required |
| deleteProduct() | TC-U27 – U29 | Ownership check, 403/404, success |

### 5.3 middleware.test.js — Auth Middleware

| Group | Cases | Description |
|-------|-------|-------------|
| authenticateJWT() | TC-U30 – U32 | Missing/invalid/valid JWT token handling |
| requireRole() | TC-U33 – U35 | Role-based access control |

---

## 6. Integration Test Plan

| Suite | Endpoint | Cases | Description |
|-------|----------|-------|-------------|
| Suite 1 | POST /api/register | IT-01 – IT-04 | Registration API end-to-end |
| Suite 2 | POST /api/login | IT-05 – IT-08 | Login API end-to-end |
| Suite 3 | GET /api/me | IT-09 – IT-11 | Profile retrieval with/without JWT |
| Suite 4 | POST /api/auth/university | IT-12 – IT-14 | University SSO flow |
| Suite 5 | GET /api/products | IT-15 – IT-17 | Public product listing |
| Suite 6 | GET /api/products/:id | IT-18 – IT-19 | Product detail |
| Suite 7 | POST /api/products | IT-20 – IT-22 | Authenticated product creation |
| Suite 8 | DELETE /api/products/:id | IT-23 – IT-25 | Authenticated product deletion |
| Suite 9 | /_health, unknown routes | IT-26 – IT-27 | Health check and 404 |

---

## 7. Coverage Requirements

| Metric | Threshold | Target |
|--------|-----------|--------|
| Statements | 80% | 85%+ |
| Branches | 80% | 82%+ |
| Functions | 80% | 90%+ |
| Lines | 80% | 85%+ |

---

## 8. Entry & Exit Criteria

### Entry Criteria
- All source code is committed to the repository
- `npm install` completes without errors
- `node app.js` (without DB) loads without module errors

### Exit Criteria
- All unit tests pass (0 failures)
- All integration tests pass (0 failures)
- Code coverage ≥ 80% on all metrics
- UAT scenarios reviewed and signed off

---

## 9. Risk & Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| MySQL not running locally | Tests fail on real DB calls | All automated tests mock the DB pool |
| Corrupted node_modules | Cannot run tests | Run `npm ci` / `npm install` to restore |
| JWT_SECRET misconfiguration | Auth tests fail | Tests use the default secret from `middlewares/auth.js` |
| Multer incompatibility with Node.js 24 | App fails to load | Upgraded to `multer@2` |

---

## 10. Test Schedule

| Activity | Target Date |
|----------|------------|
| Unit test implementation | 2026-03-22 |
| Integration test implementation | 2026-03-22 |
| Test execution & coverage report | 2026-03-22 |
| UAT sessions | 2026-03-23 |
| Final report & submission | 2026-03-24 |

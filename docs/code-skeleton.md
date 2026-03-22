# Code Skeleton — โครงโค้ดพื้นฐาน (B2H Project)

## 📁 Folder Structure (โครงสร้างไฟล์)

```
B2h(new)/
├── config/
│   └── db.js                    — Database connection pool
├── controllers/
│   ├── authController.js        — Authentication handlers
│   ├── productController.js     — Product CRUD + related operations
│   └── userController.js        — User profile management (optional)
├── middlewares/
│   ├── auth.js                  — JWT verification & authorization
│   ├── errorHandler.js          — Global error handling
│   ├── logger.js                — Request/Response logging
│   ├── security.js              — Security headers (CORS, CSP)
│   └── validate.js              — Input validation (Joi schemas)
├── routes/
│   ├── authRoutes.js            — GET /auth/*, POST /auth/*
│   ├── productRoutes.js         — GET/POST/PUT/DELETE /products/*
│   ├── userRoutes.js            — PUT /users/me, POST /avatar
│   ├── interestRoutes.js        — GET/POST /favorites, /interests
│   ├── reviewRoutes.js          — POST /reviews, GET /reviews/:id
│   ├── reportRoutes.js          — POST /reports, (admin) GET/PUT
│   └── adminRoutes.js           — Admin operations (users, products, reports)
├── services/                    — Business Logic Layer (Optional, can be in controllers)
│   ├── authService.js           — Auth business logic
│   ├── productService.js        — Product business logic
│   ├── userService.js           — User business logic
│   └── reviewService.js         — Review/Rating business logic
├── utils/
│   ├── validators.js            — Custom validation functions
│   ├── helpers.js               — Utility functions
│   └── constants.js             — Application constants
├── public/
│   ├── uploads/                 — Uploaded images (multer destination)
│   ├── index.html               — Front-end (if serving static)
│   ├── dashboard.html
│   ├── admin.html
│   └── ...
├── server.js                    — Express app initialization & middleware setup
├── package.json                 — Dependencies & scripts
├── .env                         — Environment variables (NOT in git)
├── .gitignore                   — Git ignore file
└── database.sql                 — SQL schema, triggers, indexes

docs/
├── D1_ProjectCharter.md
├── D1_UserStories.md
├── D2.md                        — Design Document (v1)
├── D2V2.md                      — Design Document (v2, current)
├── diagrams/
│   ├── ER_Diagram.png
│   ├── Use_Case.png
│   └── System_Architecture.png

src/
├── business.md                  — Business Logic Layer documentation
├── presentation.md              — Presentation Layer documentation
├── cross-cutting.md             — Cross-Cutting Concerns (Middleware patterns)
└── code-skeleton.md             — This file
```

---

## 🏗️ Class & Interface Definitions

### ============================================

### 1. DATABASE MODELS (Entities)

### ============================================

```typescript
// ============= User Entity =============
interface User {
  user_id: number; // Primary Key (Auto-increment)
  email: string; // Unique, NOT NULL
  password: string; // bcrypt hashed, nullable (SSO users)
  first_name: string; // Nullable
  last_name: string; // Nullable
  avatar_url: string; // Nullable, URL to uploaded image
  role: "user" | "admin"; // Default: 'user'
  status: "active" | "banned"; // Default: 'active'
  contact_facebook: string; // Nullable
  contact_line: string; // Nullable
  contact_instagram: string; // Nullable
  create_time: Date; // Auto-set on insert
}

// ============= Product Entity =============
interface Product {
  product_id: number; // Primary Key
  seller_id: number; // Foreign Key → User(user_id)
  title: string; // NOT NULL
  description: string; // Nullable
  price: number; // NOT NULL, >= 0
  contact: string; // Nullable (seller contact info)
  category: string; // Nullable
  img_url: string; // Nullable, main product image
  status: ProductStatus; // 'available' | 'reserved' | 'selling' | 'sold' | 'hidden'
  buyer_id: number; // Nullable, Foreign Key → User(user_id)
  create_time: Date; // Auto-set
}

type ProductStatus = "available" | "reserved" | "selling" | "sold" | "hidden";

// ============= Interest Entity =============
interface Interest {
  interest_id: number; // Primary Key
  user_id: number; // Foreign Key → User
  product_id: number; // Foreign Key → Product
  create_time: Date;
}

// ============= Favorite Entity =============
interface Favorite {
  favorite_id: number; // Primary Key
  user_id: number; // Foreign Key → User
  product_id: number; // Foreign Key → Product
  create_time: Date;
}

// ============= Review Entity =============
interface Review {
  review_id: number; // Primary Key
  reviewer_id: number; // Foreign Key → User (buyer)
  seller_id: number; // Foreign Key → User (seller)
  product_id: number; // Foreign Key → Product
  rating: number; // 1-5
  comment: string; // Nullable
  create_time: Date;
}

// ============= Report Entity =============
interface Report {
  report_id: number; // Primary Key
  reporter_id: number; // Foreign Key → User
  target_type: string; // 'user' | 'product'
  target_id: number; // ID of reported entity
  reason: string; // Report description
  attachments: string; // JSON array of file URLs (nullable)
  status: ReportStatus; // 'pending' | 'reviewed' | 'rejected'
  admin_note: string; // Nullable
  reviewed_by: number; // Nullable, Foreign Key → User (admin)
  review_time: Date; // Nullable
  create_time: Date;
}

type ReportStatus = "pending" | "reviewed" | "rejected";
```

---

### ============================================

### 2. REQUEST/RESPONSE DTOs (Data Transfer Objects)

### ============================================

```typescript
// ============= Auth DTOs =============
interface RegisterRequest {
  email: string; // Required, email format
  password: string; // Required, min 8 chars
  first_name?: string;
  last_name?: string;
}

interface LoginRequest {
  email: string; // Required
  password: string; // Required
}

interface UniversityAuthRequest {
  email: string; // Required, must be @go.buu.ac.th
  name?: string; // Auto-extract from email if not provided
}

interface AuthResponse {
  success: boolean;
  token: string; // JWT token
  user: {
    user_id: number;
    email: string;
    name: string; // first_name + last_name
  };
  message: string;
}

// ============= Product DTOs =============
interface CreateProductRequest {
  title: string; // Required
  description?: string;
  price: number; // Required, >= 0
  contact?: string;
  category?: string;
  // images uploaded via multipart/form-data (multer)
}

interface UpdateProductRequest {
  title?: string;
  description?: string;
  price?: number;
  contact?: string;
  category?: string;
}

interface ProductResponse {
  success: boolean;
  product: {
    product_id: number;
    seller_id: number;
    title: string;
    price: number;
    img_url?: string;
    images: string[]; // Array of image URLs
    seller_name?: string; // Denormalized for convenience
    seller_email?: string;
    status: ProductStatus;
    // ... other fields
  };
}

// ============= User DTOs =============
interface UpdateUserProfileRequest {
  name?: string; // Parsed into first_name, last_name
  contact_facebook?: string;
  contact_line?: string;
  contact_instagram?: string;
}

interface UserProfileResponse {
  success: boolean;
  user: {
    user_id: number;
    email: string;
    name: string;
    avatar_url?: string;
    contact_facebook?: string;
    contact_line?: string;
    contact_instagram?: string;
  };
}

// ============= Interest/Favorite DTOs =============
interface ToggleFavoriteRequest {
  product_id: number; // Required
}

interface ToggleFavoriteResponse {
  success: boolean;
  added?: boolean;
  removed?: boolean;
}

interface AddInterestRequest {
  product_id: number;
}

// ============= Review DTOs =============
interface AddReviewRequest {
  product_id: number; // Required
  seller_id: number; // Required
  rating: number; // Required, 1-5
  comment?: string;
}

// ============= Report DTOs =============
interface CreateReportRequest {
  target_type: "user" | "product"; // Required
  target_id: number; // Required
  reason: string; // Required
  // attachments uploaded via multipart/form-data
}

// ============= General Response DTOs =============
interface SuccessResponse<T = any> {
  success: true;
  data?: T;
  message?: string;
  timestamp?: string;
}

interface ErrorResponse {
  success: false;
  message: string;
  errorCode?: string;
  timestamp?: string;
}

type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;
```

---

### ============================================

### 3. MIDDLEWARE SIGNATURES

### ============================================

```typescript
// ============= Middleware Type =============
type Middleware = (
  req: Express.Request,
  res: Express.Response,
  next: Function,
) => void;

// ============= Authentication Middleware =============
interface AuthMiddleware extends Middleware {
  // Decorates req with:
  // req.auth: { user_id: number; email: string; }
}

interface AdminCheckMiddleware extends Middleware {
  // Checks req.auth.user_id has role='admin'
  // Returns 403 if not admin
}

// ============= Error Handling Middleware =============
interface ErrorHandler {
  (
    err: Error,
    req: Express.Request,
    res: Express.Response,
    next: Function,
  ): void;
}

// ============= Validation Middleware =============
interface ValidationMiddleware extends Middleware {
  // Uses Joi schema to validate req.body
  // Returns 400 if validation fails
}

// ============= Logging Middleware =============
interface LoggingMiddleware extends Middleware {
  // Logs: method, path, status, duration
}

// ============= Security Headers Middleware =============
interface SecurityMiddleware extends Middleware {
  // Sets: X-Frame-Options, CSP, CORS, etc.
}
```

---

### ============================================

### 4. CONTROLLER SIGNATURES

### ============================================

```typescript
// ============= Auth Controller =============
namespace authController {
  function isUniversityEmail(email: string): boolean;

  async function register(
    req: Express.Request<any, any, RegisterRequest>,
    res: Express.Response<AuthResponse | ErrorResponse>,
  ): Promise<void>;

  async function login(
    req: Express.Request<any, any, LoginRequest>,
    res: Express.Response<AuthResponse | ErrorResponse>,
  ): Promise<void>;

  async function universityAuth(
    req: Express.Request<any, any, UniversityAuthRequest>,
    res: Express.Response<AuthResponse | ErrorResponse>,
  ): Promise<void>;

  async function me(
    req: Express.Request,
    res: Express.Response<{ loggedIn: boolean; user?: Omit<User, "password"> }>,
  ): Promise<void>;
}

// ============= Product Controller =============
namespace productController {
  async function listProducts(
    req: Express.Request<any, any, any, { show_sold?: string }>,
    res: Express.Response<{ success: boolean; products: Product[] }>,
  ): Promise<void>;

  async function getProduct(
    req: Express.Request<{ id: string }>,
    res: Express.Response<ProductResponse | ErrorResponse>,
  ): Promise<void>;

  async function createProduct(
    req: Express.Request<any, any, CreateProductRequest> & {
      files?: Express.Multer.File[];
    },
    res: Express.Response<
      { success: boolean; product_id: number; images: string[] } | ErrorResponse
    >,
  ): Promise<void>;

  async function updateProduct(
    req: Express.Request<{ id: string }, any, UpdateProductRequest>,
    res: Express.Response<
      { success: boolean; product_id: number; images: string[] } | ErrorResponse
    >,
  ): Promise<void>;

  async function deleteProduct(
    req: Express.Request<{ id: string }>,
    res: Express.Response<
      { success: boolean; deleted: boolean } | ErrorResponse
    >,
  ): Promise<void>;

  async function updateProductStatus(
    req: Express.Request<
      { id: string },
      any,
      { status: ProductStatus; buyer_id?: number }
    >,
    res: Express.Response<ApiResponse>,
  ): Promise<void>;

  async function cancelSale(
    req: Express.Request<{ id: string }>,
    res: Express.Response<ApiResponse>,
  ): Promise<void>;

  async function getSellerProducts(
    req: Express.Request<{ id: string }>,
    res: Express.Response<{
      success: boolean;
      seller: Omit<User, "password">;
      products: Product[];
    }>,
  ): Promise<void>;
}

// ============= User Controller =============
namespace userController {
  async function updateMe(
    req: Express.Request<any, any, UpdateUserProfileRequest>,
    res: Express.Response<UserProfileResponse | ErrorResponse>,
  ): Promise<void>;

  async function uploadAvatar(
    req: Express.Request & { file?: Express.Multer.File },
    res: Express.Response<UserProfileResponse | ErrorResponse>,
  ): Promise<void>;

  async function adminGetUsers(
    req: Express.Request,
    res: Express.Response<
      { success: boolean; users: Omit<User, "password">[] } | ErrorResponse
    >,
  ): Promise<void>;
}

// ============= Interest Controller =============
namespace interestController {
  async function getFavorites(
    req: Express.Request,
    res: Express.Response,
  ): Promise<void>;
  async function toggleFavorite(
    req: Express.Request,
    res: Express.Response,
  ): Promise<void>;
  async function getInterests(
    req: Express.Request,
    res: Express.Response,
  ): Promise<void>;
  async function addInterest(
    req: Express.Request,
    res: Express.Response,
  ): Promise<void>;
  async function toggleInterest(
    req: Express.Request,
    res: Express.Response,
  ): Promise<void>;
  async function getSellerInterested(
    req: Express.Request,
    res: Express.Response,
  ): Promise<void>;
}

// ============= Review Controller =============
namespace reviewController {
  async function addReview(
    req: Express.Request,
    res: Express.Response,
  ): Promise<void>;
  async function getSellerReviews(
    req: Express.Request,
    res: Express.Response,
  ): Promise<void>;
  async function getUserHistory(
    req: Express.Request,
    res: Express.Response,
  ): Promise<void>;
}

// ============= Report Controller =============
namespace reportController {
  async function createReport(
    req: Express.Request,
    res: Express.Response,
  ): Promise<void>;
  async function adminGetReports(
    req: Express.Request,
    res: Express.Response,
  ): Promise<void>;
  async function updateReportStatus(
    req: Express.Request,
    res: Express.Response,
  ): Promise<void>;
}

// ============= Admin Controller =============
namespace adminController {
  async function adminDeleteProduct(
    req: Express.Request,
    res: Express.Response,
  ): Promise<void>;
  async function adminSetUserStatus(
    req: Express.Request,
    res: Express.Response,
  ): Promise<void>;
  async function adminDeleteReview(
    req: Express.Request,
    res: Express.Response,
  ): Promise<void>;
}
```

---

### ============================================

### 5. SERVICE LAYER (Optional but Recommended)

### ============================================

```typescript
// ============= Auth Service =============
interface AuthService {
  register(
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
  ): Promise<{ user_id: number }>;
  login(
    email: string,
    password: string,
  ): Promise<{ token: string; user: User }>;
  universityAuth(
    email: string,
    name?: string,
  ): Promise<{ token: string; user: User }>;
  verifyToken(token: string): Promise<{ user_id: number; email: string }>;
}

// ============= Product Service =============
interface ProductService {
  listProducts(showSold: boolean): Promise<Product[]>;
  getProduct(
    productId: number,
  ): Promise<Product & { seller: Omit<User, "password"> }>;
  createProduct(
    sellerId: number,
    data: CreateProductRequest,
    imageUrls: string[],
  ): Promise<Product>;
  updateProduct(
    productId: number,
    sellerId: number,
    data: UpdateProductRequest,
    imageUrls?: string[],
  ): Promise<Product>;
  deleteProduct(productId: number, sellerId: number): Promise<void>;
  updateProductStatus(
    productId: number,
    sellerId: number,
    status: ProductStatus,
  ): Promise<void>;
  cancelSale(productId: number, sellerId: number): Promise<void>;
  getSellerProducts(sellerId: number, showSold: boolean): Promise<Product[]>;
}

// ============= User Service =============
interface UserService {
  getUser(userId: number): Promise<Omit<User, "password">>;
  updateProfile(
    userId: number,
    data: UpdateUserProfileRequest,
  ): Promise<Omit<User, "password">>;
  uploadAvatar(
    userId: number,
    imageUrl: string,
  ): Promise<Omit<User, "password">>;
  getAllUsers(): Promise<Omit<User, "password">[]>;
  setUserStatus(userId: number, status: "active" | "banned"): Promise<void>;
}

// ============= Interest Service =============
interface InterestService {
  getFavorites(userId: number): Promise<Product[]>;
  toggleFavorite(
    userId: number,
    productId: number,
  ): Promise<{ added: boolean } | { removed: boolean }>;
  getInterests(userId: number): Promise<Product[]>;
  addInterest(userId: number, productId: number): Promise<void>;
  toggleInterest(
    userId: number,
    productId: number,
  ): Promise<{ added: boolean } | { removed: boolean }>;
  getSellerInterested(sellerId: number): Promise<any[]>;
}

// ============= Review Service =============
interface ReviewService {
  addReview(
    reviewerId: number,
    sellerId: number,
    productId: number,
    rating: number,
    comment?: string,
  ): Promise<void>;
  getSellerReviews(
    sellerId: number,
  ): Promise<Review[] & { reviewer: User; product: Product }[]>;
  getUserHistory(
    userId: number,
  ): Promise<{ purchases: Product[]; sales: Product[] }>;
}

// ============= Report Service =============
interface ReportService {
  createReport(
    reporterId: number,
    targetType: string,
    targetId: number,
    reason: string,
    attachments?: string[],
  ): Promise<Report>;
  getReports(
    page: number,
    limit: number,
  ): Promise<{ reports: Report[]; total: number }>;
  updateReportStatus(
    reportId: number,
    status: ReportStatus,
    adminNote?: string,
    reviewedBy?: number,
  ): Promise<void>;
}
```

---

### ============================================

### 6. DATABASE CONNECTION

### ============================================

```typescript
// config/db.js
import mysql from "mysql2/promise";

interface PoolConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  waitForConnections: boolean;
  connectionLimit: number;
  queueLimit: number;
}

class Database {
  private pool: mysql.Pool;

  constructor(config: PoolConfig);

  async getConnection(): Promise<mysql.PoolConnection>;

  async execute<T>(query: string, values?: any[]): Promise<[T[], any]>;

  async query<T>(query: string, values?: any[]): Promise<T[]>;

  async close(): Promise<void>;
}

export const pool: mysql.Pool;
```

---

### ============================================

### 7. ROUTE DEFINITIONS

### ============================================

```typescript
// ============= Auth Routes =============
// POST    /api/auth/register
// POST    /api/auth/login
// POST    /api/auth/university-auth
// GET     /api/auth/me

// ============= Product Routes =============
// GET     /api/products                    (list)
// GET     /api/products/:id                (get detail)
// POST    /api/products                    (create)
// PUT     /api/products/:id                (update)
// DELETE  /api/products/:id                (delete)
// GET     /api/products/:id/sellers        (seller products)
// PUT     /api/products/:id/status         (update status)
// POST    /api/products/:id/cancel         (cancel sale)

// ============= User Routes =============
// PUT     /api/users/me                    (update profile)
// POST    /api/users/avatar                (upload avatar)
// GET     /api/admin/users                 (admin list users)
// PUT     /api/admin/users/:id/status      (admin set status)

// ============= Interest Routes =============
// GET     /api/favorites                   (get favorites)
// POST    /api/favorites                   (toggle favorite)
// GET     /api/interests                   (get interests)
// POST    /api/interests                   (add interest)
// GET     /api/sellers/:id/interested      (seller interested list)

// ============= Review Routes =============
// POST    /api/reviews                     (add review)
// GET     /api/reviews/:seller_id          (get seller reviews)
// GET     /api/history                     (get user history)

// ============= Report Routes =============
// POST    /api/reports                     (create report)
// GET     /api/admin/reports               (admin list reports)
// PUT     /api/admin/reports/:id           (admin update report)

// ============= Admin Routes =============
// DELETE  /api/admin/products/:id          (delete product)
// PUT     /api/admin/users/:id/status      (set user status)
// DELETE  /api/admin/reviews/:id           (delete review)
```

---

## 📋 Implementation Checklist

### Entities (✅ Created in Database)

- [x] Users
- [x] Products
- [x] Interests
- [x] Favorites
- [x] Reviews
- [x] Reports

### Controllers (✅ Implemented)

- [x] authController
- [x] productController
- [x] userController
- [x] interestController
- [x] reviewController
- [x] reportController
- [x] adminController

### Middlewares (✅/⏳ Implemented)

- [x] authMiddleware
- [x] errorHandler
- [x] requestLogger
- [x] securityHeaders
- [ ] validationMiddleware (Joi schemas)
- [ ] rateLimiter

### Routes (✅ Implemented)

- [x] authRoutes
- [x] productRoutes
- [x] userRoutes (partial)
- [x] interestRoutes
- [x] reviewRoutes
- [x] reportRoutes
- [x] adminRoutes

### Services (⏳ Optional Layer)

- [ ] authService
- [ ] productService
- [ ] userService
- [ ] interestService
- [ ] reviewService
- [ ] reportService

---

## 🎯 Next Steps

1. **Implement missing middlewares** — Add Joi validation, rate limiting
2. **Create service layer** — Extract business logic from controllers
3. **Add tests** — Unit tests, integration tests
4. **Documentation** — API docs (Swagger), README
5. **Deployment** — Docker, CI/CD, production setup

---

## 📚 Reference

- **Controllers**: Receive req/res, call BLL, return formatted responses
- **Services**: Contain business logic, database queries, validation
- **Middlewares**: Cross-cutting concerns (auth, logging, error handling)
- **DTOs**: Define request/response contract between client & server
- **Entities**: Database table representations (ORM models)

**Architecture Pattern**: Express.js 3-layer Architecture (Presentation → Logic → Data)

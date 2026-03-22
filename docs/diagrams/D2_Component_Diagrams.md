# D2 - Component Diagrams

## Overview
This document presents the component architecture for the B2H (Business to Home) E-commerce Platform, showing how different system components interact and communicate.

---

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PRESENTATION LAYER                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  ┌────────────┐ │
│  │  Dashboard     │  │  Seller Page   │  │  Product Page  │  │   Admin    │ │
│  │   (HTML)       │  │   (HTML)       │  │   (HTML)       │  │   Panel    │ │
│  │                │  │                │  │                │  │   (HTML)   │ │
│  └────────────────┘  └────────────────┘  └────────────────┘  └────────────┘ │
│         │                    │                    │                   │       │
│         └────────────────────┴────────────────────┴───────────────────┘       │
│                              HTTP/AJAX                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        BUSINESS LOGIC LAYER                                   │
│  ┌──────────────────────┐  ┌──────────────────────┐                          │
│  │  Auth Controller     │  │  Product Controller  │                          │
│  │  - Login/Register    │  │  - Crud Operation    │                          │
│  │  - User Validation   │  │  - Category Filter   │                          │
│  └──────────────────────┘  └──────────────────────┘                          │
│             │                       │                                         │
│             └───────────────────────┘                                         │
│                    Call Business Logic                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CROSS-CUTTING CONCERNS LAYER                               │
│  ┌──────────────────────┐  ┌──────────────────────┐                          │
│  │  Auth Middleware     │  │  Error Handler       │                          │
│  │  - Request Check     │  │  - Exception Handle  │                          │
│  │  - Token Validation  │  │  - Log Error         │                          │
│  └──────────────────────┘  └──────────────────────┘                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      PERSISTENCE LAYER                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                      Route Handlers (Express)                         │   │
│  │  ┌────────────────────┐  ┌────────────────────┐                      │   │
│  │  │  authRoutes.js     │  │  productRoutes.js  │                      │   │
│  │  │  - POST /register  │  │  - GET /products   │                      │   │
│  │  │  - POST /login     │  │  - POST /product   │                      │   │
│  │  │  - POST /logout    │  │  - PUT /product    │                      │   │
│  │  └────────────────────┘  └────────────────────┘                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                      Database Config (db.js)                         │   │
│  │  ┌────────────────────────────────────────────────────────────────┐  │   │
│  │  │              MySQL/MariaDB Database                            │  │   │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │  │   │
│  │  │  │  Users   │  │ Products │  │Favorites │  │ Interests│      │  │   │
│  │  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │  │   │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐                     │  │   │
│  │  │  │ Reviews  │  │  Reports │  │  Images  │                     │  │   │
│  │  │  └──────────┘  └──────────┘  └──────────┘                     │  │   │
│  │  └────────────────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Detailed Component Interaction Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          CLIENT (Browser)                                     │
│  index.html / dashboard.html / seller.html / admindb.html                    │
└──────────────────────────────────────────────────────────────────────────────┘
                                    │
                        (HTTP Request/Response)
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                      EXPRESS.JS SERVER (server.js)                            │
│  ┌──────────────────────────────────────────────────────────────────────────┐│
│  │                         Route Layer                                      ││
│  │  ┌────────────────────┐        ┌────────────────────┐                   ││
│  │  │  /api/auth/*       │        │  /api/products/*   │                   ││
│  │  │  authRoutes.js     │        │  productRoutes.js  │                   ││
│  │  └────────────────────┘        └────────────────────┘                   ││
│  └──────────────────────────────────────────────────────────────────────────┘│
│                                    │                                          │
│  ┌──────────────────────────────────────────────────────────────────────────┐│
│  │                      Middleware Chain                                    ││
│  │  ┌────────────────────┐        ┌────────────────────┐                   ││
│  │  │  Auth Middleware   │        │  Error Handling    │                   ││
│  │  │  middlewares/auth  │        │  Express Errors    │                   ││
│  │  └────────────────────┘        └────────────────────┘                   ││
│  └──────────────────────────────────────────────────────────────────────────┘│
│                                    │                                          │
│  ┌──────────────────────────────────────────────────────────────────────────┐│
│  │                     Business Logic Layer                                 ││
│  │  ┌────────────────────┐        ┌────────────────────┐                   ││
│  │  │ authController.js  │        │productController.js│                   ││
│  │  │ - validateUser()   │        │ - createProduct()  │                   ││
│  │  │ - hashPassword()   │        │ - getProducts()    │                   ││
│  │  │ - generateToken()  │        │ - updateProduct()  │                   ││
│  │  └────────────────────┘        │ - deleteProduct()  │                   ││
│  │                                │ - filterCategory() │                   ││
│  │                                └────────────────────┘                   ││
│  └──────────────────────────────────────────────────────────────────────────┘│
│                                    │                                          │
└──────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                    DATABASE ABSTRACTION LAYER                                 │
│                           config/db.js                                        │
│  ┌──────────────────────────────────────────────────────────────────────────┐│
│  │  - Connection Pooling                                                   ││
│  │  - Query Execution                                                      ││
│  │  - Connection Management                                                ││
│  └──────────────────────────────────────────────────────────────────────────┘│
│                                    │                                          │
└──────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                      MYSQL/MARIADB DATABASE                                   │
│                            (b2h database)                                     │
│                                                                               │
│  [users] ◄──────────┐                                                        │
│     ▲               │                                                        │
│     │      ┌────────┴──────────┐                                             │
│     │      ▼                   ▼                                             │
│  [product] ◄────────────── [reviews]                                         │
│     ▲               ▲          │                                             │
│     │               │          │                                             │
│  [product_images] [favorites] [interests] [report]                           │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Component Dependencies

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Dependencies Graph                                  │
└─────────────────────────────────────────────────────────────────────────────┘

server.js (Main Entry Point)
    │
    ├─── express (Framework)
    │       ├─── authRoutes.js
    │       │       └─── authController.js
    │       │            └─── config/db.js
    │       │
    │       ├─── productRoutes.js
    │       │       └─── productController.js
    │       │            └─── config/db.js
    │       │
    │       └─── middlewares/auth.js
    │            └─── jsonwebtoken (Token validation)
    │
    ├─── config/db.js
    │       └─── mysql2 (Database driver)
    │
    ├─── bcryptjs (Password hashing)
    │
    └─── public/ (Static Files)
         ├─── index.html
         ├─── dashboard.html
         ├─── seller.html
         ├─── admindb.html
         ├─── interested.html
         ├─── history.html
         └─── uploads/ (Product images)
```

---

## 4. Data Flow Diagram

### 4.1 User Registration/Login Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│ User Input (Email, Password)                                        │
└─────────────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ authRoutes.js → POST /register or /login                            │
└─────────────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ authController.js                                                   │
│  - Validate Input (email format, password strength)                │
│  - Hash Password (bcryptjs) [Registration]                         │
│  - Query Database (config/db.js)                                   │
│  - Generate JWT Token [Login]                                      │
└─────────────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ MySQL Database - users table                                        │
│  - INSERT (registration)                                           │
│  - SELECT (login validation)                                       │
│  - UPDATE (user profile)                                           │
└─────────────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Response (JWT Token, User Data)                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Product CRUD Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│ Client Request: Create/Read/Update/Delete Product                   │
└─────────────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ productRoutes.js → GET/POST/PUT/DELETE /products                    │
└─────────────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Auth Middleware (middlewares/auth.js)                               │
│  - Verify JWT Token                                                │
│  - Extract User ID                                                 │
│  - Check Authorization                                             │
└─────────────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ productController.js                                                │
│  - Validate Product Data                                           │
│  - Process Image Upload (if applicable)                            │
│  - Handle Business Logic:                                          │
│    * Filter by Category                                            │
│    * Check Product Status                                          │
│    * Validate Price Range                                          │
└─────────────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Database Operations (config/db.js)                                  │
│  - product table (CRUD)                                            │
│  - product_images table (image management)                         │
│  - users table (seller/buyer info)                                 │
│  - JOIN operations for related data                                │
└─────────────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Response: Product Data / Success Message                            │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.3 Product Discovery Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│ User Browse Products (Dashboard)                                    │
└─────────────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ productRoutes.js → GET /products?category=X&filter=Y                │
└─────────────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ productController.js                                                │
│  - Parse Query Parameters (Category, Price Range, Status)           │
│  - Construct SQL Query with Filters                                │
│  - Apply Pagination (limit, offset)                                │
└─────────────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Database Query                                                      │
│  - SELECT * FROM product                                           │
│  - WHERE status='available' AND category=X AND price<Y             │
│  - JOIN with users table (seller info)                             │
│  - ORDER BY create_time DESC                                       │
│  - LIMIT & OFFSET                                                  │
└─────────────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Response: Array of Products with Seller Information                 │
└─────────────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Render Products on Dashboard (HTML + Images)                        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 5. Component Interaction Matrix

| Component | Interacts With | Purpose | Data Exchanged |
|-----------|----------------|---------|----------------|
| **Presentation** | - Browser rendering of HTML pages | Display UI | DOM events, form data |
| **Express Server** | - Routes, Middleware, Controllers | Request routing | HTTP requests/responses |
| **authRoutes** | - authController, Auth Middleware | User authentication | Email, password, tokens |
| **productRoutes** | - productController, Auth Middleware | Product management | Product data, filters |
| **authController** | - Database, bcryptjs, JWT | User logic | Credentials, tokens |
| **productController** | - Database, File system | Product logic | Product CRUD, images |
| **Auth Middleware** | - jsonwebtoken, Express | Token validation | JWT tokens |
| **Database Config** | - MySQL driver, Connection pool | DB abstraction | SQL queries, results |
| **MySQL Database** | - Tables with relationships | Data persistence | Records, transactions |

---

## 6. Technology Stack Components

```
┌──────────────────────────────────────────────────┐
│     FRONTEND (Presentation Layer)                 │
├──────────────────────────────────────────────────┤
│  • HTML5                   (Markup)               │
│  • CSS3                    (Styling)              │
│  • vanilla JavaScript      (Client-side logic)   │
│  • HTTP/AJAX              (Communication)        │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│     BACKEND (Business Logic Layer)               │
├──────────────────────────────────────────────────┤
│  • Node.js                 (Runtime)              │
│  • Express.js              (Web Framework)        │
│  • bcryptjs                (Password hashing)     │
│  • jsonwebtoken            (Authentication)      │
│  • multer                  (File upload)          │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│     DATABASE (Data Layer)                         │
├──────────────────────────────────────────────────┤
│  • MySQL 5.7+              (Database)             │
│  • MariaDB 10.4            (Database variant)    │
│  • mysql2/promise          (Driver)               │
│  • Connection Pooling      (Performance)         │
└──────────────────────────────────────────────────┘
```

---

## 7. Component Responsibilities

### Presentation Layer
- **Responsibility**: Display user interface and handle user interactions
- **Components**: 
  - index.html (Home page)
  - dashboard.html (Browse products)
  - seller.html (Manage products)
  - admindb.html (Admin dashboard)
  - interested.html (User interests)
  - history.html (Transaction history)

### Business Logic Layer
- **Responsibility**: Process business rules and coordinate operations
- **Components**:
  - authController.js: User authentication
  - productController.js: Product management
  - authRoutes.js: Auth endpoints
  - productRoutes.js: Product endpoints

### Cross-cutting Concerns
- **Responsibility**: Handle cross-component concerns
- **Components**:
  - middlewares/auth.js: Authentication & authorization
  - Error handling: Exception handling
  - Logging: Request/Response logging

### Persistence Layer
- **Responsibility**: Handle data access and routing
- **Components**:
  - Routes: Map HTTP requests to controllers
  - controllers: Execute business logic

### Data Layer
- **Responsibility**: Store and retrieve data
- **Components**:
  - config/db.js: Database configuration
  - MySQL Database: Data storage

---

## 8. Communication Protocols

```
Client ◄──────► Server ◄──────► Database

HTTP Methods for APIs:
- GET    /api/products       → Retrieve products
- POST   /api/products       → Create product
- PUT    /api/products/:id   → Update product
- DELETE /api/products/:id   → Delete product
- POST   /api/auth/register  → User registration
- POST   /api/auth/login     → User login

Response Format: JSON
{
  "success": boolean,
  "message": string,
  "data": object or array
}

Authentication: JWT (Bearer Token in Authorization header)
Authorization: Header → "Bearer <token>"
```

---

**Document Version:** 1.0  
**Last Updated:** March 2026  
**Framework Version:** Express.js, Node.js

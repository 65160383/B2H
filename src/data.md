# Database Layer

## Database Configuration

| Property        | Value                |
| --------------- | -------------------- |
| RDBMS           | MariaDB 10.4.32      |
| Database Name   | `b2h`                |
| Default Charset | `utf8mb4`            |
| Collation       | `utf8mb4_general_ci` |
| Engine          | InnoDB               |
| Connection      | localhost:3306       |

---

## Tables Schema (SQL DDL)

### 1. `users`

```sql
CREATE TABLE users (
  user_id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(100) UNIQUE NOT NULL COMMENT 'ต้องเป็นโดเมน @go.buu.ac.th',
  password VARCHAR(255) COMMENT 'bcrypt hash, NULL สำหรับผู้ใช้ระบบมหาวิทยาลัย',
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role ENUM('user','admin') NOT NULL DEFAULT 'user',
  status ENUM('active','banned') NOT NULL DEFAULT 'active',
  contact_facebook VARCHAR(255),
  contact_line VARCHAR(255),
  contact_instagram VARCHAR(255),
  avatar_url VARCHAR(255) COMMENT 'URL รูปโปรไฟล์',
  create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_status (status),
  INDEX idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

---

### 2. `product`

```sql
CREATE TABLE product (
  product_id INT PRIMARY KEY AUTO_INCREMENT,
  seller_id INT NOT NULL,
  title VARCHAR(100) NOT NULL,
  description LONGTEXT,
  price DECIMAL(10,2) NOT NULL,
  contact VARCHAR(255),
  category VARCHAR(100),
  img_url VARCHAR(255) COMMENT 'URL รูปหลัก',
  buyer_id INT,
  status ENUM('available','reserved','selling','sold','hidden') NOT NULL DEFAULT 'available',
  create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY fk_product_seller (seller_id) REFERENCES users(user_id) ON DELETE RESTRICT,
  FOREIGN KEY fk_product_buyer (buyer_id) REFERENCES users(user_id) ON DELETE SET NULL,
  INDEX idx_seller_id (seller_id),
  INDEX idx_buyer_id (buyer_id),
  INDEX idx_status (status),
  INDEX idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

---

### 3. `product_images`

```sql
CREATE TABLE product_images (
  image_id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL,
  img_url VARCHAR(255) NOT NULL,
  FOREIGN KEY fk_product_images_product (product_id) REFERENCES product(product_id) ON DELETE CASCADE,
  INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

---

### 4. `interests`

```sql
CREATE TABLE interests (
  interest_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_product_interest (user_id, product_id),
  FOREIGN KEY fk_interests_user (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY fk_interests_product (product_id) REFERENCES product(product_id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_product_id (product_id),
  INDEX idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

---

### 5. `favorites`

```sql
CREATE TABLE favorites (
  favorite_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  UNIQUE KEY uk_user_product (user_id, product_id),
  FOREIGN KEY fk_favorites_user (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY fk_favorites_product (product_id) REFERENCES product(product_id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

---

### 6. `reviews`

```sql
CREATE TABLE reviews (
  review_id INT PRIMARY KEY AUTO_INCREMENT,
  reviewer_id INT NOT NULL,
  seller_id INT NOT NULL,
  product_id INT NOT NULL,
  rating INT NOT NULL COMMENT 'คะแนน 1-5',
  comment LONGTEXT,
  create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY fk_reviews_reviewer (reviewer_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY fk_reviews_seller (seller_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY fk_reviews_product (product_id) REFERENCES product(product_id) ON DELETE CASCADE,
  INDEX idx_seller_id (seller_id),
  INDEX idx_reviewer_id (reviewer_id),
  INDEX idx_product_id (product_id),
  INDEX idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

---

### 7. `report`

```sql
CREATE TABLE report (
  report_id INT PRIMARY KEY AUTO_INCREMENT,
  reporter_id INT NOT NULL,
  target_type ENUM('user','product','review') NOT NULL,
  target_id INT NOT NULL COMMENT 'user_id, product_id, หรือ review_id',
  reason LONGTEXT NOT NULL,
  status ENUM('pending','reviewed','rejected') NOT NULL DEFAULT 'pending',
  attachments LONGTEXT COMMENT 'JSON array ของ URLs'
    CHECK (attachments IS NULL OR JSON_VALID(attachments)),
  admin_note LONGTEXT,
  reviewed_by INT,
  review_time TIMESTAMP NULL,
  create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY fk_report_reporter (reporter_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY fk_report_reviewer (reviewed_by) REFERENCES users(user_id) ON DELETE SET NULL,
  INDEX idx_reporter_id (reporter_id),
  INDEX idx_target_type_id (target_type, target_id),
  INDEX idx_status (status),
  INDEX idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

---

## Foreign Key Relationships

### Diagram

```
users ──────────┬──> product (seller_id)
               ├──> product (buyer_id)
               ├──> interests (user_id) [CASCADE DELETE]
               ├──> favorites (user_id) [CASCADE DELETE]
               ├──> reviews (reviewer_id)
               ├──> reviews (seller_id)
               ├──> report (reporter_id)
               └──> report (reviewed_by)

product ───────┬──> interests (product_id) [CASCADE DELETE]
               ├──> favorites (product_id) [CASCADE DELETE]
               ├──> product_images (product_id)
               └──> reviews (product_id)
```

### CASCADE Behavior

When a parent record is deleted:

- **`users` → `interests`**: Deleting a user automatically deletes all their interests
- **`users` → `favorites`**: Deleting a user automatically deletes all their favorites
- **`product` → `interests`**: Deleting a product automatically deletes all interests for it
- **`product` → `favorites`**: Deleting a product automatically deletes all favorites for it

---

## Key Constraints & Rules

### Unique Constraints

- `users.email` — One account per email
- `interests.user_id + interests.product_id` — A user can only express interest once per product
- `favorites.user_id + favorites.product_id` — A user can only favorite once per product

### Enum Values

**`users.role`:**

- `'user'` — Regular user
- `'admin'` — Administrator

**`users.status`:**

- `'active'` — Account is active
- `'banned'` — Account is suspended

**`product.status`:**

- `'available'` — Available for purchase
- `'reserved'` — Reserved/under negotiation
- `'selling'` — Actively being sold
- `'sold'` — Sold/transaction complete
- `'hidden'` — Unlisted/hidden

**`report.status`:**

- `'pending'` — Awaiting admin review
- `'reviewed'` — Admin has reviewed
- `'rejected'` — Report rejected

**`report.target_type`:**

- `'user'` — Reporting a user
- `'product'` — Reporting a product
- `'review'` — Reporting a review

### JSON Columns

**`report.attachments`** — Stores file URLs as JSON array:

```json
["/uploads/1234-file1.jpg", "/uploads/5678-file2.png"]
```

---

## Performance & Indexing

### Indexes Strategy

ทุกตารางรวม:

- PRIMARY KEY ในคอลัมน์ ID (อัตโนมัติ)
- FOREIGN KEY indexes สำหรับประสิทธิภาพ JOIN
- Indexes ในคอลัมน์ที่ใช้ฟิลเตอร์บ่อย (`status`, `create_time`)
- UNIQUE KEY indexes (อัตโนมัติ)

### Common Query Patterns

1. **การแสดงรายการสินค้า** — `idx_status`, `idx_create_time` (ฟิลเตอร์ + เรียงลำดับ)
2. **สินค้าของผู้ขาย** — `idx_seller_id` (FK indexed)
3. **ความสนใจของผู้ใช้** — `idx_user_id` (FK indexed)
4. **การแบ่งหน้า** — `idx_create_time` (ORDER BY create_time DESC)
5. **รายงานของผู้ดูแล** — `idx_status`, `idx_create_time`

### Pagination Example

```sql
SELECT * FROM product
WHERE status != 'sold'
ORDER BY create_time DESC
LIMIT 10 OFFSET 20;  -- หน้า 3, 10 รายการต่อหน้า
```

---

## Data Types & Sizes

| Data Type       | Usage             | Example                   | Max Size       |
| --------------- | ----------------- | ------------------------- | -------------- |
| `INT`           | IDs, integers     | user_id, product_id       | ±2.1B          |
| `VARCHAR(n)`    | สตริงความยาวคงที่ | email, title, URLs        | n ตัวอักษร     |
| `LONGTEXT`      | ข้อความขนาดใหญ่   | description, comment      | 4GB (ตามทฤษฎี) |
| `DECIMAL(10,2)` | Decimal numbers   | price                     | 99,999,999.99  |
| `ENUM(...)`     | ชุดค่าคงที่       | role, status, target_type | 65,535 ค่า     |
| `TIMESTAMP`     | Date/time         | create_time, review_time  | Automatic      |

---

## Connection Pooling

**Config (`config/db.js`):**

```js
{
  waitForConnections: true,      // คิวคำขอถ้าการเชื่อมต่อทั้งหมดในการใช้งาน
  connectionLimit: 10,           // การเชื่อมต่อ 10 ครั้งพร้อมกัน
  queueLimit: 0,                 // คิวไม่จำกัด
  host: 'localhost',
  port: 3306,
  database: 'b2h',
  waitForConnectionsMillis: 0,
  enableKeepAlive: true,
  keepAliveInitialDelayMs: 0
}
```

สิ่งนี้จะให้:

- สามารถรัน 10 คำขอพร้อมกันได้
- คำขอเพิ่มเติมรอในคิว
- การนำการเชื่อมต่อกลับมาใช้ใหม่เพื่อประสิทธิภาพ
- ไม่มีข้อผิดพลาดการจำกัดการเชื่อมต่อภายใต้โหลดปกติ

## Database Configuration

| Property        | Value                |
| --------------- | -------------------- |
| RDBMS           | MariaDB 10.4.32      |
| Database Name   | `b2h`                |
| Default Charset | `utf8mb4`            |
| Collation       | `utf8mb4_general_ci` |
| Engine          | InnoDB               |
| Connection      | localhost:3306       |

---

## Tables Schema

### 1. `users`

| Column              | Type                      | Constraint                  | Description                   |
| ------------------- | ------------------------- | --------------------------- | ----------------------------- |
| `user_id`           | `int(11)`                 | PK, AUTO_INCREMENT          | User ID                       |
| `email`             | `varchar(100)`            | UNIQUE, NOT NULL            | Email (must be @go.buu.ac.th) |
| `role`              | `enum('user','admin')`    | NOT NULL, DEFAULT 'user'    | User role                     |
| `status`            | `enum('active','banned')` | NOT NULL, DEFAULT 'active'  | Account status                |
| `password`          | `varchar(255)`            | NULL                        | bcrypt hash                   |
| `first_name`        | `varchar(100)`            | NULL                        | First name                    |
| `last_name`         | `varchar(100)`            | NULL                        | Last name                     |
| `contact_facebook`  | `varchar(255)`            | NULL                        | Facebook profile              |
| `contact_line`      | `varchar(255)`            | NULL                        | LINE ID                       |
| `contact_instagram` | `varchar(255)`            | NULL                        | Instagram handle              |
| `avatar_url`        | `varchar(255)`            | NULL                        | Profile picture URL           |
| `create_time`       | `timestamp`               | DEFAULT current_timestamp() | Registration date             |

---

### 2. `product`

| Column        | Type                                                     | Constraint                   | Description         |
| ------------- | -------------------------------------------------------- | ---------------------------- | ------------------- |
| `product_id`  | `int(11)`                                                | PK, AUTO_INCREMENT           | Product ID          |
| `seller_id`   | `int(11)`                                                | FK → users.user_id, NOT NULL | Seller              |
| `title`       | `varchar(100)`                                           | NOT NULL                     | Product name        |
| `description` | `longtext`                                               | NULL                         | Product details     |
| `price`       | `decimal(10,2)`                                          | NOT NULL                     | Price               |
| `contact`     | `varchar(255)`                                           | NULL                         | Seller contact info |
| `category`    | `varchar(100)`                                           | NULL                         | Category            |
| `img_url`     | `varchar(255)`                                           | NULL                         | Main image URL      |
| `buyer_id`    | `int(11)`                                                | FK → users.user_id, NULL     | Buyer (when sold)   |
| `status`      | `enum('available','reserved','selling','sold','hidden')` | DEFAULT 'available'          | Product status      |
| `create_time` | `timestamp`                                              | DEFAULT current_timestamp()  | Listing date        |

**Indexes:**

- PRIMARY KEY: `product_id`
- FK: `seller_id`, `buyer_id`

---

### 3. `product_images`

| Column       | Type           | Constraint                        | Description       |
| ------------ | -------------- | --------------------------------- | ----------------- |
| `image_id`   | `int(11)`      | PK, AUTO_INCREMENT                | Image ID          |
| `product_id` | `int(11)`      | FK → product.product_id, NOT NULL | Product reference |
| `img_url`    | `varchar(255)` | NOT NULL                          | Image URL         |

---

### 4. `interests`

| Column        | Type        | Constraint                               | Description         |
| ------------- | ----------- | ---------------------------------------- | ------------------- |
| `interest_id` | `int(11)`   | PK, AUTO_INCREMENT                       | Interest ID         |
| `user_id`     | `int(11)`   | FK → users.user_id (CASCADE DELETE)      | Interested user     |
| `product_id`  | `int(11)`   | FK → product.product_id (CASCADE DELETE) | Product of interest |
| `create_time` | `timestamp` | DEFAULT current_timestamp()              | Date of interest    |

**Unique Constraint:** `uk_user_product_interest` (`user_id`, `product_id`) — Prevents duplicates

---

### 5. `favorites`

| Column        | Type      | Constraint                               | Description        |
| ------------- | --------- | ---------------------------------------- | ------------------ |
| `favorite_id` | `int(11)` | PK, AUTO_INCREMENT                       | Favorite ID        |
| `user_id`     | `int(11)` | FK → users.user_id (CASCADE DELETE)      | User who favorited |
| `product_id`  | `int(11)` | FK → product.product_id (CASCADE DELETE) | Favorited product  |

**Unique Constraint:** `uk_user_product` (`user_id`, `product_id`) — Prevents duplicates

---

### 6. `reviews`

| Column        | Type        | Constraint                        | Description           |
| ------------- | ----------- | --------------------------------- | --------------------- |
| `review_id`   | `int(11)`   | PK, AUTO_INCREMENT                | Review ID             |
| `reviewer_id` | `int(11)`   | FK → users.user_id, NOT NULL      | Buyer who reviewed    |
| `seller_id`   | `int(11)`   | FK → users.user_id, NOT NULL      | Seller being reviewed |
| `product_id`  | `int(11)`   | FK → product.product_id, NOT NULL | Product reviewed      |
| `rating`      | `int(11)`   | NOT NULL                          | Rating (1–5)          |
| `comment`     | `longtext`  | NULL                              | Review comment        |
| `create_time` | `timestamp` | DEFAULT current_timestamp()       | Review date           |

**Indexes:**

- PRIMARY KEY: `review_id`
- FK: `reviewer_id`, `seller_id`, `product_id`

---

### 7. `report`

| Column        | Type                                    | Constraint                            | Description                                      |
| ------------- | --------------------------------------- | ------------------------------------- | ------------------------------------------------ |
| `report_id`   | `int(11)`                               | PK, AUTO_INCREMENT                    | Report ID                                        |
| `reporter_id` | `int(11)`                               | FK → users.user_id, NOT NULL          | User who reported                                |
| `target_type` | `enum('user','product','review')`       | NOT NULL                              | Type being reported                              |
| `target_id`   | `int(11)`                               | NOT NULL                              | ID of target (user_id, product_id, or review_id) |
| `reason`      | `longtext`                              | NOT NULL                              | Report reason                                    |
| `status`      | `enum('pending','reviewed','rejected')` | DEFAULT 'pending'                     | Review status                                    |
| `attachments` | `longtext` (JSON)                       | NULL, CHECK json_valid(`attachments`) | File URLs (JSON array)                           |
| `admin_note`  | `longtext`                              | NULL                                  | Admin notes                                      |
| `reviewed_by` | `int(11)`                               | FK → users.user_id, NULL              | Admin who reviewed                               |
| `review_time` | `timestamp`                             | NULL                                  | Review timestamp                                 |
| `create_time` | `timestamp`                             | DEFAULT current_timestamp()           | Report date                                      |

**Indexes:**

- PRIMARY KEY: `report_id`
- FK: `reporter_id`, `reviewed_by`

---

## Foreign Key Relationships

### Diagram

```
users ──────────┬──> product (seller_id)
               ├──> product (buyer_id)
               ├──> interests (user_id) [CASCADE DELETE]
               ├──> favorites (user_id) [CASCADE DELETE]
               ├──> reviews (reviewer_id)
               ├──> reviews (seller_id)
               ├──> report (reporter_id)
               └──> report (reviewed_by)

product ───────┬──> interests (product_id) [CASCADE DELETE]
               ├──> favorites (product_id) [CASCADE DELETE]
               ├──> product_images (product_id)
               └──> reviews (product_id)
```

### CASCADE Behavior

When a parent record is deleted:

- **`users` → `interests`**: Deleting a user automatically deletes all their interests
- **`users` → `favorites`**: Deleting a user automatically deletes all their favorites
- **`product` → `interests`**: Deleting a product automatically deletes all interests for it
- **`product` → `favorites`**: Deleting a product automatically deletes all favorites for it

---

## Key Constraints & Rules

### Unique Constraints

- `users.email` — One account per email
- `interests.user_id + interests.product_id` — A user can only express interest once per product
- `favorites.user_id + favorites.product_id` — A user can only favorite once per product

### Enum Values

**`users.role`:**

- `'user'` — Regular user
- `'admin'` — Administrator

**`users.status`:**

- `'active'` — Account is active
- `'banned'` — Account is suspended

**`product.status`:**

- `'available'` — Available for purchase
- `'reserved'` — Reserved/under negotiation
- `'selling'` — Actively being sold
- `'sold'` — Sold/transaction complete
- `'hidden'` — Unlisted/hidden

**`report.status`:**

- `'pending'` — Awaiting admin review
- `'reviewed'` — Admin has reviewed
- `'rejected'` — Report rejected

**`report.target_type`:**

- `'user'` — Reporting a user
- `'product'` — Reporting a product
- `'review'` — Reporting a review

### JSON Columns

**`report.attachments`** — Stores file URLs as JSON array:

```json
["/uploads/1234-file1.jpg", "/uploads/5678-file2.png"]
```

---

## Query Performance Notes

### Recommended Indexes

Current indexes cover:

- All PRIMARY KEYs
- All FOREIGN KEYs (for JOIN performance)
- UNIQUE constraints

### Common Queries Optimized For

1. **Listing products** — Uses `status` and `create_time` (index on both)
2. **Seller's products** — FK indexed `seller_id`
3. **User's interests/favorites** — FK indexed `user_id`
4. **Seller's reviews** — FK indexed `seller_id`, no additional index needed
5. **Admin reports list** — `create_time` for ordering

### Pagination Support

All listing queries use `LIMIT offset, limit` format for efficient pagination:

```sql
ORDER BY create_time DESC
LIMIT 0, 10  -- first 10 results
```

---

## Data Types & Sizes

| Data Type       | Usage                    | Example                               |
| --------------- | ------------------------ | ------------------------------------- |
| `int(11)`       | IDs, quantities          | user_id, product_id, rating           |
| `varchar(100)`  | Strings with size limits | email, title, category                |
| `varchar(255)`  | URLs, longer strings     | avatar_url, img_url, contact fields   |
| `longtext`      | Large text fields        | description, reason, comment          |
| `decimal(10,2)` | Monetary amounts         | price (supports up to $99,999,999.99) |
| `enum(...)`     | Fixed set of values      | role, status, target_type             |
| `timestamp`     | Dates with auto-defaults | create_time (auto set to NOW())       |

---

## Connection Pooling

**Config (`config/db.js`):**

```js
waitForConnections: true,      // Queue requests if all connections in use
connectionLimit: 10,           // Max 10 concurrent connections
queueLimit: 0,                 // Unlimited queue
```

This ensures:

- Up to 10 simultaneous queries can run
- Additional requests wait in queue
- No connection limit errors under normal load

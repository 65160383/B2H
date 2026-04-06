# B2H

B2H คือเว็บแอปพลิเคชันตลาดซื้อขายของมือสองสำหรับผู้ใช้ภายในมหาวิทยาลัย โดยออกแบบให้รองรับการซื้อขายที่ใช้งานง่าย มีการควบคุมการเข้าถึงด้วยอีเมลมหาวิทยาลัย พร้อมฟีเจอร์โปรไฟล์ผู้ขาย รายการสินค้า รายการโปรด รีวิว และระบบรายงานปัญหา

## ภาพรวมระบบ

- ส่วนหน้า: HTML5, CSS3, Vanilla JavaScript
- ส่วนหลัง: Node.js + Express
- ฐานข้อมูล: MySQL ผ่าน `mysql2/promise`
- การยืนยันตัวตน: JWT แบบ Bearer token
- การอัปโหลดไฟล์: Multer โดยเก็บไฟล์ไว้ใน `public/uploads`

## ความสามารถหลัก

- ยืนยันตัวตนด้วยอีเมลมหาวิทยาลัยที่ได้รับอนุญาต
- สมัครสมาชิก เข้าสู่ระบบ แก้ไขโปรไฟล์ และอัปโหลดรูปโปรไฟล์
- ดูรายละเอียดสินค้า และจัดการสินค้าแบบสร้าง แก้ไข ลบ
- จัดการ favorites และ interests สำหรับการโต้ตอบของผู้ใช้กับสินค้า
- รองรับรีวิว รายงานปัญหา และ endpoint สำหรับผู้ดูแลระบบ

## สรุปสถาปัตยกรรม

- `app.js` ใช้ประกอบและ export ตัว Express app เพื่อให้ทดสอบและนำกลับไปใช้ซ้ำได้
- `server.js` ใช้สำหรับเปิด HTTP server
- `routes/` ใช้กำหนด API endpoints
- `controllers/` ใช้เก็บตัวจัดการ request และลำดับการทำงานของระบบ
- `middlewares/auth.js` ใช้จัดการ JWT และตรวจสอบสิทธิ์ตามบทบาท
- `config/db.js` ใช้สร้าง MySQL connection pool กลางของระบบ
- `public/` ใช้เก็บหน้าเว็บแบบ static และไฟล์ที่อัปโหลด

ลำดับการทำงานของ request:

`Browser -> Express Routes -> Auth Middleware -> Controller -> MySQL Pool -> Database -> JSON/HTML Response`

## โครงสร้างโปรเจกต์

```text
B2h(new)/
├── app.js
├── server.js
├── package.json
├── b2h (1).sql
├── config/
│   └── db.js
├── controllers/
│   ├── authController.js
│   └── productController.js
├── middlewares/
│   └── auth.js
├── routes/
│   ├── authRoutes.js
│   └── productRoutes.js
├── public/
│   ├── index.html
│   ├── dashboard.html
│   ├── seller.html
│   ├── interested.html
│   └── uploads/
├── tests/
│   ├── integration/
│   └── unit/
└── docs/
    ├── D2.md
    ├── D2V2.md
    ├── D2_Coding_Standards.md
    └── D2_Design_Patterns.md
```

## สิ่งที่ต้องมี

- แนะนำ Node.js 18 ขึ้นไป
- MySQL หรือ MariaDB
- npm

## วิธีติดตั้งและใช้งาน

### 1. ติดตั้ง dependencies

```powershell
npm install
```

### 2. สร้างฐานข้อมูล

สร้างฐานข้อมูลชื่อ `b2h` แล้วนำเข้าไฟล์ SQL ดังนี้:

```sql
SOURCE "b2h (1).sql";
```

หากใช้ phpMyAdmin สามารถ import ไฟล์ `b2h (1).sql` ได้โดยตรงจากหน้าเว็บ

### 3. ตั้งค่าการเชื่อมต่อฐานข้อมูล

ปัจจุบันค่าการเชื่อมต่อฐานข้อมูลถูกกำหนดไว้ตรง ๆ ใน `config/db.js`:

```js
const db = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'b2h',
  port: 3306,
};
```

ให้แก้ค่าเหล่านี้ตามเครื่องของผู้ใช้ หากค่าฐานข้อมูลในเครื่องไม่ตรงกับค่าดีฟอลต์

### 4. เริ่มต้นเซิร์ฟเวอร์

```powershell
npm start
```

ระบบจะทำงานที่:

```text
http://localhost:3000
```

## คำสั่งที่ใช้งานได้

| คำสั่ง | คำอธิบาย |
|---|---|
| `npm start` | เริ่มต้น Express server |
| `npm test` | รัน Jest tests ทั้งหมด |
| `npm run test:unit` | รันเฉพาะ unit tests |
| `npm run test:integration` | รันเฉพาะ integration tests |
| `npm run test:coverage` | รัน tests ทั้งหมดพร้อม coverage |

หมายเหตุ: ใน `package.json` มีสคริปต์ `init-db` แต่ในรีโปนี้ยังไม่มีไฟล์ `init_db.js`

## API สำคัญ

### การยืนยันตัวตน

| Method | Path | คำอธิบาย |
|---|---|---|
| `POST` | `/api/auth/university` | เข้าสู่ระบบหรือสร้างผู้ใช้อัตโนมัติด้วยอีเมลมหาวิทยาลัย |
| `POST` | `/api/register` | สมัครสมาชิกใหม่ด้วยอีเมลและรหัสผ่าน |
| `POST` | `/api/login` | เข้าสู่ระบบและรับ JWT token |
| `GET` | `/api/me` | ดึงข้อมูลผู้ใช้ปัจจุบัน |
| `PUT` | `/api/me` | อัปเดตข้อมูลโปรไฟล์ |
| `POST` | `/api/me/avatar` | อัปโหลดรูปโปรไฟล์ |
| `POST` | `/api/logout` | ออกจากระบบแบบ stateless ฝั่ง API |

### สินค้าและการโต้ตอบของผู้ใช้

| Method | Path | คำอธิบาย |
|---|---|---|
| `GET` | `/api/products` | ดึงรายการสินค้าทั้งหมด |
| `GET` | `/api/products/:id` | ดึงรายละเอียดสินค้า |
| `POST` | `/api/products` | สร้างสินค้าใหม่พร้อมอัปโหลดรูป |
| `PUT` | `/api/products/:id` | แก้ไขสินค้า |
| `DELETE` | `/api/products/:id` | ลบสินค้า |
| `PUT` | `/api/products/:id/status` | อัปเดตสถานะสินค้า |
| `POST` | `/api/products/:id/cancel-sale` | ยกเลิกการขาย |
| `GET` | `/api/favorites` | ดึงรายการโปรดของผู้ใช้ |
| `POST` | `/api/favorites/:id` | เพิ่มหรือลบ favorite |
| `GET` | `/api/interests` | ดึงรายการความสนใจของผู้ใช้ |
| `POST` | `/api/interests/:id` | เพิ่มหรือลบ interest |
| `GET` | `/api/history` | ดึงประวัติการซื้อและการขายของผู้ใช้ |
| `POST` | `/api/products/:id/reviews` | เพิ่มรีวิว |
| `POST` | `/api/products/:id/report` | รายงานสินค้า ผู้ใช้ หรือรีวิว |

### ผู้ดูแลระบบ

| Method | Path | คำอธิบาย |
|---|---|---|
| `GET` | `/api/admin/users` | ดูรายการผู้ใช้เพื่อการจัดการ |
| `GET` | `/api/admin/reports` | ดูรายการรายงานปัญหา |
| `PUT` | `/api/admin/reports/:id` | อัปเดตสถานะของรายงาน |
| `DELETE` | `/api/admin/products/:id` | ลบสินค้าในสิทธิ์ผู้ดูแลระบบ |
| `PUT` | `/api/admin/users/:id/status` | เปิดใช้งานหรือระงับผู้ใช้ |
| `DELETE` | `/api/admin/reviews/:id` | ลบรีวิว |

endpoint ที่มีการป้องกันจำเป็นต้องส่ง header แบบนี้:

```text
Authorization: Bearer <token>
```

## หน้าเว็บหลัก

- `/` หรือ `public/index.html`: หน้าเริ่มต้น
- `/dashboard`: หน้าแสดงสินค้า
- `/seller`: หน้าผู้ขาย
- `/seller/:id`: redirect ไปหน้าผู้ขายพร้อม query string
- `public/interested.html`: หน้ารายการที่สนใจหรือรายการที่บันทึกไว้

## โครงสร้างฐานข้อมูล

ไฟล์ SQL `b2h (1).sql` ในปัจจุบันกำหนดตารางดังนี้:

- `users`
- `product`
- `product_images`
- `favorites`
- `interests`
- `reviews`
- `report`

สรุปความสัมพันธ์หลักของข้อมูล:

- ผู้ใช้ 1 คนสามารถสร้างสินค้าได้หลายรายการ
- สินค้า 1 รายการสามารถมีรูปภาพได้หลายรูป
- ผู้ใช้สามารถ favorite และ interest สินค้าได้
- รีวิวเชื่อมโยงผู้ซื้อ ผู้ขาย และสินค้าเข้าด้วยกัน
- รายงานปัญหารองรับการดูแลผู้ใช้ สินค้า และรีวิว

## การทดสอบ

โปรเจกต์นี้ใช้ Jest และ Supertest

รันชุดทดสอบทั้งหมด:

```powershell
npm test
```

รันพร้อม coverage:

```powershell
npm run test:coverage
```

ชุดทดสอบปัจจุบันประกอบด้วย:

- Unit tests สำหรับ controllers และ middleware
- Integration tests ที่ import `app.js` โดยตรง
- การ mock การเข้าถึงฐานข้อมูลเพื่อแยกการทดสอบ API ออกจากฐานข้อมูลจริง

## หมายเหตุด้านความปลอดภัย

- ปัจจุบัน JWT secret มีค่า fallback เป็น `b2h-demo-jwt-secret` สำหรับการพัฒนา
- ค่าการเชื่อมต่อฐานข้อมูลยังถูกเขียนค้างไว้ใน `config/db.js`
- ไฟล์ที่อัปโหลดถูกเก็บไว้ในเครื่องโดยตรง

ข้อเสนอแนะที่ควรปรับปรุงต่อ:

- ย้ายค่าฐานข้อมูลและ JWT secret ไปไว้ใน environment variables
- เพิ่ม validation แบบรวมศูนย์และ global error handler
- เพิ่มการจำกัดชนิดไฟล์และขนาดไฟล์สำหรับการอัปโหลด
- พิจารณาใช้ cloud storage สำหรับไฟล์สื่อ

## หมายเหตุเพิ่มเติม

- metadata ใน `package.json` ยังระบุชื่อโปรเจกต์เป็น `simple-login` แต่โค้ดจริงคือระบบ B2H marketplace
- มี `express-session` อยู่ใน dependencies แต่ระบบยังไม่ได้ใช้งาน
- `app.js` ใช้สำหรับประกอบแอปให้ทดสอบได้ ส่วน `server.js` ใช้สำหรับเปิด server เท่านั้น

## เอกสารประกอบ

เอกสารเพิ่มเติมของโปรเจกต์อยู่ในโฟลเดอร์ `docs/`:

- `D2.md`
- `D2V2.md`
- `D2_Coding_Standards.md`
- `D2_Design_Patterns.md`
- `D3_Test_Plan.md`
- `D3_Test_Cases.md`

## ใบอนุญาต

ปัจจุบันยังไม่มีไฟล์ license อยู่ในรีโปนี้

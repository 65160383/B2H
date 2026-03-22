# D2: Coding Standards (B2H)

เอกสารนี้กำหนดข้อปฏิบัติการเขียนโค้ดของโปรเจกต์ B2H โดยอิงจากโค้ดที่ใช้งานจริงในระบบ เพื่อให้โค้ดอ่านง่าย ดูแลรักษาง่าย และทำงานร่วมกันเป็นทีมได้สม่ำเสมอ

## 1. Naming Standards

### 1.1 JavaScript Variables และ Functions
- ใช้รูปแบบ camelCase สำหรับตัวแปรและชื่อฟังก์ชัน
- ชื่อควรสื่อความหมายตามหน้าที่จริง ไม่ใช้ชื่อกว้างเกินไป
- ฟังก์ชันที่เป็น endpoint handler ควรขึ้นต้นด้วยคำกริยา เช่น get, list, create, update, delete, toggle

ตัวอย่างจากโค้ด:
- authenticateJWT, requireRole
- listProducts, getProduct, createProduct, updateProduct, deleteProduct
- productUpload, showSold, priceNum

### 1.2 Constants
- ใช้รูปแบบ UPPER_SNAKE_CASE สำหรับค่าคงที่
- ใช้ค่าคงที่กลางสำหรับค่าที่ใช้ซ้ำหรือเกี่ยวกับ environment

ตัวอย่างจากโค้ด:
- JWT_SECRET
- UNIVERSITY_DOMAINS

### 1.3 File Naming
- ไฟล์ route ใช้รูปแบบลงท้ายด้วย Routes เช่น authRoutes.js, productRoutes.js
- ไฟล์ controller ใช้รูปแบบลงท้ายด้วย Controller เช่น authController.js, productController.js
- ไฟล์ middleware ใช้ชื่อสั้นตามหน้าที่ เช่น auth.js
- ไฟล์ config ใช้ชื่อหน้าที่โดยตรง เช่น db.js

### 1.4 API Route Naming
- ใช้คำนามพหูพจน์สำหรับ resource หลัก เช่น /api/products, /api/favorites, /api/interests
- action เฉพาะให้ใช้ path segment ที่ชัดเจน เช่น /cancel-sale, /status
- ชื่อ path ใช้ lowercase และคั่นคำด้วย - เมื่อจำเป็น

### 1.5 Database Naming
- คอลัมน์และตารางใน SQL ใช้ snake_case (เช่น user_id, first_name, create_time)
- เมื่อนำข้อมูลเข้าสู่ JavaScript อนุญาตให้ใช้ alias เพื่อให้สอดคล้องกับบริบท (เช่น AS profile_image)

## 2. Formatting Standards

### 2.1 Indentation และ Spacing
- ใช้ 2 spaces ต่อระดับการย่อหน้าในไฟล์ JavaScript
- เว้นวรรค 1 ช่องหลัง comma และรอบ operator เพื่อให้อ่านง่าย
- เว้นบรรทัดว่างระหว่าง section สำคัญ เช่น imports, constants, functions, exports

### 2.2 String และ Quotes
- มาตรฐานหลักของโปรเจกต์ให้ใช้ double quotes ใน JavaScript
- อนุญาต single quotes เฉพาะกรณีจำเป็นหรือไฟล์เดิมที่ยังไม่ได้ปรับ เพื่อหลีกเลี่ยงการเปลี่ยนแปลงเกินจำเป็น

หมายเหตุจากโค้ดปัจจุบัน:
- ส่วนใหญ่ของไฟล์ใช้ double quotes
- มีบางไฟล์ (เช่น db.js) ที่ยังใช้ single quotes

### 2.3 Semicolons
- ปิดท้าย statement ด้วย semicolon
- รักษาความสม่ำเสมอทั้งไฟล์เพื่อป้องกันปัญหา ASI (Automatic Semicolon Insertion)

### 2.4 Braces และ Control Flow
- ใช้ braces กับ if/else, try/catch, loop
- กรณี guard clause แบบบรรทัดเดียวที่สั้นและชัดเจน อนุญาตให้เขียนแบบย่อได้ แต่ควรไม่ซับซ้อน

### 2.5 Function Layout
- จัดโครงฟังก์ชันตามลำดับ:
1. รับค่า input
2. validate
3. business logic
4. database call
5. response
6. error handling

- สำหรับ async route handlers ต้องมี try/catch เสมอ
- ส่ง error response เป็นรูปแบบเดียวกัน เช่น { success: false, message: "..." }

### 2.6 Import/Require Order
- เรียง require ตามลำดับ:
1. third-party packages
2. core modules ของ Node.js
3. local modules

ตัวอย่างที่แนะนำ:
1. const express = require("express");
2. const path = require("path");
3. const { authenticateJWT } = require("../middlewares/auth");

### 2.7 Line Length และ Readability
- ควรจำกัดความยาวบรรทัดประมาณ 100-120 ตัวอักษร
- หากคำสั่งยาว ให้ตัดบรรทัดในตำแหน่งที่อ่านง่าย เช่น function arguments หรือ object literals

## 3. Comment Standards

### 3.1 หลักการเขียน Comment
- เขียน comment เมื่อโค้ดมีเหตุผลเชิงธุรกิจหรือเงื่อนไขพิเศษที่อ่านจากโค้ดอย่างเดียวไม่ชัด
- อธิบาย "why" มากกว่า "what"
- หลีกเลี่ยง comment ที่ซ้ำกับชื่อฟังก์ชันหรือโค้ดที่เข้าใจได้อยู่แล้ว

### 3.2 ตำแหน่งที่ควรมี Comment
- ก่อน logic สำคัญที่มีหลายเงื่อนไข
- ก่อน SQL query ที่ซับซ้อน
- ก่อน fallback/retry path
- ใน middleware chain ที่มี policy สำคัญ เช่น auth/role

ตัวอย่างที่พบในโค้ด:
- By default, exclude products with status = 'sold'...
- prefer user loaded by authenticateJWT to avoid extra DB lookup
- Some MySQL setups may not accept parameter placeholders for LIMIT

### 3.3 รูปแบบ Comment
- ใช้ single-line comment สำหรับอธิบายสั้น
- ใช้ block comment หรือ file header เฉพาะกรณีอธิบายภาพรวมไฟล์หรือ test suite
- TODO/FIXME ต้องระบุสิ่งที่ต้องทำให้ชัดเจน และควรอ้างอิงงานหรือ issue หากมี

### 3.4 ภาษาใน Comment
- อนุญาตทั้งไทยและอังกฤษ
- ควรเลือกภาษาเดียวกันใน block เดียวเพื่อไม่ให้ผู้อ่านสับสน
- ข้อความตอบกลับผู้ใช้ (API message) สามารถเป็นภาษาไทยตามบริบทระบบ

## 4. ตัวอย่างมาตรฐานสำหรับ Endpoint ใหม่

เมื่อเพิ่ม endpoint ใหม่ ให้ยึดรูปแบบนี้:
1. ตั้งชื่อ handler แบบกริยา + คำนาม (เช่น createReview)
2. validate input ด้วย guard clause
3. ใช้ try/catch ครอบ async logic
4. จัด error response ให้เป็นรูปแบบเดียวกัน
5. ใส่ comment เฉพาะจุดที่มี business rule สำคัญ

## 5. Checklist ก่อน Commit

- Naming เป็น camelCase (ยกเว้น constants และ SQL snake_case)
- ใช้ semicolon ครบ
- ใช้ double quotes เป็นหลัก
- จัดย่อหน้า 2 spaces และตัดบรรทัดยาวให้อ่านง่าย
- มี try/catch ใน async handler
- โครงสร้าง response สม่ำเสมอ
- Comment เฉพาะจุดที่เพิ่มความเข้าใจจริง

## 6. สรุป

มาตรฐานนี้ครอบคลุม 3 ด้านที่ D2 กำหนด ได้แก่ naming, formatting และ comments โดยยึดจากรูปแบบที่ใช้อยู่จริงใน B2H และปรับให้อยู่ในรูปแบบที่ทีมสามารถใช้ร่วมกันได้ทันทีทั้งงานพัฒนาและงานรีวิวโค้ด

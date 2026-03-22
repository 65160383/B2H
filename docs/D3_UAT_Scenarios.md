# D3 UAT Scenarios — B2H Marketplace

**Project:** B2H (Buy to Hand)  
**Version:** 1.0  
**Date:** 2026-03-22  
**Tester:** Team member acting as student buyer / seller

---

## Overview

User Acceptance Testing (UAT) validates that the B2H system meets real-world user requirements from the perspective of actual university students. Each scenario is executed manually through the web browser.

---

## UAT Scenario 1 — Student Registration and Login

**Scenario ID:** UAT-01  
**Title:** นักศึกษาลงทะเบียนและเข้าสู่ระบบด้วยอีเมลมหาวิทยาลัย  
**Priority:** High  
**Preconditions:** Server running at `http://localhost:3000`, database connected

| Step | Action | Expected Result | Actual Result | Status |
|------|--------|----------------|---------------|--------|
| 1 | เปิด `http://localhost:3000` | หน้า Landing page แสดงขึ้น | — | — |
| 2 | กด "สมัครสมาชิก" | ฟอร์มลงทะเบียนแสดงขึ้น | — | — |
| 3 | กรอก `email = test@gmail.com` แล้วกด Submit | แสดงข้อความ Error: ต้องใช้อีเมลมหาวิทยาลัย | — | — |
| 4 | กรอก `email = 65160025@go.buu.ac.th`, `password = Test1234`, `first_name = ทดสอบ` | สมัครสำเร็จ ได้รับ user_id | — | — |
| 5 | กรอกข้อมูล Login ด้วย email/password เดิม | เข้าสู่ระบบสำเร็จ ได้รับ JWT token, redirect ไป Dashboard | — | — |
| 6 | กด Logout | ออกจากระบบ กลับไปหน้า Login | — | — |

**Acceptance Criteria:**
- ✅ อีเมลนอกมหาวิทยาลัยถูกปฏิเสธ
- ✅ อีเมล `go.buu.ac.th` สมัครได้สำเร็จ
- ✅ Login สำเร็จและ redirect ถูกต้อง

---

## UAT Scenario 2 — Seller Posts a Product

**Scenario ID:** UAT-02  
**Title:** ผู้ขายลงประกาศขายสินค้ามือสอง  
**Priority:** High  
**Preconditions:** ผู้ใช้ login สำเร็จและมี JWT token แล้ว

| Step | Action | Expected Result | Actual Result | Status |
|------|--------|----------------|---------------|--------|
| 1 | ไปที่หน้า Dashboard | เห็นปุ่ม "ลงขาย" | — | — |
| 2 | กด "ลงขาย" | ฟอร์มสร้างสินค้าแสดงขึ้น | — | — |
| 3 | ไม่กรอกชื่อสินค้า แล้ว Submit | Error: กรุณากรอกชื่อสินค้าและราคา | — | — |
| 4 | กรอก `title = หนังสือเรียน Python`, `price = 150`, `description = ยังดีมาก`, `category = หนังสือ` | — | — | — |
| 5 | เพิ่มรูปภาพสินค้า 1 รูป แล้ว Submit | สินค้าถูกสร้าง ได้รับ `product_id` | — | — |
| 6 | ไปที่หน้าสินค้า `/api/products/:id` | ข้อมูลสินค้าแสดงถูกต้อง รวมถึงรูปภาพ | — | — |

**Acceptance Criteria:**
- ✅ ไม่กรอกข้อมูลจำเป็น → Error แสดง
- ✅ สินค้าถูกบันทึกในฐานข้อมูล
- ✅ รูปภาพ upload สำเร็จ

---

## UAT Scenario 3 — Buyer Browses and Expresses Interest

**Scenario ID:** UAT-03  
**Title:** ผู้ซื้อค้นหาสินค้าและแสดงความสนใจ  
**Priority:** High  
**Preconditions:** มีสินค้าอยู่ในระบบแล้ว, ผู้ซื้อ login แล้ว

| Step | Action | Expected Result | Actual Result | Status |
|------|--------|----------------|---------------|--------|
| 1 | เปิดหน้า `http://localhost:3000` | แสดงรายการสินค้าทั้งหมด | — | — |
| 2 | เลือกสินค้าที่สนใจ | หน้าสินค้ารายละเอียดแสดงขึ้น รวมถึงชื่อผู้ขาย | — | — |
| 3 | กด "สนใจสินค้า" หรือ Add to Favorites | บันทึกความสนใจสำเร็จ | — | — |
| 4 | ไปที่หน้า "สินค้าที่ฉันสนใจ" | สินค้าที่กดไว้ปรากฎในรายการ | — | — |
| 5 | ดูข้อมูลติดต่อผู้ขาย | แสดง email / LINE / Facebook ของผู้ขาย | — | — |

**Acceptance Criteria:**
- ✅ หน้ารายการสินค้าโหลดได้
- ✅ แสดงรายละเอียดสินค้าถูกต้อง
- ✅ บันทึกและแสดงความสนใจในสินค้าได้

---

## UAT Scenario 4 — Seller Marks Product as Sold

**Scenario ID:** UAT-04  
**Title:** ผู้ขายอัพเดทสถานะสินค้าเป็น "ขายแล้ว"  
**Priority:** Medium  
**Preconditions:** ผู้ขาย login แล้ว, มีสินค้าที่ตนเองลงขายอยู่

| Step | Action | Expected Result | Actual Result | Status |
|------|--------|----------------|---------------|--------|
| 1 | ไปที่หน้า Seller Dashboard | แสดงสินค้าที่ตนเองลงขาย | — | — |
| 2 | เลือกสินค้าที่ขายแล้ว → กด "อัพเดทสถานะ" → เลือก "ขายแล้ว" | สถานะเปลี่ยนเป็น "sold" | — | — |
| 3 | กลับไปที่หน้า `/api/products` (ไม่ได้ส่ง `show_sold=1`) | สินค้าที่ขายแล้วไม่แสดงในรายการ | — | — |
| 4 | ไปที่ `GET /api/products?show_sold=1` | สินค้า status=sold ปรากฎในรายการ | — | — |
| 5 | ผู้ขายพยายาม delete สินค้าของตนเอง | ลบสำเร็จ `{ deleted: true }` | — | — |
| 6 | ผู้ใช้อื่นพยายาม delete สินค้านั้น (ด้วย token ของตนเอง) | 403 Forbidden | — | — |

**Acceptance Criteria:**
- ✅ สถานะ "sold" ซ่อนสินค้าจากรายการปกติ
- ✅ เฉพาะเจ้าของสินค้าลบได้
- ✅ Role authorization ทำงานถูกต้อง

---

## UAT Scenario 5 — Admin User Management

**Scenario ID:** UAT-05  
**Title:** ผู้ดูแลระบบจัดการผู้ใช้และรายงาน  
**Priority:** Medium  
**Preconditions:** Admin account มีอยู่ใน DB (`role = "admin"`), login สำเร็จ

| Step | Action | Expected Result | Actual Result | Status |
|------|--------|----------------|---------------|--------|
| 1 | Login ด้วยบัญชี admin | เข้าสู่ระบบสำเร็จ | — | — |
| 2 | เรียก `GET /api/admin/users` พร้อม JWT | แสดงรายการผู้ใช้ทั้งหมด | — | — |
| 3 | ใช้บัญชีปกติ (role=user) เรียก `GET /api/admin/users` | 403 Insufficient role | — | — |
| 4 | Admin เรียก `GET /api/admin/reports` พร้อม JWT | แสดงรายการ reports | — | — |
| 5 | Admin ระงับผู้ใช้ `PUT /api/admin/users/:id/status` body `{ status: "banned" }` | ผู้ใช้ถูกเปลี่ยน status → ไม่สามารถ login ได้ | — | — |
| 6 | ผู้ใช้ที่ถูกแบนพยายาม login | 403 `{ message: "บัญชีถูกระงับ" }` | — | — |

**Acceptance Criteria:**
- ✅ Admin-only endpoints ถูก protect ด้วย `requireRole("admin")`
- ✅ ผู้ใช้ทั่วไปเข้า admin endpoint ไม่ได้
- ✅ การระงับบัญชีมีผลทันที

---

## UAT Sign-off

| Scenario | Tester | Date | Result |
|----------|--------|------|--------|
| UAT-01 | — | — | Pending |
| UAT-02 | — | — | Pending |
| UAT-03 | — | — | Pending |
| UAT-04 | — | — | Pending |
| UAT-05 | — | — | Pending |

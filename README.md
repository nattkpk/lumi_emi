# LumiEMI: Global Greenhouse Gas Emissions Tracker

## Project Overview

LumiEMI เป็นระบบเว็บแอปพลิเคชันที่มีจุดประสงค์ในการติดตาม วิเคราะห์ และจัดการข้อมูลการปล่อยก๊าซเรือนกระจก (Greenhouse Gas Emissions) ในระดับโลก โครงการนี้ถูกพัฒนาขึ้นผ่านสถาปัตยกรรมซอฟต์แวร์สมัยใหม่ โดยแบ่งแยกส่วนการทำงานอย่างชัดเจนเพื่อรองรับการขยายตัว (Scalability) และออกแบบส่วนการตั้งต่อผู้ใช้งาน (User Interface) ให้สอดคล้องกับหลักการ "Editorial Minimalism" ซึ่งเน้นความชัดเจนและเรียบง่าย เหมาะสำหรับการใช้งานในระดับองค์กร (Enterprise/B2B SaaS)

## System Architecture and Technology Stack

ระบบถูกแบ่งออกเป็น 2 ส่วนการทำงานหลัก ได้แก่ ระบบส่วนหน้า (Frontend) และระบบส่วนหลัง (Backend)

### Frontend Architecture
- **Core Framework:** ใช้ Vue 3 (Composition API) ทำงานร่วมกับ Vite เพื่อประสิทธิภาพความเร็วในการแสดงผลและการ Build รหัสคำสั่ง
- **Routing:** ใช้ Vue Router ในการจัดการเส้นทางภายในแอปพลิเคชันแบบ Single Page Application (SPA) เพื่อลดระยะเวลาการโหลดทรัพยากรหน้าเว็บ
- **Styling:** ใช้ Tailwind CSS v4 เป็นกรอบแนวคิดแบบ Utility-first ควบคุมโทนสีและระยะห่างอย่างเป็นระบบ
- **Data Visualization:** อาศัยไลบรารี Apache ECharts เป็นกลไกหลักในการวาดกราฟเส้น กราฟแท่ง และการประมวลผลแผนที่ภูมิศาสตร์ (Choropleth Map)

### Backend Architecture
- **Runtime Environment:** ใช้ Node.js ร่วมกับเฟรมเวิร์ก Express.js สำหรับบูรณาการ RESTful API
- **Database Management:** จัดเก็บข้อมูลผ่านระบบฐานข้อมูลเชิงสัมพันธ์ PostgreSQL โดยทำงานอยู่ภายในสภาพแวดล้อมจำลอง Docker Container
- **Object-Relational Mapping (ORM):** ใช้ Prisma จัดการโครงสร้างทางฐานข้อมูล (Schema Migration) และเพิ่มความแม่นยำทางประเภทข้อมูล (Type-Safety) ในการอ้างอิงข้อมูล
- **Authentication:** อาศัยมาตรฐาน JSON Web Tokens (JWT) รองรับการเข้ารหัสลับสำหรับการยืนยันตัวตนและการตรวจสอบสิทธิ์การเข้าถึงข้อมูล
- **Performance Optimization:** ขีดความสามารถถูกเสริมด้วยระบบ Caching ผ่านหน่วยความจำหลัก (RAM) เพื่อลดปริมาณการร้องขอข้อมูลจากฐานข้อมูลระดับลึก
- **API Documentation:** ทำการเชื่อมต่อเข้ากับ Swagger UI อัตโนมัติ เพื่อจัดทำเอกสารข้อกำหนดและการทดสอบ Endpoint ทางเทคนิค

## User Interface and Design System

ระบบกำหนด Design System อย่างเป็นระบบ เพื่อสะท้อนลักษณะแพลตฟอร์มวิเคราะห์ข้อมูลระดับองค์กร
- **Typography:** บังคับใช้รูปแบบตัวอักษรแบบมีเชิง (Serif - ฟอนต์ Lora) ในส่วนของหัวข้อหลักเพื่อสร้างความน่าเชื่อถือ ทำงานร่วมกับตัวอักษรไร้เชิง (Sans-serif - ฟอนต์ Inter) ในส่วนของรายละเอียดเพื่อยกระดับความสามารถในการอ่าน 
- **Color Palette:** สีหลักประจำโครงการ (Corporate Identity) กำหนดด้วยค่า `#15372c` (Dark Forest Green) โดยมีการประยุกต์ใช้ Dark Mode ที่คำนวณสัดส่วนความต่างของทัศนวิสัยด้วยสีพื้นหลังเทาเข้ม (`#212124` และ `#161618`)
- **Micro-interactions:** ควบคุมความแข็งกระด้างของการเปลี่ยนแปลงสถานะ ด้วยเทคนิคการประวิงเวลาและความโปร่งแสง (Fade and Slide CSS Transitions)

## Core Features and Application Views

### 1. Analytical Dashboard (เส้นทาง: `/`)
หน้าจอหลักใช้แสดงภาพรวมเชิงสถิติผ่านการประมวลผลและนำเสนอด้วยแผนภาพปฏิสัมพันธ์ (Interactive Charts)
- **Dynamic Time Filtration:** คอมโพเนนต์ประเภท Input Range สำหรับเลื่อนตัวแปรเวลา (เช่น ปี ค.ศ. 1990-2022) ข้อมูลทั้งหมดจะถูกส่งสัญญาณไปยังแผนภูมิเพื่อแสดงค่าแบบทันท่วงที (Real-time reactivity)
- **Trend Line Chart:** แผนภูมิเส้นแสดงการเปลี่ยนแปลงทางสถิติประเมินตามประวัติศาสตรเวลา
- **Sectoral Distribution Chart:** แผนภูมิแท่งจำแนกอัตราส่วนการปล่อยก๊าซในแต่ละภาคส่วนอุตสาหกรรม
- **Global Emissions Map:** แผนที่ทางปูมิศาสตร์แสดงความเบาบางและหนาแน่นของการปล่อยก๊าซแต่ละภูมิภาค
- **Data Exportation:** กลไกฝังแฝงในการส่งมอบภาพแผนภูมิสู่สภาวะออฟไลน์ออกมาในรูปแบบไฟล์ภาพ

### 2. Data Management Console (เส้นทาง: `/manage`)
พื้นที่จัดการและเรียกดูฐานข้อมูล ซึ่งควบคุมด้วยตรรกะการให้สิทธิ์เข้าถึง 2 ระดับเงื่อนไข
- **Public Data Directories:** ผู้เยี่ยมชมสามารถสืบค้นและคัดกรองฐานข้อมูลรายการประเทศ และรายการตัวเก็บข้อมูลก๊าซ ได้ผ่านคำค้นหา 
- **CSV Data Extraction:** ระบบมีปุ่มดำเนินการสาธารณะเพื่อแปลงโครงสร้างและดาวน์โหลดข้อมูลที่พบในรูปแบบไฟล์ CSV เชิงวิเคราะห์
- **Protected Administrative Operations:** ฟังก์ชันการปรับแก้และบันทึกข้อมูล (Add, Edit, Delete) จะถูกเปิดเผยและดำเนินการได้ต่อเมื่อผู้ดำเนินการให้ค่าตัวแปร JWT ที่มีสถานะถูกต้อง (ผ่านทางระบบ Login Modal Context) ในหน้าส่วนนี้เท่านั้น

## Advanced Technical Implementations (Bonus Systems)

1. **Intelligent Caching:** นำรูปแบบ Middleware มาใช้งานที่ระดับ Backend หากเกิดการค้นหาข้อมูลเดิมซ้ำ ระบบจะส่งออกคลาส Data สู่ Client จาก Cache ในตรรกะระดับ On-memory และมีการรื้อถอนสภาวะ (Invalidate Cache) โดยอัตโนมัติหากบันทึกข้อมูลมีการปรับเปลี่ยน 
2. **Secure Authorization Pipeline:** เครือข่ายการจัดการอนุญาตถูกล็อคป้องกันที่ชั้น Express Router สำหรับทุก HTTP Protocol ประเภทปรับแก้ข้อมูลเพื่อป้องกันการเจาะระบบ (Unauthorized Write Manipulation) 
3. **Chart Toolbox Rendering:** ปรับแต่งไลบรารีฝั่ง UI ให้สามารถ Render ภาพ Canvas ส่งออกสู่เบราเซอร์โดยตรง

## Deployment and Execution Instructions

โครงการมาพร้อมกับสคริปต์อัตโนมัติเพื่อให้พร้อมสำหรับการทำงานบนระบบปฏิบัติการ

1. ระบบคอมพิวเตอร์จำเป็นต้องมีโปรแกรม Docker daemon ทำงานเบื้องหลัง
2. ทำการเปิดหน้าต่างบรรทัดคำสั่ง (Terminal) ไปยังจุดเกิดของโครงสร้าง และรันคำสั่ง:
   ```bash
   ./run.sh
   ```
   *(กลไกคือ: (1) เรียก Docker เริ่มทำงานระบบ PostgreSQL (2) คำนวณ Packages ของ Backend พร้อมเปิด Port การเชื่อมต่อ (3) ปล่อยสัญญาณการทำงานสู่วิสัยทัศน์ของ Frontend Application)*
3. การเข้าถึงหน้าผู้ใช้งาน: `http://localhost:5173`
4. การเข้าถึงสารบรรณข้อมูลนักพัฒนา (Swagger): `http://localhost:3001/api-docs`

---
## 🧪 System Testing & CI/CD Pipeline

โครงการมาพร้อมกับกระบวนการทดสอบและ Automation ที่พร้อมสำหรับ Scale ไประดับองค์กร:

### 1. ทดสอบระบบ (Testing)
ระบบใช้ **Vitest**, **Supertest** (Backend), และ **Vue Test Utils** (Frontend) ในการทดสอบ
*   รันเทสต์ Backend: `cd backend && npm run test`  (จะยิง Request ทดสอบ API ทุกเส้น)
*   รันเทสต์ Frontend: `cd frontend && npm run test` (จะจำลอง Component เพื่อทดสอบการกดปุ่มต่างๆ)

### 2. CI/CD (GitHub Actions)
ทุกครั้งที่มีการโค้ด Push หรือ Pull Request ขึ้นไปยัง `main` branch ระบบ GitHub Actions จะตรวจสอบว่า:
1.  **Backend Tests** รันผ่านทั้งหมด 
2.  **Frontend Components Tests** รันผ่านทั้งหมด 
3.  **Frontend Build** สามารถคอมไพล์โค้ดเป็น Production Ready ได้
สามารถตรวจสอบตัวโค้ด Pipeline นี้ได้ที่ไฟล์ `.github/workflows/main.yml`

---
## 🚀 Deployment Strategy (คู่มือการนำไปใช้งานบน Cloud)

สถาปัตยกรรมของโครงการนี้ถูกออกแบบมาแบบ Microservices จึงแนะนำให้แบ่งการ Deploy ดังนี้:

### 1. Database (Supabase PostgreSQL)
1. สมัครใช้งาน Supabase.com สร้างโปรเจกต์ใหม่
2. ไปที่ตั้งค่า Database นำค่า Connection URI มาใช้
3. นำค่ามาระบุใน `backend/.env` (ดูโครงสร้างจากไฟล์ `backend/.env.example`) 
4. รัน `npx prisma db push` เพื่อสร้างตารางข้อมูลบนคลาวด์

### 2. Backend API (Render.com / Railway.app)
1. ผูก Github Repo ของคุณกับ Render สร้าง `Web Service`
2. ตั้งค่า Root Directory เป็น `backend`
3. Build Command: `npm install`
4. Start Command: `npm start`
5. ระบุ `DATABASE_URL` และ `JWT_SECRET` ในแท็บ Environment Variables

### 3. Frontend Web (Vercel / Netlify)
1. ผูก Github Repo เข้ากับ Vercel สร้างโปรเจกต์
2. ตั้งค่า Root Directory เป็น `frontend`
3. Vercel จะทำงานอัตโนมัติด้วยคำสั่ง `vite build` 
4. ระบบจะกระจายผ่าน CDN สากลพร้อมใช้งานผ่าน HTTPS ทันที

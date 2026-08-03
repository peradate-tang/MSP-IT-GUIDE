# IT Guide — Knowledge Base

ระบบ Knowledge Base สำหรับทีม IT พัฒนาด้วย NestJS + React + MySQL Deploy บน Railway

---

## 📁 โครงสร้างโปรเจกต์

```
it-guide/
├── backend/       NestJS API
└── frontend/      React + Vite
```

---

## 🚀 Deploy บน Railway (Step-by-Step)

### 1. สร้าง MySQL Database

1. ไปที่ [railway.app](https://railway.app) → New Project
2. คลิก **Add a Service** → **Database** → **MySQL**
3. คลิกที่ MySQL service → Tab **Variables** → Copy ค่า `DATABASE_URL`

---

### 2. Deploy Backend

1. คลิก **Add a Service** → **GitHub Repo** → เลือก repo ของคุณ
2. ตั้ง **Root Directory** เป็น `backend`
3. ไปที่ Tab **Variables** → เพิ่ม:

```env
DATABASE_URL=mysql://...   (จาก MySQL service ข้างบน)
JWT_SECRET=your-random-secret-string-here
NODE_ENV=production
FRONTEND_URL=https://your-frontend.up.railway.app
PORT=3001
```

4. Railway จะ build และ deploy อัตโนมัติ
5. ไปที่ Tab **Settings** → **Networking** → **Generate Domain** → copy URL

---

### 3. Deploy Frontend

1. คลิก **Add a Service** → **GitHub Repo** → เลือก repo เดิม
2. ตั้ง **Root Directory** เป็น `frontend`
3. ไปที่ Tab **Variables** → เพิ่ม:

```env
VITE_API_URL=https://your-backend.up.railway.app
```

4. Generate Domain สำหรับ frontend ด้วย

---

## 💻 รัน Local (Development)

### Prerequisites
- Node.js 20+
- MySQL (หรือใช้ Docker)

### Backend
```bash
cd backend
cp .env.example .env
# แก้ไข .env ให้ตรงกับ MySQL local ของคุณ
npm install
npm run start:dev
```

### Frontend
```bash
cd frontend
cp .env.example .env
# แก้ VITE_API_URL=http://localhost:3001
npm install
npm run dev
```

---

## 👤 Default Account

```
Username: admin
Password: admin1234
```

> ⚠️ เปลี่ยนรหัสผ่านหลัง deploy จริงทันที!

---

## 🔐 Role และสิทธิ์

การอ่านบทความ (ที่เผยแพร่แล้ว) **ไม่ต้อง login** — ใครก็เข้ามาอ่านได้เลย

ผู้ใช้ที่ต้อง login มีแค่ 2 role:

| Role   | สิทธิ์ |
|--------|--------|
| admin  | จัดการได้ทุกอย่าง ทุกหมวดหมู่ ทุกบทความ รวมถึง User/Role/Category |
| editor | สร้าง/แก้ไข/ลบบทความได้ **เฉพาะในหมวดหมู่ (แผนก) ที่ตัวเองถูกผูกไว้เท่านั้น** |

**แผนกของ editor แต่ละคน** กำหนดผ่านฟิลด์ "แผนก" ตอนสร้าง/แก้ไข user (แอดมินเป็นคนตั้งค่า) โดยผูกตรงกับหมวดหมู่ (Category) ที่มีอยู่จริงในระบบ เช่น ถ้า user ผูกแผนก "Front Office" จะสร้าง/แก้ไข/ลบบทความได้เฉพาะบทความในหมวด Front Office เท่านั้น จะสร้างหรือย้ายบทความไปหมวดอื่นไม่ได้ ต่อให้พยายามส่งค่าอื่นมาก็ตาม (ระบบบังคับที่ backend)

หมวดหมู่ (Category) จัดการได้เฉพาะ admin เท่านั้น เพราะถือเป็นโครงสร้างแผนกทั้งองค์กร

---

## 📡 API Endpoints

| Method | Path                      | Guard          |
|--------|---------------------------|----------------|
| POST   | /api/auth/login           | Public         |
| GET    | /api/auth/me              | JWT            |
| GET    | /api/articles             | Public (editor/admin เห็นเพิ่มตามสิทธิ์) |
| GET    | /api/articles/slug/:slug  | Public         |
| POST   | /api/articles             | editor/admin (editor สร้างได้เฉพาะหมวดแผนกตัวเอง) |
| PUT    | /api/articles/:id         | editor/admin (editor แก้ได้เฉพาะหมวดแผนกตัวเอง) |
| DELETE | /api/articles/:id         | editor/admin (editor ลบได้เฉพาะหมวดแผนกตัวเอง) |
| GET    | /api/categories           | Public         |
| POST   | /api/categories           | admin          |
| PUT    | /api/categories/:id       | admin          |
| DELETE | /api/categories/:id       | admin          |
| GET    | /api/users                | admin          |
| POST   | /api/users                | admin          |
| PUT    | /api/users/:id            | admin          |
| DELETE | /api/users/:id            | admin          |
| GET    | /api/roles                | admin          |
| POST   | /api/roles                | admin          |
| PUT    | /api/roles/:id            | admin          |
| DELETE | /api/roles/:id            | admin          |

---

## 🛠 Tech Stack

- **Backend**: NestJS 10, TypeORM, MySQL 8, JWT, Bcrypt
- **Frontend**: React 18, Vite, TanStack Query, Zustand, React Router v6, React Markdown
- **Deploy**: Railway, Docker, Nginx

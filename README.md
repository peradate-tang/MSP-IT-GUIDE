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

| Role    | สิทธิ์                                          |
|---------|------------------------------------------------|
| admin   | ทุกอย่าง รวมถึงจัดการ User/Role/Category/Article |
| editor  | สร้าง/แก้ไขบทความและหมวดหมู่                    |
| viewer  | อ่านบทความอย่างเดียว                            |

---

## 📡 API Endpoints

| Method | Path                      | Guard          |
|--------|---------------------------|----------------|
| POST   | /api/auth/login           | Public         |
| GET    | /api/auth/me              | JWT            |
| GET    | /api/articles             | Public         |
| GET    | /api/articles/slug/:slug  | Public         |
| POST   | /api/articles             | editor/admin   |
| PUT    | /api/articles/:id         | editor/admin   |
| DELETE | /api/articles/:id         | admin          |
| GET    | /api/categories           | Public         |
| POST   | /api/categories           | editor/admin   |
| PUT    | /api/categories/:id       | editor/admin   |
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

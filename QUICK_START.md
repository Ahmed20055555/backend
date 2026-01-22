# Quick Start - بدء سريع

## ⚡ الخطوات السريعة (5 دقائق)

### 1. تثبيت الحزم
```bash
npm install
```

### 2. إنشاء ملف .env
أنشئ ملف `.env` في مجلد `backend`:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/esdaly
JWT_SECRET=change_this_to_random_string
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
```

### 3. تشغيل MongoDB
```bash
# Windows
net start MongoDB

# أو استخدم MongoDB Atlas (Cloud)
```

### 4. إنشاء Admin
```bash
npm run seed:admin
```

### 5. تشغيل Backend
```bash
npm run dev
```

---

## ✅ بيانات تسجيل الدخول

```
Email: admin@esdaly.com
Password: admin123
```

---

## 🔗 الروابط

- Backend: http://localhost:5000
- Frontend: http://localhost:3000
- Admin Login: http://localhost:3000/admin/login

---

**جاهز! 🎉**

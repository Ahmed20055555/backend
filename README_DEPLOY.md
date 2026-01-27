# دليل رفع Backend على Railway

## 🚀 خطوات سريعة

### 1. رفع الكود على GitHub

```bash
cd backend
git init
git add .
git commit -m "Ready for deployment"
git remote add origin https://github.com/YOUR_USERNAME/esdaly-backend.git
git push -u origin main
```

### 2. إنشاء Project جديد على Railway

1. اذهب إلى [railway.app](https://railway.app)
2. اضغط "New Project"
3. اختر "Deploy from GitHub repo"
4. اختر repository الخاص بـ Backend

### 3. إضافة Environment Variables

في Railway Dashboard → Variables:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/esdaly?retryWrites=true&w=majority
FRONTEND_URL=https://esdaly-website.vercel.app
JWT_SECRET=your-secret-key-here
NODE_ENV=production
PORT=5000
```

### 4. الحصول على MongoDB URI

1. اذهب إلى [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. أنشئ Cluster (Free)
3. Database Access → Add User
4. Network Access → Add IP (0.0.0.0/0 للسماح من أي مكان)
5. Connect → Connect your application
6. انسخ Connection String واستبدل `<password>`

### 5. تشغيل Seeder

بعد الرفع، في Railway Terminal:

```bash
npm run seed:admin
```

أو أضف في Settings → Deploy → Post Deploy Command:
```bash
npm run seed:admin
```

### 6. الحصول على Railway URL

بعد الرفع، Railway سيعطيك URL مثل:
```
https://esdaly-backend-production.up.railway.app
```

انسخ هذا الرابط!

### 7. إضافة في Vercel

في Vercel Dashboard → Environment Variables:

```env
NEXT_PUBLIC_API_URL=https://YOUR-RAILWAY-APP.railway.app/api
```

ثم Redeploy Frontend.

---

## ✅ التحقق

افتح:
```
https://YOUR-RAILWAY-APP.railway.app/api/health
```

يجب أن ترى:
```json
{"status":"OK","message":"ESDALY Backend API is running"}
```

---

## 🔧 ملاحظات مهمة

- Railway يعطي URL تلقائياً
- تأكد من إضافة Railway URL في Vercel Environment Variables
- تأكد من إضافة Vercel URL في Railway Environment Variables (FRONTEND_URL)

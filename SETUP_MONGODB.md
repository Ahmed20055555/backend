# إعداد MongoDB - خطوة بخطوة

## 🚀 الطريقة الأسهل: MongoDB Atlas (Cloud - مجاني)

### الخطوة 1: إنشاء حساب
1. اذهب إلى: https://www.mongodb.com/cloud/atlas/register
2. سجل حساب مجاني
3. اختر "Build a Database" → "FREE" (M0)

### الخطوة 2: إنشاء Cluster
1. اختر Cloud Provider: AWS
2. اختر Region: أقرب منطقة لك
3. اختر Cluster Name: `esdaly-cluster`
4. اضغط "Create"

### الخطوة 3: إنشاء Database User
1. Username: `esdalyadmin`
2. Password: أنشئ كلمة مرور قوية (احفظها!)
3. Database User Privileges: "Atlas admin"
4. اضغط "Create Database User"

### الخطوة 4: إعداد Network Access
1. اضغط "Add IP Address"
2. اختر "Allow Access from Anywhere" (للاختبار)
   - أو أضف IP محدد: `0.0.0.0/0`
3. اضغط "Confirm"

### الخطوة 5: الحصول على Connection String
1. اضغط "Connect" على Cluster
2. اختر "Connect your application"
3. Driver: "Node.js"
4. Version: "5.5 or later"
5. انسخ Connection String

مثال:
```
mongodb+srv://esdalyadmin:<password>@esdaly-cluster.xxxxx.mongodb.net/esdaly?retryWrites=true&w=majority
```

### الخطوة 6: تحديث ملف .env
في `backend/.env`، استبدل:
```env
MONGODB_URI=mongodb://localhost:27017/esdaly
```

بـ:
```env
MONGODB_URI=mongodb+srv://esdalyadmin:YOUR_PASSWORD@esdaly-cluster.xxxxx.mongodb.net/esdaly?retryWrites=true&w=majority
```

**⚠️ استبدل `YOUR_PASSWORD` بكلمة المرور التي أنشأتها!**

---

## 🖥️ الطريقة البديلة: تثبيت MongoDB محلياً

### Windows:
1. اذهب إلى: https://www.mongodb.com/try/download/community
2. اختر:
   - Version: Latest
   - Platform: Windows
   - Package: MSI
3. حمل وثبت MongoDB
4. أثناء التثبيت:
   - اختر "Complete"
   - اختر "Install MongoDB as a Service"
   - Run service as: "Network Service user"

### بعد التثبيت:
```bash
# شغّل MongoDB
net start MongoDB

# تحقق من الحالة
Get-Service MongoDB
```

---

## ✅ بعد إعداد MongoDB

### شغّل Seeder:
```bash
cd backend
npm run seed:admin
```

يجب أن ترى:
```
✅ Connected to MongoDB
✅ Super Admin user created successfully!
```

### شغّل Backend:
```bash
npm run dev
```

---

## 🎯 نصيحة

**استخدم MongoDB Atlas** - أسهل وأسرع:
- ✅ مجاني للبداية
- ✅ لا يحتاج تثبيت
- ✅ يعمل من أي مكان
- ✅ جاهز للاستخدام فوراً

---

**بعد إعداد MongoDB، شغّل Seeder وستعمل! 🎉**

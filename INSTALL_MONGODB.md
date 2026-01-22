# تثبيت MongoDB على Windows

## 📥 التحميل والتثبيت

### الخطوة 1: التحميل
1. اذهب إلى: https://www.mongodb.com/try/download/community
2. اختر:
   - Version: **7.0** (أو Latest)
   - Platform: **Windows**
   - Package: **MSI**
3. اضغط "Download"

### الخطوة 2: التثبيت
1. شغّل الملف الذي تم تحميله
2. اضغط "Next"
3. اختر "Complete" installation
4. ✅ تأكد من تحديد "Install MongoDB as a Service"
5. ✅ Run service as: "Network Service user"
6. ✅ تأكد من تحديد "Install MongoDB Compass" (GUI tool)
7. اضغط "Install"

### الخطوة 3: التحقق من التثبيت
```powershell
# تحقق من الخدمة
Get-Service MongoDB

# أو
net start MongoDB
```

### الخطوة 4: شغّل Seeder
```bash
cd backend
npm run seed:admin
```

---

## ✅ بعد التثبيت

1. MongoDB سيعمل تلقائياً كخدمة
2. يمكنك استخدام MongoDB Compass للوصول إلى قاعدة البيانات
3. Connection String: `mongodb://localhost:27017/esdaly`

---

## 🎯 جاهز!

بعد التثبيت، شغّل:
```bash
cd backend
npm run seed:admin
```

---

**أو استخدم MongoDB Atlas - أسهل! 🚀**

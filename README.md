# Rady Store - POS & Inventory System

نظام متكامل لإدارة المبيعات والمخزون لمحل موبايلات (Rady Store). يتميز النظام بالسرعة، الأمان، والواجهة العصرية المتوافقة مع جميع الأجهزة.

## 🚀 المميزات (Features)
- **إدارة المخزون**: إضافة وتعديل المنتجات مع تتبع الكميات.
- **نظام المبيعات**: واجهة بيع سريعة مع طباعة فواتير.
- **التقارير المالية**: رسوم بيانية وتحليلات للأرباح والمبيعات.
- **نظام حماية الاسترداد**: حماية تغيير الرموز السرية بكلمة سر النظام.
- **دعم الأجهزة**: متوافق تماماً مع الموبايل، التابلت، والديسك توب.
- **الخصوصية**: تخزين البيانات محلياً (Local Storage) لضمان الخصوصية والسرعة.

## 🛠️ التقنيات المستخدمة (Tech Stack)
- **Frontend**: React 19 + TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Motion
- **State Management**: Zustand
- **Icons**: Lucide React
- **Charts**: Recharts

## 💻 طريقة التشغيل محلياً (Local Setup)

1. قم بتحميل المستودع (Clone):
   ```bash
   git clone [your-github-repo-url]
   ```

2. انتقل إلى مجلد المشروع:
   ```bash
   cd rady-store-pos
   ```

3. تثبيت المكتبات:
   ```bash
   npm install
   ```

4. تشغيل المشروع في وضع التطوير:
   ```bash
   npm run dev
   ```

## 🌐 الرفع على GitHub (Push to GitHub)

1. أنشئ مستودعاً جديداً (New Repository) على GitHub.
2. اتبع الأوامر التالية في جهازك:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Rady Store POS"
   git branch -M main
   git remote add origin [your-github-repo-url]
   git push -u origin main
   ```

## 🌍 النشر لايف (Deployment)

يمكنك رفع المشروع بسهولة على منصات مثل **Vercel** أو **Netlify** أو **GitHub Pages**:

### للنشر على Vercel/Netlify:
- فقط قم بربط حساب GitHub الخاص بك واختر المستودع. 
- سيتعرف النظام تلقائياً على أنه مشروع Vite وسيقوم بالبناء والنشر.

### للنشر اليدوي:
```bash
npm run build
```
سيتكون مجلد باسم `dist` يحتوي على ملفات الموقع الجاهزة للرفع على أي استضافة.

## 🔑 بيانات الدخول الافتراضية
- **المدير**: `2002`
- **الموظف**: `0000`
- **كلمة سر النظام للتغيير**: `Zz@#112007`

---
تم التطوير بواسطة Rady Store Team.

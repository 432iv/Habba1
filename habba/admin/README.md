# HABBA Admin Dashboard

لوحة إدارة خاصة بمالك المتجر — منفصلة تماماً عن واجهة المتجر.

## 1) تشغيل وضع العرض (بدون Supabase)

```bash
cd habba
python3 -m http.server 8080
# افتح http://localhost:8080/admin/
# أي بريد + كلمة مرور من 6 أحرف
```

وضع العرض يستخدم `js/supabase-mock.js` (localStorage) ويحاكي قيود قاعدة البيانات:
الخصم يجب أن يكون أقل من السعر، لقطة أسعار الطلبات ثابتة، علامة مرتبطة بعطور لا تُحذف،
الحالات النهائية لا تُعدّل.

لإعادة ضبط بيانات العرض: من الكونسول `HABBA_ADMIN.resetDemo()`.

## 2) الربط بمشروع Supabase حقيقي

1. **نفّذ الـ migrations** بالترتيب من `../backend/migrations/` في SQL Editor.
2. **أنشئ حساب المالك الوحيد**: Authentication → Users → Add user (بريد + كلمة مرور).
   ثم في SQL Editor:
   ```sql
   insert into public.profiles (id) values ('<user-uuid>');
   ```
   > بدون صف `profiles` لن يُعتبر الحساب مالكاً، وستبقى الكتابة مرفوضة من القاعدة.
3. **املأ `config.js`**:
   ```js
   supabaseUrl: "https://xxxx.supabase.co",
   supabaseAnonKey: "eyJhbGciOi...",   // anon / publishable فقط
   ```
4. **احذف سطر وضع العرض** من `index.html`:
   ```html
   <!-- <script src="js/supabase-mock.js"></script> -->
   ```
   وأضف عميل Supabase بدلاً منه:
   ```html
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
   ```
   (أو استضف `supabase-js` محلياً إن أردت منع أي اتصال خارجي.)

## 3) قواعد لا يجوز كسرها

- ❌ لا تضع `service_role` في أي ملف هنا. اللوحة تعمل بـ anon key + جلسة المالك + RLS.
- ❌ لا تعتمد على الواجهة للتحقق من الصلاحيات: كل قرار في القاعدة.
- ❌ لا تُنشئ واجهة تسجيل حساب — المالك يُضاف يدوياً مرة واحدة.
- ✅ الحالات المسموحة فقط هي ما تعرضه القائمة، والقاعدة ترفض أي انتقال آخر.

## 4) الملفات

| الملف | الوظيفة |
|---|---|
| `index.html` | نقطة الدخول |
| `config.js` | رابط Supabase والمفتاح العام |
| `js/db.js` | كل نداءات Supabase في مكان واحد |
| `js/app.js` | الراوتر والشاشات والتفاعلات |
| `js/supabase-mock.js` | بديل محلي للعرض فقط (يُحذف في الإنتاج) |
| `css/tokens.css` | ألوان وخطوط **مولّدة** من `../css/habba.css` |
| `css/admin.css` | تنسيقات اللوحة |
| `build_admin_css.py` | يعيد توليد `tokens.css` من ستايل المتجر |

> `css/tokens.css` و `assets/` منسوخان من المتجر لأخذ نفس الهوية البصرية **دون لمس** أي ملف في المتجر.
> لتحديثها بعد تغيير هوية المتجر: `python3 admin/build_admin_css.py && cp -r assets admin/`.

# HABBA — Backend Architecture & Review Package

> **Status: nothing deployed. No Supabase project created. No storefront file modified.**
> This document is the approval gate for Stages 2–4.

---

## 0. TL;DR for the owner

| Question | Answer |
|---|---|
| هل تغيّر تصميم المتجر؟ | **لا.** بصمات SHA-256 لملفات المتجر الستة محفوظة في `storefront.sha256` ولم تتغيّر. |
| هل تم إنشاء مشروع Supabase؟ | **لا.** كل شيء محلي وقابل للمراجعة. |
| هل تم اختبار قاعدة البيانات فعلياً؟ | **نعم** — PostgreSQL 17 حقيقي، **42 اختباراً ناجحاً** (RLS، الوظائف، القيود). |
| هل تم اختبار لوحة الإدارة؟ | **نعم** — **36 اختباراً ناجحاً** في متصفح حقيقي + وضع عرض يعمل بلا خادم. |
| ما الذي يحتاج قرارك؟ | (1) اعتماد المخطط، (2) اعتماد التغييرات المقترحة على `index.html` في مرحلة الربط. |

---

## 1. Stage 1 — ما وُجد في المشروع الحالي (نتيجة الفحص)

| البند | الحالة الحالية |
|---|---|
| التصميم | HTML + CSS + JS خام، بلا أي تبعيات |
| التوجيه | Hash router داخلي (`#/`, `#/product/:id`, `#/brand/:id`, `#/search`, `#/favorites`, `#/cart`, `#/checkout`) |
| مصدر البيانات | `js/data.js` → `window.HABBA_DATA` (9 منتجات، 3 علامات، 7 فئات) |
| الإعدادات | `js/config.js` → `window.HABBA_CONFIG` (رقم واتساب فارغ، رسوم التوصيل 15، حد مجاني 400) |
| السلة والمفضلة | `localStorage` بمفاتيح `habba.cart.v1` / `habba.favs.v1` / `habba.cat.v1` |
| الطلب | يُبنى نص عربي في المتصفح ويُفتح `wa.me` — لا يوجد خادم |
| الصور | ملفات محلية `assets/img/products/*.jpg` |

### حقول المنتج التي تعتمد عليها الواجهة فعلياً
```
id, name_ar, name_en, brandId, image,
sizes[{label, price, oldPrice}],     ← الواجهة تقرأ sizes[0] فقط
gender, family, concentration,
notes{top, heart, base}, description,
stock, featured, newArrival, bestSeller
```

### نقاط الربط (Integration points)
1. `window.HABBA_DATA.products / .brands / .categories` — القراءة فقط.
2. `window.HABBA_CONFIG.*` — رقم واتساب، الرسوم، العنوان.
3. `buildOrderMessage()` + `submitOrder()` في `js/app.js` — إنشاء الطلب.

---

## 2. Stage 2 — مخطط قاعدة البيانات

### الجداول (8)

```
profiles ─────────── حساب المالك الوحيد (مرآة auth.users)
brands ───────────── علامات تجارية (slug, name_ar, name_en, logo_path, is_visible, sort_order)
categories ───────── فئات (slug, name_ar, image_path, is_visible, sort_order)
products ─────────── عطر واحد = حجم واحد = سعر واحد
   ├─ product_images ── صور (is_primary واحد فقط لكل منتج)
orders ───────────── رأس الطلب + بيانات العميل + الإجماليات + الحالة
   └─ order_items ───── لقطة ثابتة (اسم/علامة/حجم/سعر لحظة الشراء)
store_settings ───── صف واحد (id boolean PK) لكل إعدادات المتجر
```

### المنتج — قرارات مقصودة
| المطلوب | التنفيذ |
|---|---|
| حجم واحد فقط | عمود `size_label` نصي واحد — **لا جدول variants ولا أعمدة حجم متعددة** |
| بلا كميات مخزون | لا يوجد عمود كمية إطلاقاً؛ `is_visible` هو التحكم الوحيد |
| السعر + خصم اختياري | `price` + `discount_price` + `CHECK (discount_price < price)` |
| عرض الأسعار | أعمدة مولّدة: `effective_price = COALESCE(discount_price, price)` و `discount_percent` |
| «وصل حديثاً» تلقائي | `created_at >= now() - interval '3 days'` — **لا حقل يدوي**، ومُجمَّد بمُشغّل ضد التعديل |
| «الخصومات» تلقائي | `discount_price IS NOT NULL` — تظهر/تختفي تلقائياً مع تفعيل الخصم |

### الطلبات — حفظ التاريخ
- `order_items` يحتفظ بـ **اسم المنتج، العلامة، الحجم، سعر الوحدة، والسعر الأصلي** كنصوص/أرقام مستقلة.
- `product_id` مفتاح أجنبي `ON DELETE SET NULL` ⇒ حذف العطر **لا يمس** الطلبات القديمة.
- `order_items` غير قابلة للتعديل أو الحذف (trigger) — ما عدا `SET NULL` من حذف المنتج.
- الحالات الست هي `enum` في القاعدة: `new, confirmed, preparing, ready, delivered, cancelled`.
- `guard_order_status` يمنع القفزات غير المنطقية (مثال: `confirmed → delivered` مباشرة) ويمنع تعديل المبالغ أو بيانات العميل بعد الإنشاء.
- رقم الطلب التسلسلي: `HB-YYMMDD-NNNN` من sequence حقيقي (وليس حساباً في الواجهة).

### الفهارس (29) — الأهم
```
products(visible, created_at desc)  · products(created_at desc) where is_visible
products(discount_price) where not null · products(is_best_seller) where true
products gin_trgm(name_ar||name_en)  ← بحث عربي سريع
orders(status, created_at desc) · orders(created_at desc) · orders(customer_phone)
order_items(order_id) · order_items(product_id)
product_images(product_id, sort_order) + unique(product_id) where is_primary
```

### العلاقات وقيود الحذف
| من | إلى | عند الحذف |
|---|---|---|
| products.brand_id | brands | `RESTRICT` — لا تُحذف علامة مرتبطة بعطور (تُخفى بدلاً من ذلك) |
| products.category_id | categories | `RESTRICT` |
| product_images.product_id | products | `CASCADE` |
| order_items.order_id | orders | `CASCADE` |
| order_items.product_id | products | `SET NULL` ← يحفظ التاريخ |

---

## 3. الأمان — RLS هو الحكم، لا الواجهة

| الجدول | anon (الزائر) | owner (المالك) |
|---|---|---|
| brands / categories / products / product_images | قراءة **الصفوف الظاهرة فقط** (ومنها: علامة مخفية تُخفي كل عطورها) | كل العمليات |
| orders / order_items | **لا قراءة إطلاقاً** — فقط إنشاء عبر `place_order()` | قراءة + تحديث الحالة |
| store_settings | قراءة (رقم واتساب، رسوم، ساعات) | تحديث فقط |
| profiles | لا شيء | صفّه فقط |

**نقاط صلبة:**
- `is_owner()` دالة `SECURITY DEFINER` تقرأ `profiles` — لا يمكن تزويرها من المتصفح.
- سبب وجود صف مالك واحد مضمون بـ trigger يرفض أي صف ثانٍ.
- لا يوجد أي مسار لإنشاء حساب: التسجيل العام معطّل، والمالك يُنشأ مرة واحدة من لوحة Supabase.
- مفاتيح `service_role` **غير موجودة في أي ملف واجهة**. التدقيق: `grep -riE "service_role|sb_secret" admin/ integration/` لا يعيد شيئاً، وفي `backend/` لا يظهر الاسم إلا كـ **اسم دور** في `grant execute` (ليس مفتاحاً) وفي سكربت الاختبار المحلي.
- كتابة الطلب تمرّ عبر `place_order()` الذي **يعيد حساب كل سعر من القاعدة** — لا يثق بأي مبلغ من المتصفح.

---

## 4. Storage — الصور

| الـ bucket | عام؟ | المحتوى | حد الحجم |
|---|---|---|---|
| `product-images` | نعم (قراءة) | صور العطور | 5MB · JPEG/PNG/WebP |
| `brand-logos` | نعم | شعارات العلامات | 2MB |
| `category-images` | نعم | صور الفئات | 2MB |

الرفع/الاستبدال/الحذف: `is_owner()` فقط. لا تُخزَّن أي صورة داخل PostgreSQL — فقط المسار `storage_path`.

---

## 5. Stage 3 — لوحة الإدارة

```
admin/
├── index.html            ← صفحة مستقلة تماماً عن المتجر
├── config.js             ← supabaseUrl + anon key (فارغة الآن)
├── css/{tokens,admin}.css ← tokens مُولَّدة آلياً من css/habba.css
└── js/{app,db,supabase-mock}.js
```

- **تسجيل الدخول**: بريد + كلمة مرور عبر Supabase Auth، مع حماية كل المسارات (أي مسار إداري بلا جلسة يعيد شاشة الدخول).
- **لوحة التحكم**: إجمالي المبيعات (المسلّمة)، طلبات جديدة، بانتظار التجهيز، مكتملة، الأكثر مبيعاً، آخر الطلبات، عدّادات الكتالوج. **بلا رسوم بيانية إطلاقاً.**
- **الطلبات**: تصفية بالحالات الست، بحث برقم الطلب/الاسم/الهاتف، صفحة تفاصيل فيها لقطة الأسعار، مسار الحالة، وزر واتساب يفتح محادثة مع رقم العميل.
- **العطور**: إضافة/تعديل/حذف/إخفاء/نشر/تغيير السعر والخصم والصور والوصف والحجم.
- **العلامات والفئات**: إضافة/تعديل/حذف/إخفاء/إظهار + الشعارات.
- **الإعدادات**: رقم واتساب، رسوم التوصيل، حد التوصيل المجاني، العنوان، ساعات العمل، تشغيل/إيقاف استقبال الطلبات.

### وضع العرض (Demo)
`js/supabase-mock.js` يقلّد واجهة supabase-js على `localStorage` ويحاكي قيود القاعدة (الخصم < السعر، حجم واحد، لقطة تاريخية، RESTRICT للحذف). يُحذف بسطر واحد عند الربط الحقيقي.

---

## 6. Stage 4 — الربط (مُعدّ، **غير مطبَّق**)

`integration/habba-supabase-adapter.js` يحوّل صفوف القاعدة إلى **نفس شكل البيانات الذي تقرأه الواجهة اليوم**، من ضمنها تحويل الحجم الواحد إلى `sizes:[{...}]` كي يبقى كود الواجهة كما هو حرفياً.

**التغيير الوحيد المطلوب في المتجر (بانتظار موافقتك):**

```diff
  <script src="js/data.js"></script>
+ <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
+ <script src="integration/habba-supabase-adapter.js"></script>
+ <script>HABBA_ADAPTER.hydrate().finally(() => {});</script>
  <script src="js/app.js"></script>
```

وبديل اختياري غير جراحي: تحميل المحوّل قبل `app.js` وتمرير البيانات عبر `HABBA_DATA` (نفس السطور أعلاه، دون لمس أي سطر في `app.js`).

> **لا يوجد أي تغيير على التصميم أو الأنماط أو المسارات أو السلة.** المحوّل يملأ نفس المصفوفات التي يقرأها التطبيق الآن.

---

## 7. Stage 5 — نتائج الاختبار

> **حدّث هذا القسم بعد كل تشغيل.** الأرقام أدناه منقولة من آخر تشغيل فعالً عبر
> `./run_all_tests.sh`؛ لا تُكتب يدوياً.

### قاعدة البيانات + التخزين — 107/107 ✅
شغّلها بنفسك: `./backend/run_tests.sh` (يحتاج PostgreSQL محلياً فقط)

| المجموعة | ما أُثبت |
|---|---|
| A. Storefront (anon) | يرى المنشور فقط؛ إخفاء علامة يُخفي عطورها؛ لا وصول للطلبات |
| B. إنشاء الطلب | يُرفض عند إيقاف الاستقبال؛ يحسب **سعر الخصم** لا الأصلي؛ رسوم/توصيل مجاني من الإعدادات؛ الاستلام بلا رسوم ولا عنوان؛ يرفض الهاتف/العنوان/السلة الفارغة |
| C. حفظ التاريخ | حذف العطر يبقي سطور الطلب بالسعر والاسم الأصليين |
| D. دورة الحالة | الانتقالات المشروعة تعمل، وغير المشروعة مرفوضة، والمبالغ غير قابلة للتعديل |
| E. المالك فقط | حساب غير مالك لا يرى المخفي ولا الطلبات ولا يستطيع الكتابة؛ مالك ثانٍ مستحيل |
| F. الإعدادات والأقسام التلقائية | «وصل حديثاً» يسقط بعد 3 أيام ويبقى في فئته؛ الخصم يظهر/يختفي تلقائياً؛ خصم > السعر مرفوض |
| G. القيود | slug مكرر، طلب بلا عنوان، إجمالي غير متطابق — كلها مرفوضة |
| H. سلامة الربط | `place_order` هي المسار الوحيد للكتابة |

### لوحة الإدارة — 39/39 ✅ (متصفح حقيقي)
حماية المسارات، تسجيل دخول/خروج، تصفية الطلبات، تحديث الحالة، واتساب، إنشاء/تعديل/إخفاء عطر، رفض خصم أعلى من السعر، شارة «وصل حديثاً»، إنشاء/حذف علامة وفئة، حفظ الإعدادات بعد إعادة التحميل، رفض رقم واتساب غير صالح، والقائمة الجانبية على الموبايل بلا تجاوز أفقي.

### المتجر — 49/49 ✅ (لم يتأثر) · الربط — 24/24 ✅

---

## 8. ما يحتاج قرارك قبل المتابعة

1. **اعتماد المخطط** أعلاه (أو طلب تعديلات).
2. **إنشاء مشروع Supabase** — لن أفعله بدون كلمة منك صريحة.
3. **اعتماد سطور الربط** في `index.html` (القسم 6) — التغيير الوحيد في المتجر.
4. **بيانات العمل الحقيقية**: رقم واتساب، رسوم التوصيل النهائية، حد التوصيل المجاني، العنوان، ساعات العمل. (كلها قابلة للتعديل من اللوحة، ولن أخترع أي قيمة.)

### خطوات النشر لاحقاً (بعد الموافقة)
```bash
# 1) في مشروع Supabase → SQL Editor: شغّل الملفات بالترتيب
backend/migrations/0001_schema.sql
backend/migrations/0002_rls.sql
backend/migrations/0003_functions.sql
backend/migrations/0004_storage.sql
backend/migrations/0005_security_hardening.sql
# 0006_seed_demo.sql  ← اختياري: بيانات العرض الحالية فقط

# 2) أنشئ المالك الوحيد
#    Authentication → Users → Add user (email + password)
#    ثم: insert into public.profiles (id) values ('<user-uuid>');

# 3) الصق URL و anon key في admin/config.js
# 4) احذف سطر js/supabase-mock.js من admin/index.html
```

---

## 9. ملاحظات أمان نهائية

- **لا تضع `service_role` في المتصفح أبداً** — اللوحة تعمل بجلسة المالك + RLS فقط.
- سياسات RLS تمنع حتى *قراءة* الطلبات من الزائر؛ لا توجد واجهة «تتبع طلب» للعميل (غير مطلوبة).
- تحديث الحالة محكوم بـ trigger في القاعدة: حتى لو تلاعب أحد بالواجهة، لا يمكن تجاوز الانتقالات المسموحة.
- `orders.total` يُحسب من `subtotal + delivery_fee` بقيود CHECK — لا يمكن إدخال إجمالي مغلوط.


---

## 10. تدقيق أمني تصحيحي (Audit)

### ما تم إصلاحه

| # | الملف | المشكلة | الأثر |
|---|---|---|---|
| 1 | `0007_close_direct_order_writes.sql` | `place_order()` كان يتحقق من `products.is_visible` فقط | **قابل للاستغلال فعلياً**: عطر من علامة مخفية كان يُشرى رغم اختفائه من المتجر (أُثبت بطلب `HB-261110-0007` بـ 240 د.ل). الآن الشرط: المنتج **وعلامته وفئته**. |
| 2 | نفس الملف | منح `INSERT` مباشر على `orders`/`order_items` لـ anon + سياستان `*_guest_insert` | كان يسمح نظرياً بإنشاء طلب بأي مبلغ. مُلغى الآن؛ `place_order()` هو المسار الوحيد. |
| 3 | نفس الملف | `search_path` لـ `place_order` كان `public` فقط | صار `public, pg_temp` (يمنع اختطاف الدوال المؤقتة). |
| 4 | نفس الملف | `order_stats()`/`admin_dashboard()` قابلة للتنفيذ من anon عبر منح PUBLIC الافتراضي | مُلغيت لـ anon وPUBLIC. |
| 5 | `integration/habba-supabase-adapter.js` | كان يكتب `freeDeliveryThreshold` بمفتاح غير المفتاح الذي يقرأه المتجر (`freeDeliveryThreshold`) | **حد التوصيل المجاني لم يكن ليُطبَّق أبداً** عند الربط. الآن يُكتب باسمه الصحيح، مع `applySettings()`. |
| 6 | `admin/js/app.js` | `waLink()`: `00218…` تُنتج رقماً مكرراً، والرقم الفارغ يُنتج `wa.me/218` | تصحيح البادئة، ورفض الأرقام غير الصالحة (إرجاع `""`). |
| 7 | `backend/run_tests.sh` | `psql | grep` كان يبتلع الفشل: **12 خطأ SQL مقابل تقرير «42 ناجح · 0 فشل»**، ورمز الخروج 0 | رمز خروج صحيح، عدّ أخطاء SQL، إخفاق عند أي خطأ غير متوقع. |
| 8 | `admin/tests/admin_test.py` | كان **ينتهي دائماً بـ 0** حتى مع فشل التأكيدات | `sys.exit(1)` عند أي فشل، وحاجز أدنى لعدد التأكيدات. |
| 9 | `backend/tests/rls_test.sql` | 24 تأكيداً لم تُنفَّذ قط (كتل تُقطع بعد أول خطأ) | أُضيف `pg_temp.denied()` وأُعيدت هيكلة المقاطع؛ من 42 إلى **107**. |

### ما لم يكن معطوباً (تم التحقق)
- `is_owner()` غير قابلة للتزوير: `SECURITY DEFINER` تقرأ `profiles`، والصف الواحد مفروض بمُشغّل.
- لا تُوجد أي صلاحية إدارية مبنية على `user_metadata`.
- `protect_order_items()` + `guard_order_status()`: اللقطات التاريخية غير قابلة للتعديل أو الحذف، والمبالغ غير قابلة للتغيير بعد الإنشاء.
- سياسات التخزين: القراءة عامة للصور، والكتابة للمالك فقط (مُختبرة).
- قاعدة «وصل حديثاً» (3 أيام) دقيقة على الحدّ ومستقلة عن المنطقة الزمنية.

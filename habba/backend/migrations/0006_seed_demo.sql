-- ============================================================================
-- HABBA — 0006_seed_demo.sql  (OPTIONAL)
-- Imports the *current demo catalog* from js/data.js so the storefront and the
-- dashboard show the same nine perfumes while integrating.
--
-- Every row here is demonstration content, not official brand information.
-- The three brands (Laverne / Ibraq / Jambool) exist only as placeholders.
--
-- Safe to run once on a fresh database. Never run in production after the
-- owner has entered real products.
-- ============================================================================

begin;

insert into public.brands (slug, name_ar, name_en, tagline_ar, description_ar, sort_order)
values
  ('laverne', 'لافيرن', 'Laverne', 'أناقة هادئة بنفحات شرقية',
   'علامة تجمع بين النعومة والدفء، وتقدّم عطوراً يومية راقية بتوليفات زهرية ومسكية. (وصف تجريبي للعرض)', 1),
  ('ibraq', 'إبراق', 'Ibraq', 'عمق العود والعنبر',
   'علامة تميل إلى العطور الشرقية والخشبية بتركيز عالٍ وثبات طويل، مناسبة للمساء والمناسبات. (وصف تجريبي للعرض)', 2),
  ('jambool', 'جامبول', 'Jambool', 'نفحات خفيفة لليوم',
   'علامة شبابية تقدّم عطوراً خفيفة ومنعشّة بحجوم مناسبة للاستخدام اليومي. (وصف تجريبي للعرض)', 3)
on conflict (slug) do nothing;

insert into public.categories (slug, name_ar, name_en, description_ar, sort_order)
values
  ('women', 'العطور النسائية', 'Women', 'عطور نسائية من علامات مختارة', 1),
  ('floral', 'زهري', 'Floral', null, 2),
  ('amber', 'عنبري / شرقي', 'Amber', null, 3),
  ('woody', 'خشبي', 'Woody', null, 4),
  ('musk', 'مسكي', 'Musk', null, 5),
  ('fruity', 'فواكه', 'Fruity', null, 6),
  ('green', 'أخضر / منعش', 'Green', null, 7)
on conflict (slug) do nothing;

with b as (select id, slug from public.brands),
     c as (select id, slug from public.categories)
insert into public.products
  (slug, name_ar, name_en, brand_id, category_id, description_ar, size_label,
   price, discount_price, concentration, fragrance_family,
   notes_top, notes_heart, notes_base, is_visible, is_best_seller, created_at)
values
  ('soie-dor', 'سوا دور', 'Soie d''Or',
   (select id from b where slug = 'laverne'), (select id from c where slug = 'amber'),
   'عطر دافئ ينفتح على نفحة حمضية خفيفة ثم يستقرّ على مزيج من الياسمين والعنبر، بثبات هادئ يناسب المساء.',
   '100 مل', 310, 265, 'Eau de Parfum', 'عنبري / شرقي',
   array['برغموت','زهر البرتقال'], array['ياسمين','زهر الفانيلا'], array['عنبر','خشب الصندل','مسك أبيض'],
   true, true, now() - interval '20 days'),

  ('rose-eternelle', 'روز إيترنيل', 'Rose Éternelle',
   (select id from b where slug = 'laverne'), (select id from c where slug = 'floral'),
   'وردة ناعمة بلمسة فاكهية، عطر أنثوي مباشر بلا مبالغة، مناسب للاستخدام اليومي والمناسبات القريبة.',
   '100 مل', 240, null, 'Eau de Parfum', 'زهري',
   array['الورد الدمشقي','ليتشي'], array['بيوني','فاوانيا'], array['مسك','خشب الأرز'],
   true, false, now() - interval '2 days'),

  ('blanc-absolu', 'بلان أبسولو', 'Blanc Absolu',
   (select id from b where slug = 'laverne'), (select id from c where slug = 'musk'),
   'نظافة هادئة في زجاجة: مسك أبيض وزهور بيضاء على قاعدة فانيلا مخملية. عطر «الجلسة الصباحية» بامتياز.',
   '75 مل', 295, null, 'Eau de Parfum', 'مسكي',
   array['كمثرى','زنبق الوادي'], array['زهر البرتقال','أيريس'], array['مسك أبيض','فانيلا','خشب الكشمير'],
   true, false, now() - interval '14 days'),

  ('nuit-dambre', 'نوي دامبر', 'Nuit d''Ambre',
   (select id from b where slug = 'ibraq'), (select id from c where slug = 'amber'),
   'توليفة عنبرية عميقة تكبر مع الوقت، تنفتح على البهار ثم تسخن باللبان والعود. حضور مسائي واضح.',
   '100 مل', 320, null, 'Eau de Parfum Intense', 'عنبري / شرقي',
   array['فلفل وردي','قرنفل'], array['عنبر','لبان'], array['عود','بنزوين','جلد ناعم'],
   true, true, now() - interval '11 days'),

  ('noir-oud', 'نوار عود', 'Noir Oud',
   (select id from b where slug = 'ibraq'), (select id from c where slug = 'woody'),
   'عود ناعم مهذّب بالورد والزعفران، ثقيل بذوق. رشّة واحدة تكفي ليوم كامل أو لسهرة.',
   '100 مل', 345, null, 'Extrait de Parfum', 'خشبي',
   array['زعفران','ورد'], array['عود كمبودي','باتشولي'], array['صندل','مسك أسود','عنبر رمادي'],
   true, false, now() - interval '1 day'),

  ('ambre-de-soie', 'أمبر دي سوا', 'Ambre de Soie',
   (select id from b where slug = 'ibraq'), (select id from c where slug = 'amber'),
   'عنبر خفيف بلمسة ماندرين، عطر انتقالي مناسب بين النهار والمساء بحجم صغير يرافقك في الحقيبة.',
   '50 مل', 185, null, 'Eau de Toilette', 'عنبري / شرقي',
   array['ماندرين','هيل'], array['عنبر','قرفة'], array['تونكا','فانيلا'],
   true, false, now() - interval '9 days'),

  ('jardin-de-figuier', 'جاردان دي فيغييه', 'Jardin de Figuier',
   (select id from b where slug = 'jambool'), (select id from c where slug = 'green'),
   'حديقة في الصباح: ورق تين أخضر وحليب تين دافئ. عطر منعش ولكنه غير متوقّع، مثالي للربيع.',
   '100 مل', 260, null, 'Eau de Parfum', 'أخضر / منعش',
   array['ورق التين','ليمون أخضر'], array['حليب التين','أوراق الزيتون'], array['خشب أبيض','مسك نباتي'],
   true, false, now() - interval '2 days'),

  ('musc-blanc', 'مسك بلان', 'Musc Blanc',
   (select id from b where slug = 'jambool'), (select id from c where slug = 'musk'),
   'مسك أبيض نقي يشبه رائحة الملابس النظيفة بعد الغسيل، هادئ وقريب من الجلد. الأنسب للنهار والعمل.',
   '75 مل', 210, null, 'Eau de Parfum', 'مسكي',
   array['بذور القطن','ألدهيد ناعم'], array['زهر القطن','ياسمين'], array['مسك أبيض','صندل','كشمير'],
   true, true, now() - interval '16 days'),

  ('prune-de-velours', 'برون دي فيلور', 'Prune de Velours',
   (select id from b where slug = 'jambool'), (select id from c where slug = 'fruity'),
   'برقوق مخملي على قاعدة باتشولي، مزيج حلو ولكنه ناضج. عطر شتوي دافئ بلمسة فاكهية.',
   '100 مل', 280, null, 'Eau de Parfum', 'فواكه',
   array['خوخ','برقوق'], array['ورد','باتشولي'], array['عنبر','مسك','خشب'],
   true, false, now() - interval '1 day')
on conflict (slug) do nothing;

commit;

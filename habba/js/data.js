/* ============================================================
   HABBA — Data layer
   كل المنتجات والعلامات مصممة لتُقرأ من هنا. أضف/احذف منتجات
   وعلامات دون الحاجة لتعديل الواجهة.
   ------------------------------------------------------------
   تنبيه: الأسماء والأوصاف والأسعار أدناه بيانات تجريبية
   لأغراض العرض فقط (demo content) وليست معلومات رسمية عن
   أي علامة تجارية.
   ============================================================ */
window.HABBA_DATA = {
  brands: [
    {
      id: "laverne",
      name_ar: "لافيرن",
      name_en: "Laverne",
      tagline: "أناقة هادئة بنفحات شرقية",
      description:
        "علامة تجمع بين النعومة والدفء، وتقدّم عطوراً يومية راقية بتوليفات زهرية ومسكية. (وصف تجريبي للعرض)",
      logo: null,
      status: "active"
    },
    {
      id: "ibraq",
      name_ar: "إبراق",
      name_en: "Ibraq",
      tagline: "عمق العود والعنبر",
      description:
        "علامة تميل إلى العطور الشرقية والخشبية بتركيز عالٍ وثبات طويل، مناسبة للمساء والمناسبات. (وصف تجريبي للعرض)",
      logo: null,
      status: "active"
    },
    {
      id: "jambool",
      name_ar: "جامبول",
      name_en: "Jambool",
      tagline: "نفحات خفيفة لليوم",
      description:
        "علامة شبابية تقدّم عطوراً خفيفة ومنعشة بحجوم مناسبة للاستخدام اليومي. (وصف تجريبي للعرض)",
      logo: null,
      status: "active"
    }
  ],

  /* الفئات — قابلة للتوسّع. الفئة الرجالية جاهزة وتظهر بحالة فارغة أنيقة */
  categories: [
    { id: "all", label: "جميع العطور" },
    { id: "bestsellers", label: "الأكثر مبيعاً" },
    { id: "new", label: "وصل حديثاً" },
    { id: "women", label: "العطور النسائية" },
    { id: "men", label: "العطور الرجالية", enabled: false }
  ],

  /* العائلات العطرية للتصفية */
  families: [
    { id: "floral", label: "زهري" },
    { id: "amber", label: "عنبري / شرقي" },
    { id: "woody", label: "خشبي" },
    { id: "musk", label: "مسكي" },
    { id: "fruity", label: "فواكه" },
    { id: "green", label: "أخضر / منعش" }
  ],

  /* ------------------------------------------------------------
     المنتجات
     السعر بالدينار الليبي (LYD). أول حجم هو الحجم الافتراضي.
     ------------------------------------------------------------ */
  products: [
    {
      id: "soie-dor",
      name_ar: "سوا دور",
      name_en: "Soie d'Or",
      brandId: "laverne",
      image: "assets/img/products/soie-dor.jpg",
      sizes: [
        { label: "100 مل", price: 265, oldPrice: 310 },
        { label: "50 مل", price: 175 }
      ],
      gender: "women",
      family: "amber",
      concentration: "Eau de Parfum",
      notes: {
        top: ["برغموت", "زهر البرتقال"],
        heart: ["ياسمين", "زهر الفانيلا"],
        base: ["عنبر", "خشب الصندل", "مسك أبيض"]
      },
      description:
        "عطر دافئ ينفتح على نفحة حمضية خفيفة ثم يستقرّ على مزيج من الياسمين والعنبر، بثبات هادئ يناسب المساء.",
      stock: true,
      featured: true,
      newArrival: false,
      bestSeller: true
    },
    {
      id: "rose-eternelle",
      name_ar: "روز إيترنيل",
      name_en: "Rose Éternelle",
      brandId: "laverne",
      image: "assets/img/products/rose-eternelle.jpg",
      sizes: [
        { label: "100 مل", price: 240 },
        { label: "50 مل", price: 155 }
      ],
      gender: "women",
      family: "floral",
      concentration: "Eau de Parfum",
      notes: {
        top: ["الورد الدمشقي", "ليتشي"],
        heart: ["بيوني", "فاوانيا"],
        base: ["مسك", "خشب الأرز"]
      },
      description:
        "وردة ناعمة بلمسة فاكهية، عطر أنثوي مباشر بلا مبالغة، مناسب للاستخدام اليومي والمناسبات القريبة.",
      stock: true,
      featured: false,
      newArrival: true,
      bestSeller: false
    },
    {
      id: "blanc-absolu",
      name_ar: "بلان أبسولو",
      name_en: "Blanc Absolu",
      brandId: "laverne",
      image: "assets/img/products/blanc-absolu.jpg",
      sizes: [{ label: "75 مل", price: 295 }],
      gender: "women",
      family: "musk",
      concentration: "Eau de Parfum",
      notes: {
        top: ["كمثرى", "زنبق الوادي"],
        heart: ["زهر البرتقال", "أيريس"],
        base: ["مسك أبيض", "فانيلا", "خشب الكشمير"]
      },
      description:
        "نظافة هادئة في زجاجة: مسك أبيض وزهور بيضاء على قاعدة فانيلا مخملية. عطر «الجلسة الصباحية» بامتياز.",
      stock: true,
      featured: true,
      newArrival: false,
      bestSeller: false
    },
    {
      id: "nuit-dambre",
      name_ar: "نوي دامبر",
      name_en: "Nuit d'Ambre",
      brandId: "ibraq",
      image: "assets/img/products/nuit-de-ambre.jpg",
      sizes: [
        { label: "100 مل", price: 320 },
        { label: "50 مل", price: 210 }
      ],
      gender: "women",
      family: "amber",
      concentration: "Eau de Parfum Intense",
      notes: {
        top: ["فلفل وردي", "قرنفل"],
        heart: ["عنبر", "لبان"],
        base: ["عود", "بنزوين", "جلد ناعم"]
      },
      description:
        "توليفة عنبرية عميقة تكبر مع الوقت، تنفتح على البهار ثم تسخن باللبان والعود. حضور مسائي واضح.",
      stock: true,
      featured: false,
      newArrival: false,
      bestSeller: true
    },
    {
      id: "noir-oud",
      name_ar: "نوار عود",
      name_en: "Noir Oud",
      brandId: "ibraq",
      image: "assets/img/products/noir-oud.jpg",
      sizes: [{ label: "100 مل", price: 345 }],
      gender: "women",
      family: "woody",
      concentration: "Extrait de Parfum",
      notes: {
        top: ["زعفران", "ورد"],
        heart: ["عود كمبودي", "باتشولي"],
        base: ["صندل", "مسك أسود", "عنبر رمادي"]
      },
      description:
        "عود ناعم مهذّب بالورد والزعفران، ثقيل بذوق. رشّة واحدة تكفي ليوم كامل أو لسهرة.",
      stock: true,
      featured: true,
      newArrival: true,
      bestSeller: false
    },
    {
      id: "ambre-de-soie",
      name_ar: "أمبر دي سوا",
      name_en: "Ambre de Soie",
      brandId: "ibraq",
      image: "assets/img/products/ambre-de-soie.jpg",
      sizes: [
        { label: "50 مل", price: 185 },
        { label: "30 مل", price: 120 }
      ],
      gender: "women",
      family: "amber",
      concentration: "Eau de Toilette",
      notes: {
        top: ["ماندرين", "هيل"],
        heart: ["عنبر", "قرفة"],
        base: ["تونكا", "فانيلا"]
      },
      description:
        "عنبر خفيف بلمسة ماندرين، عطر انتقالي مناسب بين النهار والمساء بحجم صغير يرافقك في الحقيبة.",
      stock: true,
      featured: false,
      newArrival: false,
      bestSeller: false
    },
    {
      id: "jardin-de-figuier",
      name_ar: "جاردان دي فيغييه",
      name_en: "Jardin de Figuier",
      brandId: "jambool",
      image: "assets/img/products/jardin-de-figuier.jpg",
      sizes: [{ label: "100 مل", price: 260 }],
      gender: "women",
      family: "green",
      concentration: "Eau de Parfum",
      notes: {
        top: ["ورق التين", "ليمون أخضر"],
        heart: ["حليب التين", "أوراق الزيتون"],
        base: ["خشب أبيض", "مسك نباتي"]
      },
      description:
        "حديقة في الصباح: ورق تين أخضر وحليب تين دافئ. عطر منعش ولكنه غير متوقّع، مثالي للربيع.",
      stock: true,
      featured: false,
      newArrival: true,
      bestSeller: false
    },
    {
      id: "musc-blanc",
      name_ar: "مسك بلان",
      name_en: "Musc Blanc",
      brandId: "jambool",
      image: "assets/img/products/musc-blanc.jpg",
      sizes: [{ label: "75 مل", price: 210 }],
      gender: "women",
      family: "musk",
      concentration: "Eau de Parfum",
      notes: {
        top: ["بذور القطن", "ألدهيد ناعم"],
        heart: ["زهر القطن", "ياسمين"],
        base: ["مسك أبيض", "صندل", "كشمير"]
      },
      description:
        "مسك أبيض نقي يشبه رائحة الملابس النظيفة بعد الغسيل، هادئ وقريب من الجلد. الأنسب للنهار والعمل.",
      stock: true,
      featured: false,
      newArrival: false,
      bestSeller: true
    },
    {
      id: "prune-de-velours",
      name_ar: "برون دي فيلور",
      name_en: "Prune de Velours",
      brandId: "jambool",
      image: "assets/img/products/prune-de-velours.jpg",
      sizes: [
        { label: "100 مل", price: 280 },
        { label: "50 مل", price: 180 }
      ],
      gender: "women",
      family: "fruity",
      concentration: "Eau de Parfum",
      notes: {
        top: ["خوخ", "برقوق"],
        heart: ["ورد", "باتشولي"],
        base: ["عنبر", "مسك", "خشب"]
      },
      description:
        "برقوق مخملي على قاعدة باتشولي، مزيج حلو ولكنه ناضج. عطر شتوي دافئ بلمسة فاكهية.",
      stock: true,
      featured: false,
      newArrival: true,
      bestSeller: false
    }
  ]
};

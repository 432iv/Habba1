/* ============================================================
   HABBA — هبّة | Storefront application
   Vanilla JS · hash router · no dependencies
   ============================================================ */
(function () {
  "use strict";

  var CFG = window.HABBA_CONFIG;
  var DB = window.HABBA_DATA;

  /* ---------------- Icons (stroke, currentColor) ---------------- */
  var ICONS = {
    menu: '<path d="M4 7h16M4 12h16M4 17h10"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
    bag: '<path d="M6 8h12l1 12H5L6 8z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
    heart: '<path d="M12 20s-7-4.35-7-9a4.2 4.2 0 0 1 7-3 4.2 4.2 0 0 1 7 3c0 4.65-7 9-7 9z"/>',
    home: '<path d="M4 10.5 12 4l8 6.5"/><path d="M6 9.5V20h12V9.5"/>',
    arrowLeft: '<path d="M15 5l-7 7 7 7"/>',
    arrowUpRight: '<path d="M7 17 17 7"/><path d="M9 7h8v8"/>',
    share: '<circle cx="6" cy="12" r="2.2"/><circle cx="17" cy="6" r="2.2"/><circle cx="17" cy="18" r="2.2"/><path d="M8 11l7-4M8 13l7 4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    trash: '<path d="M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    sparkle: '<path d="M12 3.5l1.7 4.9 4.8 1.6-4.8 1.6L12 16.5l-1.7-4.9L5.5 10l4.8-1.6L12 3.5z"/>',
    shield: '<path d="M12 4l7 3v5c0 4.4-3 7.3-7 8-4-.7-7-3.6-7-8V7l7-3z"/><path d="M9.2 12.2l2 2 3.6-3.9"/>',
    truck: '<path d="M3 7h10v9H3z"/><path d="M13 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/>',
    store: '<path d="M4 9l1.5-4h13L20 9"/><path d="M4 9h16v10H4z"/><path d="M9.5 19v-5h5v5"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/>',
    chevronDown: '<path d="M6 9.5l6 6 6-6"/>',
    sliders: '<path d="M4 8h9M17 8h3M4 16h4M12 16h8"/><circle cx="15" cy="8" r="2"/><circle cx="10" cy="16" r="2"/>',
    whatsapp: '<path d="M20.5 11.7a8.5 8.5 0 0 1-12.4 7.6L3.5 20.5l1.3-4.5A8.5 8.5 0 1 1 20.5 11.7z"/><path d="M8.8 8.6c0 3.5 2.8 6.4 6.4 6.4"/>',
    instagram: '<rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="12" cy="12" r="3.4"/><circle cx="16.7" cy="7.3" r=".9" fill="currentColor" stroke="none"/>',
    mail: '<rect x="3.5" y="6" width="17" height="12" rx="2.5"/><path d="M4.5 8.2l7.5 5 7.5-5"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M15 5.5A2.5 2.5 0 0 0 12.5 3h-6A2.5 2.5 0 0 0 4 5.5v6"/>',
    zoom: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5M8.5 11h5"/>',
    external: '<path d="M14 4h6v6"/><path d="M20 4l-8 8"/><path d="M19 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4"/>',
    phone: '<path d="M6 4h3l1.5 4-2 1.5a11 11 0 0 0 5 5L15 12.5 19 14v3a2 2 0 0 1-2 2A13 13 0 0 1 4 6a2 2 0 0 1 2-2z"/>',
    pin: '<path d="M12 21s-6-5.2-6-10a6 6 0 1 1 12 0c0 4.8-6 10-6 10z"/><circle cx="12" cy="11" r="2.2"/>',
    package: '<path d="M12 3l8 4.2v9.6L12 21l-8-4.2V7.2L12 3z"/><path d="M4 7.2l8 4.3 8-4.3M12 21v-9.5"/>',
    leaf: '<path d="M5 19C5 10 11 5 19 5c0 8-5 14-14 14z"/><path d="M5 19l7-7"/>',
    filter: '<path d="M4 6h16M7 12h10M10 18h4"/>'
  };

  function icon(name, cls) {
    return (
      '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"' +
      (cls ? ' class="' + cls + '"' : "") + ">" + ICONS[name] + "</svg>"
    );
  }

  /* ---------------- Helpers ---------------- */
  var app = document.getElementById("app");
  var chrome = document.getElementById("chrome");

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function fmtNum(n) { return Number(n).toLocaleString("en-US"); }
  function moneyHTML(n, opts) {
    opts = opts || {};
    return '<span class="price' + (opts.lg ? " price--lg" : "") + (opts.sale ? " price--sale" : "") + '">' +
      fmtNum(n) + "<small>" + CFG.currencyAr + "</small></span>";
  }
  function brandById(id) {
    for (var i = 0; i < DB.brands.length; i++) if (DB.brands[i].id === id) return DB.brands[i];
    return null;
  }
  function productById(id) {
    for (var i = 0; i < DB.products.length; i++) if (DB.products[i].id === id) return DB.products[i];
    return null;
  }
  function productsOfBrand(id) {
    return DB.products.filter(function (p) { return p.brandId === id; });
  }
  function minPrice(p) {
    return Math.min.apply(null, p.sizes.map(function (s) { return s.price; }));
  }
  function defaultSize(p) { return p.sizes[0]; }
  function hasDiscount(p) { return p.sizes.some(function (s) { return s.oldPrice; }); }
  function familyLabel(id) {
    var f = DB.families.filter(function (x) { return x.id === id; })[0];
    return f ? f.label : "";
  }
  function normalizeAr(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/[\u064B-\u0652\u0670\u0640]/g, "")
      .replace(/[أإآٱ]/g, "ا")
      .replace(/ى/g, "ي")
      .replace(/ة/g, "ه")
      .replace(/ؤ/g, "و")
      .replace(/ئ/g, "ي")
      .replace(/\s+/g, " ")
      .trim();
  }

  /* ---------------- Storage ---------------- */
  var KEY_CART = "habba.cart.v1";
  var KEY_FAVS = "habba.favs.v1";
  var KEY_CAT = "habba.cat.v1";

  function read(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function write(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* ignore */ }
  }

  var state = {
    cart: read(KEY_CART, []),          // [{ id, size, qty }]
    favs: read(KEY_FAVS, []),          // [id]
    cat: read(KEY_CAT, "all"),
    q: "",
    sortBrand: "featured",
    brandFamily: "all",
    brandKey: "",
    lastOrder: "",
    routeKey: ""
  };
  if (!Array.isArray(state.cart)) state.cart = [];
  if (!Array.isArray(state.favs)) state.favs = [];

  function saveCart() { write(KEY_CART, state.cart); }
  function saveFavs() { write(KEY_FAVS, state.favs); }

  function cartCount() {
    return state.cart.reduce(function (n, it) { return n + it.qty; }, 0);
  }
  function cartLineTotal(it) {
    var p = productById(it.id);
    if (!p) return 0;
    var s = p.sizes.filter(function (x) { return x.label === it.size; })[0] || defaultSize(p);
    return s.price * it.qty;
  }
  function cartSubtotal() {
    return state.cart.reduce(function (n, it) { return n + cartLineTotal(it); }, 0);
  }
  function cartQty() { return cartCount(); }

  /* ---------------- Toast ---------------- */
  var toastWrap;
  function toast(msg, ico) {
    if (!toastWrap) return;
    var el = document.createElement("div");
    el.className = "toast";
    el.setAttribute("role", "status");
    el.innerHTML = icon(ico || "check") + "<span>" + esc(msg) + "</span>";
    toastWrap.appendChild(el);
    setTimeout(function () {
      el.classList.add("is-out");
      setTimeout(function () { el.remove(); }, 320);
    }, 2300);
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(function () { return legacyCopy(text); });
    }
    return legacyCopy(text);
  }
  function legacyCopy(text) {
    return new Promise(function (resolve) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch (e) {}
      ta.remove();
      resolve();
    });
  }

  /* ---------------- Router ---------------- */
  function path() {
    return (location.hash || "#/").replace(/^#/, "") || "/";
  }
  function parseRoute() {
    var p = path();
    var m;
    if (p === "/" || p === "") return { view: "home", key: "home" };
    if ((m = p.match(/^\/product\/([\w-]+)$/))) return { view: "product", id: m[1], key: "p:" + m[1] };
    if ((m = p.match(/^\/brand\/([\w-]+)$/))) return { view: "brand", id: m[1], key: "b:" + m[1] };
    if (p === "/search") return { view: "search", key: "search" };
    if (p === "/favorites") return { view: "favorites", key: "favorites" };
    if (p === "/cart") return { view: "cart", key: "cart" };
    if (p === "/checkout") return { view: "checkout", key: "checkout" };
    return { view: "notfound", key: "404" };
  }
  function go(hash) {
    if (location.hash === hash) render();
    else location.hash = hash;
  }

  /* ---------------- Shared UI fragments ---------------- */
  function wordmark(center) {
    return '<a class="wordmark' + (center ? " wordmark--center" : "") + '" href="#/" aria-label="هبّة — الصفحة الرئيسية">' +
      '<span class="wordmark__ar">هبّة</span><span class="wordmark__en">HABBA</span></a>';
  }

  function cartButton() {
    var n = cartCount();
    return '<a class="icon-btn" href="#/cart" aria-label="سلة التسوق' + (n ? " — " + n + " قطعة" : "") + '">' +
      icon("bag") + '<span class="count-badge js-cart-count"' + (n ? "" : " hidden") + ">" + n + "</span></a>";
  }

  function header(opts) {
    opts = opts || {};
    var mode = opts.mode || "home";
    var title = opts.title || "";
    var start, end;

    if (mode === "back" || mode === "brand" || mode === "checkout") {
      start = '<button class="icon-btn" data-back aria-label="رجوع">' + icon("arrowLeft") + "</button>";
    } else if (mode === "plain") {
      start = '<span style="width:42px"></span>';
    } else {
      start = '<button class="icon-btn menu-only-mobile" data-open-drawer aria-expanded="false" aria-controls="drawer" aria-label="فتح القائمة">' + icon("menu") + "</button>";
    }

    if (mode === "product") {
      end = '<button class="icon-btn" data-share aria-label="مشاركة المنتج">' + icon("share") + "</button>";
    } else if (mode === "checkout") {
      end = '<span style="width:42px"></span>';
    } else {
      end = '<div class="site-header__group">' +
        (mode === "cart"
          ? '<a class="icon-btn" href="#/search" aria-label="البحث">' + icon("search") + "</a>"
          : '<a class="icon-btn" href="#/search" aria-label="البحث">' + icon("search") + "</a>") +
        cartButton() + "</div>";
    }

    var middle = mode === "checkout"
      ? '<strong style="font-size:14px;font-weight:600">' + esc(title) + "</strong>"
      : wordmark(true);

    /* Desktop: inline navigation replaces the floating capsule */
    var r = parseRoute();
    var deskNav = (mode === "home" || mode === "brand")
      ? '<nav class="desk-nav" aria-label="التنقل الرئيسي">' +
        '<a href="#/"' + (r.view === "home" ? ' class="is-active" aria-current="page"' : "") + ">الرئيسية</a>" +
        '<a href="#/" data-scroll="products">العطور</a>' +
        DB.brands.filter(function (b) { return b.status === "active"; }).map(function (b) {
          var on = r.view === "brand" && r.id === b.id;
          return '<a href="#/brand/' + b.id + '"' + (on ? ' class="is-active" aria-current="page"' : "") + ">" + esc(b.name_ar) + "</a>";
        }).join("") +
        "</nav>"
      : "";

    /* RTL: start = right side (menu/back), end = left side (search/cart) */
    return '<header class="site-header"><div class="container site-header__inner">' +
      '<div class="site-header__group">' + deskNav + start + "</div>" + middle +
      '<div class="site-header__group">' +
      '<a class="icon-btn desk-only" href="#/favorites" aria-label="المفضلة">' + icon("heart") + "</a>" + end +
      "</div></div></header>";
  }

  function footerHTML() {
    return '<footer class="site-footer"><div class="container">' +
      '<div class="footer-grid">' +
      '<div class="footer-brand">' + wordmark() +
      '<p>متجر متعدد العلامات للعطور في ليبيا. نختار عطوراً من علامات مختلفة ونعرضها في مكان واحد — كل عطر يبقى ملكاً لعلامته المصنّعة.</p>' +
      '<div class="row" style="gap:14px;margin-block-start:12px;color:var(--ink-2)">' +
      '<a href="' + esc(CFG.instagram) + '" target="_blank" rel="noopener" aria-label="إنستغرام" class="icon-btn icon-btn--plain">' + icon("instagram") + "</a>" +
      '<a href="mailto:' + esc(CFG.email) + '" aria-label="البريد الإلكتروني" class="icon-btn icon-btn--plain">' + icon("mail") + "</a>" +
      "</div></div>" +
      '<div class="footer-col"><h4>تسوّقي</h4>' +
      '<a href="#/">جميع العطور</a><a href="#/search">البحث</a><a href="#/favorites">المفضلة</a><a href="#/cart">السلة</a></div>' +
      '<div class="footer-col"><h4>العلامات</h4>' +
      DB.brands.map(function (b) { return '<a href="#/brand/' + b.id + '">' + esc(b.name_ar) + ' <span class="en" lang="en" dir="ltr">— ' + esc(b.name_en) + "</span></a>"; }).join("") +
      "</div></div>" +
      '<div class="footer-legal"><span>© 2026 هبّة HABBA — جميع الحقوق محفوظة.</span>' +
      "<span>الأسعار بالدينار الليبي · التوصيل أو الاستلام من المحل</span></div>" +
      "</div></footer>";
  }

  /* ---------------- Product card ---------------- */
  function badgeHTML(p) {
    if (!p.stock) return '<span class="badge badge--out">نفدت الكمية</span>';
    if (hasDiscount(p) && p.bestSeller) return '<span class="badge badge--sale">عرض خاص</span><span class="badge badge--second">الأكثر مبيعاً</span>';
    if (hasDiscount(p)) return '<span class="badge badge--sale">عرض خاص</span>';
    if (p.newArrival) return '<span class="badge">وصل حديثاً</span>';
    if (p.bestSeller) return '<span class="badge badge--light">الأكثر مبيعاً</span>';
    return "";
  }

  function productCard(p) {
    var b = brandById(p.brandId);
    var s = defaultSize(p);
    var isFav = state.favs.indexOf(p.id) > -1;
    var priceBlock = s.oldPrice
      ? moneyHTML(s.price, { sale: true }) + ' <span class="price price--old">' + fmtNum(s.oldPrice) + "</span>"
      : moneyHTML(s.price);

    return '<article class="pcard" data-product-card="' + p.id + '">' +
      '<div class="pcard__media">' +
      '<a class="pcard__img" href="#/product/' + p.id + '" aria-label="' + esc(p.name_ar) + " من " + esc(b.name_ar) + '">' +
      '<img src="' + esc(p.image) + '" alt="' + esc(p.name_ar) + " — " + esc(b.name_ar) + '" loading="lazy" width="512" height="512">' +
      "</a>" +
      '<div class="pcard__badges" aria-hidden="true">' + badgeHTML(p) + "</div>" +
      '<button class="fav-btn' + (isFav ? " is-on" : "") + '" data-fav="' + p.id + '" aria-pressed="' + isFav + '" aria-label="' +
      (isFav ? "إزالة من المفضلة" : "إضافة إلى المفضلة") + '">' + icon("heart") + "</button>" +
      "</div>" +
      '<div class="pcard__body">' +
      '<div class="pcard__brand"><span>' + esc(b.name_ar) + '</span><span class="en">' + esc(b.name_en) + "</span></div>" +
      '<a class="pcard__name" href="#/product/' + p.id + '">' + esc(p.name_ar) + "</a>" +
      '<div class="pcard__price-row">' + priceBlock + "</div>" +
      "</div></article>";
  }

  function productGrid(list) {
    return '<div class="grid-products">' + list.map(productCard).join("") + "</div>";
  }

  /* ---------------- Filtering / sorting ---------------- */
  function catLabel(id) {
    var c = DB.categories.filter(function (x) { return x.id === id; })[0];
    return c ? c.label : "";
  }
  function filterByCategory(list, cat) {
    if (cat === "bestsellers") return list.filter(function (p) { return p.bestSeller; });
    if (cat === "new") return list.filter(function (p) { return p.newArrival; });
    if (cat === "women") return list.filter(function (p) { return p.gender === "women"; });
    if (cat === "men") return list.filter(function (p) { return p.gender === "men"; });
    return list;
  }
  function sortList(list, sort) {
    var arr = list.slice();
    if (sort === "price-asc") arr.sort(function (a, b) { return minPrice(a) - minPrice(b); });
    else if (sort === "price-desc") arr.sort(function (a, b) { return minPrice(b) - minPrice(a); });
    else if (sort === "newest") arr.sort(function (a, b) { return (b.newArrival ? 1 : 0) - (a.newArrival ? 1 : 0); });
    else arr.sort(function (a, b) { return (b.featured ? 1 : 0) - (a.featured ? 1 : 0); });
    return arr;
  }

  /* ---------------- Home ---------------- */
  function categoriesRail(active) {
    return '<div class="rail" role="tablist" aria-label="فئات العطور">' +
      DB.categories.map(function (c) {
        var disabled = c.enabled === false;
        return '<button class="pill' + (c.id === active ? " is-active" : "") + '" data-cat="' + c.id + '" role="tab" aria-selected="' +
          (c.id === active) + '"' + (disabled ? ' data-soon="1" aria-describedby="soonNote"' : "") + ">" +
          esc(c.label) + (disabled ? ' <span class="cnt" id="soonNote">قريباً</span>' : "") + "</button>";
      }).join("") + "</div>";
  }

  function brandTiles() {
    return '<div class="brand-rail" aria-label="العلامات التجارية">' +
      DB.brands.filter(function (b) { return b.status === "active"; }).map(function (b) {
        var n = productsOfBrand(b.id).length;
        return '<a class="brand-tile" href="#/brand/' + b.id + '">' +
          '<div><div class="brand-tile__en">' + esc(b.name_en) + '</div><div class="brand-tile__ar">' + esc(b.name_ar) + " · " + esc(b.tagline) + "</div></div>" +
          '<div class="brand-tile__foot"><span class="brand-tile__count">' + n + " عطور</span>" +
          '<span class="brand-tile__arrow">' + icon("arrowUpRight") + "</span></div></a>";
      }).join("") + "</div>";
  }

  function homeView() {
    var list = sortList(filterByCategory(DB.products, state.cat), "featured");
    return header({ mode: "home" }) +
      '<main id="main" class="container view">' +

      '<section class="hero" aria-labelledby="heroTitle">' +
      '<div class="hero__copy">' +
      '<span class="hero__eyebrow">متجر عطور متعدد العلامات</span>' +
      '<h1 class="hero__title" id="heroTitle">اكتشفي عطرك المفضل</h1>' +
      '<p class="hero__text">عطور مختارة بعناية لتناسب ذوقك، من علامات مختلفة في مكان واحد.</p>' +
      '<div class="hero__cta">' +
      '<button class="btn btn--primary" data-scroll="products">تسوّقي الآن ' + icon("arrowUpRight") + "</button>" +
      '<button class="btn btn--ghost" data-scroll="brands">حسب العلامة</button>' +
      "</div>" +
      '<div class="hero__trust">' +
      "<span>" + icon("truck") + " توصيل أو استلام من المحل</span>" +
      "<span>" + icon("whatsapp") + " اطلبي عبر واتساب</span>" +
      "</div></div>" +
      '<div class="hero__media" aria-hidden="true">' +
      '<div class="hero-disc hero-disc--main"><img src="assets/img/products/soie-dor.jpg" alt="" width="512" height="512"></div>' +
      '<div class="hero-disc hero-disc--sub"><img src="assets/img/products/rose-eternelle.jpg" alt="" width="512" height="512"></div>' +
      '<span class="hero-spark">' + icon("sparkle") + "</span>" +
      "</div></section>" +

      '<section class="section section--tight" aria-label="تصفية حسب الفئة">' +
      '<div id="catRail">' + categoriesRail(state.cat) + "</div></section>" +

      '<section class="section" id="brands" aria-labelledby="brandsTitle">' +
      '<div class="section-head"><div><h2 class="section-title" id="brandsTitle">تسوّقي حسب العلامة التجارية</h2>' +
      '<p class="section-sub">هبّة متجر متعدد العلامات — كل عطر يحمل علامته المصنّعة.</p></div></div>' +
      brandTiles() + "</section>" +

      '<section class="section" id="products" aria-labelledby="productsTitle">' +
      '<div class="section-head"><div><h2 class="section-title" id="productsTitle">اختيارات هبّة</h2>' +
      '<p class="section-sub" id="gridCount">' + list.length + " عطراً · " + esc(catLabel(state.cat)) + "</p></div>" +
      '<button class="link-more" data-cat="all">عرض الكل ' + icon("arrowUpRight") + "</button></div>" +
      '<div id="homeGrid" aria-live="polite">' + productGrid(list) + "</div></section>" +

      '<section class="section section--tight" aria-label="معلومات المتجر">' +
      '<div class="trust-card">' +
      '<div class="trust-item">' + icon("store") + "<span>استلام من المحل<br>أو توصيل</span></div>" +
      '<div class="trust-item">' + icon("whatsapp") + "<span>الطلب يتم<br>عبر واتساب</span></div>" +
      '<div class="trust-item">' + icon("package") + "<span>بدون حساب<br>شراء سريع</span></div>" +
      "</div></section>" +
      "</main>" + footerHTML();
  }

  /* ---------------- Product page ---------------- */
  var pdp = null; // { id, sizeIndex, thumb }

  function pdpView(id) {
    var p = productById(id);
    if (!p) return notFoundView("لم نجد هذا العطر");

    var b = brandById(p.brandId);
    var si = 0;
    var size = p.sizes[si];
    pdp = { id: p.id, sizeIndex: si };

    var isFav = state.favs.indexOf(p.id) > -1;
    var related = DB.products
      .filter(function (x) { return x.id !== p.id && (x.brandId === p.brandId || x.family === p.family); })
      .slice(0, 6);

    var badges = [];
    if (p.newArrival) badges.push('<span class="chip">' + icon("sparkle") + " وصل حديثاً</span>");
    if (p.bestSeller) badges.push('<span class="chip">' + icon("check") + " الأكثر مبيعاً</span>");

    return header({ mode: "product" }) +
      '<main id="main" class="container view">' +
      '<div class="pdp">' +

      /* media */
      '<div class="pdp__media-col">' +
      '<div class="pdp__media">' +
      '<div class="pdp__img" id="pdpMainImg"><img src="' + esc(p.image) + '" alt="' + esc(p.name_ar) + " من " + esc(b.name_ar) + '" id="pdpImgEl" width="900" height="900"></div>' +
      '<button class="fav-btn' + (isFav ? " is-on" : "") + '" data-fav="' + p.id + '" aria-pressed="' + isFav + '" aria-label="' +
      (isFav ? "إزالة من المفضلة" : "إضافة إلى المفضلة") + '">' + icon("heart") + "</button>" +
      "</div>" +
      '<div class="pdp__thumbs" role="group" aria-label="صور المنتج">' +
      ['عرض كامل', 'تقريب متوسط', 'تقريب قريب'].map(function (t, i) {
        return '<button class="pdp__thumb' + (i === 0 ? " is-active" : "") + '" data-thumb="' + i + '" aria-label="' + t + '">' +
          '<img src="' + esc(p.image) + '" alt=""></button>';
      }).join("") +
      "</div></div>" +

      /* info */
      '<div class="pdp__info">' +
      '<div class="pdp__brand-row">' +
      '<a href="#/brand/' + b.id + '">' + icon("store") + esc(b.name_en) + "</a>" +
      '<span class="dot"></span><span>' + esc(familyLabel(p.family)) + "</span>" +
      (p.concentration ? '<span class="dot"></span><span>' + esc(p.concentration) + "</span>" : "") +
      "</div>" +
      '<h1 class="pdp__title">' + esc(p.name_ar) + "</h1>" +
      '<div class="pdp__meta">' + badges.map(function (x) { return x; }).join("") +
      (p.stock ? '<span class="chip">' + icon("check") + " متوفر</span>" : '<span class="chip">نفدت الكمية</span>') + "</div>" +

      '<div class="pdp__price-row" id="pdpPriceRow">' + priceHTMLForSize(p, size) + "</div>" +

      '<p class="pdp__desc">' + esc(p.description) + "</p>" +

      '<div class="opt-block">' +
      '<div class="opt-block__label"><span>الحجم</span><strong>' + esc(size.label) + "</strong></div>" +
      '<div class="size-row">' +
      p.sizes.map(function (s, i) {
        return '<button class="size-btn' + (i === si ? " is-active" : "") + '" data-size-index="' + i + '"' +
          (p.stock ? "" : " disabled") + ' aria-pressed="' + (i === si) + '">' + esc(s.label) +
          '<span class="sz-price">' + fmtNum(s.price) + "</span></button>";
      }).join("") + "</div></div>" +

      '<div class="pdp__buy">' +
      '<div class="qty" role="group" aria-label="الكمية">' +
      '<button data-pdp-minus aria-label="تقليل الكمية">' + icon("minus") + "</button>" +
      '<span class="qty__val" id="pdpQty">1</span>' +
      '<button data-pdp-plus aria-label="زيادة الكمية">' + icon("plus") + "</button></div>" +
      '<button class="btn btn--primary" data-add-to-cart="' + p.id + '"' + (p.stock ? "" : " disabled") + ">" +
      (p.stock ? "أضيفي إلى السلة" : "غير متوفر") + "</button></div>" +

      '<div class="notes-card">' +
      '<div class="notes-card__head"><span class="notes-card__title">' + icon("leaf") + " هرم النفحات</span>" +
      '<span class="tiny">' + esc(p.concentration || "") + "</span></div>" +
      '<div class="notes-grid">' +
      noteCol("المقدمة", p.notes.top) +
      noteCol("القلب", p.notes.heart) +
      noteCol("القاعدة", p.notes.base) +
      "</div></div>" +

      '<div class="spec">' +
      specRow("العلامة التجارية", b.name_ar + " — " + b.name_en) +
      specRow("العائلة العطرية", familyLabel(p.family)) +
      specRow("التركيز", p.concentration || "—") +
      specRow("الأحجام المتوفرة", p.sizes.map(function (s) { return s.label; }).join(" · ")) +
      specRow("الفئة", p.gender === "women" ? "نسائي" : p.gender === "men" ? "رجالي" : "للجنسين") +
      "</div>" +

      '<div class="demo-note">' + icon("info") + "<span>بيانات المنتج (الوصف، النفحات، السعر) تجريبية للعرض فقط وليست معلومات رسمية من العلامة.</span></div>" +

      '<div class="trust-row">' +
      '<div class="trust-item">' + icon("truck") + "<span>توصيل داخل ليبيا</span></div>" +
      '<div class="trust-item">' + icon("store") + "<span>استلام من المحل</span></div>" +
      '<div class="trust-item">' + icon("whatsapp") + "<span>متابعة عبر واتساب</span></div>" +
      "</div></div></div>" +

      (related.length
        ? '<section class="section" aria-labelledby="relTitle"><div class="section-head">' +
          '<h2 class="section-title" id="relTitle">قد يعجبك أيضاً</h2>' +
          '<a class="link-more" href="#/brand/' + b.id + '">كل عطور ' + esc(b.name_ar) + " " + icon("arrowUpRight") + "</a></div>" +
          '<div class="h-rail">' + related.map(railCard).join("") + "</div></section>"
        : "") +
      "</main>" +

      '<div class="buybar" role="region" aria-label="شراء سريع">' +
      '<div class="buybar__inner">' +
      '<div class="buybar__price"><span class="price" id="buybarPrice">' + fmtNum(size.price) + "<small>" + CFG.currencyAr + "</small></span>" +
      '<small id="buybarSize">' + esc(size.label) + "</small></div>" +
      '<button class="btn btn--primary" data-add-to-cart="' + p.id + '"' + (p.stock ? "" : " disabled") + ">" +
      (p.stock ? "أضيفي إلى السلة" : "غير متوفر") + "</button></div></div>" +
      footerHTML();
  }

  function priceHTMLForSize(p, s) {
    return (s.oldPrice
      ? moneyHTML(s.price, { lg: true, sale: true }) + ' <span class="price price--old">' + fmtNum(s.oldPrice) + "</span>"
      : moneyHTML(s.price, { lg: true })) +
      '<span class="tiny" style="font-family:var(--font-ar)">' + esc(s.label) + "</span>";
  }
  function noteCol(label, arr) {
    return '<div class="note-col"><div class="note-col__label">' + esc(label) + "</div>" +
      '<div class="note-col__list">' + (arr && arr.length ? arr.map(esc).join("<br>") : "—") + "</div></div>";
  }
  function specRow(k, v) {
    return '<div class="spec__row"><span class="spec__key">' + esc(k) + '</span><span class="spec__val">' + esc(v) + "</span></div>";
  }
  function railCard(p) {
    var b = brandById(p.brandId);
    return '<a class="pcard" href="#/product/' + p.id + '">' +
      '<div class="pcard__media"><div class="pcard__img"><img src="' + esc(p.image) + '" alt="' + esc(p.name_ar) + '" loading="lazy"></div></div>' +
      '<div class="pcard__body"><span class="pcard__name">' + esc(p.name_ar) + '</span><span class="pcard__brand">' + esc(b.name_ar) + "</span>" +
      '<div class="pcard__price-row">' + moneyHTML(minPrice(p)) + "</div></div></a>";
  }

  /* ---------------- Brand collection ---------------- */
  function brandView(id) {
    var b = brandById(id);
    if (!b) return notFoundView("لم نجد هذه العلامة");
    var brandProducts = productsOfBrand(id);
    var familiesInBrand = DB.families.filter(function (f) {
      return brandProducts.some(function (p) { return p.family === f.id; });
    });
    var filtered = state.brandFamily && state.brandFamily !== "all"
      ? brandProducts.filter(function (p) { return p.family === state.brandFamily; })
      : brandProducts;
    var list = sortList(filtered, state.sortBrand);
    var others = DB.brands.filter(function (x) { return x.id !== id && x.status === "active"; });

    return header({ mode: "brand" }) +
      '<main id="main" class="container view">' +
      '<div class="crumbs"><a href="#/">الرئيسية</a>' + icon("arrowLeft") + '<span>العلامات</span>' + icon("arrowLeft") +
      "<span>" + esc(b.name_ar) + "</span></div>" +
      '<section class="brand-hero section--tight" aria-labelledby="bTitle">' +
      (brandProducts[0] ? '<div class="brand-hero__media" aria-hidden="true"><img src="' + esc(brandProducts[0].image) + '" alt="" width="900" height="900"></div>' : "") +
      '<div class="brand-hero__copy">' +
      '<span class="hero__eyebrow">علامة تجارية</span>' +
      '<h1 class="brand-hero__en" id="bTitle" lang="en">' + esc(b.name_en) + "</h1>" +
      '<div class="brand-hero__ar">' + esc(b.name_ar) + " · " + esc(b.tagline) + "</div>" +
      '<p class="brand-hero__desc">' + esc(b.description) + "</p>" +
      '<div class="brand-hero__meta"><span class="chip">' + icon("package") + list.length + " عطور</span>" +
      '<span class="chip">' + icon("store") + " تُباع لدى هبّة</span></div>" +
      "</div></section>" +

      '<section class="section" aria-label="منتجات العلامة">' +
      '<div class="rail" role="group" aria-label="تصفية حسب العائلة العطرية" style="margin-block-end:14px">' +
      '<button class="pill pill--sm' + (!state.brandFamily || state.brandFamily === "all" ? " is-active" : "") + '" data-brand-family="all">الكل <span class="cnt">' + brandProducts.length + "</span></button>" +
      familiesInBrand.map(function (f) {
        var n = brandProducts.filter(function (p) { return p.family === f.id; }).length;
        return '<button class="pill pill--sm' + (state.brandFamily === f.id ? " is-active" : "") + '" data-brand-family="' + f.id + '">' + esc(f.label) + ' <span class="cnt">' + n + "</span></button>";
      }).join("") + "</div>" +
      '<div class="toolbar"><span class="toolbar__count">' + list.length + " عطراً</span>" +
      '<div class="toolbar__right">' +
      '<label class="sr-only" for="sortBrand">ترتيب المنتجات</label>' +
      '<div class="select-wrap">' + icon("chevronDown") +
      '<select class="select" id="sortBrand" data-sort-brand>' +
      sortOption("featured", "مختارة") + sortOption("newest", "الأحدث") +
      sortOption("price-asc", "السعر: من الأقل") + sortOption("price-desc", "السعر: من الأعلى") +
      "</select></div></div></div>" +
      productGrid(list) +
      '<p class="demo-note">' + icon("info") + "<span>هبّة متجر مستقل متعدد العلامات؛ هذه الصفحة جزء من متجر هبّة وليست الموقع الرسمي للعلامة.</span></p>" +
      "</section>" +

      (others.length
        ? '<section class="section" aria-labelledby="otTitle"><div class="section-head"><h2 class="section-title" id="otTitle">علامات أخرى لدى هبّة</h2></div>' +
          '<div class="brand-rail">' + others.map(function (o) {
            return '<a class="brand-tile" href="#/brand/' + o.id + '" style="min-height:104px">' +
              '<div><div class="brand-tile__en">' + esc(o.name_en) + '</div><div class="brand-tile__ar">' + esc(o.name_ar) + "</div></div>" +
              '<div class="brand-tile__foot"><span class="brand-tile__count">' + productsOfBrand(o.id).length + " عطور</span>" +
              '<span class="brand-tile__arrow">' + icon("arrowUpRight") + "</span></div></a>";
          }).join("") + "</div></section>"
        : "") +
      "</main>" + footerHTML();
  }
  function sortOption(v, label) {
    return '<option value="' + v + '"' + (state.sortBrand === v ? " selected" : "") + ">" + esc(label) + "</option>";
  }

  /* ---------------- Search ---------------- */
  function searchMatches(q) {
    var nq = normalizeAr(q);
    if (!nq) return [];
    return DB.products.filter(function (p) {
      var b = brandById(p.brandId);
      var hay = normalizeAr([
        p.name_ar, p.name_en, b.name_ar, b.name_en,
        familyLabel(p.family), p.concentration,
        p.gender === "women" ? "نسائي نساء" : "رجالي رجال"
      ].join(" "));
      return nq.split(" ").every(function (t) { return hay.indexOf(t) > -1; });
    });
  }

  function searchView() {
    return header({ mode: "back" }) +
      '<main id="main" class="container view search-shell">' +
      '<div class="page-head"><h1 class="page-title">البحث</h1>' +
      '<p class="page-sub">ابحثي باسم العطر، العلامة، أو العائلة العطرية.</p></div>' +
      '<div class="searchbar" role="search">' + icon("search") +
      '<label class="sr-only" for="q">البحث في المتجر</label>' +
      '<input id="q" type="search" autocomplete="off" placeholder="مثال: عود، لافيرن، زهري…" value="' + esc(state.q) + '" enterkeyhint="search">' +
      '<button class="searchbar__clear' + (state.q ? "" : " hide") + '" id="qClear" data-clear-search aria-label="مسح البحث">' + icon("close") + "</button>" +
      "</div>" +
      '<div id="searchSuggest" class="' + (state.q ? "hide" : "") + '">' +
      '<div class="suggest" style="margin-block-start:16px"><span class="suggest-label">اقتراحات:</span>' +
      DB.brands.map(function (b) { return '<button class="pill pill--sm" data-suggest="' + esc(b.name_en) + '">' + esc(b.name_ar) + "</button>"; }).join("") +
      ['عود', 'زهري', 'مسك', 'جديد'].map(function (t) { return '<button class="pill pill--sm" data-suggest="' + esc(t) + '">' + esc(t) + "</button>"; }).join("") +
      "</div>" +
      '<section class="section"><div class="section-head"><h2 class="section-title">العلامات</h2></div>' + brandTiles() + "</section>" +
      "</div>" +
      '<div id="searchResults" aria-live="polite" class="section"></div>' +
      "</main>" + footerHTML();
  }

  function renderSearchResults(immediate) {
    var box = document.getElementById("searchResults");
    var sug = document.getElementById("searchSuggest");
    var clearBtn = document.getElementById("qClear");
    if (!box) return;
    var q = state.q.trim();
    if (sug) sug.classList.toggle("hide", !!q);
    if (clearBtn) clearBtn.classList.toggle("hide", !q);

    if (!q) { box.innerHTML = ""; return; }

    box.innerHTML = skeletonGrid(Math.min(6, DB.products.length));
    var token = (renderSearchResults.token = (renderSearchResults.token || 0) + 1);
    setTimeout(function () {
      if (token !== renderSearchResults.token) return;
      var results = sortList(searchMatches(q), "featured");
      if (!results.length) {
        box.innerHTML = '<div class="empty"><div class="empty__icon">' + icon("search") + "</div>" +
          "<h3>لا توجد نتائج لـ «" + esc(q) + "»</h3>" +
          "<p>جرّبي كلمة أقصر أو ابحثي باسم العلامة التجارية.</p>" +
          '<button class="btn btn--ghost btn--sm" data-clear-search>مسح البحث</button></div>';
        return;
      }
      box.innerHTML = '<div class="toolbar"><span class="toolbar__count">' + results.length + " نتيجة</span></div>" + productGrid(results);
    }, immediate ? 60 : 240);
  }

  function skeletonGrid(n) {
    var out = '<div class="grid-products" aria-hidden="true">';
    for (var i = 0; i < n; i++) {
      out += '<div class="sk-card"><div class="sk sk-img"></div><div class="sk sk-line w60"></div><div class="sk sk-line w40"></div></div>';
    }
    return out + "</div>";
  }

  /* ---------------- Favorites ---------------- */
  function favoritesView() {
    var list = DB.products.filter(function (p) { return state.favs.indexOf(p.id) > -1; });
    return header({ mode: "back" }) +
      '<main id="main" class="container view">' +
      '<div class="page-head"><h1 class="page-title">المفضلة</h1>' +
      '<p class="page-sub">' + (list.length ? list.length + " عطراً محفوظاً على هذا الجهاز." : "احفظي العطور التي تحبينها لتعودي إليها لاحقاً.") + "</p></div>" +
      '<section class="section">' +
      (list.length
        ? productGrid(list)
        : '<div class="empty"><div class="empty__icon">' + icon("heart") + "</div>" +
          "<h3>قائمة المفضلة فارغة</h3><p>اضغطي على القلب في أي عطر لحفظه هنا، دون الحاجة إلى إنشاء حساب.</p>" +
          '<a class="btn btn--primary" href="#/">تسوّقي العطور</a></div>') +
      "</section></main>" + footerHTML();
  }

  /* ---------------- Cart ---------------- */
  function cartView() {
    var items = state.cart;
    var sub = cartSubtotal();
    var body;

    if (!items.length) {
      body = '<div class="empty"><div class="empty__icon">' + icon("bag") + "</div>" +
        "<h3>سلتك فارغة</h3><p>أضيفي عطراً واحداً على الأقل لإتمام الطلب.</p>" +
        '<a class="btn btn--primary" href="#/">تسوّقي الآن</a></div>';
    } else {
      body = '<div class="cart-layout">' +
        '<div class="cart-list">' + items.map(cartItemHTML).join("") +
        '<div class="row row--between" style="margin-block-start:12px">' +
        '<a class="link-more" href="#/">' + icon("plus") + " إضافة عطور أخرى</a>" +
        '<button class="link-more" data-clear-cart>' + icon("trash") + " إفراغ السلة</button></div></div>" +
        '<aside class="cart-aside"><div class="summary">' +
        '<h2 class="summary__title">ملخص الطلب</h2>' +
        '<div class="summary__row"><span>المجموع الفرعي (' + cartQty() + ' قطعة)</span>' + moneyHTML(sub) + "</div>" +
        '<div class="summary__row"><span>التوصيل</span><span class="tiny">يُحسب عند اختيار طريقة الاستلام</span></div>' +
        (sub >= CFG.freeDeliveryThreshold
          ? '<div class="free-ship">' + icon("truck") + " طلبك مؤهل للتوصيل المجاني داخل طرابلس</div>"
          : '<div class="free-ship">' + icon("truck") + " توصيل مجاني فوق " + fmtNum(CFG.freeDeliveryThreshold) + " د.ل</div>") +
        '<div class="summary__row summary__row--total"><span>الإجمالي</span>' + moneyHTML(sub) + "</div>" +
        '<a class="btn btn--primary btn--block" href="#/checkout">إتمام الطلب ' + icon("arrowUpRight") + "</a>" +
        '<p class="summary__note">لا حاجة لإنشاء حساب. سيتم تجهيز طلبك وإرساله إلى المتجر عبر واتساب.</p>' +
        "</div></aside></div>";
    }

    return header({ mode: "cart" }) +
      '<main id="main" class="container view">' +
      '<div class="page-head"><h1 class="page-title">سلة التسوق</h1>' +
      '<p class="page-sub">' + (items.length ? cartQty() + " قطعة في سلتك." : "أضيفي عطورك المفضلة.") + "</p></div>" +
      '<section class="section">' + body + "</section></main>" + footerHTML();
  }

  function cartItemHTML(it) {
    var p = productById(it.id);
    if (!p) return "";
    var b = brandById(p.brandId);
    var s = p.sizes.filter(function (x) { return x.label === it.size; })[0] || defaultSize(p);
    var key = it.id + "|" + it.size;
    return '<article class="cart-item">' +
      '<a class="cart-item__img" href="#/product/' + p.id + '" aria-label="' + esc(p.name_ar) + '">' +
      '<img src="' + esc(p.image) + '" alt="" loading="lazy"></a>' +
      '<div class="cart-item__main">' +
      '<div class="cart-item__top"><div><div class="cart-item__name">' + esc(p.name_ar) + "</div>" +
      '<div class="cart-item__brand">' + esc(b.name_ar) + ' · <span lang="en">' + esc(s.label) + "</span></div></div>" +
      '<button class="cart-item__remove" data-remove="' + esc(key) + '" aria-label="حذف ' + esc(p.name_ar) + ' من السلة">' + icon("trash") + "</button></div>" +
      '<div class="cart-item__bottom">' +
      '<div class="qty qty--sm" role="group" aria-label="كمية ' + esc(p.name_ar) + '">' +
      '<button data-qty-minus="' + esc(key) + '" aria-label="تقليل الكمية">' + icon("minus") + "</button>" +
      '<span class="qty__val">' + it.qty + "</span>" +
      '<button data-qty-plus="' + esc(key) + '" aria-label="زيادة الكمية">' + icon("plus") + "</button></div>" +
      '<div class="cart-item__price">' + moneyHTML(cartLineTotal(it)) +
      '<div class="cart-item__unit">' + fmtNum(s.price) + " × " + it.qty + "</div></div>" +
      "</div></div></article>";
  }

  /* ---------------- Checkout ---------------- */
  function checkoutView() {
    if (!state.cart.length) {
      return header({ mode: "checkout", title: "إتمام الطلب" }) +
        '<main id="main" class="container view">' +
        '<div class="empty" style="padding-block-start:60px"><div class="empty__icon">' + icon("bag") + "</div>" +
        "<h3>لا يمكن إتمام الطلب</h3><p>سلتك فارغة حالياً. أضيفي عطراً أولاً.</p>" +
        '<a class="btn btn--primary" href="#/">تسوّقي الآن</a></div></main>' + footerHTML();
    }

    var sub = cartSubtotal();
    var fee = sub >= CFG.freeDeliveryThreshold ? 0 : CFG.deliveryFee;

    return header({ mode: "checkout", title: "إتمام الطلب" }) +
      '<main id="main" class="container view">' +
      '<div class="page-head"><h1 class="page-title">إتمام الطلب</h1>' +
      '<p class="page-sub">لا حاجة لإنشاء حساب — املئي بياناتك وسنستلم طلبك عبر واتساب.</p></div>' +

      '<div class="cart-layout">' +
      '<form class="checkout-form" id="checkoutForm" novalidate>' +

      '<div class="form-card"><h2 class="form-card__title"><span class="step">1</span> بياناتك</h2>' +
      '<div class="field" id="fName"><label for="custName">الاسم الكامل <span class="req">*</span></label>' +
      '<input class="input" id="custName" name="name" autocomplete="name" placeholder="مثال: سارة أحمد">' +
      '<div class="field__error">الرجاء إدخال الاسم (3 أحرف على الأقل).</div></div>' +
      '<div class="field" id="fPhone"><label for="custPhone">رقم الهاتف / واتساب <span class="req">*</span></label>' +
      '<input class="input" id="custPhone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="09X XXX XXXX" dir="ltr" style="text-align:right">' +
      '<div class="field__error">الرجاء إدخال رقم هاتف صحيح (9 أرقام على الأقل).</div></div></div>' +

      '<div class="form-card"><h2 class="form-card__title"><span class="step">2</span> طريقة الاستلام</h2>' +
      '<div class="radio-row">' +
      '<label class="radio-card"><input type="radio" name="method" value="pickup">' +
      '<span class="radio-card__check" aria-hidden="true"></span>' +
      '<span class="radio-card__title">' + icon("store") + " استلام من المحل</span>" +
      '<span class="radio-card__sub">بدون رسوم · العنوان يُرسل مع التأكيد</span></label>' +
      '<label class="radio-card"><input type="radio" name="method" value="delivery" checked>' +
      '<span class="radio-card__check" aria-hidden="true"></span>' +
      '<span class="radio-card__title">' + icon("truck") + " التوصيل</span>" +
      '<span class="radio-card__sub">' + fmtNum(CFG.deliveryFee) + " د.ل · مجاني فوق " + fmtNum(CFG.freeDeliveryThreshold) + " د.ل</span></label>" +
      "</div>" +
      '<div class="field" id="fAddress" style="margin-block-start:14px"><label for="custAddress">عنوان التوصيل <span class="req">*</span></label>' +
      '<textarea class="textarea" id="custAddress" name="address" placeholder="المدينة، المنطقة، الشارع، أقرب علامة مميزة…"></textarea>' +
      '<div class="field__error">الرجاء إدخال عنوان التوصيل.</div></div>' +
      '<div class="field"><label for="custNote">ملاحظات (اختياري)</label>' +
      '<textarea class="textarea" id="custNote" name="note" placeholder="مثال: التوصيل بعد الساعة 5 مساءً" style="min-height:64px"></textarea></div>' +
      "</div>" +

      '<div class="form-card"><h2 class="form-card__title"><span class="step">3</span> مراجعة الطلب</h2>' +
      '<div class="order-lines">' + state.cart.map(orderLineHTML).join("") + "</div>" +
      '<div class="summary__row summary__row--total" style="margin-block-start:4px"><span>الإجمالي</span>' + moneyHTML(sub + fee) + "</div>" +
      '<p class="summary__note">بالضغط على «تأكيد الطلب» سيُفتح واتساب برسالة جاهزة تحتوي تفاصيل طلبك، ثم ترسلينها للمتجر.</p>' +
      "</div></form>" +

      '<aside class="cart-aside"><div class="summary">' +
      '<h2 class="summary__title">ملخص الطلب</h2>' +
      '<div class="summary__row"><span>المجموع الفرعي (' + cartQty() + ')</span>' + moneyHTML(sub) + "</div>" +
      '<div class="summary__row"><span>رسوم التوصيل</span><span id="sumDelivery" class="en">' + (fee ? fmtNum(fee) + " " + CFG.currencyEn : "مجاناً") + "</span></div>" +
      '<div class="summary__row summary__row--total"><span>الإجمالي</span>' + moneyHTML(sub + fee) + "</div>" +
      '<button class="btn btn--primary btn--block" type="submit" form="checkoutForm">تأكيد الطلب عبر واتساب ' + icon("whatsapp") + "</button>" +
      '<p class="summary__note">' + icon("info") + " إن لم يُفتح واتساب تلقائياً، ستظهر لك نسخة من رسالة الطلب مع زر لنسخها.</p>" +
      "</div></aside></div></main>" +

      '<div class="buybar" role="region" aria-label="تأكيد الطلب">' +
      '<div class="buybar__inner">' +
      '<div class="buybar__price"><span class="price">' + fmtNum(sub + fee) + "<small>" + CFG.currencyAr + "</small></span><small>الإجمالي</small></div>" +
      '<button class="btn btn--primary" type="submit" form="checkoutForm">تأكيد الطلب ' + icon("whatsapp") + "</button></div></div>" +
      footerHTML();
  }

  function orderLineHTML(it) {
    var p = productById(it.id);
    if (!p) return "";
    var b = brandById(p.brandId);
    return '<div class="order-line"><span class="order-line__img"><img src="' + esc(p.image) + '" alt="" loading="lazy"></span>' +
      '<span class="order-line__name"><strong>' + esc(p.name_ar) + " · " + it.size + "</strong>" +
      "<span>" + esc(b.name_ar) + " · " + it.qty + " × " + fmtNum(cartLineTotal(it) / it.qty) + "</span></span>" +
      moneyHTML(cartLineTotal(it)) + "</div>";
  }

  /* ---------------- Not found ---------------- */
  function notFoundView(msg) {
    return header({ mode: "back" }) +
      '<main id="main" class="container view">' +
      '<div class="empty" style="padding-block-start:70px"><div class="empty__icon">' + icon("info") + "</div>" +
      "<h3>" + esc(msg || "الصفحة غير موجودة") + "</h3><p>يمكنك العودة إلى الصفحة الرئيسية ومتابعة التسوق.</p>" +
      '<a class="btn btn--primary" href="#/">العودة للرئيسية</a></div></main>' + footerHTML();
  }

  /* ---------------- Chrome: drawer, nav, toast, modal ---------------- */
  function drawerHTML() {
    return '<div class="overlay" id="overlay" data-close-drawer></div>' +
      '<aside class="drawer" id="drawer" role="dialog" aria-modal="true" aria-label="قائمة التنقل" aria-hidden="true">' +
      '<div class="drawer__head">' + wordmark() +
      '<button class="icon-btn icon-btn--plain" data-close-drawer aria-label="إغلاق القائمة">' + icon("close") + "</button></div>" +
      '<div class="drawer__body">' +
      '<div class="drawer__group"><div class="drawer__label">التسوق</div>' +
      '<a class="drawer__link" href="#/">الرئيسية' + icon("arrowLeft") + "</a>" +
      DB.categories.filter(function (c) { return ["all", "bestsellers", "new", "women"].indexOf(c.id) > -1; }).map(function (c) {
        return '<a class="drawer__link" href="#/" data-cat="' + c.id + '" data-close-drawer>' + esc(c.label) + icon("arrowLeft") + "</a>";
      }).join("") +
      '<a class="drawer__link" href="#/" data-soon-drawer>العطور الرجالية <span class="count">قريباً</span></a>' +
      "</div>" +
      '<div class="drawer__group"><div class="drawer__label">العلامات التجارية</div>' +
      DB.brands.filter(function (b) { return b.status === "active"; }).map(function (b) {
        return '<a class="drawer__link" href="#/brand/' + b.id + '">' + esc(b.name_ar) +
          '<span class="en">' + esc(b.name_en) + "</span></a>";
      }).join("") + "</div>" +
      '<div class="drawer__group"><div class="drawer__label">حسابك</div>' +
      '<a class="drawer__link" href="#/favorites">المفضلة <span class="count">' + state.favs.length + "</span></a>" +
      '<a class="drawer__link" href="#/cart">سلة التسوق <span class="count">' + cartCount() + "</span></a>" +
      "</div>" +
      '<div class="drawer__group"><div class="drawer__label">التواصل</div>' +
      '<a class="drawer__contact" href="#/checkout">' + icon("whatsapp") + " اطلبي عبر واتساب</a>" +
      '<a class="drawer__contact" href="mailto:' + esc(CFG.email) + '">' + icon("mail") + esc(CFG.email) + "</a>" +
      '<div class="drawer__contact">' + icon("pin") + esc(CFG.storeAddress) + "</div>" +
      "</div></div>" +
      '<div class="drawer__foot">هبّة متجر متعدد العلامات — الأسعار بالدينار الليبي.<br>منتجات تجريبية للعرض.</div>' +
      "</aside>";
  }

  function navHTML(active) {
    var items = [
      { k: "home", href: "#/", label: "الرئيسية", ico: "home" },
      { k: "search", href: "#/search", label: "البحث", ico: "search" },
      { k: "favorites", href: "#/favorites", label: "المفضلة", ico: "heart" },
      { k: "cart", href: "#/cart", label: "السلة", ico: "bag" }
    ];
    return '<nav class="float-nav" aria-label="التنقل الرئيسي">' +
      items.map(function (it) {
        var on = active === it.k;
        return '<a class="float-nav__item' + (on ? " is-active" : "") + '" href="' + it.href + '"' +
          (on ? ' aria-current="page"' : "") + ' aria-label="' + it.label + '">' + icon(it.ico) +
          '<span class="lbl" aria-hidden="true">' + it.label + "</span>" +
          (it.k === "cart" ? '<span class="count-badge js-cart-count"' + (cartCount() ? "" : " hidden") + ">" + cartCount() + "</span>" : "") +
          "</a>";
      }).join("") + "</nav>";
  }

  function updateChrome(route) {
    document.body.classList.toggle("is-pdp", route.view === "product");
    document.body.classList.toggle("is-checkout", route.view === "checkout");
    document.body.classList.toggle("no-nav", route.view === "notfound");

    var active = { home: "home", search: "search", favorites: "favorites", cart: "cart" }[route.view] || "";
    chrome.innerHTML =
      drawerHTML() +
      (route.view === "notfound" ? "" : navHTML(active)) +
      '<div class="toast-wrap" id="toastWrap"></div>' +
      '<span class="sr-only" id="liveCart" aria-live="polite"></span>' +
      '<div class="modal" id="modalRoot" aria-hidden="true"></div>';
    toastWrap = document.getElementById("toastWrap");

    var badgeCount = cartCount();
    Array.prototype.forEach.call(document.querySelectorAll(".js-cart-count"), function (b) {
      b.textContent = badgeCount;
      b.hidden = badgeCount === 0;
    });
  }

  function refreshBadges(bump) {
    var drawerCart = document.querySelector('.drawer__link[href="#/cart"] .count');
    if (drawerCart) drawerCart.textContent = cartCount();
    var n = cartCount();
    Array.prototype.forEach.call(document.querySelectorAll(".js-cart-count"), function (b) {
      b.textContent = n;
      b.hidden = n === 0;
      if (bump) {
        b.classList.remove("bump");
        void b.offsetWidth;
        b.classList.add("bump");
      }
    });
    var live = document.getElementById("liveCart");
    if (live && bump) live.textContent = "السلة تحتوي الآن " + n + " قطعة";
    var cartLink = document.querySelector('.icon-btn[href="#/cart"]');
    if (cartLink) cartLink.setAttribute("aria-label", "سلة التسوق" + (n ? " — " + n + " قطعة" : ""));
  }

  function openDrawer() {
    var d = document.getElementById("drawer");
    var o = document.getElementById("overlay");
    if (!d) return;
    d.classList.add("is-open");
    d.setAttribute("aria-hidden", "false");
    o.classList.add("is-open");
    var btn = document.querySelector("[data-open-drawer]");
    if (btn) btn.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    var close = d.querySelector("[data-close-drawer]");
    if (close) close.focus();
  }
  function closeDrawer() {
    var d = document.getElementById("drawer");
    var o = document.getElementById("overlay");
    if (!d || !d.classList.contains("is-open")) return;
    d.classList.remove("is-open");
    d.setAttribute("aria-hidden", "true");
    if (o) o.classList.remove("is-open");
    var btn = document.querySelector("[data-open-drawer]");
    if (btn) { btn.setAttribute("aria-expanded", "false"); btn.focus(); }
    document.body.style.overflow = "";
  }

  /* ---------------- Modal ---------------- */
  function openModal(html) {
    var m = document.getElementById("modalRoot");
    if (!m) return;
    m.innerHTML = '<div class="modal__backdrop" data-close-modal></div><div class="modal__card" role="dialog" aria-modal="true">' +
      '<button class="modal__close" data-close-modal aria-label="إغلاق">' + icon("close") + "</button>" + html + "</div>";
    m.classList.add("is-open");
    m.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
  function closeModal() {
    var m = document.getElementById("modalRoot");
    if (!m) return;
    m.classList.remove("is-open");
    m.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    setTimeout(function () { if (!m.classList.contains("is-open")) m.innerHTML = ""; }, 280);
  }

  /* ---------------- Cart actions ---------------- */
  function addToCart(id, sizeLabel, qty) {
    var p = productById(id);
    if (!p || !p.stock) return;
    var size = sizeLabel || defaultSize(p).label;
    qty = qty || 1;
    var line = state.cart.filter(function (it) { return it.id === id && it.size === size; })[0];
    if (line) line.qty = Math.min(20, line.qty + qty);
    else state.cart.push({ id: id, size: size, qty: qty });
    saveCart();
    refreshBadges(true);
    toast("أُضيف " + p.name_ar + " إلى السلة", "bag");
  }
  function setQty(key, delta) {
    var parts = key.split("|");
    state.cart.forEach(function (it) {
      if (it.id === parts[0] && it.size === parts[1]) {
        it.qty = Math.max(1, Math.min(20, it.qty + delta));
      }
    });
    saveCart();
    render();
  }
  function removeLine(key) {
    var parts = key.split("|");
    state.cart = state.cart.filter(function (it) { return !(it.id === parts[0] && it.size === parts[1]); });
    saveCart();
    render();
    toast("تم حذف المنتج من السلة", "trash");
  }

  /* ---------------- Favorites ---------------- */
  function toggleFav(id) {
    var i = state.favs.indexOf(id);
    var on = i === -1;
    if (on) state.favs.push(id);
    else state.favs.splice(i, 1);
    saveFavs();
    Array.prototype.forEach.call(document.querySelectorAll('[data-fav="' + id + '"]'), function (btn) {
      btn.classList.toggle("is-on", on);
      btn.setAttribute("aria-pressed", String(on));
      btn.setAttribute("aria-label", on ? "إزالة من المفضلة" : "إضافة إلى المفضلة");
      btn.classList.remove("pop");
      void btn.offsetWidth;
      if (on) btn.classList.add("pop");
    });
    toast(on ? "أُضيف إلى المفضلة" : "أُزيل من المفضلة", "heart");
    if (parseRoute().view === "favorites") render();
  }

  /* ---------------- PDP interactions ---------------- */
  function selectSize(index) {
    if (!pdp) return;
    var p = productById(pdp.id);
    var s = p.sizes[index];
    if (!s) return;
    pdp.sizeIndex = index;
    Array.prototype.forEach.call(document.querySelectorAll("[data-size-index]"), function (b) {
      var on = Number(b.getAttribute("data-size-index")) === index;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    var row = document.getElementById("pdpPriceRow");
    if (row) row.innerHTML = priceHTMLForSize(p, s);
    var bp = document.getElementById("buybarPrice");
    if (bp) bp.innerHTML = fmtNum(s.price) + "<small>" + CFG.currencyAr + "</small>";
    var bs = document.getElementById("buybarSize");
    if (bs) bs.textContent = s.label;
    var labels = document.querySelectorAll(".opt-block__label strong");
    if (labels[0]) labels[0].textContent = s.label;
  }

  function selectThumb(i) {
    Array.prototype.forEach.call(document.querySelectorAll("[data-thumb]"), function (b) {
      b.classList.toggle("is-active", Number(b.getAttribute("data-thumb")) === i);
    });
    var img = document.getElementById("pdpImgEl");
    if (img) {
      img.style.transform = i === 0 ? "" : i === 1 ? "scale(1.55)" : "scale(2)";
      img.style.transformOrigin = i === 0 ? "center" : i === 1 ? "50% 45%" : "50% 82%";
      img.style.transition = "transform .5s cubic-bezier(.22,.7,.24,1)";
    }
  }

  function pdpQty(n) {
    var el = document.getElementById("pdpQty");
    if (!el) return 1;
    var v = Math.max(1, Math.min(20, (parseInt(el.textContent, 10) || 1) + n));
    el.textContent = v;
    return v;
  }

  /* ---------------- Checkout logic ---------------- */
  function deliveryFee(sub) {
    return sub >= CFG.freeDeliveryThreshold ? 0 : CFG.deliveryFee;
  }

  function buildOrderMessage(d) {
    var lines = [];
    lines.push("طلب جديد من متجر هبّة");
    lines.push("");
    lines.push("الاسم: " + d.name);
    lines.push("رقم الهاتف: " + d.phone);
    lines.push("طريقة الاستلام: " + (d.method === "delivery" ? "التوصيل" : "الاستلام من المحل"));
    if (d.method === "delivery") lines.push("العنوان: " + d.address);
    if (d.note) lines.push("ملاحظات: " + d.note);
    lines.push("");
    lines.push("المنتجات:");
    var sub = cartSubtotal();
    state.cart.forEach(function (it, i) {
      var p = productById(it.id);
      var b = brandById(p.brandId);
      var unit = cartLineTotal(it) / it.qty;
      lines.push((i + 1) + ") " + p.name_ar + " — " + b.name_ar + " — " + it.size);
      lines.push("   الكمية: " + it.qty + " × " + fmtNum(unit) + " " + CFG.currencyAr + " = " + fmtNum(cartLineTotal(it)) + " " + CFG.currencyAr);
    });
    var fee = d.method === "delivery" ? deliveryFee(sub) : 0;
    lines.push("");
    lines.push("المجموع الفرعي: " + fmtNum(sub) + " " + CFG.currencyAr);
    lines.push("رسوم التوصيل: " + (d.method === "delivery" ? (fee ? fmtNum(fee) + " " + CFG.currencyAr : "مجاناً") : "—"));
    lines.push("الإجمالي: " + fmtNum(sub + fee) + " " + CFG.currencyAr);
    lines.push("");
    lines.push("شكراً لكم — HABBA");
    return lines.join("\n");
  }

  function validateForm(form) {
    var name = form.querySelector("#custName");
    var phone = form.querySelector("#custPhone");
    var address = form.querySelector("#custAddress");
    var method = form.querySelector('input[name="method"]:checked');
    var ok = true;

    function mark(field, bad) {
      var wrap = form.querySelector("#" + field);
      if (!wrap) return;
      wrap.classList.toggle("has-error", bad);
      var input = wrap.querySelector(".input, .textarea");
      if (input) input.setAttribute("aria-invalid", bad ? "true" : "false");
      if (bad) ok = false;
    }

    mark("fName", name.value.trim().length < 3);
    var digits = phone.value.replace(/\D/g, "");
    mark("fPhone", digits.length < 9);
    var isDelivery = !method || method.value === "delivery";
    if (isDelivery) mark("fAddress", address.value.trim().length < 6);

    if (!ok) {
      var first = form.querySelector(".has-error");
      if (first) {
        first.scrollIntoView({ behavior: "smooth", block: "center" });
        var el = first.querySelector(".input, .textarea");
        if (el) el.focus({ preventScroll: true });
      }
      toast("راجعي الحقول المطلوبة", "info");
      return null;
    }
    return {
      name: name.value.trim(),
      phone: phone.value.trim(),
      method: isDelivery ? "delivery" : "pickup",
      address: isDelivery ? address.value.trim() : "",
      note: form.querySelector("#custNote").value.trim()
    };
  }

  function submitOrder(form) {
    if (!state.cart.length) return;
    var data = validateForm(form);
    if (!data) return;
    var msg = buildOrderMessage(data);
    state.lastOrder = msg;
    var number = String(CFG.whatsappNumber || "").replace(/\D/g, "");
    var waUrl = number ? "https://wa.me/" + number + "?text=" + encodeURIComponent(msg) : "";

    if (waUrl) window.open(waUrl, "_blank", "noopener");

    /* clear cart after the order is prepared */
    state.cart = [];
    saveCart();
    refreshBadges(false);
    state.orderPlaced = true;

    openModal(
      '<div class="modal__icon">' + icon(waUrl ? "check" : "info") + "</div>" +
      "<h3>" + (waUrl ? "تم تجهيز طلبك" : "رسالة الطلب جاهزة") + "</h3>" +
      "<p>" + (waUrl
        ? "فُتح واتساب في نافذة جديدة برسالة الطلب. أرسليها للمتجر لإتمام التأكيد."
        : "رقم واتساب المتجر غير مُعد بعد في ملف الإعدادات (config.js). نسخت رسالة طلبك أدناه — أرسليها للمتجر عند توفر الرقم.") + "</p>" +
      '<div class="msg-preview" id="orderMsg">' + esc(msg) + "</div>" +
      '<div class="modal__actions">' +
      (waUrl ? '<a class="btn btn--primary btn--block" href="' + esc(waUrl) + '" target="_blank" rel="noopener">فتح واتساب ' + icon("whatsapp") + "</a>" : "") +
      '<button class="btn btn--ghost btn--block" data-copy="#orderMsg">' + icon("copy") + " نسخ تفاصيل الطلب</button>" +
      '<a class="btn btn--ghost btn--block" href="#/">متابعة التسوق</a>' +
      "</div>"
    );
  }

  /* ---------------- Render ---------------- */
  var LAST_FOCUS_Q = null;

  function render() {
    var route = parseRoute();
    var html = "";

    if (route.view === "home") {
      html = homeView();
      document.title = "هبّة HABBA — عطور من علامات مختارة";
    } else if (route.view === "product") {
      var p = productById(route.id);
      html = pdpView(route.id);
      document.title = p ? p.name_ar + " — " + brandById(p.brandId).name_en + " | HABBA" : "المنتج غير موجود | HABBA";
    } else if (route.view === "brand") {
      var b = brandById(route.id);
      html = brandView(route.id);
      document.title = b ? brandById(route.id).name_ar + " " + b.name_en + " — HABBA" : "العلامة غير موجودة | HABBA";
    } else if (route.view === "search") {
      html = searchView();
      document.title = "البحث | HABBA";
    } else if (route.view === "favorites") {
      html = favoritesView();
      document.title = "المفضلة | HABBA";
    } else if (route.view === "cart") {
      html = cartView();
      document.title = "سلة التسوق | HABBA";
    } else if (route.view === "checkout") {
      html = checkoutView();
      document.title = "إتمام الطلب | HABBA";
    } else {
      html = notFoundView();
      document.title = "الصفحة غير موجودة | HABBA";
    }

    app.innerHTML = html;
    updateChrome(route);

    if (route.key !== state.routeKey) {
      var isFirst = !state.routeKey;
      state.routeKey = route.key;
      window.scrollTo({ top: 0, behavior: isFirst ? "auto" : "auto" });
    }

    if (route.view === "search") {
      var q = document.getElementById("q");
      if (q) {
        q.focus({ preventScroll: true });
        var v = q.value;
        q.setSelectionRange(v.length, v.length);
      }
      if (state.q) renderSearchResults(true);
    }
  }

  /* ---------------- Global events ---------------- */
  document.addEventListener("click", function (e) {
    var t = e.target;

    if (t.closest("#drawer a[href^='#/']")) closeDrawer();

    var el = t.closest("[data-open-drawer]");
    if (el) { e.preventDefault(); openDrawer(); return; }

    if (t.closest("[data-close-drawer]")) { closeDrawer(); return; }
    if (t.closest("[data-close-modal]")) {
      closeModal();
      if (state.orderPlaced && parseRoute().view === "checkout") {
        state.orderPlaced = false;
        go("#/");
      }
      return;
    }

    el = t.closest("[data-back]");
    if (el) {
      e.preventDefault();
      if (history.length > 1) history.back();
      else go("#/");
      return;
    }

    el = t.closest("[data-scroll]");
    if (el) {
      e.preventDefault();
      var target = document.getElementById(el.getAttribute("data-scroll"));
      if (target) { target.scrollIntoView({ behavior: "smooth", block: "start" }); return; }
      var wanted = el.getAttribute("data-scroll");
      go("#/");
      setTimeout(function () {
        var t2 = document.getElementById(wanted);
        if (t2) t2.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 220);
      return;
    }

    el = t.closest("[data-cat]");
    if (el) {
      e.preventDefault();
      if (el.hasAttribute("data-soon")) { toast("قسم العطور الرجالية قادم قريباً", "info"); return; }
      state.cat = el.getAttribute("data-cat");
      write(KEY_CAT, state.cat);

      if (parseRoute().view === "home") {
        var rail = document.getElementById("catRail");
        if (rail) rail.innerHTML = categoriesRail(state.cat);
        var grid = document.getElementById("homeGrid");
        var list = sortList(filterByCategory(DB.products, state.cat), "featured");
        if (grid) grid.innerHTML = productGrid(list);
        var count = document.getElementById("gridCount");
        if (count) count.textContent = list.length + " عطراً · " + catLabel(state.cat);
        if (el.closest("#drawer")) closeDrawer();
        var target2 = document.getElementById("products");
        if (target2 && !el.closest("#drawer")) target2.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        closeDrawer();
        go("#/");
      }
      return;
    }

    if (t.closest("[data-soon-drawer]")) { e.preventDefault(); toast("قسم العطور الرجالية قادم قريباً", "info"); return; }

    el = t.closest("[data-fav]");
    if (el) { e.preventDefault(); toggleFav(el.getAttribute("data-fav")); return; }

    el = t.closest("[data-add-to-cart]");
    if (el) {
      e.preventDefault();
      if (!pdp || pdp.id !== el.getAttribute("data-add-to-cart")) {
        addToCart(el.getAttribute("data-add-to-cart"));
      } else {
        var qtyEl = document.getElementById("pdpQty");
        var qty = qtyEl ? parseInt(qtyEl.textContent, 10) || 1 : 1;
        addToCart(pdp.id, productById(pdp.id).sizes[pdp.sizeIndex].label, qty);
      }
      var old = el.innerHTML;
      el.innerHTML = icon("check") + " أُضيف";
      el.disabled = true;
      setTimeout(function () { el.innerHTML = old; el.disabled = false; }, 1300);
      return;
    }

    el = t.closest("[data-brand-family]");
    if (el) {
      state.brandFamily = el.getAttribute("data-brand-family");
      render();
      return;
    }

    el = t.closest("[data-size-index]");
    if (el) { selectSize(Number(el.getAttribute("data-size-index"))); return; }

    el = t.closest("[data-thumb]");
    if (el) { selectThumb(Number(el.getAttribute("data-thumb"))); return; }

    if (t.closest("[data-pdp-plus]")) { pdpQty(1); return; }
    if (t.closest("[data-pdp-minus]")) { pdpQty(-1); return; }

    el = t.closest("[data-qty-plus]");
    if (el) { setQty(el.getAttribute("data-qty-plus"), 1); return; }
    el = t.closest("[data-qty-minus]");
    if (el) { setQty(el.getAttribute("data-qty-minus"), -1); return; }

    el = t.closest("[data-remove]");
    if (el) { removeLine(el.getAttribute("data-remove")); return; }

    if (t.closest("[data-clear-cart]")) {
      state.cart = [];
      saveCart();
      render();
      toast("تم إفراغ السلة", "trash");
      return;
    }

    if (t.closest("[data-clear-search]")) {
      state.q = "";
      var input = document.getElementById("q");
      if (input) { input.value = ""; input.focus(); }
      renderSearchResults(true);
      var sug = document.getElementById("searchSuggest");
      if (sug) sug.classList.remove("hide");
      return;
    }

    el = t.closest("[data-suggest]");
    if (el) {
      var val = el.getAttribute("data-suggest");
      var inp = document.getElementById("q");
      if (inp) { inp.value = val; state.q = val; renderSearchResults(true); }
      return;
    }

    el = t.closest("[data-copy]");
    if (el) {
      var sel = el.getAttribute("data-copy");
      var node = document.querySelector(sel);
      if (node) {
        copyText(node.textContent).then(function () { toast("تم نسخ رسالة الطلب", "copy"); });
      }
      return;
    }

    if (t.closest("[data-share]")) {
      var r = parseRoute();
      if (r.view === "product") {
        var prod = productById(r.id);
        var url = location.origin + location.pathname + "#/product/" + r.id;
        var title = prod ? prod.name_ar + " — " + brandById(prod.brandId).name_en : "HABBA";
        if (navigator.share) {
          navigator.share({ title: title, url: url }).catch(function () {});
        } else {
          copyText(url).then(function () { toast("تم نسخ رابط المنتج", "copy"); });
        }
      }
      return;
    }

    el = t.closest(".pill[data-cat], .drawer__link[data-cat]");
    if (el) { return; }
  });

  document.addEventListener("input", function (e) {
    if (e.target && e.target.id === "q") {
      state.q = e.target.value;
      renderSearchResults(false);
    }
  });

  document.addEventListener("change", function (e) {
    var t = e.target;
    if (t && t.id === "sortBrand") {
      state.sortBrand = t.value;
      render();
      return;
    }
    if (t && t.name === "method") {
      var wrap = document.getElementById("fAddress");
      if (wrap) {
        var isPickup = t.value === "pickup";
        wrap.style.display = isPickup ? "none" : "";
        if (isPickup) wrap.classList.remove("has-error");
      }
      var sub = cartSubtotal();
      var fee = t.value === "delivery" ? deliveryFee(sub) : 0;
      var sum = document.getElementById("sumDelivery");
      if (sum) sum.textContent = fee ? fmtNum(fee) + " " + CFG.currencyEn : "مجاناً";
    }
  });

  document.addEventListener("submit", function (e) {
    if (e.target && e.target.id === "checkoutForm") {
      e.preventDefault();
      submitOrder(e.target);
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeDrawer();
      closeModal();
    }
  });

  var lastScroll = 0;
  window.addEventListener("scroll", function () {
    var y = window.scrollY || 0;
    var h = document.querySelector(".site-header");
    if (h) h.classList.toggle("is-scrolled", y > 6);
    lastScroll = y;
  }, { passive: true });

  window.addEventListener("hashchange", function () { render(); });

  /* ---------------- Boot ---------------- */
  updateChrome(parseRoute());
  render();
})();

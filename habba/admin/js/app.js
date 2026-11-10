/* ============================================================================
   HABBA Admin Dashboard — application
   Vanilla JS + hash router. All persistence goes through HABBA_DB, and every
   permission decision is made by Postgres RLS, not by this file.
   ============================================================================ */
(function () {
  "use strict";

  var DB = window.HABBA_DB;
  var CFG = window.HABBA_ADMIN_CONFIG || {};
  var app = document.getElementById("app");
  var IS_DEMO = !!(window.supabase && window.supabase.__demo);

  /* ------------------------------- icons ------------------------------- */
  var P = {
    home: '<path d="M4 10.5 12 4l8 6.5"/><path d="M6 9.5V20h12V9.5"/>',
    bag: '<path d="M6 8h12l1 12H5L6 8z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
    box: '<path d="M12 3l8 4.2v9.6L12 21l-8-4.2V7.2L12 3z"/><path d="M4 7.2l8 4.3 8-4.3M12 21v-9.5"/>',
    tag: '<path d="M12.5 3H21v8.5L11 21.5 2.5 13 12.5 3z"/><circle cx="16.5" cy="7.5" r="1.4"/>',
    grid: '<rect x="4" y="4" width="7" height="7" rx="1.6"/><rect x="13" y="4" width="7" height="7" rx="1.6"/><rect x="4" y="13" width="7" height="7" rx="1.6"/><rect x="13" y="13" width="7" height="7" rx="1.6"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    logout: '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="M10 16l-4-4 4-4"/><path d="M6 12h9"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    edit: '<path d="M4 20h4l10-10-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/>',
    trash: '<path d="M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.6"/>',
    eyeOff: '<path d="M3 3l18 18"/><path d="M10.6 6.2A9.6 9.6 0 0 1 12 6c6 0 9.5 6 9.5 6a17 17 0 0 1-3 3.7"/><path d="M6.3 8.3A17 17 0 0 0 2.5 12S6 18 12 18a9.4 9.4 0 0 0 4-.9"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    whatsapp: '<path d="M20.5 11.7a8.5 8.5 0 0 1-12.4 7.6L3.5 20.5l1.3-4.5A8.5 8.5 0 1 1 20.5 11.7z"/><path d="M8.8 8.6c0 3.5 2.8 6.4 6.4 6.4"/>',
    phone: '<path d="M6 4h3l1.5 4-2 1.5a11 11 0 0 0 5 5L15 12.5 19 14v3a2 2 0 0 1-2 2A13 13 0 0 1 4 6a2 2 0 0 1 2-2z"/>',
    arrowBack: '<path d="M15 5l-7 7 7 7"/>',
    arrowUp: '<path d="M7 17 17 7"/><path d="M9 7h8v8"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    truck: '<path d="M3 7h10v9H3z"/><path d="M13 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/>',
    store: '<path d="M4 9l1.5-4h13L20 9"/><path d="M4 9h16v10H4z"/><path d="M9.5 19v-5h5v5"/>',
    money: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v10M9.5 9.5h4a1.8 1.8 0 0 1 0 3.6h-3a1.8 1.8 0 0 0 0 3.6h4"/>',
    inbox: '<path d="M4 13h4l1.5 3h5L16 13h4"/><path d="M4 13l2.5-8h11L20 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5z"/>',
    flame: '<path d="M12 3s5 4.5 5 9a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 1.5.5 2.5 1.5 3C10 8 11 5 12 3z"/>',
    image: '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><circle cx="9" cy="10" r="1.6"/><path d="M4 17l5-5 4 4 3-2.5 3.5 3.5"/>',
    star: '<path d="M12 4l2.4 5 5.6.7-4 3.9 1 5.4-5-2.8-5 2.8 1-5.4-4-3.9 5.6-.7L12 4z"/>',
    alert: '<path d="M12 4l9 16H3l9-16z"/><path d="M12 10v4M12 17h.01"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M15 5.5A2.5 2.5 0 0 0 12.5 3h-6A2.5 2.5 0 0 0 4 5.5v6"/>',
    refresh: '<path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M20 4v5h-5"/>',
    filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
    external: '<path d="M14 4h6v6"/><path d="M20 4l-8 8"/><path d="M19 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4"/>',
    shield: '<path d="M12 4l7 3v5c0 4.4-3 7.3-7 8-4-.7-7-3.6-7-8V7l7-3z"/><path d="M9.2 12.2l2 2 3.6-3.9"/>'
  };
  function ico(n, cls) {
    return '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"' + (cls ? ' class="' + cls + '"' : '') + '>' + P[n] + '</svg>';
  }

  /* ------------------------------- utils ------------------------------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function money(n) {
    var v = Number(n || 0);
    return '<span class="num">' + v.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + '</span> <span class="tiny dim">د.ل</span>';
  }
  function moneyText(n) {
    return Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 }) + " د.ل";
  }
  function fmtDate(iso, withTime) {
    if (!iso) return "—";
    var d = new Date(iso);
    var date = d.toLocaleDateString("ar-LY", { year: "numeric", month: "short", day: "numeric" });
    if (!withTime) return date;
    return date + " · " + d.toLocaleTimeString("ar-LY", { hour: "2-digit", minute: "2-digit" });
  }
  function relTime(iso) {
    var diff = Date.now() - new Date(iso).getTime();
    var m = Math.round(diff / 60000);
    if (m < 1) return "الآن";
    if (m < 60) return "قبل " + m + " دقيقة";
    var h = Math.round(m / 60);
    if (h < 24) return "قبل " + h + " ساعة";
    var d = Math.round(h / 24);
    return "قبل " + d + " يوم";
  }
  function debounce(fn, ms) {
    var t; return function () {
      var a = arguments, self = this;
      clearTimeout(t); t = setTimeout(function () { fn.apply(self, a); }, ms);
    };
  }
  function clone(v) { return v == null ? v : JSON.parse(JSON.stringify(v)); }
  function slugify(s) {
    return String(s || "").toLowerCase().trim().replace(/[^a-z0-9\u0621-\u064A]+/g, "-").replace(/^-+|-+$/g, "");
  }

  /* ----------------------------- constants ----------------------------- */
  var STATUS = {
    new:       { label: "جديد",                 cls: "tag--gold",    next: ["confirmed", "cancelled"] },
    confirmed: { label: "مؤكد",                 cls: "tag--blue",    next: ["preparing", "cancelled"] },
    preparing: { label: "قيد التجهيز",          cls: "tag--blue",    next: ["ready", "cancelled"] },
    ready:     { label: "جاهز للتسليم/الاستلام", cls: "tag--green",   next: ["delivered", "cancelled"] },
    delivered: { label: "تم التسليم",           cls: "tag--green",   next: [] },
    cancelled: { label: "ملغي",                 cls: "tag--red",     next: [] }
  };
  var STATUS_ORDER = ["new", "confirmed", "preparing", "ready", "delivered"];

  /* ------------------------------- state ------------------------------- */
  var state = {
    session: null,
    route: { name: "login" },
    settings: null,
    brands: [], categories: [], products: [], orders: [],
    orderFilter: "all",
    orderQuery: "",
    productQuery: "",
    productFilter: "all",
    lastImagePaths: [],
    editing: null
  };

  /* ------------------------------- chrome ------------------------------- */
  function toast(msg, kind) {
    var wrap = document.getElementById("toasts");
    if (!wrap) return;
    var el = document.createElement("div");
    el.className = "toast" + (kind === "error" ? " toast--error" : "");
    el.setAttribute("role", "status");
    el.innerHTML = ico(kind === "error" ? "alert" : "check") + "<span>" + esc(msg) + "</span>";
    wrap.appendChild(el);
    setTimeout(function () { el.remove(); }, 3200);
  }

  function errText(e) {
    var m = (e && (e.message || e.error_description || e.details)) || "حدث خطأ غير متوقع";
    if (/duplicate key|unique constraint/i.test(m)) return "هذه القيمة مستخدمة بالفعل (رمز مكرر).";
    if (/permission denied|row-level security|violates row-level/i.test(m)) return "ليست لديك صلاحية لهذا الإجراء.";
    if (/discount/i.test(m)) return "سعر الخصم يجب أن يكون أقل من السعر الأصلي.";
    if (/order is final/i.test(m)) return "لا يمكن تعديل طلب منتهٍ أو ملغي.";
    if (/foreign key constraint/i.test(m)) return "لا يمكن الحذف: السجل مرتبط بعطور. أخفِه بدلاً من حذفه أو انقل العطور أولاً.";
    if (/not found/i.test(m)) return "لم يتم العثور على السجل.";
    if (/JWT|token|auth/i.test(m)) return "انتهت الجلسة، الرجاء تسجيل الدخول مجدداً.";
    return m;
  }

  var NAV = [
    { key: "dashboard", href: "#/", label: "لوحة التحكم", icon: "home" },
    { key: "orders", href: "#/orders", label: "الطلبات", icon: "bag" },
    { key: "products", href: "#/products", label: "العطور", icon: "box" },
    { key: "brands", href: "#/brands", label: "العلامات التجارية", icon: "tag" },
    { key: "categories", href: "#/categories", label: "الفئات", icon: "grid" },
    { key: "settings", href: "#/settings", label: "إعدادات المتجر", icon: "gear" }
  ];

  function shellHTML(activeKey, title, subtitle, body, actions) {
    var newCount = state.orders.filter(function (o) { return o.status === "new"; }).length;
    var nav = NAV.map(function (n) {
      var badge = n.key === "orders" && newCount
        ? '<span class="badge-count">' + newCount + '</span>' : "";
      return '<a class="nav-item' + (n.key === activeKey ? " is-active" : "") + '" href="' + n.href + '"' +
        (n.key === activeKey ? ' aria-current="page"' : "") + '>' + ico(n.icon) + '<span>' + n.label + '</span>' + badge + '</a>';
    }).join("");

    return '<div class="shell">' +
      '<aside class="side" id="side">' +
      '<div class="side__brand"><span class="side__mark">ه</span>' +
      '<div><div class="side__title">هبّة</div><div class="side__sub">HABBA ADMIN</div></div></div>' +
      '<div class="side__label">الإدارة</div>' + nav +
      '<div class="side__foot">' +
      '<div class="side__user"><span class="dot"></span><span class="grow">' +
      esc((state.session && state.session.user && state.session.user.email) || "المالك") +
      '</span></div>' +
      '<button class="nav-item" data-logout style="width:100%">' + ico("logout") + '<span>تسجيل الخروج</span></button>' +
      '</div></aside>' +
      '<div class="main">' +
      '<div class="topbar">' +
      '<button class="menu-btn" data-menu aria-label="القائمة">' + ico("menu") + '</button>' +
      '<div><div class="topbar__title">' + esc(title) + '</div>' +
      (subtitle ? '<div class="topbar__sub">' + esc(subtitle) + '</div>' : "") + '</div>' +
      '<div class="topbar__right">' + (actions || "") + '</div>' +
      '</div>' +
      '<div class="page">' + body + '</div></div></div>' +
      '<div class="toasts" id="toasts"></div>' +
      '<div class="overlay" id="overlay" data-close-menu></div>';
  }

  function loadingCard() {
    return '<div class="card">' + Array(5).join().split(",").map(function () {
      return '<div class="skel sk-row"></div>';
    }).join("") + '</div>';
  }

  /* ------------------------------ router ------------------------------ */
  function parseHash() {
    var h = (location.hash || "#/").replace(/^#/, "");
    var parts = h.split("/").filter(Boolean);
    if (parts.length === 0) return { name: "dashboard" };
    if (parts[0] === "orders" && parts[1]) return { name: "order", id: parts[1] };
    if (["orders", "products", "brands", "categories", "settings", "product-new", "product-edit"].indexOf(parts[0]) > -1) {
      if (parts[0] === "product-new") return { name: "product-form", id: null };
      if (parts[0] === "product-edit") return { name: "product-form", id: parts[1] };
      return { name: parts[0] };
    }
    return { name: "dashboard" };
  }

  var bootDone = false;

  function boot() {
    DB.init();
    DB.auth.session().then(function (session) {
      state.session = session;
      if (!session) { renderLogin(); return; }
      bootDone = true;
      loadShared().then(render).catch(function (e) {
        console.error(e);
        toast(errText(e), "error");
      });
    }).catch(function (e) {
      renderConfigError(e);
    });

    DB.auth.onChange(function (event, session) {
      if (event === "SIGNED_OUT" || (event === "SIGNED_IN" && !session)) {
        state.session = null;
        renderLogin();
      }
    });
  }

  function loadShared() {
    return Promise.all([
      DB.settings.get().catch(function () { return null; }),
      DB.brands.list(),
      DB.categories.list(),
      DB.orders.list({}).catch(function () { return []; })
    ]).then(function (r) {
      state.settings = r[0];
      state.brands = r[1] || [];
      state.categories = r[2] || [];
      state.orders = r[3] || [];
    });
  }

  function render() {
    var r = parseHash();
    state.route = r;
    var titles = {
      dashboard: ["لوحة التحكم", "نظرة سريعة على المتجر"],
      orders: ["الطلبات", "إدارة ومتابعة طلبات العملاء"],
      order: ["تفاصيل الطلب", ""],
      products: ["العطور", "إدارة كتالوج العطور"],
      "product-form": [state && state.route.id ? "تعديل عطر" : "إضافة عطر", ""],
      brands: ["العلامات التجارية", "العلامات المعروضة في المتجر"],
      categories: ["الفئات", "تنظيم العطور ضمن فئات"],
      settings: ["إعدادات المتجر", "بيانات التواصل والتوصيل واستقبال الطلبات"]
    };
    var t = titles[r.name] || ["لوحة التحكم", ""];

    switch (r.name) {
      case "dashboard": return renderDashboard(t[0], t[1]);
      case "orders": return renderOrders(t[0], t[1]);
      case "order": return renderOrder(r.id);
      case "products": return renderProducts(t[0], t[1]);
      case "product-form": return renderProductForm(r.id);
      case "brands": return renderBrands(t[0], t[1]);
      case "categories": return renderCategories(t[0], t[1]);
      case "settings": return renderSettings(t[0], t[1]);
      default: return renderDashboard(t[0], t[1]);
    }
  }

  function mount(html) {
    app.innerHTML = html;
    var side = document.getElementById("side");
    var overlay = document.getElementById("overlay");
    if (side && overlay) {
      side.classList.remove("is-open");
      overlay.classList.remove("is-open");
    }
  }

  /* ------------------------------- login ------------------------------- */
  function renderLogin() {
    document.title = "دخول الإدارة | هبّة";
    app.innerHTML =
      '<div class="login-wrap"><form class="login-card" id="loginForm" novalidate>' +
      '<div class="login-mark">ه</div>' +
      '<h1>لوحة إدارة هبّة</h1>' +
      '<p class="sub">دخول مخصص لمالك المتجر فقط</p>' +
      '<div class="login-alert hide" id="loginErr" role="alert"></div>' +
      '<div class="field"><label for="email">البريد الإلكتروني</label>' +
      '<input class="input" id="email" type="email" autocomplete="username" dir="ltr" required></div>' +
      '<div class="field mt-14"><label for="password">كلمة المرور</label>' +
      '<input class="input" id="password" type="password" autocomplete="current-password" dir="ltr" required></div>' +
      '<button class="btn btn--primary btn--block mt-20" type="submit" id="loginBtn">تسجيل الدخول</button>' +
      '<p class="login-note">لا يوجد تسجيل حساب جديد. حساب المالك يُنشأ من إعدادات Supabase مرة واحدة.<br>' +
      (IS_DEMO ? 'وضع العرض التجريبي: استخدم أي بريد وأي كلمة مرور من 6 أحرف.' : '') +
      '</p></form></div>' +
      '<div class="toasts" id="toasts"></div>';

    document.getElementById("loginForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var email = document.getElementById("email").value.trim();
      var pass = document.getElementById("password").value;
      var btn = document.getElementById("loginBtn");
      var box = document.getElementById("loginErr");
      if (!email || pass.length < 6) {
        box.textContent = "أدخل بريداً صحيحاً وكلمة مرور من 6 أحرف على الأقل.";
        box.classList.remove("hide");
        return;
      }
      box.classList.add("hide");
      btn.disabled = true;
      btn.textContent = "جارٍ الدخول…";
      DB.auth.signIn(email, pass).then(function (session) {
        state.session = session;
        return loadShared().then(function () {
          if (location.hash && location.hash !== "#/") location.hash = "#/";
          render();
          toast("مرحباً بك في لوحة الإدارة");
        });
      }).catch(function (err) {
        box.textContent = "تعذّر تسجيل الدخول: " + errText(err);
        box.classList.remove("hide");
        btn.disabled = false;
        btn.textContent = "تسجيل الدخول";
      });
    });
  }

  function renderConfigError(e) {
    app.innerHTML = '<div class="login-wrap"><div class="login-card">' +
      '<div class="login-mark">ه</div><h1>لم يتم ربط Supabase بعد</h1>' +
      '<p class="sub">' + esc(e.message) + '</p>' +
      '<div class="alert alert--info">' + ico("shield") +
      '<div>أدخل <b>supabaseUrl</b> و <b>supabaseAnonKey</b> في <span class="mono">admin/config.js</span>. ' +
      'استخدم المفتاح العام (anon) فقط — لا تضع مفتاح service_role في المتصفح أبداً.</div></div>' +
      '</div></div>';
  }

  /* ----------------------------- dashboard ----------------------------- */
  function renderDashboard(title, sub) {
    mount(shellHTML("dashboard", title, sub, '<div id="dashBody">' + loadingCard() + '</div>'));

    DB.dashboard.stats().then(function (d) {
      var s = d.stats || {};
      var body = '';

      if (state.settings && !state.settings.whatsapp_number) {
        body += '<div class="alert">' + ico("alert") +
          '<div><b>لم يتم ضبط رقم واتساب بعد.</b> لن يصل الطلب إلى المتجر عبر واتساب حتى تضيفه في ' +
          '<a href="#/settings">إعدادات المتجر</a>.</div></div>';
      }
      if (state.settings && state.settings.orders_enabled === false) {
        body += '<div class="alert alert--info mt-8">' + ico("alert") +
          '<div><b>استقبال الطلبات متوقف حالياً.</b> الطلبات الجديدة ستُرفض من قاعدة البيانات حتى تفعّله من ' +
          '<a href="#/settings">الإعدادات</a>.</div></div>';
      }

      body += '<div class="stats mt-14">' +
        '<div class="stat stat--accent"><div class="stat__label">' + ico("money") + 'إجمالي المبيعات</div>' +
        '<div class="stat__value">' + Number(s.total_sales || 0).toLocaleString("en-US") + '<small>د.ل</small></div>' +
        '<div class="stat__foot">من الطلبات المسلّمة فقط</div></div>' +
        '<div class="stat"><div class="stat__label">' + ico("inbox") + 'طلبات جديدة</div>' +
        '<div class="stat__value">' + (s.new_orders || 0) + '</div>' +
        '<div class="stat__foot">' + (s.orders_today || 0) + ' طلب اليوم</div></div>' +
        '<div class="stat"><div class="stat__label">' + ico("clock") + 'بانتظار التجهيز</div>' +
        '<div class="stat__value">' + (s.awaiting_prep || 0) + '</div>' +
        '<div class="stat__foot">مؤكد · قيد التجهيز · جاهز</div></div>' +
        '<div class="stat"><div class="stat__label">' + ico("check") + 'طلبات مكتملة</div>' +
        '<div class="stat__value">' + (s.completed_orders || 0) + '</div>' +
        '<div class="stat__foot">' + (s.cancelled_orders || 0) + ' ملغي</div></div>' +
        '</div>';

      body += '<div class="grid-2 block">';

      /* best sellers */
      var best = d.best_sellers || [];
      body += '<div class="card card--pad0"><div class="card__head"><h3 class="card__title">الأكثر مبيعاً</h3>' +
        '<span class="block__hint">حسب القطع المبيعة</span></div>' +
        (best.length ? '<div class="table-wrap"><table class="adm"><thead><tr>' +
          '<th>العطر</th><th>العلامة</th><th>القطع</th></tr></thead><tbody>' +
          best.map(function (b, i) {
            return '<tr><td><div class="row"><span class="mono dim" style="font-size:11px">' + (i + 1) + '</span>' +
              '<strong>' + esc(b.name_ar || "—") + '</strong></div></td>' +
              '<td class="dim">' + esc(b.brand_ar || "—") + '</td>' +
              '<td class="num">' + b.units + '</td></tr>';
          }).join("") + '</tbody></table></div>'
          : '<div class="empty-state"><div class="empty-state__icon">' + ico("flame") + '</div>' +
            '<h3>لا توجد مبيعات بعد</h3><p>ستظهر أفضل العطور مبيعاً هنا بعد أول طلب.</p></div>') +
        '</div>';

      /* catalogue snapshot + recent orders */
      body += '<div class="card card--pad0"><div class="card__head"><h3 class="card__title">آخر الطلبات</h3>' +
        '<a class="card__link" href="#/orders">كل الطلبات</a></div>' +
        (state.orders.length ? '<div class="table-wrap"><table class="adm"><tbody>' +
          state.orders.slice(0, 5).map(function (o) {
            return '<tr><td><div class="td-main"><strong class="mono">' + esc(o.order_number) + '</strong>' +
              '<span>' + esc(o.customer_name) + ' · ' + relTime(o.created_at) + '</span></div></td>' +
              '<td>' + money(o.total) + '</td>' +
              '<td><span class="tag ' + (STATUS[o.status] || {}).cls + '">' + (STATUS[o.status] || {}).label + '</span></td>' +
              '<td class="td-actions"><a class="icon-btn" href="#/orders/' + o.id + '" aria-label="عرض الطلب">' + ico("eye") + '</a></td></tr>';
          }).join("") + '</tbody></table></div>'
          : '<div class="empty-state"><div class="empty-state__icon">' + ico("bag") + '</div><h3>لا توجد طلبات</h3></div>') +
        '</div>';
      body += '</div>';

      /* catalogue counters (no charts, no stock) */
      body += '<div class="block"><div class="block__head"><h2 class="block__title">نظرة على الكتالوج</h2></div>' +
        '<div class="stats">' +
        '<div class="stat"><div class="stat__label">' + ico("box") + 'عطور منشورة</div><div class="stat__value">' +
        (d.products_total != null ? d.products_total : state.products.length) + '</div></div>' +
        '<div class="stat"><div class="stat__label">' + ico("eyeOff") + 'عطور مخفية</div><div class="stat__value">' +
        (d.products_hidden != null ? d.products_hidden : "—") + '</div></div>' +
        '<div class="stat"><div class="stat__label">' + ico("tag") + 'عطور بخصم</div><div class="stat__value">' +
        (d.products_discounted != null ? d.products_discounted : "—") + '</div></div>' +
        '<div class="stat"><div class="stat__label">' + ico("tag") + 'علامات وفئات</div><div class="stat__value">' +
        state.brands.length + '<small>/</small>' + state.categories.length + '</div></div>' +
        '</div>' +
        '<p class="hint mt-8">لا يتم تتبّع كميات المخزون في هذا المتجر — العطر إما منشور أو مخفي.</p></div>';

      var el = document.getElementById("dashBody");
      if (el) el.innerHTML = body;
      document.title = "لوحة التحكم | هبّة";
    }).catch(function (e) {
      var el = document.getElementById("dashBody");
      if (el) el.innerHTML = '<div class="card"><div class="empty-state"><div class="empty-state__icon">' + ico("alert") +
        '</div><h3>تعذّر تحميل الإحصائيات</h3><p>' + esc(errText(e)) + '</p></div></div>';
    });
  }

  /* ------------------------------ orders ------------------------------ */
  function orderCounts() {
    var c = { all: state.orders.length };
    Object.keys(STATUS).forEach(function (k) { c[k] = 0; });
    state.orders.forEach(function (o) { c[o.status] = (c[o.status] || 0) + 1; });
    return c;
  }

  function renderOrders(title, sub) {
    var counts = orderCounts();
    var filtered = state.orders.filter(function (o) {
      if (state.orderFilter !== "all" && o.status !== state.orderFilter) return false;
      var q = state.orderQuery.trim().toLowerCase();
      if (!q) return true;
      return (o.order_number + " " + o.customer_name + " " + o.customer_phone).toLowerCase().indexOf(q) > -1;
    });

    var chips = '<div class="chips">' +
      '<button class="chip' + (state.orderFilter === "all" ? " is-active" : "") + '" data-ofilter="all">الكل <span class="n">' + counts.all + '</span></button>' +
      Object.keys(STATUS).map(function (k) {
        return '<button class="chip' + (state.orderFilter === k ? " is-active" : "") + '" data-ofilter="' + k + '">' +
          STATUS[k].label + ' <span class="n">' + (counts[k] || 0) + '</span></button>';
      }).join("") + '</div>';

    var rows = filtered.map(function (o) {
      var st = STATUS[o.status] || { label: o.status, cls: "tag--neutral" };
      return '<tr data-order-row="' + o.id + '">' +
        '<td><div class="td-main"><strong class="mono">' + esc(o.order_number) + '</strong>' +
        '<span>' + fmtDate(o.created_at, true) + '</span></div></td>' +
        '<td><div class="td-main"><strong>' + esc(o.customer_name) + '</strong>' +
        '<span class="mono">' + esc(o.customer_phone) + '</span></div></td>' +
        '<td>' + (o.fulfillment_method === "delivery"
          ? '<span class="tag tag--neutral">' + ico("truck") + 'توصيل</span>'
          : '<span class="tag tag--neutral">' + ico("store") + 'استلام</span>') + '</td>' +
        '<td>' + money(o.total) + '</td>' +
        '<td><span class="tag ' + st.cls + '">' + st.label + '</span></td>' +
        '<td class="td-actions">' +
        '<a class="icon-btn" href="#/orders/' + o.id + '" aria-label="تفاصيل الطلب">' + ico("eye") + '</a>' +
        (o.status !== "cancelled" && o.status !== "delivered"
          ? '<a class="icon-btn" target="_blank" rel="noopener" href="' + (waLink(o.customer_phone, o) || "#") + '" aria-label="واتساب العميل">' + ico("whatsapp") + '</a>'
          : "") +
        '</td></tr>';
    }).join("");

    var body =
      '<div class="toolbar">' + chips + '<div class="grow"></div>' +
      '<div class="search-input">' + ico("search") +
      '<input class="input" id="orderSearch" placeholder="رقم الطلب، الاسم، أو الهاتف" value="' + esc(state.orderQuery) + '">' +
      '</div></div>' +
      '<div class="card card--pad0">' +
      (filtered.length
        ? '<div class="table-wrap"><table class="adm"><thead><tr>' +
          '<th>الطلب</th><th>العميل</th><th>طريقة الاستلام</th><th>الإجمالي</th><th>الحالة</th><th></th>' +
          '</tr></thead><tbody>' + rows + '</tbody></table></div>'
        : '<div class="empty-state"><div class="empty-state__icon">' + ico("bag") + '</div>' +
          '<h3>لا توجد طلبات مطابقة</h3><p>جرّب تغيير عامل التصفية أو البحث.</p></div>') +
      '</div>';

    mount(shellHTML("orders", title, sub, body));
    document.title = "الطلبات | هبّة";

    var search = document.getElementById("orderSearch");
    if (search) {
      search.addEventListener("input", debounce(function () {
        state.orderQuery = search.value;
        renderOrders(title, sub);
        var s2 = document.getElementById("orderSearch");
        if (s2) { s2.focus(); s2.setSelectionRange(s2.value.length, s2.value.length); }
      }, 250));
    }
  }

  /**
   * Build a wa.me link from a stored phone number.
   * Returns "" when the number cannot be normalised, so callers hide the
   * button instead of opening a conversation with a bogus contact.
   */
  function waLink(phone, order) {
    var digits = String(phone || "").replace(/\D/g, "");
    if (!digits) return "";
    // 00 international prefix -> strip it (0021894... becomes 21894...)
    if (digits.indexOf("00") === 0) digits = digits.slice(2);
    // local Libyan form 09XXXXXXXX -> 2189XXXXXXXX
    if (digits.indexOf("218") !== 0) digits = "218" + digits.replace(/^0+/, "");
    // a usable international number is 11-15 digits
    if (digits.length < 11 || digits.length > 15) return "";

    var text = order
      ? "مرحباً " + order.customer_name + "، بخصوص طلبك " + order.order_number + " من متجر هبّة."
      : "";
    return "https://wa.me/" + digits + (text ? "?text=" + encodeURIComponent(text) : "");
  }

  /* ---------------------------- order detail ---------------------------- */
  function renderOrder(id) {
    mount(shellHTML("orders", "تفاصيل الطلب", "جارٍ التحميل…", loadingCard()));

    DB.orders.get(id).then(function (res) {
      var o = res.order;
      var items = res.items;
      var st = STATUS[o.status] || { label: o.status, cls: "tag--neutral", next: [] };
      var canChange = st.next && st.next.length > 0;

      /* status timeline */
      var reachedIndex = STATUS_ORDER.indexOf(o.status);
      var timeline = STATUS_ORDER.map(function (k, i) {
        var cls = "tl-item" + (i < reachedIndex ? " is-done" : i === reachedIndex ? " is-current" : "");
        var stamp = i === reachedIndex && o.status_updated_at ? fmtDate(o.status_updated_at, true) : "";
        return '<div class="' + cls + '"><div class="tl-dot-wrap"><span class="tl-dot"></span><span class="tl-line"></span></div>' +
          '<div class="tl-text">' + STATUS[k].label + (stamp ? '<span>' + stamp + '</span>' : "") + '</div></div>';
      }).join("");
      if (o.status === "cancelled") {
        timeline = '<div class="alert alert--danger">' + ico("alert") + '<div>تم إلغاء هذا الطلب' +
          (o.status_updated_at ? " في " + fmtDate(o.status_updated_at, true) : "") + '.</div></div>';
      } else {
        timeline = '<div class="timeline">' + timeline + '</div>';
      }

      var itemsRows = items.map(function (it) {
        return '<tr><td><div class="td-main"><strong>' + esc(it.product_name_ar) + '</strong>' +
          '<span>' + esc(it.brand_name_ar) + ' · ' + esc(it.size_label) + '</span></div></td>' +
          '<td class="num">' + it.quantity + '</td>' +
          '<td>' + money(it.unit_price) + (it.list_price && it.list_price > it.unit_price
            ? '<div class="tiny dim" style="text-decoration:line-through">' + moneyText(it.list_price) + '</div>' : '') + '</td>' +
          '<td class="line-total">' + money(it.unit_price * it.quantity) + '</td></tr>';
      }).join("");

      var body =
        '<div class="between wrap" style="margin-block-end:12px">' +
        '<div class="row"><a class="icon-btn" href="#/orders" aria-label="عودة">' + ico("arrowBack") + '</a>' +
        '<div><div style="font-size:16px;font-weight:600" class="mono">' + esc(o.order_number) + '</div>' +
        '<div class="tiny dim">' + fmtDate(o.created_at, true) + ' · ' + relTime(o.created_at) + '</div></div></div>' +
        '<div class="row">' +
        '<a class="btn btn--ghost btn--sm" href="' + waLink(o.customer_phone, o) + '" target="_blank" rel="noopener">' +
        ico("whatsapp") + 'واتساب العميل</a>' +
        '<a class="btn btn--ghost btn--sm" href="tel:' + esc(o.customer_phone) + '">' + ico("phone") + 'اتصال</a>' +
        '</div></div>' +

        '<div class="detail">' +
        '<div>' +
        /* items */
        '<div class="card card--pad0"><div class="card__head"><h3 class="card__title">العطور المطلوبة</h3>' +
        '<span class="tag ' + st.cls + '">' + st.label + '</span></div>' +
        '<div class="table-wrap"><table class="adm items-table"><thead><tr>' +
        '<th>العطر</th><th>الكمية</th><th>سعر الوحدة</th><th>المجموع</th></tr></thead><tbody>' + itemsRows + '</tbody></table></div>' +
        '<div style="padding:0 16px 16px"><div class="totals">' +
        '<div class="totals__row"><span>المجموع الفرعي</span><span>' + money(o.subtotal) + '</span></div>' +
        '<div class="totals__row"><span>رسوم التوصيل</span><span>' + (Number(o.delivery_fee) ? money(o.delivery_fee) : '<span class="dim">لا رسوم</span>') + '</span></div>' +
        '<div class="totals__row totals__row--total"><span>الإجمالي</span><span>' + money(o.total) + '</span></div>' +
        '</div></div></div>' +

        /* customer */
        '<div class="card mt-14"><h3 class="card__title" style="margin-block-end:10px">بيانات العميل</h3>' +
        '<div class="kv">' +
        '<div class="kv__row"><span class="kv__k">الاسم</span><span class="kv__v">' + esc(o.customer_name) + '</span></div>' +
        '<div class="kv__row"><span class="kv__k">الهاتف</span><span class="kv__v mono">' + esc(o.customer_phone) + '</span></div>' +
        '<div class="kv__row"><span class="kv__k">طريقة الاستلام</span><span class="kv__v">' +
        (o.fulfillment_method === "delivery" ? "توصيل" : "استلام من المحل") + '</span></div>' +
        (o.delivery_address ? '<div class="kv__row"><span class="kv__k">العنوان</span><span class="kv__v">' + esc(o.delivery_address) + '</span></div>' : "") +
        (o.customer_note ? '<div class="kv__row"><span class="kv__k">ملاحظات</span><span class="kv__v">' + esc(o.customer_note) + '</span></div>' : "") +
        '</div></div>' +

        '<div class="alert alert--info mt-14">' + ico("shield") +
        '<div>هذه الأسعار والأسماء محفوظة كما كانت لحظة الطلب — لا تتغيّر إذا عدّلت العطر أو حذفته لاحقاً.</div></div>' +
        '</div>' +

        /* side: status control */
        '<div>' +
        '<div class="card"><h3 class="card__title" style="margin-block-end:12px">حالة الطلب</h3>' +
        (canChange
          ? '<div class="field"><label for="statusSelect">تحديث إلى</label>' +
            '<select class="select status-select" id="statusSelect">' +
            '<option value="">— اختر الحالة الجديدة —</option>' +
            st.next.map(function (s) { return '<option value="' + s + '">' + STATUS[s].label + '</option>'; }).join("") +
            '</select>' +
            '<button class="btn btn--primary btn--block mt-8" id="applyStatus" disabled>تطبيق الحالة</button>' +
            '<p class="hint">الانتقالات المسموحة فقط: ' +
            st.next.map(function (s) { return STATUS[s].label; }).join(" · ") + '</p></div>'
          : '<p class="muted tiny">هذا الطلب في حالة نهائية ولا يمكن تغييرها.</p>') +
        '<div class="mt-14" style="border-block-start:1px solid var(--line);padding-block-start:12px">' + timeline + '</div>' +
        '</div>' +
        '<div class="card mt-14"><h3 class="card__title" style="margin-block-end:10px">مشاركة</h3>' +
        '<a class="btn btn--ghost btn--block" href="' + waLink(o.customer_phone, o) + '" target="_blank" rel="noopener">' +
        ico("whatsapp") + 'مراسلة العميل على واتساب</a>' +
        '<p class="hint">يُفتح واتساب على رقم العميل المحفوظ مع الطلب — دون حاجة لحساب.</p></div>' +
        '</div></div>';

      mount(shellHTML("orders", "الطلب " + o.order_number, fmtDate(o.created_at, true), body));
      document.title = o.order_number + " | هبّة";

      var sel = document.getElementById("statusSelect");
      var btn = document.getElementById("applyStatus");
      if (sel && btn) {
        sel.addEventListener("change", function () { btn.disabled = !sel.value; });
        btn.addEventListener("click", function () {
          if (!sel.value) return;
          btn.disabled = true;
          btn.textContent = "جارٍ التحديث…";
          DB.orders.setStatus(o.id, sel.value).then(function () {
            toast("تم تحديث حالة الطلب");
            return DB.orders.list({});
          }).then(function (list) {
            state.orders = list || [];
            render();
          }).catch(function (e) {
            toast(errText(e), "error");
            btn.disabled = false;
            btn.textContent = "تطبيق الحالة";
          });
        });
      }
    }).catch(function (e) {
      mount(shellHTML("orders", "تفاصيل الطلب", "", '<div class="card"><div class="empty-state">' +
        '<div class="empty-state__icon">' + ico("alert") + '</div><h3>تعذّر تحميل الطلب</h3><p>' +
        esc(errText(e)) + '</p><a class="btn btn--ghost mt-14" href="#/orders">عودة للطلبات</a></div></div>'));
    });
  }

  /* ----------------------------- products ----------------------------- */
  function productImage(p) {
    if (p._image_url) return p._image_url;
    var imgs = p.product_images || [];
    var primary = imgs.filter(function (i) { return i.is_primary; })[0] || imgs[0];
    if (primary && primary.storage_path) {
      return DB.storage.publicUrl("product-images", primary.storage_path);
    }
    return p._fallback || "";
  }

  function renderProducts(title, sub) {
    var body = '<div id="productsBody">' + loadingCard() + '</div>';
    mount(shellHTML("products", title, sub, body,
      '<a class="btn btn--primary" href="#/product-new">' + ico("plus") + 'إضافة عطر</a>'));
    document.title = "العطور | هبّة";

    DB.products.list().then(function (list) {
      state.products = list || [];
      paint();
    }).catch(function (e) {
      document.getElementById("productsBody").innerHTML =
        '<div class="card"><div class="empty-state"><div class="empty-state__icon">' + ico("alert") +
        '</div><h3>تعذّر تحميل العطور</h3><p>' + esc(errText(e)) + '</p></div></div>';
    });

    function paint() {
      var q = state.productQuery.trim().toLowerCase();
      var list = state.products.filter(function (p) {
        if (state.productFilter === "visible" && !p.is_visible) return false;
        if (state.productFilter === "hidden" && p.is_visible) return false;
        if (state.productFilter === "discount" && p.discount_price == null) return false;
        if (!q) return true;
        return ((p.name_ar || "") + " " + (p.name_en || "") + " " +
          ((p.brands || {}).name_ar || "") + " " + ((p.categories || {}).name_ar || "")).toLowerCase().indexOf(q) > -1;
      });

      var html =
        '<div class="toolbar">' +
        '<div class="chips">' +
        '<button class="chip' + (state.productFilter === "all" ? " is-active" : "") + '" data-pfilter="all">الكل <span class="n">' + state.products.length + '</span></button>' +
        '<button class="chip' + (state.productFilter === "visible" ? " is-active" : "") + '" data-pfilter="visible">منشور</button>' +
        '<button class="chip' + (state.productFilter === "hidden" ? " is-active" : "") + '" data-pfilter="hidden">مخفي</button>' +
        '<button class="chip' + (state.productFilter === "discount" ? " is-active" : "") + '" data-pfilter="discount">بخصم</button>' +
        '</div><div class="grow"></div>' +
        '<div class="search-input">' + ico("search") +
        '<input class="input" id="productSearch" placeholder="اسم العطر أو العلامة" value="' + esc(state.productQuery) + '"></div>' +
        '</div>';

      html += '<div class="card card--pad0">';
      if (!list.length) {
        html += '<div class="empty-state"><div class="empty-state__icon">' + ico("box") + '</div>' +
          '<h3>لا توجد عطور</h3><p>أضف أول عطر ليظهر في المتجر.</p>' +
          '<a class="btn btn--primary mt-14" href="#/product-new">إضافة عطر</a></div>';
      } else {
        html += '<div class="table-wrap"><table class="adm"><thead><tr>' +
          '<th>العطر</th><th>العلامة</th><th>الفئة</th><th>الحجم</th><th>السعر</th><th>الحالة</th><th></th>' +
          '</tr></thead><tbody>' +
          list.map(function (p) {
            var img = productImage(p);
            var isNew = (Date.now() - new Date(p.created_at).getTime()) < 3 * 864e5;
            return '<tr>' +
              '<td><div class="cell-product">' +
              (img ? '<img class="thumb" src="' + esc(img) + '" alt="">' : '<span class="thumb"></span>') +
              '<div class="td-main"><strong>' + esc(p.name_ar) + '</strong>' +
              '<span class="en">' + esc(p.name_en || "") + '</span></div></div></td>' +
              '<td class="dim">' + esc((p.brands || {}).name_ar || "—") + '</td>' +
              '<td class="dim">' + esc((p.categories || {}).name_ar || "—") + '</td>' +
              '<td class="dim">' + esc(p.size_label) + '</td>' +
              '<td>' + (p.discount_price != null
                ? money(p.discount_price) + '<div class="tiny dim" style="text-decoration:line-through">' + moneyText(p.price) + '</div>'
                : money(p.price)) + '</td>' +
              '<td><div class="chips" style="gap:4px">' +
              (p.is_visible
                ? '<span class="tag tag--green">منشور</span>'
                : '<span class="tag tag--muted">مخفي</span>') +
              (p.discount_price != null ? '<span class="tag tag--gold">خصم</span>' : "") +
              (isNew ? '<span class="tag tag--blue">جديد</span>' : "") +
              (p.is_best_seller ? '<span class="tag tag--neutral">الأكثر مبيعاً</span>' : "") +
              '</div></td>' +
              '<td class="td-actions">' +
              '<a class="icon-btn" href="#/product-edit/' + p.id + '" aria-label="تعديل">' + ico("edit") + '</a>' +
              '<button class="icon-btn" data-toggle-visible="' + p.id + '" aria-label="' +
              (p.is_visible ? "إخفاء" : "نشر") + '">' + ico(p.is_visible ? "eyeOff" : "eye") + '</button>' +
              '<button class="icon-btn icon-btn--danger" data-delete-product="' + p.id + '" aria-label="حذف">' + ico("trash") + '</button>' +
              '</td></tr>';
          }).join("") + '</tbody></table></div>';
      }
      html += '</div>';
      document.getElementById("productsBody").innerHTML = html;

      var s = document.getElementById("productSearch");
      if (s) {
        s.addEventListener("input", debounce(function () {
          state.productQuery = s.value; paint();
          var s2 = document.getElementById("productSearch");
          if (s2) { s2.focus(); s2.setSelectionRange(s2.value.length, s2.value.length); }
        }, 240));
      }
    }
  }

  function renderProductForm(id) {
    var isEdit = !!id;
    mount(shellHTML("products", isEdit ? "تعديل عطر" : "إضافة عطر", "", '<div id="formBody">' + loadingCard() + '</div>'));

    var load = isEdit ? DB.products.get(id) : Promise.resolve(null);
    Promise.all([
      load,
      DB.brands.list(),
      DB.categories.list()
    ]).then(function (res) {
      var p = res[0] || {
        name_ar: "", name_en: "", brand_id: "", category_id: "", size_label: "",
        price: "", discount_price: "", concentration: "", fragrance_family: "",
        description_ar: "", is_visible: true, is_best_seller: false, product_images: []
      };
      state.editing = p;
      paint(p, res[1] || [], res[2] || []);
    }).catch(function (e) {
      document.getElementById("formBody").innerHTML =
        '<div class="card"><div class="empty-state"><h3>تعذّر تحميل النموذج</h3><p>' + esc(errText(e)) + '</p></div></div>';
    });

    function paint(p, brands, cats) {
      var imgs = (p.product_images || []).slice().sort(function (a, b) { return (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0); });

      var body =
        '<form id="productForm" novalidate>' +
        '<div class="grid-2">' +

        /* main fields */
        '<div class="card"><h3 class="card__title" style="margin-block-end:12px">بيانات العطر</h3>' +
        '<div class="form-grid">' +
        '<div class="field"><label for="f-name_ar">اسم العطر بالعربية <span class="req">*</span></label>' +
        '<input class="input" id="f-name_ar" value="' + esc(p.name_ar) + '" required></div>' +
        '<div class="field"><label for="f-name_en">الاسم بالإنجليزية</label>' +
        '<input class="input" id="f-name_en" dir="ltr" value="' + esc(p.name_en || "") + '"></div>' +
        '<div class="form-grid form-grid--2">' +
        '<div class="field"><label for="f-brand">العلامة التجارية <span class="req">*</span></label>' +
        '<select class="select" id="f-brand">' +
        '<option value="">— اختر العلامة —</option>' +
        brands.map(function (b) {
          return '<option value="' + b.id + '"' + (b.id === p.brand_id ? " selected" : "") + '>' + esc(b.name_ar) + ' — ' + esc(b.name_en) + '</option>';
        }).join("") + '</select></div>' +
        '<div class="field"><label for="f-category">الفئة <span class="req">*</span></label>' +
        '<select class="select" id="f-category">' +
        '<option value="">— اختر الفئة —</option>' +
        cats.map(function (c) {
          return '<option value="' + c.id + '"' + (c.id === p.category_id ? " selected" : "") + '>' + esc(c.name_ar) + '</option>';
        }).join("") + '</select></div></div>' +

        '<div class="form-grid form-grid--2">' +
        '<div class="field"><label for="f-size">الحجم <span class="req">*</span></label>' +
        '<input class="input" id="f-size" value="' + esc(p.size_label || "") + '" placeholder="100 مل">' +
        '<p class="hint">حجم واحد لكل عطر — لا توجد أحجام متعددة.</p></div>' +
        '<div class="field"><label for="f-concentration">التركيز</label>' +
        '<input class="input" id="f-concentration" value="' + esc(p.concentration || "") + '" placeholder="Eau de Parfum"></div></div>' +

        '<div class="form-grid form-grid--2">' +
        '<div class="field"><label for="f-family">العائلة العطرية</label>' +
        '<input class="input" id="f-family" value="' + esc(p.fragrance_family || "") + '" placeholder="زهري"></div>' +
        '</div>' +

        '<div class="form-grid form-grid--2">' +
        '<div class="field"><label for="f-price">السعر الأصلي (د.ل) <span class="req">*</span></label>' +
        '<input class="input num" id="f-price" type="number" min="1" step="0.5" dir="ltr" value="' + esc(p.price || "") + '" required></div>' +
        '<div class="field"><label for="f-discount">سعر الخصم (د.ل)</label>' +
        '<input class="input num" id="f-discount" type="number" min="0.5" step="0.5" dir="ltr" value="' +
        esc(p.discount_price == null ? "" : p.discount_price) + '" placeholder="اتركه فارغاً لتعطيل الخصم">' +
        '<p class="hint">عند تعبئته يُعرض السعر الأصلي مشطوباً ويُحسب الخصم تلقائياً.</p></div></div>' +

        '<div class="field"><label for="f-desc">الوصف</label>' +
        '<textarea class="textarea" id="f-desc">' + esc(p.description_ar || "") + '</textarea></div>' +

        '<div class="form-grid form-grid--2">' +
        '<label class="switch"><input type="checkbox" id="f-visible"' + (p.is_visible ? " checked" : "") + '>' +
        '<span class="switch__track"></span><span><span class="switch__text">منشور في المتجر</span>' +
        '<span class="switch__desc">عند الإيقاف يُخفى العطر دون حذفه.</span></span></label>' +
        '<label class="switch"><input type="checkbox" id="f-best"' + (p.is_best_seller ? " checked" : "") + '>' +
        '<span class="switch__track"></span><span><span class="switch__text">ضمن الأكثر مبيعاً</span>' +
        '<span class="switch__desc">شارة اختيارية يدوية.</span></span></label>' +
        '</div></div></div>' +

        /* images */
        '<div>' +
        '<div class="card"><h3 class="card__title" style="margin-block-end:12px">صور العطر</h3>' +
        '<div class="uploader" id="dropZone">' +
        '<div class="thumbs" id="thumbList">' +
        imgs.map(function (im) {
          var url = DB.storage.publicUrl("product-images", im.storage_path);
          return '<div class="thumb-item' + (im.is_primary ? " is-primary" : "") + '" data-image-row="' + im.id + '">' +
            (url ? '<img src="' + esc(url) + '" alt="">' : '<div class="skel" style="width:100%;height:100%"></div>') +
            (im.is_primary ? '' : '<button type="button" class="thumb-item__star" data-make-primary="' + im.id + '" aria-label="الصورة الرئيسية">' + ico("star") + '</button>') +
            '<button type="button" class="thumb-item__x" data-remove-image="' + im.id + '" aria-label="حذف الصورة">' + ico("close") + '</button>' +
            '</div>';
        }).join("") +
        '</div>' +
        '<div class="row wrap">' +
        '<label class="file-btn">' + ico("image") + 'اختاري صوراً' +
        '<input type="file" id="fileInput" accept="image/jpeg,image/png,image/webp" multiple></label>' +
        '<span class="hint" id="uploadHint">JPEG أو PNG أو WebP · حتى 5 ميجابايت للصورة</span>' +
        '</div>' +
        '<p class="hint">أول صورة تُعتبر الرئيسية. يمكنك تغيير الصورة الرئيسية بالضغط على النجمة.</p>' +
        '</div></div>' +

        '<div class="card mt-14"><div class="between wrap">' +
        '<a class="btn btn--ghost" href="#/products">إلغاء</a>' +
        '<button class="btn btn--primary" type="submit" id="saveProduct">' +
        (isEdit ? "حفظ التعديلات" : "إضافة العطر") + '</button>' +
        '</div>' +
        '<p class="hint mt-8">تاريخ الإنشاء يُسجَّل تلقائياً ويظهر العطر في «وصل حديثاً» لمدة 3 أيام فقط.</p>' +
        '</div>' +
        '</div></div></form>';

      document.getElementById("formBody").innerHTML = body;
      wireForm(p, isEdit);
    }

    function wireForm(p, isEdit) {
      var form = document.getElementById("productForm");
      var fileInput = document.getElementById("fileInput");
      var pending = [];

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var nameAr = form.querySelector("#f-name_ar").value.trim();
        var brandId = form.querySelector("#f-brand").value;
        var catId = form.querySelector("#f-category").value;
        var size = form.querySelector("#f-size").value.trim();
        var price = parseFloat(form.querySelector("#f-price").value);
        var discountRaw = form.querySelector("#f-discount").value.trim();
        var discount = discountRaw === "" ? null : parseFloat(discountRaw);

        var bad = [];
        if (nameAr.length < 2) bad.push(["#f-name_ar", "اسم العطر مطلوب."]);
        if (!brandId) bad.push(["#f-brand", "اختر العلامة."]);
        if (!catId) bad.push(["#f-category", "اختر الفئة."]);
        if (!size) bad.push(["#f-size", "الحجم مطلوب."]);
        if (!(price > 0)) bad.push(["#f-price", "السعر يجب أن يكون أكبر من صفر."]);
        if (discount != null && !(discount < price)) bad.push(["#f-discount", "سعر الخصم يجب أن يكون أقل من السعر الأصلي."]);

        form.querySelectorAll(".err").forEach(function (n) { n.remove(); });
        if (bad.length) {
          bad.forEach(function (b) {
            var f = form.querySelector(b[0]);
            if (!f) return;
            f.setAttribute("aria-invalid", "true");
            var d = document.createElement("div");
            d.className = "err";
            d.style.display = "block";
            d.textContent = b[1];
            f.parentNode.appendChild(d);
          });
          toast(bad[0][1], "error");
          return;
        }

        var row = {
          name_ar: nameAr,
          name_en: form.querySelector("#f-name_en").value.trim() || null,
          brand_id: brandId,
          category_id: catId,
          size_label: size,
          price: price,
          discount_price: discount,
          concentration: form.querySelector("#f-concentration").value.trim() || null,
          fragrance_family: form.querySelector("#f-family").value.trim() || null,
          description_ar: form.querySelector("#f-desc").value.trim() || null,
          is_visible: form.querySelector("#f-visible").checked,
          is_best_seller: form.querySelector("#f-best").checked
        };

        var btn = document.getElementById("saveProduct");
        btn.disabled = true;
        btn.textContent = isEdit ? "جارٍ الحفظ…" : "جارٍ الإضافة…";

        var op = isEdit
          ? DB.products.update(p.id, row)
          : DB.products.create(row, pending.map(function (x) { return x.path; }));

        op.then(function () {
          toast(isEdit ? "تم حفظ التعديلات" : "تمت إضافة العطر");
          location.hash = "#/products";
        }).catch(function (err) {
          toast(errText(err), "error");
          btn.disabled = false;
          btn.textContent = isEdit ? "حفظ التعديلات" : "إضافة العطر";
        });
      });

      /* image uploads */
      if (fileInput) {
        fileInput.addEventListener("change", function () {
          var files = Array.prototype.slice.call(fileInput.files || []);
          if (!files.length) return;
          var hint = document.getElementById("uploadHint");
          if (hint) hint.textContent = "جارٍ الرفع…";
          var chain = Promise.resolve();
          files.forEach(function (file) {
            chain = chain.then(function () {
              return DB.storage.upload("product-images", file, isEdit ? p.id : "new").then(function (path) {
                pending.push({ path: path });
                if (isEdit) return DB.products.addImage(p.id, path, false);
                return null;
              });
            });
          });
          chain.then(function () {
            if (isEdit) { renderProductForm(p.id); toast("تم رفع الصور"); }
            else {
              var list = document.getElementById("thumbList");
              files.forEach(function (file) {
                var url = URL.createObjectURL(file);
                var div = document.createElement("div");
                div.className = "thumb-item";
                div.innerHTML = '<img src="' + url + '" alt="">';
                if (list) list.appendChild(div);
              });
              if (hint) hint.textContent = "ستُرفع الصور عند الحفظ.";
            }
          }).catch(function (e) { toast(errText(e), "error"); });
        });
      }
    }
  }

  /* ------------------------------ brands ------------------------------ */
  function renderBrands(title, sub) {
    mount(shellHTML("brands", title, sub, '<div id="brandsBody">' + loadingCard() + '</div>',
      '<button class="btn btn--primary" data-new-brand>' + ico("plus") + 'إضافة علامة</button>'));

    load().then(paint).catch(function (e) { toast(errText(e), "error"); });

    function load() {
      // Product counts must be real: load both lists together so the column is
      // never shown as a misleading 0 on a route that never loaded products.
      return Promise.all([DB.brands.list(), DB.products.list()]).then(function (r) {
        return { brands: r[0], products: r[1] };
      });
    }
    function paint(data) {
      var list = data.brands;
      state.brands = list;
      state.products = data.products;
      var counts = {};
      data.products.forEach(function (p) { counts[p.brand_id] = (counts[p.brand_id] || 0) + 1; });

      var html = '<div class="card card--pad0">';
      if (!list.length) {
        html += '<div class="empty-state"><div class="empty-state__icon">' + ico("tag") +
          '</div><h3>لا توجد علامات</h3><p>أضف أول علامة تجارية.</p></div>';
      } else {
        html += '<div class="table-wrap"><table class="adm"><thead><tr>' +
          '<th>العلامة</th><th>النبذة</th><th>عدد العطور</th><th>الحالة</th><th></th></tr></thead><tbody>' +
          list.map(function (b) {
            var logo = b.logo_path ? DB.storage.publicUrl("brand-logos", b.logo_path) : "";
            return '<tr><td><div class="cell-product">' +
              (logo ? '<img class="thumb" src="' + esc(logo) + '" alt="">'
                    : '<span class="thumb" style="display:grid;place-items:center;font-family:var(--font-en);font-size:11px;letter-spacing:.08em">' +
                      esc((b.name_en || "").slice(0, 3).toUpperCase()) + '</span>') +
              '<div class="td-main"><strong>' + esc(b.name_ar) + '</strong>' +
              '<span class="en">' + esc(b.name_en) + '</span></div></div></td>' +
              '<td class="dim" style="max-width:240px">' + esc(b.tagline_ar || "—") + '</td>' +
              '<td class="num">' + (counts[b.id] || 0) + '</td>' +
              '<td>' + (b.is_visible ? '<span class="tag tag--green">ظاهرة</span>' : '<span class="tag tag--muted">مخفية</span>') + '</td>' +
              '<td class="td-actions">' +
              '<button class="icon-btn" data-edit-brand="' + b.id + '" aria-label="تعديل">' + ico("edit") + '</button>' +
              '<button class="icon-btn" data-toggle-brand="' + b.id + '" aria-label="' + (b.is_visible ? "إخفاء" : "إظهار") + '">' +
              ico(b.is_visible ? "eyeOff" : "eye") + '</button>' +
              '<button class="icon-btn icon-btn--danger" data-delete-brand="' + b.id + '" aria-label="حذف">' + ico("trash") + '</button>' +
              '</td></tr>';
          }).join("") + '</tbody></table></div>';
      }
      html += '</div>' +
        '<div class="alert alert--info mt-14">' + ico("shield") +
        '<div>إخفاء علامة يُخفي كل عطورها من المتجر تلقائياً. لا يمكن حذف علامة مرتبطة بعطور — أخفيها أو انقل عطورها أولاً.</div></div>';
      document.getElementById("brandsBody").innerHTML = html;
    }

    window.__brandsReload = function () { load().then(paint); };
  }

  /* ---------------------------- categories ---------------------------- */
  function renderCategories(title, sub) {
    mount(shellHTML("categories", title, sub, '<div id="catsBody">' + loadingCard() + '</div>',
      '<button class="btn btn--primary" data-new-category>' + ico("plus") + 'إضافة فئة</button>'));

    DB.categories.list().then(function (list) {
      state.categories = list;
      var counts = {};
      state.products.forEach(function (p) { counts[p.category_id] = (counts[p.category_id] || 0) + 1; });

      var html = '<div class="card card--pad0">';
      if (!list.length) {
        html += '<div class="empty-state"><div class="empty-state__icon">' + ico("grid") + '</div><h3>لا توجد فئات</h3></div>';
      } else {
        html += '<div class="table-wrap"><table class="adm"><thead><tr>' +
          '<th>الفئة</th><th>الاسم بالإنجليزية</th><th>عدد العطور</th><th>الحالة</th><th></th></tr></thead><tbody>' +
          list.map(function (c) {
            return '<tr><td><div class="td-main"><strong>' + esc(c.name_ar) + '</strong>' +
              '<span class="en">' + esc(c.name_en || "") + '</span></div></td>' +
              '<td class="dim en">' + esc(c.name_en || "—") + '</td>' +
              '<td class="num">' + (counts[c.id] || 0) + '</td>' +
              '<td>' + (c.is_visible ? '<span class="tag tag--green">ظاهرة</span>' : '<span class="tag tag--muted">مخفية</span>') + '</td>' +
              '<td class="td-actions">' +
              '<button class="icon-btn" data-edit-cat="' + c.id + '" aria-label="تعديل">' + ico("edit") + '</button>' +
              '<button class="icon-btn" data-toggle-cat="' + c.id + '" aria-label="' + (c.is_visible ? "إخفاء" : "إظهار") + '">' +
              ico(c.is_visible ? "eyeOff" : "eye") + '</button>' +
              '<button class="icon-btn icon-btn--danger" data-delete-cat="' + c.id + '" aria-label="حذف">' + ico("trash") + '</button>' +
              '</td></tr>';
          }).join("") + '</tbody></table></div>';
      }
      html += '</div>' +
        '<div class="alert alert--info mt-14">' + ico("shield") +
        '<div>الخصومات و«وصل حديثاً» أقسام تلقائية وليست فئات: الخصم يظهر تلقائياً عند وجود سعر خصم، ' +
        'و«وصل حديثاً» يعتمد على تاريخ الإضافة (3 أيام).</div></div>';
      document.getElementById("catsBody").innerHTML = html;
    }).catch(function (e) {
      document.getElementById("catsBody").innerHTML = '<div class="card"><div class="empty-state"><h3>تعذّر التحميل</h3><p>' + esc(errText(e)) + '</p></div></div>';
    });
  }

  /* ------------------------------ settings ------------------------------ */
  function renderSettings(title, sub) {
    mount(shellHTML("settings", title, sub, '<div id="setBody">' + loadingCard() + '</div>'));

    DB.settings.get().then(function (s) {
      state.settings = s;
      var body =
        '<form id="settingsForm" novalidate>' +
        '<div class="grid-2">' +
        '<div class="card"><h3 class="card__title" style="margin-block-end:12px">استقبال الطلبات</h3>' +
        '<label class="switch"><input type="checkbox" id="s-enabled"' + (s.orders_enabled ? " checked" : "") + '>' +
        '<span class="switch__track"></span><span><span class="switch__text">المتجر يستقبل طلبات جديدة</span>' +
        '<span class="switch__desc">عند الإيقاف يرفض الخادم أي طلب جديد (وليس الواجهة فقط).</span></span></label>' +
        '<hr style="border:0;border-block-start:1px solid var(--line);margin-block:16px">' +
        '<div class="field"><label for="s-whatsapp">رقم واتساب لاستقبال الطلبات</label>' +
        '<input class="input mono" id="s-whatsapp" dir="ltr" inputmode="numeric" value="' + esc(s.whatsapp_number || "") + '" placeholder="2189XXXXXXXX">' +
        '<p class="hint">بالصيغة الدولية بدون + أو مسافات (مثال: 218911234567).</p></div>' +
        '<div class="field mt-14"><label for="s-contact">رقم التواصل العام</label>' +
        '<input class="input mono" id="s-contact" dir="ltr" value="' + esc(s.contact_phone || "") + '" placeholder="اختياري"></div>' +
        '</div>' +

        '<div class="card"><h3 class="card__title" style="margin-block-end:12px">التوصيل والعنوان</h3>' +
        '<div class="form-grid form-grid--2">' +
        '<div class="field"><label for="s-fee">رسوم التوصيل (د.ل)</label>' +
        '<input class="input num" id="s-fee" type="number" min="0" step="0.5" dir="ltr" value="' +
        (s.delivery_fee == null ? "" : s.delivery_fee) + '"></div>' +
        '<div class="field"><label for="s-threshold">حد التوصيل المجاني (د.ل)</label>' +
        '<input class="input num" id="s-threshold" type="number" min="0" step="0.5" dir="ltr" value="' +
        (s.free_delivery_threshold == null ? "" : s.free_delivery_threshold) + '" placeholder="اتركه فارغاً لتعطيله">' +
        '<p class="hint">الطلبات التي تساوي أو تتجاوز هذا المبلغ تُوصَّل مجاناً.</p></div></div>' +
        '<div class="field mt-14"><label for="s-address">عنوان المحل</label>' +
        '<textarea class="textarea" id="s-address" style="min-height:66px">' + esc(s.store_address || "") + '</textarea></div>' +
        '<div class="field mt-14"><label for="s-hours">ساعات العمل</label>' +
        '<input class="input" id="s-hours" value="' + esc(s.working_hours || "") + '" placeholder="مثال: السبت – الخميس، 10 ص – 9 م"></div>' +
        '</div></div>' +

        '<div class="card mt-14"><div class="between wrap">' +
        '<div><div style="font-size:13px;font-weight:600">حفظ الإعدادات</div>' +
        '<div class="tiny dim">تُطبَّق التغييرات فوراً على المتجر.</div></div>' +
        '<button class="btn btn--primary" type="submit" id="saveSettings">حفظ الإعدادات</button>' +
        '</div></div></form>';

      document.getElementById("setBody").innerHTML = body;

      document.getElementById("settingsForm").addEventListener("submit", function (e) {
        e.preventDefault();
        var wa = document.getElementById("s-whatsapp").value.replace(/[^\d]/g, "");
        if (wa && !/^\d{9,15}$/.test(wa)) {
          toast("رقم واتساب يجب أن يكون 9–15 رقماً بالصيغة الدولية.", "error");
          return;
        }
        var patch = {
          whatsapp_number: wa || null,
          contact_phone: document.getElementById("s-contact").value.trim() || null,
          delivery_fee: numOrNull(document.getElementById("s-fee").value),
          free_delivery_threshold: numOrNull(document.getElementById("s-threshold").value),
          store_address: document.getElementById("s-address").value.trim() || null,
          working_hours: document.getElementById("s-hours").value.trim() || null,
          orders_enabled: document.getElementById("s-enabled").checked
        };
        var btn = document.getElementById("saveSettings");
        btn.disabled = true; btn.textContent = "جارٍ الحفظ…";
        DB.settings.save(patch).then(function (row) {
          state.settings = row;
          toast("تم حفظ الإعدادات");
          btn.disabled = false; btn.textContent = "حفظ الإعدادات";
        }).catch(function (err) {
          console.error("settings save failed:", err);
          toast(errText(err), "error");
          btn.disabled = false; btn.textContent = "حفظ الإعدادات";
        });
      });
    }).catch(function (e) {
      document.getElementById("setBody").innerHTML = '<div class="card"><div class="empty-state">' +
        '<div class="empty-state__icon">' + ico("alert") + '</div><h3>تعذّر تحميل الإعدادات</h3><p>' +
        esc(errText(e)) + '</p></div></div>';
    });
  }

  function numOrNull(v) {
    var t = String(v == null ? "" : v).trim();
    if (t === "") return null;
    var n = Number(t);
    return isNaN(n) ? null : n;
  }

  /* ------------------------------- modals ------------------------------- */
  function openModal(opts) {
    var host = document.createElement("div");
    host.className = "modal is-open";
    host.innerHTML = '<div class="overlay is-open" data-modal-close></div>' +
      '<div class="modal__card" role="dialog" aria-modal="true">' +
      '<button class="modal__close" data-modal-close aria-label="إغلاق">' + ico("close") + '</button>' +
      '<h3 class="modal__title">' + esc(opts.title) + '</h3>' +
      (opts.text ? '<p class="modal__text">' + opts.text + '</p>' : '') +
      (opts.body || '') +
      '<div class="modal__actions">' +
      (opts.danger
        ? '<button class="btn btn--danger" data-modal-ok>' + esc(opts.okLabel || "تأكيد") + '</button>'
        : '<button class="btn btn--primary" data-modal-ok>' + esc(opts.okLabel || "تأكيد") + '</button>') +
      '<button class="btn btn--ghost" data-modal-close>إلغاء</button>' +
      '</div></div>';
    document.body.appendChild(host);

    function close() { host.remove(); }
    host.addEventListener("click", function (e) {
      if (e.target.closest("[data-modal-close]")) close();
      if (e.target.closest("[data-modal-ok]")) {
        var okBtn = host.querySelector("[data-modal-ok]");
        okBtn.disabled = true;
        Promise.resolve(opts.onOk && opts.onOk(host)).then(function (keep) {
          if (keep !== false) close();
          else { okBtn.disabled = false; }
        }).catch(function (err) {
          toast(errText(err), "error");
          okBtn.disabled = false;
        });
      }
    });
    var first = host.querySelector("input, textarea, select, button[data-modal-ok]");
    if (first) first.focus();
    return host;
  }

  /* --------------------------- brand modal --------------------------- */
  function brandModal(brand) {
    var isEdit = !!brand;
    var b = brand || { name_ar: "", name_en: "", tagline_ar: "", description_ar: "", is_visible: true, logo_path: null };
    var pendingLogo = null;

    var host = openModal({
      title: isEdit ? "تعديل العلامة" : "إضافة علامة تجارية",
      body:
        '<div class="field"><label for="b-name_ar">الاسم بالعربية <span class="req">*</span></label>' +
        '<input class="input" id="b-name_ar" value="' + esc(b.name_ar) + '"></div>' +
        '<div class="field mt-14"><label for="b-name_en">الاسم بالإنجليزية <span class="req">*</span></label>' +
        '<input class="input" id="b-name_en" dir="ltr" value="' + esc(b.name_en) + '"></div>' +
        '<div class="field mt-14"><label for="b-tagline">نبذة قصيرة</label>' +
        '<input class="input" id="b-tagline" value="' + esc(b.tagline_ar || "") + '"></div>' +
        '<div class="field mt-14"><label for="b-desc">وصف العلامة</label>' +
        '<textarea class="textarea" id="b-desc">' + esc(b.description_ar || "") + '</textarea></div>' +
        '<div class="field mt-14"><label>شعار العلامة (اختياري)</label>' +
        '<div class="row wrap"><label class="file-btn">' + ico("image") + 'اختيار شعار' +
        '<input type="file" id="b-logo" accept="image/png,image/jpeg,image/webp"></label>' +
        '<span class="hint" id="b-logo-name">' + (b.logo_path ? "شعار محفوظ مسبقاً" : "لا يوجد شعار") + '</span></div>' +
        '<p class="hint">إن لم يتوفر الشعار الرسمي نعرض اسم العلامة نصياً — لا نغيّر شعارات العلامات.</p></div>' +
        '<label class="switch mt-14"><input type="checkbox" id="b-visible"' + (b.is_visible ? " checked" : "") + '>' +
        '<span class="switch__track"></span><span><span class="switch__text">ظاهرة في المتجر</span></span></label>',
      okLabel: isEdit ? "حفظ" : "إضافة",
      onOk: function (hostEl) {
        var nameAr = hostEl.querySelector("#b-name_ar").value.trim();
        var nameEn = hostEl.querySelector("#b-name_en").value.trim();
        if (!nameAr || !nameEn) { toast("الاسم بالعربية والإنجليزية مطلوبان.", "error"); return false; }
        var fileInput = hostEl.querySelector("#b-logo");
        var file = fileInput && fileInput.files && fileInput.files[0];

        var upload = file ? DB.storage.upload("brand-logos", file, "brands") : Promise.resolve(null);
        return upload.then(function (path) {
          var row = {
            name_ar: nameAr, name_en: nameEn,
            tagline_ar: hostEl.querySelector("#b-tagline").value.trim() || null,
            description_ar: hostEl.querySelector("#b-desc").value.trim() || null,
            is_visible: hostEl.querySelector("#b-visible").checked
          };
          if (path) row.logo_path = path;
          if (!isEdit) row.slug = slugify(nameEn || nameAr) + "-" + Math.random().toString(36).slice(2, 6);
          return isEdit ? DB.brands.update(b.id, row) : DB.brands.create(row);
        }).then(function () {
          toast(isEdit ? "تم تحديث العلامة" : "تمت إضافة العلامة");
          location.hash === "#/brands" ? renderBrands("العلامات التجارية", "العلامات المعروضة في المتجر") : (location.hash = "#/brands");
          if (window.__brandsReload) window.__brandsReload();
        });
      }
    });
    var fileInput = host.querySelector("#b-logo");
    if (fileInput) {
      fileInput.addEventListener("change", function () {
        var n = host.querySelector("#b-logo-name");
        if (n && fileInput.files[0]) n.textContent = fileInput.files[0].name;
      });
    }
  }

  /* -------------------------- category modal -------------------------- */
  function categoryModal(cat) {
    var isEdit = !!cat;
    var c = cat || { name_ar: "", name_en: "", is_visible: true };
    openModal({
      title: isEdit ? "تعديل الفئة" : "إضافة فئة",
      body:
        '<div class="field"><label for="c-name_ar">الاسم بالعربية <span class="req">*</span></label>' +
        '<input class="input" id="c-name_ar" value="' + esc(c.name_ar) + '"></div>' +
        '<div class="field mt-14"><label for="c-name_en">الاسم بالإنجليزية</label>' +
        '<input class="input" id="c-name_en" dir="ltr" value="' + esc(c.name_en || "") + '"></div>' +
        '<label class="switch mt-14"><input type="checkbox" id="c-visible"' + (c.is_visible ? " checked" : "") + '>' +
        '<span class="switch__track"></span><span><span class="switch__text">ظاهرة في المتجر</span></span></label>',
      okLabel: isEdit ? "حفظ" : "إضافة",
      onOk: function (host) {
        var nameAr = host.querySelector("#c-name_ar").value.trim();
        if (!nameAr) { toast("اسم الفئة مطلوب.", "error"); return false; }
        var row = {
          name_ar: nameAr,
          name_en: host.querySelector("#c-name_en").value.trim() || null,
          is_visible: host.querySelector("#c-visible").checked
        };
        if (!isEdit) row.slug = slugify(row.name_en || nameAr) + "-" + Math.random().toString(36).slice(2, 6);
        return (isEdit ? DB.categories.update(c.id, row) : DB.categories.create(row)).then(function () {
          toast(isEdit ? "تم تحديث الفئة" : "تمت إضافة الفئة");
          renderCategories("الفئات", "تنظيم العطور ضمن فئات");
        });
      }
    });
  }

  /* --------------------------- global events --------------------------- */
  document.addEventListener("click", function (e) {
    var t = e.target;

    if (t.closest("[data-menu]")) {
      var side = document.getElementById("side");
      var ov = document.getElementById("overlay");
      if (side) side.classList.toggle("is-open");
      if (ov) ov.classList.toggle("is-open");
      return;
    }
    if (t.closest("[data-close-menu]")) {
      var s2 = document.getElementById("side");
      var o2 = document.getElementById("overlay");
      if (s2) s2.classList.remove("is-open");
      if (o2) o2.classList.remove("is-open");
      return;
    }

    if (t.closest("[data-logout]")) {
      DB.auth.signOut().then(function () {
        state.session = null;
        renderLogin();
      });
      return;
    }

    var chip = t.closest("[data-ofilter]");
    if (chip) { state.orderFilter = chip.getAttribute("data-ofilter"); render(); return; }

    chip = t.closest("[data-pfilter]");
    if (chip) { state.productFilter = chip.getAttribute("data-pfilter"); render(); return; }

    var toggleP = t.closest("[data-toggle-visible]");
    if (toggleP) {
      var pid = toggleP.getAttribute("data-toggle-visible");
      var prod = state.products.filter(function (x) { return x.id === pid; })[0];
      DB.products.setVisible(pid, !prod.is_visible).then(function () {
        toast(prod.is_visible ? "تم إخفاء العطر" : "تم نشر العطر");
        render();
      }).catch(function (err) { toast(errText(err), "error"); });
      return;
    }

    var delP = t.closest("[data-delete-product]");
    if (delP) {
      var did = delP.getAttribute("data-delete-product");
      var dp = state.products.filter(function (x) { return x.id === did; })[0];
      openModal({
        title: "حذف العطر؟",
        text: "سيُحذف <b>" + esc(dp ? dp.name_ar : "") + "</b> نهائياً. الطلبات السابقة تحتفظ باسمه وسعره كما كانا.",
        danger: true, okLabel: "حذف نهائي",
        onOk: function () {
          return DB.products.remove(did).then(function () {
            toast("تم حذف العطر");
            render();
          });
        }
      });
      return;
    }

    var newB = t.closest("[data-new-brand]");
    if (newB) { brandModal(null); return; }

    var editB = t.closest("[data-edit-brand]");
    if (editB) {
      var bid = editB.getAttribute("data-edit-brand");
      brandModal(state.brands.filter(function (x) { return x.id === bid; })[0]);
      return;
    }

    var toggleB = t.closest("[data-toggle-brand]");
    if (toggleB) {
      var tbid = toggleB.getAttribute("data-toggle-brand");
      var brand = state.brands.filter(function (x) { return x.id === tbid; })[0];
      DB.brands.setVisible(tbid, !brand.is_visible).then(function () {
        toast(brand.is_visible ? "أُخفيت العلامة وعطورها" : "أُظهرت العلامة");
        render();
      }).catch(function (err) { toast(errText(err), "error"); });
      return;
    }

    var delB = t.closest("[data-delete-brand]");
    if (delB) {
      var dbid = delB.getAttribute("data-delete-brand");
      var db = state.brands.filter(function (x) { return x.id === dbid; })[0];
      openModal({
        title: "حذف العلامة؟",
        text: "لا يمكن حذف علامة مرتبطة بعطور. إن كانت العلامة فارغة سيُحذف <b>" + esc(db ? db.name_ar : "") + "</b>.",
        danger: true, okLabel: "حذف",
        onOk: function () {
          return DB.brands.remove(dbid).then(function () {
            toast("تم حذف العلامة");
            render();
          });
        }
      });
      return;
    }

    var newC = t.closest("[data-new-category]");
    if (newC) { categoryModal(null); return; }
    var editC = t.closest("[data-edit-cat]");
    if (editC) {
      var cid = editC.getAttribute("data-edit-cat");
      categoryModal(state.categories.filter(function (x) { return x.id === cid; })[0]);
      return;
    }
    var toggleC = t.closest("[data-toggle-cat]");
    if (toggleC) {
      var tcid = toggleC.getAttribute("data-toggle-cat");
      var cat = state.categories.filter(function (x) { return x.id === tcid; })[0];
      DB.categories.setVisible(tcid, !cat.is_visible).then(function () {
        toast(cat.is_visible ? "أُخفيت الفئة" : "أُظهرت الفئة");
        render();
      }).catch(function (err) { toast(errText(err), "error"); });
      return;
    }
    var delC = t.closest("[data-delete-cat]");
    if (delC) {
      var dcid = delC.getAttribute("data-delete-cat");
      var dcat = state.categories.filter(function (x) { return x.id === dcid; })[0];
      openModal({
        title: "حذف الفئة؟",
        text: "لا يمكن حذف فئة مرتبطة بعطور. الفئة: <b>" + esc(dcat ? dcat.name_ar : "") + "</b>.",
        danger: true, okLabel: "حذف",
        onOk: function () {
          return DB.categories.remove(dcid).then(function () {
            toast("تم حذف الفئة");
            render();
          });
        }
      });
      return;
    }

    var rmImg = t.closest("[data-remove-image]");
    if (rmImg) {
      var iid = rmImg.getAttribute("data-remove-image");
      DB.products.removeImage(iid).then(function () {
        toast("حُذفت الصورة");
        location.hash = "#/product-edit/" + state.editing.id;
        render();
      }).catch(function (err) { toast(errText(err), "error"); });
      return;
    }
    var mkPrimary = t.closest("[data-make-primary]");
    if (mkPrimary) {
      var mid = mkPrimary.getAttribute("data-make-primary");
      DB.products.setPrimaryImage(state.editing.id, mid).then(function () {
        toast("تم تعيين الصورة الرئيسية");
        render();
      }).catch(function (err) { toast(errText(err), "error"); });
      return;
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      var modals = document.querySelectorAll(".modal.is-open");
      if (modals.length) modals[modals.length - 1].remove();
    }
  });

  window.addEventListener("hashchange", function () {
    // never leave a dialog blocking a different page
    Array.prototype.forEach.call(document.querySelectorAll(".modal.is-open"), function (m) { m.remove(); });
    if (!state.session) return;
    render();
  });

  /* demo helpers */
  window.HABBA_ADMIN = {
    resetDemo: function () {
      if (window.supabase && window.supabase.__reset) {
        window.supabase.__reset();
        DB.auth.signOut().then(function () { location.hash = "#/"; location.reload(); });
      }
    }
  };

  boot();
})();

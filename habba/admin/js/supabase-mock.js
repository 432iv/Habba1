/* ============================================================================
   HABBA Admin — offline demo backend
   ----------------------------------------------------------------------------
   This file exists ONLY so the dashboard can be reviewed without a Supabase
   project. It implements the tiny slice of the supabase-js API the dashboard
   uses, backed by localStorage, and reproduces the same constraints as the
   PostgreSQL schema (discount < price, single size, append-only order items).

   In production: delete this <script> tag. js/db.js talks to real supabase-js
   through exactly the same interface.
   ============================================================================ */
(function () {
  "use strict";

  var KEY = "habba.admin.demo.v2";
  var REGISTRY = [];

  /* ----------------------------- seed ----------------------------- */
  function seed() {
    var now = Date.now();
    var day = 86400000;
    var brands = [
      { id: "b-lav", slug: "laverne", name_ar: "لافيرن", name_en: "Laverne", tagline_ar: "أناقة هادئة بنفحات شرقية", description_ar: "علامة تجمع بين النعومة والدفء. (وصف تجريبي)", logo_path: null, is_visible: true, sort_order: 1 },
      { id: "b-ibr", slug: "ibraq", name_ar: "إبراق", name_en: "Ibraq", tagline_ar: "عمق العود والعنبر", description_ar: "عطور شرقية وخشبية بثبات طويل. (وصف تجريبي)", logo_path: null, is_visible: true, sort_order: 2 },
      { id: "b-jam", slug: "jambool", name_ar: "جامبول", name_en: "Jambool", tagline_ar: "نفحات خفيفة لليوم", description_ar: "عطور خفيفة بحجوم يومية. (وصف تجريبي)", logo_path: null, is_visible: true, sort_order: 3 }
    ];
    var categories = [
      { id: "c-women", slug: "women", name_ar: "العطور النسائية", name_en: "Women", is_visible: true, sort_order: 1, image_path: null },
      { id: "c-floral", slug: "floral", name_ar: "زهري", name_en: "Floral", is_visible: true, sort_order: 2, image_path: null },
      { id: "c-amber", slug: "amber", name_ar: "عنبري / شرقي", name_en: "Amber", is_visible: true, sort_order: 3, image_path: null },
      { id: "c-woody", slug: "woody", name_ar: "خشبي", name_en: "Woody", is_visible: true, sort_order: 4, image_path: null },
      { id: "c-musk", slug: "musk", name_ar: "مسكي", name_en: "Musk", is_visible: true, sort_order: 5, image_path: null },
      { id: "c-fruity", slug: "fruity", name_ar: "فواكه", name_en: "Fruity", is_visible: true, sort_order: 6, image_path: null },
      { id: "c-green", slug: "green", name_ar: "أخضر / منعش", name_en: "Green", is_visible: true, sort_order: 7, image_path: null }
    ];
    var products = [
      { id: "p1", slug: "soie-dor", name_ar: "سوا دور", name_en: "Soie d'Or", brand_id: "b-lav", category_id: "c-amber", size_label: "100 مل", price: 310, discount_price: 265, concentration: "Eau de Parfum", fragrance_family: "عنبري / شرقي", description_ar: "عطر دافئ ينفتح على نفحة حمضية خفيفة ثم يستقر على الياسمين والعنبر.", is_visible: true, is_best_seller: true, created_at: new Date(now - 20 * day).toISOString(), image_path: "assets/img/products/soie-dor.jpg" },
      { id: "p2", slug: "rose-eternelle", name_ar: "روز إيترنيل", name_en: "Rose Éternelle", brand_id: "b-lav", category_id: "c-floral", size_label: "100 مل", price: 240, discount_price: null, concentration: "Eau de Parfum", fragrance_family: "زهري", description_ar: "وردة ناعمة بلمسة فاكهية، عطر أنثوي مباشر بلا مبالغة.", is_visible: true, is_best_seller: false, created_at: new Date(now - 2 * day).toISOString(), image_path: "assets/img/products/rose-eternelle.jpg" },
      { id: "p3", slug: "blanc-absolu", name_ar: "بلان أبسولو", name_en: "Blanc Absolu", brand_id: "b-lav", category_id: "c-musk", size_label: "75 مل", price: 295, discount_price: null, concentration: "Eau de Parfum", fragrance_family: "مسكي", description_ar: "مسك أبيض وزهور بيضاء على قاعدة فانيلا مخملية.", is_visible: true, is_best_seller: false, created_at: new Date(now - 14 * day).toISOString(), image_path: "assets/img/products/blanc-absolu.jpg" },
      { id: "p4", slug: "nuit-dambre", name_ar: "نوي دامبر", name_en: "Nuit d'Ambre", brand_id: "b-ibr", category_id: "c-amber", size_label: "100 مل", price: 320, discount_price: null, concentration: "Eau de Parfum Intense", fragrance_family: "عنبري / شرقي", description_ar: "توليفة عنبرية عميقة تنفتح على البهار ثم تسخن باللبان والعود.", is_visible: true, is_best_seller: true, created_at: new Date(now - 11 * day).toISOString(), image_path: "assets/img/products/nuit-de-ambre.jpg" },
      { id: "p5", slug: "noir-oud", name_ar: "نوار عود", name_en: "Noir Oud", brand_id: "b-ibr", category_id: "c-woody", size_label: "100 مل", price: 345, discount_price: null, concentration: "Extrait de Parfum", fragrance_family: "خشبي", description_ar: "عود ناعم مهذّب بالورد والزعفران، ثقيل بذوق.", is_visible: true, is_best_seller: false, created_at: new Date(now - 1 * day).toISOString(), image_path: "assets/img/products/noir-oud.jpg" },
      { id: "p6", slug: "ambre-de-soie", name_ar: "أمبر دي سوا", name_en: "Ambre de Soie", brand_id: "b-ibr", category_id: "c-amber", size_label: "50 مل", price: 185, discount_price: null, concentration: "Eau de Toilette", fragrance_family: "عنبري / شرقي", description_ar: "عنبر خفيف بلمسة ماندرين، عطر انتقالي بين النهار والمساء.", is_visible: true, is_best_seller: false, created_at: new Date(now - 9 * day).toISOString(), image_path: "assets/img/products/ambre-de-soie.jpg" },
      { id: "p7", slug: "jardin-de-figuier", name_ar: "جاردان دي فيغييه", name_en: "Jardin de Figuier", brand_id: "b-jam", category_id: "c-green", size_label: "100 مل", price: 260, discount_price: null, concentration: "Eau de Parfum", fragrance_family: "أخضر / منعش", description_ar: "ورق تين أخضر وحليب تين دافئ، عطر منعش غير متوقّع.", is_visible: true, is_best_seller: false, created_at: new Date(now - 2 * day).toISOString(), image_path: "assets/img/products/jardin-de-figuier.jpg" },
      { id: "p8", slug: "musc-blanc", name_ar: "مسك بلان", name_en: "Musc Blanc", brand_id: "b-jam", category_id: "c-musk", size_label: "75 مل", price: 210, discount_price: null, concentration: "Eau de Parfum", fragrance_family: "مسكي", description_ar: "مسك أبيض نقي هادئ وقريب من الجلد.", is_visible: true, is_best_seller: true, created_at: new Date(now - 16 * day).toISOString(), image_path: "assets/img/products/musc-blanc.jpg" },
      { id: "p9", slug: "prune-de-velours", name_ar: "برون دي فيلور", name_en: "Prune de Velours", brand_id: "b-jam", category_id: "c-fruity", size_label: "100 مل", price: 280, discount_price: null, concentration: "Eau de Parfum", fragrance_family: "فواكه", description_ar: "برقوق مخملي على قاعدة باتشولي، عطر شتوي دافئ.", is_visible: false, is_best_seller: false, created_at: new Date(now - 1 * day).toISOString(), image_path: "assets/img/products/prune-de-velours.jpg" }
    ];

    function iso(daysAgo) { return new Date(now - daysAgo * day).toISOString(); }
    var orders = [
      { id: "o1", order_number: "HB-261108-0001", customer_name: "سارة أحمد", customer_phone: "0912345678", fulfillment_method: "delivery", delivery_address: "طرابلس - حي الأندلس، شارع الجامعة", customer_note: "توصيل بعد الخامسة مساءً", subtotal: 530, delivery_fee: 0, total: 530, status: "delivered", created_at: iso(2),
        items: [ { product_id: "p1", product_name_ar: "سوا دور", brand_name_ar: "لافيرن", size_label: "100 مل", unit_price: 265, list_price: 310, quantity: 2 } ] },
      { id: "o2", order_number: "HB-261109-0002", customer_name: "منى علي", customer_phone: "0921111111", fulfillment_method: "pickup", delivery_address: null, customer_note: null, subtotal: 240, delivery_fee: 0, total: 240, status: "ready", created_at: iso(1),
        items: [ { product_id: "p2", product_name_ar: "روز إيترنيل", brand_name_ar: "لافيرن", size_label: "100 مل", unit_price: 240, list_price: null, quantity: 1 } ] },
      { id: "o3", order_number: "HB-261110-0003", customer_name: "هدى محمد", customer_phone: "0922222222", fulfillment_method: "delivery", delivery_address: "بنغازي - شارع دبي، عمارة النخيل", customer_note: null, subtotal: 690, delivery_fee: 0, total: 690, status: "preparing", created_at: iso(0),
        items: [ { product_id: "p5", product_name_ar: "نوار عود", brand_name_ar: "إبراق", size_label: "100 مل", unit_price: 345, list_price: null, quantity: 2 } ] },
      { id: "o4", order_number: "HB-261110-0004", customer_name: "ليلى عبدالله", customer_phone: "0944333222", fulfillment_method: "delivery", delivery_address: "مصراتة - حي الزروق", customer_note: "هدية، أرجو التغليف", subtotal: 835, delivery_fee: 15, total: 850, status: "new", created_at: iso(0),
        items: [ { product_id: "p4", product_name_ar: "نوي دامبر", brand_name_ar: "إبراق", size_label: "100 مل", unit_price: 320, list_price: null, quantity: 2 },
                 { product_id: "p8", product_name_ar: "مسك بلان", brand_name_ar: "جامبول", size_label: "75 مل", unit_price: 210, list_price: null, quantity: 1 } ] },
      { id: "o5", order_number: "HB-261110-0005", customer_name: "أمل بشير", customer_phone: "0915556667", fulfillment_method: "pickup", delivery_address: null, customer_note: null, subtotal: 260, delivery_fee: 0, total: 260, status: "new", created_at: iso(0),
        items: [ { product_id: "p7", product_name_ar: "جاردان دي فيغييه", brand_name_ar: "جامبول", size_label: "100 مل", unit_price: 260, list_price: null, quantity: 1 } ] },
      { id: "o6", order_number: "HB-261107-0006", customer_name: "نور الهدى", customer_phone: "0927778889", fulfillment_method: "delivery", delivery_address: "طرابلس - قرجيز", customer_note: "الرقم بديل", subtotal: 185, delivery_fee: 15, total: 200, status: "cancelled", created_at: iso(3),
        items: [ { product_id: "p6", product_name_ar: "أمبر دي سوا", brand_name_ar: "إبراق", size_label: "50 مل", unit_price: 185, list_price: null, quantity: 1 } ] }
    ];

    return {
      session: null,
      brands: brands,
      categories: categories,
      products: products,
      orders: orders,
      settings: {
        id: true,
        whatsapp_number: "", contact_phone: "", delivery_fee: 15, free_delivery_threshold: 400,
        store_address: "", working_hours: "", orders_enabled: false
      }
    };
  }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    var fresh = seed();
    save(fresh);
    return fresh;
  }
  function save(db) {
    try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {}
  }

  var db = load();
  if (db.settings && !("id" in db.settings)) { db.settings.id = true; save(db); }

  function uuid() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
  }
  function clone(v) { return v == null ? v : JSON.parse(JSON.stringify(v)); }
  function nowIso() { return new Date().toISOString(); }
  function slugify(s) {
    return String(s || "").toLowerCase().trim()
      .replace(/[^a-z0-9\u0621-\u064A]+/g, "-").replace(/^-+|-+$/g, "");
  }

  /* ------------------------- query builder ------------------------- */
  function Table(name) {
    this.name = name;
    this.filters = [];
    this.orderBy = null;
    this.limitN = null;
    this.isSingle = false;
    this.maybe = false;
    this.op = "select";
    this.payload = null;
  }

  // order_items are stored nested inside each order in the demo; expose them flat.
  function demoOrderItems() {
    var out = [];
    db.orders.forEach(function (o) {
      (o.items || []).forEach(function (it, i) {
        out.push(Object.assign({ id: o.id + "-i" + i, order_id: o.id,
          created_at: o.created_at }, it));
      });
    });
    return out;
  }

  function tableRows(n) {
    if (n === "order_items") return demoOrderItems();
    if (n === "store_settings") return db.settings ? [db.settings] : [];
    if (n === "products") return db.products;
    if (n === "brands") return db.brands;
    if (n === "categories") return db.categories;
    if (n === "orders") return db.orders;
    return [];
  }

  // NOTE: supabase-js allows .update(...).select() / .insert(...).select():
  // .select() only means "return the affected rows", it must not reset the op.
  Table.prototype.select = function () {
    if (this.op === "select") { this.op = "select"; }
    this.returning = true;
    return this;
  };
  Table.prototype.eq = function (col, val) {
    this.filters.push(function (r) {
      // booleans and strings must match each other (store_settings.id is boolean true)
      return String(r[col]).toLowerCase() === String(val).toLowerCase();
    });
    return this;
  };
  Table.prototype.neq = function (col, val) { this.filters.push(function (r) { return String(r[col]) !== String(val); }); return this; };
  Table.prototype.ilike = function (col, pattern) {
    var needle = String(pattern).replace(/%/g, "").toLowerCase();
    this.filters.push(function (r) { return String(r[col] || "").toLowerCase().indexOf(needle) > -1; });
    return this;
  };
  Table.prototype.order = function (col, opts) {
    var asc = opts && opts.ascending;
    this.orderBy = function (a, b) {
      var x = a[col], y = b[col];
      if (x === y) return 0;
      if (x == null) return 1;
      if (y == null) return -1;
      return (x < y ? -1 : 1) * (asc ? 1 : -1);
    };
    return this;
  };
  Table.prototype.limit = function (n) { this.limitN = n; return this; };
  Table.prototype.single = function () { this.isSingle = true; return this; };
  Table.prototype.maybeSingle = function () { this.isSingle = true; this.maybe = true; return this; };
  Table.prototype.insert = function (row) { this.op = "insert"; this.payload = row; return this; };
  Table.prototype.update = function (patch) { this.op = "update"; this.payload = patch; return this; };
  Table.prototype.delete = function () { this.op = "delete"; return this; };

  Table.prototype._rows = function () {
    var rows = tableRows(this.name).filter(function (r) {
      return this.filters.every(function (f) { return f(r); });
    }, this);
    if (this.orderBy) rows.sort(this.orderBy);
    if (this.limitN) rows = rows.slice(0, this.limitN);
    return rows;
  };

  Table.prototype._run = function () {
    var self = this;
    try {
      if (this.name === "orders" && this.op !== "select" && this.op !== "update") {
        throw new Error("orders may only be read or updated");
      }
      if (this.name === "order_items" && (this.op === "update" || this.op === "delete")) {
        throw new Error("order_items are immutable (historical snapshot)");
      }
      if (this.op === "select") {
        var rows = clone(this._rows());
        if (this.isSingle) {
          if (rows.length === 0) {
            if (this.maybe) return { data: null, error: null };
            return { data: null, error: { message: "not found", code: "PGRST116" } };
          }
          return { data: rows[0], error: null };
        }
        return { data: rows, error: null };
      }

      if (this.op === "insert") {
        var row = clone(this.payload);
        row.id = row.id || uuid();
        row.created_at = row.created_at || nowIso();
        row.updated_at = nowIso();
        row.slug = row.slug || (slugify(row.name_en || row.name_ar) + "-" + Math.random().toString(36).slice(2, 7));
        if (this.name === "products") {
          if (row.discount_price != null && !(row.discount_price < row.price)) {
            return { data: null, error: { message: "discount_price must be below price", code: "23514" } };
          }
        }
        if (this.name === "brands" && db.brands.some(function (b) { return b.slug === row.slug; })) {
          return { data: null, error: { message: "duplicate key value violates unique constraint (slug)", code: "23505" } };
        }
        tableRows(this.name).push(row);
        save(db);
        return { data: clone(row), error: null };
      }

      if (this.op === "update") {
        var targets = this._rows();
        var single = this.isSingle;
        if (targets.length === 0) return { data: null, error: single ? { message: "not found", code: "PGRST116" } : null };
        if (this.name === "store_settings") {
          Object.assign(db.settings, this.payload);
          db.settings.updated_at = nowIso();
          save(db);
          return { data: single ? clone(db.settings) : [clone(db.settings)], error: null };
        }
        if (this.name === "orders") {
          targets.forEach(function (o) {
            if (o.status === "cancelled" || o.status === "delivered") {
              throw new Error("order is final");
            }
          });
        }
        targets.forEach(function (t, i) {
          if (self.name === "products") {
            var merged = Object.assign({}, t, self.payload);
            if (merged.discount_price != null && !(merged.discount_price < merged.price)) {
              throw new Error("discount_price must be below price");
            }
          }
          if (self.name === "products") { delete self.payload.slug; delete self.payload.created_at; }
          Object.assign(t, self.payload);
          t.updated_at = nowIso();
          if (self.name === "orders" && self.payload.status) t.status_updated_at = nowIso();
        });
        save(db);
        return { data: clone(targets), error: null };
      }

      if (this.op === "delete") {
        var del = this._rows();
        if (this.name === "brands") {
          del.forEach(function (b) {
            if (db.products.some(function (p) { return p.brand_id === b.id; })) {
              throw new Error("update or delete on table \"brands\" violates foreign key constraint (products_brand_id_fkey)");
            }
          });
        }
        if (this.name === "categories") {
          del.forEach(function (c) {
            if (db.products.some(function (p) { return p.category_id === c.id; })) {
              throw new Error("update or delete on table \"categories\" violates foreign key constraint (products_category_id_fkey)");
            }
          });
        }
        if (this.name === "products") {
          del.forEach(function (p) {
            db.orders.forEach(function (o) {
              (o.items || []).forEach(function (it) {
                if (it.product_id === p.id) {
                  it.product_id = null;               // ON DELETE SET NULL
                  it.product_slug = it.product_slug || p.slug;
                }
              });
            });
          });
        }
        var arr = tableRows(this.name);
        del.forEach(function (d) {
          var i = arr.indexOf(d);
          if (i > -1) arr.splice(i, 1);
        });
        save(db);
        return { data: null, error: null };
      }
      return { data: null, error: { message: "unsupported" } };
    } catch (e) {
      return { data: null, error: { message: e.message, code: e.code || "P0001" } };
    }
  };

  Table.prototype.then = function (resolve, reject) {
    var res = this._run();
    return Promise.resolve(res).then(resolve, reject);
  };

  /* --------------------------- auth --------------------------- */
  var listeners = [];
  var auth = {
    getSession: function () {
      return Promise.resolve({ data: { session: db.session }, error: null });
    },
    signInWithPassword: function (creds) {
      var okEmail = (creds.email || "").trim().toLowerCase();
      var okPass = (creds.password || "").length >= 6;
      if (!okEmail || !okPass) {
        return Promise.resolve({ data: null, error: { message: "بيانات الدخول غير صحيحة" } });
      }
      db.session = {
        access_token: "demo-token",
        user: { id: "owner-demo", email: okEmail, role: "authenticated" }
      };
      save(db);
      listeners.forEach(function (fn) { fn("SIGNED_IN", db.session); });
      return Promise.resolve({ data: { session: db.session, user: db.session.user }, error: null });
    },
    signOut: function () {
      db.session = null;
      save(db);
      listeners.forEach(function (fn) { fn("SIGNED_OUT", null); });
      return Promise.resolve({ error: null });
    },
    onAuthStateChange: function (cb) {
      listeners.push(cb);
      return { data: { subscription: { unsubscribe: function () {
        var i = listeners.indexOf(cb);
        if (i > -1) listeners.splice(i, 1);
      } } } };
    }
  };

  /* --------------------------- storage --------------------------- */
  var storage = {
    from: function (bucket) {
      return {
        upload: function (path, file) {
          return new Promise(function (resolve) {
            var reader = new FileReader();
            reader.onload = function () {
              var key = "habba.demo.storage." + bucket + "/" + path;
              try { localStorage.setItem(key, reader.result); } catch (e) {
                return resolve({ data: null, error: { message: "storage quota exceeded" } });
              }
              resolve({ data: { path: path }, error: null });
            };
            reader.onerror = function () { resolve({ data: null, error: { message: "read failed" } }); };
            reader.readAsDataURL(file);
          });
        },
        getPublicUrl: function (path) {
          var key = "habba.demo.storage." + bucket + "/" + path;
          var data = null;
          try { data = localStorage.getItem(key); } catch (e) {}
          return { data: { publicUrl: data || "" } };
        },
        remove: function () { return Promise.resolve({ data: null, error: null }); }
      };
    }
  };

  REGISTRY.push({
    auth: auth,
    from: function (name) { return new Table(name); },
    storage: storage,
    rpc: function () { return Promise.resolve({ data: null, error: { message: "rpc not used in demo" } }); },
    channel: function () { return { on: function () { return this; }, subscribe: function () { return this; } }; },
    removeChannel: function () {}
  });

  window.supabase = {
    createClient: function () { return REGISTRY[0]; },
    __demo: true,
    __reset: function () { localStorage.removeItem(KEY); db = seed(); save(db); }
  };
})();

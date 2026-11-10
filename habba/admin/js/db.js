/* ============================================================================
   HABBA Admin — data access layer
   ----------------------------------------------------------------------------
   One place that talks to Supabase. The dashboard never calls
   supabase.from(...) directly, so switching between the demo backend and a
   real project changes nothing in the UI code.

   Security model (mirrored from the database):
     * every call runs with the signed-in session's JWT;
     * RLS decides what is visible/writable — this file never "enforces"
       permissions, it only surfaces what the database allows.
     * the service_role key is never present in the browser.
   ============================================================================ */
window.HABBA_DB = (function () {
  "use strict";

  var cfg = window.HABBA_ADMIN_CONFIG || {};
  var client = null;

  function init() {
    if (client) return client;
    if (!window.supabase || !window.supabase.createClient) {
      throw new Error("supabase-js is not loaded");
    }
    // In demo mode the mock client needs no credentials; production must have them.
    var demo = !!(window.supabase && window.supabase.__demo);
    if (!demo && (!cfg.supabaseUrl || !cfg.supabaseAnonKey)) {
      throw new Error("HABBA_ADMIN_CONFIG is missing supabaseUrl / supabaseAnonKey");
    }
    client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: "habba.admin.session"
      }
    });
    return client;
  }

  function sb() { return init(); }

  function unwrap(res) {
    if (res.error) throw res.error;
    return res.data;
  }

  /* ----------------------------- auth ----------------------------- */
  var auth = {
    session: function () {
      return sb().auth.getSession().then(function (r) { return r.data ? r.data.session : null; });
    },
    signIn: function (email, password) {
      return sb().auth.signInWithPassword({ email: email, password: password })
        .then(function (r) {
          if (r.error) throw r.error;
          return r.data.session;
        });
    },
    signOut: function () {
      return sb().auth.signOut().then(function (r) {
        if (r.error) throw r.error;
      });
    },
    onChange: function (cb) {
      return sb().auth.onAuthStateChange(function (event, session) { cb(event, session); });
    }
  };

  /* --------------------------- dashboard --------------------------- */
  var dashboard = {
    stats: function () {
      // One RPC round trip; falls back to plain queries if the function is absent.
      return sb().rpc("admin_dashboard").then(function (r) {
        if (!r.error && r.data) return r.data;
        return fallback();
      });

      function fallback() {
        return Promise.all([
          sb().from("orders").select("*"),
          sb().from("products").select("id,name_ar,is_visible,discount_price"),
          sb().from("order_items").select("product_id,product_name_ar,brand_name_ar,quantity")
        ]).then(function (res) {
          var orders = unwrap(res[0]) || [];
          var products = unwrap(res[1]) || [];
          var items = unwrap(res[2]) || [];
          var by = function (s) { return orders.filter(function (o) { return o.status === s; }).length; };
          var map = {};
          items.forEach(function (it) {
            var k = it.product_id || it.product_name_ar;
            map[k] = map[k] || { name_ar: it.product_name_ar, brand_ar: it.brand_name_ar, units: 0 };
            map[k].units += it.quantity;
          });
          var best = Object.keys(map).map(function (k) { return map[k]; })
            .sort(function (a, b) { return b.units - a.units; }).slice(0, 5);

          return {
            stats: {
              total_sales: orders.filter(function (o) { return o.status === "delivered"; })
                .reduce(function (n, o) { return n + Number(o.total); }, 0),
              new_orders: by("new"),
              awaiting_prep: by("confirmed") + by("preparing") + by("ready"),
              completed_orders: by("delivered"),
              cancelled_orders: by("cancelled"),
              orders_today: orders.filter(function (o) {
                return new Date(o.created_at).toDateString() === new Date().toDateString();
              }).length
            },
            products_total: products.length,
            products_hidden: products.filter(function (p) { return !p.is_visible; }).length,
            products_discounted: products.filter(function (p) { return p.discount_price != null; }).length,
            best_sellers: best
          };
        });
      }
    }
  };

  /* ---------------------------- orders ---------------------------- */
  var orders = {
    list: function (filters) {
      filters = filters || {};
      var q = sb().from("orders").select("*").order("created_at", { ascending: false }).limit(200);
      if (filters.status && filters.status !== "all") q = q.eq("status", filters.status);
      return q.then(unwrap);
    },
    get: function (id) {
      return Promise.all([
        sb().from("orders").select("*").eq("id", id).single(),
        sb().from("order_items").select("*").eq("order_id", id).order("created_at", { ascending: true })
      ]).then(function (res) {
        return { order: unwrap(res[0]), items: unwrap(res[1]) || [] };
      });
    },
    setStatus: function (id, status) {
      return sb().from("orders").update({ status: status }).eq("id", id).select().then(unwrap);
    },
    search: function (text) {
      var t = String(text || "").trim();
      if (!t) return orders.list({});
      return sb().from("orders").select("*")
        .or("order_number.ilike.%" + t + "%,customer_name.ilike.%" + t + "%,customer_phone.ilike.%" + t + "%")
        .order("created_at", { ascending: false }).limit(100)
        .then(unwrap);
    }
  };

  /* --------------------------- products --------------------------- */
  var PRODUCT_WITH_IMAGES = "*, product_images(id,storage_path,is_primary,sort_order), brands(id,name_ar,name_en), categories(id,name_ar,name_en)";

  var products = {
    list: function () {
      return sb().from("products").select(PRODUCT_WITH_IMAGES)
        .order("created_at", { ascending: false }).then(unwrap);
    },
    get: function (id) {
      return sb().from("products").select(PRODUCT_WITH_IMAGES).eq("id", id).single().then(unwrap);
    },
    create: function (row, imagePaths) {
      return sb().from("products").insert(row).select().single().then(function (r) {
        var created = unwrap(r);
        return attachImages(created.id, imagePaths).then(function () { return created; });
      });
    },
    update: function (id, patch) {
      return sb().from("products").update(patch).eq("id", id).select().single().then(unwrap);
    },
    remove: function (id) {
      return sb().from("products").delete().eq("id", id).then(function (r) {
        if (r.error) throw r.error;
      });
    },
    setVisible: function (id, visible) {
      return sb().from("products").update({ is_visible: visible }).eq("id", id).select().single().then(unwrap);
    },
    images: function (productId) {
      return sb().from("product_images").select("*").eq("product_id", productId)
        .order("sort_order", { ascending: true }).then(unwrap);
    },
    addImage: function (productId, storagePath, makePrimary) {
      return sb().from("product_images")
        .insert({ product_id: productId, storage_path: storagePath, is_primary: !!makePrimary })
        .select().single().then(unwrap);
    },
    removeImage: function (imageId) {
      return sb().from("product_images").delete().eq("id", imageId).then(function (r) {
        if (r.error) throw r.error;
      });
    },
    setPrimaryImage: function (productId, imageId) {
      return sb().from("product_images").update({ is_primary: false }).eq("product_id", productId)
        .then(function () {
          return sb().from("product_images").update({ is_primary: true }).eq("id", imageId);
        })
        .then(function (r) { if (r.error) throw r.error; });
    }
  };

  function attachImages(productId, paths) {
    if (!paths || !paths.length) return Promise.resolve();
    var rows = paths.map(function (p, i) { return { product_id: productId, storage_path: p, is_primary: i === 0, sort_order: i }; });
    return sb().from("product_images").insert(rows).then(function (r) {
      if (r.error) throw r.error;
    });
  }

  /* ---------------------------- brands ---------------------------- */
  var brands = {
    list: function () {
      return sb().from("brands").select("*").order("sort_order", { ascending: true }).then(unwrap);
    },
    create: function (row) { return sb().from("brands").insert(row).select().single().then(unwrap); },
    update: function (id, patch) { return sb().from("brands").update(patch).eq("id", id).select().single().then(unwrap); },
    remove: function (id) {
      return sb().from("brands").delete().eq("id", id).then(function (r) { if (r.error) throw r.error; });
    },
    setVisible: function (id, visible) {
      return sb().from("brands").update({ is_visible: visible }).eq("id", id).select().single().then(unwrap);
    },
    productCounts: function () {
      return sb().from("products").select("brand_id").then(function (r) {
        var list = unwrap(r) || [];
        var counts = {};
        list.forEach(function (p) { counts[p.brand_id] = (counts[p.brand_id] || 0) + 1; });
        return counts;
      });
    }
  };

  /* -------------------------- categories -------------------------- */
  var categories = {
    list: function () {
      return sb().from("categories").select("*").order("sort_order", { ascending: true }).then(unwrap);
    },
    create: function (row) { return sb().from("categories").insert(row).select().single().then(unwrap); },
    update: function (id, patch) { return sb().from("categories").update(patch).eq("id", id).select().single().then(unwrap); },
    remove: function (id) {
      return sb().from("categories").delete().eq("id", id).then(function (r) { if (r.error) throw r.error; });
    },
    setVisible: function (id, visible) {
      return sb().from("categories").update({ is_visible: visible }).eq("id", id).select().single().then(unwrap);
    },
    productCounts: function () {
      return sb().from("products").select("category_id").then(function (r) {
        var list = unwrap(r) || [];
        var counts = {};
        list.forEach(function (p) { counts[p.category_id] = (counts[p.category_id] || 0) + 1; });
        return counts;
      });
    }
  };

  /* --------------------------- settings --------------------------- */
  var settings = {
    get: function () {
      return sb().from("store_settings").select("*").single().then(unwrap);
    },
    save: function (patch) {
      // store_settings PK is a boolean `id` defaulting to true; filter by it explicitly
      return sb().from("store_settings").update(patch).eq("id", "true").select().single().then(unwrap);
    }
  };

  /* ---------------------------- storage ---------------------------- */
  var storage = {
    upload: function (bucket, file, folder) {
      var ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      var safe = (file.name.split(".")[0] || "image")
        .toLowerCase().replace(/[^a-z0-9\u0621-\u064A]+/g, "-").slice(0, 40);
      var path = (folder ? folder + "/" : "") + safe + "-" + Date.now() + "." + ext;
      return sb().storage.from(bucket).upload(path, file, { cacheControl: "31536000", upsert: false })
        .then(function (r) {
          if (r.error) throw r.error;
          return path;
        });
    },
    publicUrl: function (bucket, path) {
      if (!path) return "";
      if (window.supabase && window.supabase.__demo) {
        return sb().storage.from(bucket).getPublicUrl(path).data.publicUrl;
      }
      return sb().storage.from(bucket).getPublicUrl(path).data.publicUrl;
    },
    remove: function (bucket, paths) {
      if (!paths || !paths.length) return Promise.resolve();
      return sb().storage.from(bucket).remove(paths).then(function (r) {
        if (r.error) throw r.error;
      });
    }
  };

  return {
    init: init,
    auth: auth,
    dashboard: dashboard,
    orders: orders,
    products: products,
    brands: brands,
    categories: categories,
    settings: settings,
    storage: storage,
    isDemo: function () { return !!(window.supabase && window.supabase.__demo); }
  };
})();

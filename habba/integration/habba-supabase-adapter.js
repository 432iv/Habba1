/* ============================================================================
   HABBA — storefront ⇄ Supabase adapter  (STAGE 4 · NOT APPLIED YET)
   ----------------------------------------------------------------------------
   This file is NOT loaded by the current storefront. It exists so the backend
   integration can be reviewed and approved before anything changes.

   WHY IT IS SAFE:
     * js/app.js reads data through window.HABBA_DATA (products/brands/
       categories) and uses only these product fields:
         id, name_ar, name_en, brandId, image, sizes[{label,price,oldPrice}],
         gender, family, concentration, notes{top,heart,base}, description,
         stock, featured, newArrival, bestSeller
     * This adapter returns exactly that shape, so the UI, CSS, routing and
       localStorage behaviour stay byte-for-byte identical.
     * Nothing here writes into js/data.js or js/app.js.

   TO ACTIVATE (requires approval):
     1. add the Supabase client + this file to index.html AFTER js/data.js
     2. call HABBA_ADAPTER.hydrate() before the router boots (or add the
        two-line hook documented in INTEGRATION.md)
   ============================================================================ */
window.HABBA_ADAPTER = (function () {
  "use strict";

  var CFG = window.HABBA_STORE_CONFIG || { supabaseUrl: "", supabaseAnonKey: "" };
  var client = null;

  function sb() {
    if (client) return client;
    if (!window.supabase || !window.supabase.createClient) {
      throw new Error("supabase-js is not loaded");
    }
    client = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, {
      auth: { persistSession: false }   // customers never sign in
    });
    return client;
  }

  /* ---------------- shape conversion ---------------- */
  function publicImageUrl(path) {
    if (!path) return "assets/img/og.png";
    if (/^https?:|^assets\//.test(path)) return path;
    return sb().storage.from("product-images").getPublicUrl(path).data.publicUrl;
  }

  /**
   * DB row -> the exact object shape js/app.js already understands.
   * A single DB size becomes a one-element `sizes` array (the storefront
   * renders exactly one size chip; no variant UI is introduced).
   */
  function toStoreProduct(row, index) {
    var isNew = row.is_new_arrival != null
      ? row.is_new_arrival
      : (Date.now() - new Date(row.created_at).getTime()) < 3 * 864e5;

    return {
      id: row.slug || row.id,
      dbId: row.id,
      name_ar: row.name_ar,
      name_en: row.name_en || "",
      brandId: row.brand_slug || row.brand_id,
      image: publicImageUrl(row.image_path),
      sizes: [{
        label: row.size_label,
        price: Number(row.discount_price != null ? row.discount_price : row.price),
        oldPrice: row.discount_price != null ? Number(row.price) : undefined
      }],
      gender: "women",                       // scope: women's perfumes only
      family: row.family_slug || mapFamily(row.fragrance_family),
      concentration: row.concentration || "",
      notes: {
        top: row.notes_top || [],
        heart: row.notes_heart || [],
        base: row.notes_base || []
      },
      description: row.description_ar || "",
      stock: true,                            // stock is intentionally not tracked
      featured: !!row.is_best_seller,
      newArrival: !!isNew,
      bestSeller: !!row.is_best_seller
    };
  }

  function mapFamily(label) {
    var map = {
      "زهري": "floral", "عنبري / شرقي": "amber", "خشبي": "woody",
      "مسكي": "musk", "فواكه": "fruity", "أخضر / منعش": "green"
    };
    return map[label] || "floral";
  }

  function toStoreBrand(row) {
    return {
      id: row.slug || row.id,
      dbId: row.id,
      name_ar: row.name_ar,
      name_en: row.name_en,
      tagline: row.tagline_ar || "",
      description: row.description_ar || "",
      logo: row.logo_path
        ? sb().storage.from("brand-logos").getPublicUrl(row.logo_path).data.publicUrl
        : null,
      status: row.is_visible ? "active" : "hidden"
    };
  }

  /* ---------------- reads ---------------- */
  function fetchCatalog() {
    return Promise.all([
      sb().from("catalog_feed").select("*").limit(500),
      sb().from("brands").select("*").eq("is_visible", true).order("sort_order"),
      sb().from("categories").select("*").eq("is_visible", true).order("sort_order"),
      sb().from("store_settings").select("*").single()
    ]).then(function (res) {
      [res[0], res[1], res[2], res[3]].forEach(function (r) {
        if (r.error) throw r.error;
      });
      var products = res[0].data || [];
      var brands = (res[1].data || []).map(toStoreBrand);
      var brandSlug = {};
      (res[1].data || []).forEach(function (b) { brandSlug[b.id] = b.slug; });
      var familySlug = {};
      (res[2].data || []).forEach(function (c) { familySlug[c.name_ar] = c.slug; });

      products = products.map(function (p, i) {
        p.brand_slug = brandSlug[p.brand_id] || p.brand_id;
        p.family_slug = familySlug[p.fragrance_family] || mapFamily(p.fragrance_family);
        return toStoreProduct(p, i);
      });

      var settings = res[3].data || {};
      return { products: products, brands: brands, settings: settings };
    });
  }

  /* ---------------- hydration (opt-in) ---------------- */
  var hydrated = false;

  /**
   * Replace window.HABBA_DATA's catalogue with live rows while keeping the
   * current in-memory objects (the app captured the reference at boot).
   * Returns a promise; on any failure the bundled demo data stays in place,
   * so the storefront can never end up empty.
   */
  function hydrate() {
    if (hydrated) return Promise.resolve(window.HABBA_DATA);
    return fetchCatalog().then(function (data) {
      var D = window.HABBA_DATA;
      if (data.brands.length) {
        D.brands.length = 0;
        Array.prototype.push.apply(D.brands, data.brands);
      }
      if (data.products.length) {
        D.products.length = 0;
        Array.prototype.push.apply(D.products, data.products);
      }
      if (data.settings) applySettings(window.HABBA_CONFIG, data.settings);
      hydrated = true;
      return D;
    }).catch(function (e) {
      console.warn("[HABBA] catalogue hydration failed — keeping demo data:", e && e.message);
      return window.HABBA_DATA;
    });
  }

  /**
   * Copy live settings into the storefront config object.
   * CRITICAL: the keys must match js/config.js exactly, because js/app.js
   * captures `var CFG = window.HABBA_CONFIG` at load time and reads these
   * names directly. Writing a different key name silently does nothing
   * (e.g. freeDeliveryThreshold vs freeDelivery).
   */
  function applySettings(CFG, settings) {
    if (!CFG) return;
    if (settings.whatsapp_number)      CFG.whatsappNumber        = settings.whatsapp_number;
    if (settings.contact_phone)        CFG.contactNumber         = settings.contact_phone;
    if (settings.delivery_fee != null) CFG.deliveryFee           = Number(settings.delivery_fee);
    if (settings.free_delivery_threshold != null)
                                       CFG.freeDeliveryThreshold = Number(settings.free_delivery_threshold);
    if (settings.store_address)        CFG.storeAddress          = settings.store_address;
    if (settings.working_hours)        CFG.workingHours          = settings.working_hours;
    CFG.ordersEnabled = !!settings.orders_enabled;
  }

  /* ---------------- orders ---------------- */
  /**
   * Mirrors the current checkout flow: the same fields the storefront already
   * collects are sent to place_order(), and the WhatsApp hand-off keeps
   * working exactly as it does today.
   */
  function placeOrder(cart, customer) {
    var items = (cart || []).map(function (line) {
      var p = (window.HABBA_DATA.products || []).filter(function (x) { return x.id === line.id; })[0];
      return { product_id: (p && p.dbId) || line.id, quantity: line.qty };
    });
    return sb().rpc("place_order", {
      p_items: items,
      p_customer_name: customer.name,
      p_phone: customer.phone,
      p_method: customer.method,
      p_address: customer.address || null,
      p_note: customer.note || null
    }).then(function (r) {
      if (r.error) throw r.error;
      return r.data && r.data[0];
    });
  }

  function publicSettings() {
    return sb().rpc("public_settings").then(function (r) {
      if (r.error) throw r.error;
      return r.data;
    });
  }

  return {
    hydrate: hydrate,
    fetchCatalog: fetchCatalog,
    placeOrder: placeOrder,
    applySettings: applySettings,
    publicSettings: publicSettings,
    toStoreProduct: toStoreProduct
  };
})();

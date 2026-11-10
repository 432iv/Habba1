/**
 * HABBA — integration adapter contract test  (NO browser, NO network)
 *
 * Runs the real mapper functions from integration/habba-supabase-adapter.js
 * against rows shaped exactly like public.catalog_feed() returns, and against
 * the field names js/app.js actually reads.
 *
 *   node integration/test-adapter.js
 *
 * Exit code 1 on failure.
 */
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const SRC = path.join(__dirname, "habba-supabase-adapter.js");
const res = [];
const chk = (label, ok, detail) => res.push({ label, ok: !!ok, detail });

// ---- load the adapter in a sandbox with a fake window -----------------------
const sandbox = { window: {}, console: { warn() {}, log: console.log }, Date, Number, Promise };
sandbox.window.HABBA_STORE_CONFIG = {
  supabaseUrl: "https://example.supabase.co",
  supabaseAnonKey: "anon"
};
sandbox.window.HABBA_CONFIG = {
  whatsappNumber: "",
  contactNumber: "",
  deliveryFee: 15,
  freeDeliveryThreshold: 400,
  storeAddress: "old",
  currencyAr: "د.ل"
};
sandbox.window.HABBA_DATA = { products: [], brands: [], categories: [] };

// One stub client for the whole run: the adapter caches it on first use, so
// it must expose storage AND rpc from the start.
const rpcCalls = [];
sandbox.window.supabase = {
  createClient: () => ({
    storage: { from: (b) => ({ getPublicUrl: (p) => ({ data: { publicUrl: `https://cdn/${b}/${p}` } }) }) },
    rpc: (fn, args) => { rpcCalls.push({ fn, args }); return Promise.resolve({ data: [{}], error: null }); }
  })
};

vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(SRC, "utf8"), sandbox, { filename: "adapter.js" });
const A = sandbox.window.HABBA_ADAPTER;
chk("adapter exposes its API", A && typeof A.hydrate === "function" && typeof A.toStoreProduct === "function");

// ---- a row exactly as public.catalog_feed() returns it ---------------------
const feedRow = {
  id: "bd230638-c8ca-43cc-b8c0-13c707413c5b",
  slug: "soie-dor",
  name_ar: "سوا دور",
  name_en: "Soie d'Or",
  brand_id: "b1",
  brand_name_ar: "لافيرن",
  brand_name_en: "LAVERNE",
  category_id: "c1",
  category_name_ar: "زهري",
  size_label: "100 مل",
  price: 310,
  discount_price: 265,
  effective_price: 265,
  discount_percent: 15,
  concentration: "Eau de Parfum",
  fragrance_family: "زهري",
  notes_top: ["برغموت"],
  notes_heart: ["ياسمين"],
  notes_base: ["مسك"],
  description_ar: "وصف",
  is_best_seller: true,
  is_new_arrival: true,
  image_path: "soie-dor/1.jpg",
  created_at: new Date().toISOString()
};

const p = A.toStoreProduct(feedRow, 0);

// ---- the contract js/app.js depends on -------------------------------------
chk("keeps the storefront id (slug, used in #/product/:id)", p.id === "soie-dor");
chk("keeps a database id for order submission", p.dbId === feedRow.id);
chk("maps name_ar / name_en", p.name_ar === "سوا دور" && p.name_en === "Soie d'Or");
chk("maps brandId to the brand slug", typeof p.brandId === "string" && p.brandId.length > 0);

// js/app.js does p.sizes.filter(x => x.label === it.size)[0] — exactly one size
chk("exposes exactly one size (no variants)", Array.isArray(p.sizes) && p.sizes.length === 1);
chk("size label matches the database", p.sizes[0].label === "100 مل");

// discounted product: price = effective, oldPrice = original
chk("discounted product sells at the DISCOUNTED price", p.sizes[0].price === 265);
chk("discounted product keeps the original as oldPrice", p.sizes[0].oldPrice === 310);

// non-discounted product
const plain = A.toStoreProduct(Object.assign({}, feedRow, { discount_price: null, effective_price: 310 }), 1);
chk("non-discounted product has no oldPrice", plain.sizes[0].price === 310 && plain.sizes[0].oldPrice === undefined);

// New Arrivals must follow the database's 3-day rule, not a manual flag
chk("new arrival follows the database flag", p.newArrival === true);
const old = A.toStoreProduct(Object.assign({}, feedRow, {
  created_at: new Date(Date.now() - 5 * 864e5).toISOString(), is_new_arrival: false
}), 2);
chk("product older than 3 days is not a new arrival", old.newArrival === false);

// images resolve to a public CDN url
chk("product image resolves to a public url", p.image === "https://cdn/product-images/soie-dor/1.jpg");

// notes survive as arrays
chk("notes are passed through", Array.isArray(p.notes.top) && p.notes.top[0] === "برغموت");
chk("description and concentration survive", p.description === "وصف" && p.concentration === "Eau de Parfum");

// ---- settings keys must match js/config.js exactly -------------------------
A.applySettings(sandbox.window.HABBA_CONFIG, {
  whatsapp_number: "218911234567",
  contact_phone: "218911234568",
  delivery_fee: 20,
  free_delivery_threshold: 500,
  store_address: "طرابلس",
  working_hours: "9-21",
  orders_enabled: false
});
const C = sandbox.window.HABBA_CONFIG;
chk("settings: whatsappNumber", C.whatsappNumber === "218911234567");
chk("settings: deliveryFee", C.deliveryFee === 20);
chk("settings: freeDeliveryThreshold (key app.js actually reads)",
  C.freeDeliveryThreshold === 500);
chk("settings: storeAddress", C.storeAddress === "طرابلس");
chk("settings: ordersEnabled", C.ordersEnabled === false);

// ---- ordering contract: ids + quantities only, never prices ----------------
sandbox.window.HABBA_DATA.products = [p];

A.placeOrder(
  [{ id: "soie-dor", qty: 2, size: "100 مل", price: 999, oldPrice: 999 }],
  { name: "سارة", phone: "0912345678", method: "delivery", address: "طرابلس", note: "" }
).then(() => {
  const captured = rpcCalls.find((c) => c.fn === "place_order");
  chk("order goes through the place_order RPC", !!captured);
  const body = captured ? JSON.stringify(captured.args.p_items) : "";
  chk("order payload carries the database product id", body.includes(feedRow.id));
  chk("order payload carries the quantity", captured && captured.args.p_items[0].quantity === 2);
  chk("order payload does NOT send any price from the browser",
    !/price/i.test(body), body);

  const failed = res.filter((r) => !r.ok);
  for (const r of res) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}${r.detail && !r.ok ? "   [" + r.detail + "]" : ""}`);
  console.log(`\n${res.length - failed.length}/${res.length} passed`);
  process.exit(failed.length ? 1 : 0);
}).catch((e) => {
  console.log("FAIL  placeOrder threw:", e && e.message);
  process.exit(1);
});

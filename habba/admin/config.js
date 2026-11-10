/* ============================================================================
   HABBA Admin — configuration
   ----------------------------------------------------------------------------
   Fill these in after the Supabase project is created and approved.

   ONLY the project URL and the *anon* (publishable) key belong here.
   The service_role key must never reach the browser — the dashboard is fully
   functional with RLS + the owner's session alone.
   ============================================================================ */
window.HABBA_ADMIN_CONFIG = {
  supabaseUrl: "",
  supabaseAnonKey: "",

  /* Optional: shown in the sidebar footer */
  supportEmail: "",

  /* Demo mode is auto-detected when js/supabase-mock.js is loaded.
     Remove that script tag in production (see admin/README section 2). */
  demoMode: null
};

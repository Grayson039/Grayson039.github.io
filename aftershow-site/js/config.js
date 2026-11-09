// Aftershow — runtime config. The publishable key is safe to ship client-side (RLS guards the data).
// Aftershow shares this Supabase project with OurTable. It lives in its own database schema, `aftershow`, so nothing collides.
// Will: if the project ever changes, change the URL, key and schema here and nowhere else.
export const SUPABASE_URL = ''; // not published while the site is demo-only
export const SUPABASE_ANON_KEY = ''; // not published while the site is demo-only
export const SUPABASE_SCHEMA = 'aftershow';
// Real sign-ups. false = the site runs only as a demo on sample data kept in the visitor's own browser (nothing is sent
// to Supabase). Set true, and redeploy, to open real accounts. Turn email confirmation on in Supabase first.
export const LIVE_SIGNUPS = false;
export const SUPABASE_ESM = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';
export const PHOTO_BUCKET = 'show-photos';
export const PHOTO_MAX_DIMENSION = 1600;
export const PHOTO_TARGET_BYTES = 300 * 1024;
export const PHOTO_HARD_CAP_BYTES = 5 * 1024 * 1024;

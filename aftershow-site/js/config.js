// Aftershow — runtime config. The publishable key is safe to ship client-side (RLS guards the data).
// Will: if the Supabase project is restored under a new URL/key, change them here and nowhere else.
export const SUPABASE_URL = 'https://lfibpdefglubhuezqbxv.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_aEMDvHim4nUHW6svmWgRtg_cOHdadWq';
export const SUPABASE_ESM = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';
export const PHOTO_BUCKET = 'show-photos';
export const PHOTO_MAX_DIMENSION = 1600;
export const PHOTO_TARGET_BYTES = 300 * 1024;
export const PHOTO_HARD_CAP_BYTES = 5 * 1024 * 1024;

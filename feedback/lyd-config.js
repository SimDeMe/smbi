// Offentlige indstillinger for lydfeedback. Her må kun stå adressen og den
// offentlige anon-nøgle, aldrig tjenestenøglen. Så længe supabaseUrl er tom,
// vises ingen optageknap, og oversigten siger, at den ikke er sat op.
export const LYD_CONFIG = {
  supabaseUrl: '',
  anonNoegle: '',
  opbevaringDage: 90,   // skal passe med slet_efter i supabase/migrations
};

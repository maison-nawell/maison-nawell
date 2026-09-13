const SUPABASE_URL = "https://yukustfifvpvlxcjindn.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_J9zQEixhoQZ5-DV466OxQw_rMF7DqRM";

window.supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
        db: {
            schema: "public"
        }
    }
);
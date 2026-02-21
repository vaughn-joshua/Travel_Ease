import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
async function getToken() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: "test@example.com", 
    password: "password123"
  });
  console.log(data?.session?.access_token);
}
getToken();

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller is admin
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await userClient.auth.getUser();
    if (!caller) throw new Error("Not authenticated");

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: adminRole } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .in("role", ["admin", "super_admin"])
      .limit(1)
      .maybeSingle();
    if (!adminRole) throw new Error("Access denied");

    const { email, password } = await req.json();
    if (!email || !password) throw new Error("Email and password required");
    if (password.length < 6) throw new Error("Password must be at least 6 characters");

    // Check if user exists
    const { data: profile } = await adminClient
      .from("profiles")
      .select("user_id")
      .eq("email", email.trim())
      .maybeSingle();

    if (profile) {
      // Update existing user's password
      const { error } = await adminClient.auth.admin.updateUserById(profile.user_id, { password });
      if (error) throw new Error("Failed to update password: " + error.message);
      return new Response(JSON.stringify({ success: true, user_id: profile.user_id, action: "updated" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      // Create new user
      const { data: newUser, error } = await adminClient.auth.admin.createUser({
        email: email.trim(),
        password,
        email_confirm: true,
      });
      if (error) throw new Error("Failed to create user: " + error.message);
      return new Response(JSON.stringify({ success: true, user_id: newUser.user.id, action: "created" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

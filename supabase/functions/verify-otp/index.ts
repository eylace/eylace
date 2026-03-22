import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, code } = await req.json();
    if (!phone || !code) {
      return new Response(JSON.stringify({ error: "Phone and code are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find the latest unused OTP for this phone
    const { data: otpRecord, error: fetchError } = await supabase
      .from("otp_codes")
      .select("*")
      .eq("phone", phone)
      .eq("is_used", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!otpRecord || fetchError) {
      return new Response(JSON.stringify({ error: "No OTP found. Please request a new one." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check expiry
    if (new Date(otpRecord.expires_at) < new Date()) {
      await supabase.from("otp_codes").update({ is_used: true }).eq("id", otpRecord.id);
      return new Response(JSON.stringify({ error: "OTP has expired. Please request a new one." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check max attempts
    if (otpRecord.attempts >= otpRecord.max_attempts) {
      await supabase.from("otp_codes").update({ is_used: true }).eq("id", otpRecord.id);
      return new Response(JSON.stringify({ error: "Maximum attempts exceeded. Please request a new OTP." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Increment attempts
    await supabase
      .from("otp_codes")
      .update({ attempts: otpRecord.attempts + 1 })
      .eq("id", otpRecord.id);

    // Verify code
    if (otpRecord.code !== code) {
      const remaining = otpRecord.max_attempts - otpRecord.attempts - 1;
      return new Response(JSON.stringify({ error: `Invalid OTP. ${remaining} attempt(s) remaining.` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark OTP as used
    await supabase.from("otp_codes").update({ is_used: true }).eq("id", otpRecord.id);

    // Check if user exists with this phone
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.phone === phone || u.user_metadata?.phone === phone
    );

    let session = null;
    let userId: string;

    if (existingUser) {
      // Sign in existing user by generating a magic link session
      const { data: tokenData, error: tokenError } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: existingUser.email!,
      });

      if (tokenError || !tokenData) {
        // Fallback: update user and create session via password
        const tempPassword = crypto.randomUUID();
        await supabase.auth.admin.updateUser(existingUser.id, { password: tempPassword });
        
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: existingUser.email!,
          password: tempPassword,
        });

        if (signInError) {
          return new Response(JSON.stringify({ error: "Failed to create session" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        session = signInData.session;
      } else {
        // Use the generated token to verify
        const hashedToken = tokenData.properties?.hashed_token;
        if (hashedToken) {
          const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: hashedToken,
            type: "magiclink",
          });
          if (!verifyError && verifyData.session) {
            session = verifyData.session;
          }
        }
        
        // If magic link approach didn't yield a session, use password fallback
        if (!session) {
          const tempPassword = crypto.randomUUID();
          await supabase.auth.admin.updateUser(existingUser.id, { password: tempPassword });
          const { data: signInData } = await supabase.auth.signInWithPassword({
            email: existingUser.email!,
            password: tempPassword,
          });
          session = signInData?.session;
        }
      }
      userId = existingUser.id;
    } else {
      // Create new user with phone
      const dummyEmail = `phone_${phone.replace(/[^0-9]/g, "")}@phone.local`;
      const tempPassword = crypto.randomUUID();
      
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: dummyEmail,
        password: tempPassword,
        phone: phone,
        email_confirm: true,
        phone_confirm: true,
        user_metadata: { phone, login_method: "phone_otp" },
      });

      if (createError || !newUser.user) {
        console.error("Create user error:", createError);
        return new Response(JSON.stringify({ error: "Failed to create account" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      userId = newUser.user.id;

      // Sign in the new user
      const { data: signInData } = await supabase.auth.signInWithPassword({
        email: dummyEmail,
        password: tempPassword,
      });
      session = signInData?.session;
    }

    if (!session) {
      return new Response(JSON.stringify({ error: "Authentication failed. Please try again." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_in: session.expires_in,
        token_type: session.token_type,
      },
      user: { id: userId, phone },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("verify-otp error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

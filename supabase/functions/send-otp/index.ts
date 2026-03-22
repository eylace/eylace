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
    const { phone } = await req.json();
    if (!phone || phone.length < 10) {
      return new Response(JSON.stringify({ error: "Valid phone number required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Load OTP provider config
    const { data: providerRow } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "otp_provider_config")
      .maybeSingle();

    const providerConfig = providerRow?.value as Record<string, unknown> | null;

    // Load OTP login config
    const { data: loginRow } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "otp_login_config")
      .maybeSingle();

    const loginConfig = loginRow?.value as Record<string, unknown> | null;

    const otpLength = (loginConfig?.otp_length as number) || 6;
    const expiryMinutes = (loginConfig?.otp_expiry_minutes as number) || 5;
    const maxAttempts = (loginConfig?.max_attempts as number) || 3;
    const testMode = (providerConfig?.test_mode as boolean) || false;
    const testOtp = (providerConfig?.test_otp as string) || "123456";

    // Rate limiting: check recent OTPs for this phone
    const cooldownSeconds = (providerConfig?.otp_resend_cooldown_seconds as number) || 60;
    const { data: recentOtp } = await supabase
      .from("otp_codes")
      .select("created_at")
      .eq("phone", phone)
      .eq("is_used", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recentOtp) {
      const elapsed = (Date.now() - new Date(recentOtp.created_at).getTime()) / 1000;
      if (elapsed < cooldownSeconds) {
        const wait = Math.ceil(cooldownSeconds - elapsed);
        return new Response(JSON.stringify({ error: `Please wait ${wait} seconds before requesting another OTP` }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Generate OTP
    const otp = testMode ? testOtp : generateOTP(otpLength);

    // Invalidate old OTPs for this phone
    await supabase
      .from("otp_codes")
      .update({ is_used: true })
      .eq("phone", phone)
      .eq("is_used", false);

    // Store new OTP
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000).toISOString();
    await supabase.from("otp_codes").insert({
      phone,
      code: otp,
      expires_at: expiresAt,
      max_attempts: maxAttempts,
    });

    // Send OTP via configured provider (skip in test mode)
    if (!testMode) {
      const smsProvider = (providerConfig?.sms_provider as string) || "twilio";
      
      // Load OTP SMS template
      const { data: template } = await supabase
        .from("otp_sms_templates")
        .select("message")
        .eq("template_key", "otp_login")
        .eq("is_active", true)
        .maybeSingle();

      const messageText = template?.message
        ? template.message.replace("{{otp}}", otp)
        : `Your verification code is: ${otp}. It expires in ${expiryMinutes} minutes.`;

      let sendResult: { success: boolean; error?: string };

      if (smsProvider === "twilio") {
        sendResult = await sendViaTwilio(phone, messageText, providerConfig);
      } else if (smsProvider === "ssl_wireless") {
        sendResult = await sendViaSSLWireless(phone, messageText, providerConfig);
      } else if (smsProvider === "custom") {
        sendResult = await sendViaCustomAPI(phone, messageText, providerConfig);
      } else {
        sendResult = { success: false, error: `Unknown SMS provider: ${smsProvider}` };
      }

      if (!sendResult.success) {
        console.error("SMS send failed:", sendResult.error);
        return new Response(JSON.stringify({ error: "Failed to send OTP. Please check SMS provider configuration." }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ success: true, message: "OTP sent successfully", expiresInMinutes: expiryMinutes }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-otp error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function generateOTP(length: number): string {
  const digits = "0123456789";
  let otp = "";
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  for (let i = 0; i < length; i++) {
    otp += digits[arr[i] % 10];
  }
  return otp;
}

async function sendViaTwilio(
  phone: string,
  message: string,
  config: Record<string, unknown> | null
): Promise<{ success: boolean; error?: string }> {
  const sid = config?.twilio_account_sid as string;
  const token = config?.twilio_auth_token as string;
  const from = config?.twilio_phone_number as string;

  if (!sid || !token || !from) {
    return { success: false, error: "Twilio credentials not configured" };
  }

  try {
    const resp = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: "Basic " + btoa(`${sid}:${token}`),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: phone, From: from, Body: message }),
      }
    );
    if (!resp.ok) {
      const errText = await resp.text();
      return { success: false, error: `Twilio error ${resp.status}: ${errText}` };
    }
    await resp.text();
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

async function sendViaSSLWireless(
  phone: string,
  message: string,
  config: Record<string, unknown> | null
): Promise<{ success: boolean; error?: string }> {
  const username = config?.ssl_wireless_username as string;
  const password = config?.ssl_wireless_password as string;
  const sid = config?.ssl_wireless_sid as string;

  if (!username || !password || !sid) {
    return { success: false, error: "SSL Wireless credentials not configured" };
  }

  try {
    const resp = await fetch("https://smsplus.sslwireless.com/api/v3/send-sms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_token: password,
        sid: sid,
        msisdn: phone,
        sms: message,
        csms_id: `otp_${Date.now()}`,
      }),
    });
    if (!resp.ok) {
      const errText = await resp.text();
      return { success: false, error: `SSL Wireless error ${resp.status}: ${errText}` };
    }
    await resp.text();
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

async function sendViaCustomAPI(
  phone: string,
  message: string,
  config: Record<string, unknown> | null
): Promise<{ success: boolean; error?: string }> {
  const url = config?.custom_api_url as string;
  const apiKey = config?.custom_api_key as string;
  const method = (config?.custom_api_method as string) || "POST";
  const bodyTemplate = (config?.custom_api_body_template as string) || '{"phone":"{{phone}}","message":"{{message}}"}';

  if (!url) {
    return { success: false, error: "Custom API URL not configured" };
  }

  try {
    const body = bodyTemplate
      .replace(/\{\{phone\}\}/g, phone)
      .replace(/\{\{message\}\}/g, message);

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

    const resp = await fetch(url, { method, headers, body: method === "POST" ? body : undefined });
    if (!resp.ok) {
      const errText = await resp.text();
      return { success: false, error: `Custom API error ${resp.status}: ${errText}` };
    }
    await resp.text();
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

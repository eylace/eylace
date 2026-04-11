import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const statusMessages: Record<string, { subject: string; heading: string; message: string; emoji: string }> = {
  processing: {
    subject: "Your order is being processed",
    heading: "Order Processing 🔄",
    message: "Great news! We've started processing your order. We'll update you when it ships.",
    emoji: "🔄",
  },
  shipped: {
    subject: "Your order has been shipped!",
    heading: "Order Shipped 🚚",
    message: "Your order is on its way! You can track your shipment using the tracking details below.",
    emoji: "🚚",
  },
  delivered: {
    subject: "Your order has been delivered!",
    heading: "Order Delivered ✅",
    message: "Your order has been delivered successfully. We hope you enjoy your purchase!",
    emoji: "✅",
  },
  cancelled: {
    subject: "Your order has been cancelled",
    heading: "Order Cancelled ❌",
    message: "Your order has been cancelled. If you didn't request this, please contact our support team.",
    emoji: "❌",
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- AUTH CHECK: Require admin role ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify the caller is authenticated
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the caller is an admin
    const { data: roleData, error: roleError } = await userClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (roleError || !roleData) {
      return new Response(JSON.stringify({ error: "Forbidden - Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // --- END AUTH CHECK ---

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!RESEND_API_KEY || !LOVABLE_API_KEY) {
      throw new Error("RESEND_API_KEY or LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { order_id, new_status } = await req.json();

    if (!order_id || !new_status) {
      throw new Error("Missing order_id or new_status");
    }

    const statusInfo = statusMessages[new_status];
    if (!statusInfo) {
      return new Response(JSON.stringify({ message: "No email for this status" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      throw new Error(`Order not found: ${orderError?.message}`);
    }

    // Fetch user email
    const { data: userData, error: userFetchError } = await supabase.auth.admin.getUserById(order.user_id);
    if (userFetchError || !userData?.user?.email) {
      throw new Error(`User email not found: ${userFetchError?.message}`);
    }

    const userEmail = userData.user.email;

    // Fetch profile for name
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name")
      .eq("user_id", order.user_id)
      .single();

    const customerName = profile?.first_name || "Customer";

    // Build items HTML
    const itemsHtml = order.order_items
      .map(
        (item: any) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;">
            <strong>${item.product_name}</strong><br/>
            <span style="color:#666;font-size:13px;">Qty: ${item.quantity}</span>
          </td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">
            ৳${Number(item.price).toFixed(2)}
          </td>
        </tr>`
      )
      .join("");

    const trackingHtml =
      new_status === "shipped" && order.tracking_number
        ? `<div style="background:#f0f7ff;padding:16px;border-radius:8px;margin:16px 0;">
            <p style="margin:0;font-size:14px;color:#333;"><strong>Tracking Number:</strong> ${order.tracking_number}</p>
            ${order.carrier ? `<p style="margin:4px 0 0;font-size:14px;color:#333;"><strong>Carrier:</strong> ${order.carrier}</p>` : ""}
           </div>`
        : "";

    const emailHtml = `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background:#f5f5f5;">
      <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;margin-top:20px;margin-bottom:20px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <div style="background:#1a2d47;padding:32px;text-align:center;">
          <h1 style="color:#ff8c00;margin:0;font-size:28px;">Eylace</h1>
          <p style="color:#ffffff;margin:8px 0 0;font-size:14px;">Your trusted shopping destination</p>
        </div>
        <div style="padding:32px;">
          <h2 style="color:#1a2d47;margin:0 0 8px;">${statusInfo.heading}</h2>
          <p style="color:#666;font-size:15px;line-height:1.6;">
            Hi ${customerName},<br/><br/>
            ${statusInfo.message}
          </p>
          ${trackingHtml}
          <div style="background:#fafafa;border-radius:8px;padding:16px;margin:20px 0;">
            <h3 style="margin:0 0 12px;color:#1a2d47;font-size:16px;">Order #${order.order_number}</h3>
            <table style="width:100%;border-collapse:collapse;">
              ${itemsHtml}
              <tr>
                <td style="padding:12px;font-weight:bold;color:#1a2d47;">Total</td>
                <td style="padding:12px;font-weight:bold;color:#1a2d47;text-align:right;">৳${Number(order.total).toFixed(2)}</td>
              </tr>
            </table>
          </div>
          <div style="text-align:center;margin-top:24px;">
            <a href="https://grand-mall-emporium.lovable.app/orders" style="display:inline-block;padding:12px 32px;background:#ff8c00;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">View Order Details</a>
          </div>
        </div>
        <div style="background:#f5f5f5;padding:20px;text-align:center;">
          <p style="margin:0;color:#999;font-size:12px;">© 2026 Eylace. All rights reserved.</p>
          <p style="margin:4px 0 0;color:#999;font-size:12px;">You're receiving this because you placed an order on Eylace.</p>
        </div>
      </div>
    </body>
    </html>`;

    // Send email via Resend through connector gateway
    const resendRes = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: "Eylace <onboarding@resend.dev>",
        to: [userEmail],
        subject: `${statusInfo.subject} - Order #${order.order_number}`,
        html: emailHtml,
      }),
    });

    const resendData = await resendRes.json();

    if (!resendRes.ok) {
      throw new Error(`Resend API error: ${JSON.stringify(resendData)}`);
    }

    console.log(`Email sent to ${userEmail} for order ${order.order_number} status: ${new_status}`);

    return new Response(JSON.stringify({ success: true, emailId: resendData.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error sending order email:", errorMessage);
    return new Response(JSON.stringify({ error: "Failed to send email" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

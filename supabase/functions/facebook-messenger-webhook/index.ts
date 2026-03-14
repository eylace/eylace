import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FB_GRAPH_URL = "https://graph.facebook.com/v19.0";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const VERIFY_TOKEN = Deno.env.get("FB_VERIFY_TOKEN");
  const PAGE_ACCESS_TOKEN = Deno.env.get("FB_PAGE_ACCESS_TOKEN");
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // GET = Facebook webhook verification
  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("Webhook verified successfully");
      return new Response(challenge, { status: 200, headers: { "Content-Type": "text/plain" } });
    }
    return new Response("Forbidden", { status: 403 });
  }

  // POST = Incoming messages from Facebook
  if (req.method === "POST") {
    try {
      const body = await req.json();
      console.log("Received webhook:", JSON.stringify(body).slice(0, 500));

      if (body.object !== "page") {
        return new Response("Not a page event", { status: 200 });
      }

      if (!PAGE_ACCESS_TOKEN || !LOVABLE_API_KEY) {
        console.error("Missing FB_PAGE_ACCESS_TOKEN or LOVABLE_API_KEY");
        return new Response("OK", { status: 200 });
      }

      // Process each entry
      for (const entry of body.entry || []) {
        for (const event of entry.messaging || []) {
          const senderId = event.sender?.id;
          if (!senderId || !event.message?.text) continue;

          const userMessage = event.message.text;
          console.log(`Message from ${senderId}: ${userMessage}`);

          // Send typing indicator
          await sendTypingAction(senderId, PAGE_ACCESS_TOKEN);

          // Fetch product catalog for context
          const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
          const { data: products } = await supabase
            .from("products")
            .select("name, price, stock, description, slug, images, is_active")
            .eq("is_active", true)
            .limit(30);

          const catalog = products?.map(p => `- ${p.name}: ৳${p.price} (Stock: ${p.stock})`).join("\n") || "No products available";

          // Get AI response
          const aiResponse = await getAIResponse(userMessage, catalog, LOVABLE_API_KEY);

          // Send response back to Facebook
          await sendFBMessage(senderId, aiResponse, PAGE_ACCESS_TOKEN);
        }
      }

      return new Response("EVENT_RECEIVED", { status: 200 });
    } catch (e) {
      console.error("Webhook error:", e);
      // Always return 200 to Facebook to prevent retries
      return new Response("OK", { status: 200 });
    }
  }

  return new Response("Method not allowed", { status: 405 });
});

async function sendTypingAction(recipientId: string, token: string) {
  try {
    await fetch(`${FB_GRAPH_URL}/me/messages?access_token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: recipientId },
        sender_action: "typing_on",
      }),
    });
  } catch (e) {
    console.error("Typing indicator error:", e);
  }
}

async function getAIResponse(userMessage: string, catalog: string, apiKey: string): Promise<string> {
  const systemPrompt = `You are a friendly AI shopping assistant for Grand Mall Emporium on Facebook Messenger. You speak both Bangla and English fluently. Always respond in the same language the customer uses.

Your responsibilities:
1. Help customers find products
2. Answer questions about products, pricing, shipping
3. Provide product recommendations
4. Help with order-related queries
5. Be polite, professional, and persuasive

Available Products:
${catalog}

Rules:
- Always suggest relevant products when possible
- If asked about something not in stock, suggest alternatives
- For order issues, direct them to the website
- Keep responses concise (under 300 chars for Messenger readability)
- Use emojis to be friendly 😊
- If customer speaks Bangla, respond in Bangla
- Don't use markdown formatting (no ** or # etc) - use plain text only`;

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!response.ok) {
      console.error("AI gateway error:", response.status);
      return "দুঃখিত, এই মুহূর্তে আমি আপনাকে সাহায্য করতে পারছি না। অনুগ্রহ করে আমাদের ওয়েবসাইট ভিজিট করুন। 🙏";
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "ধন্যবাদ আপনার মেসেজের জন্য! অনুগ্রহ করে আবার চেষ্টা করুন। 😊";
  } catch (e) {
    console.error("AI error:", e);
    return "দুঃখিত, সাময়িক সমস্যা হচ্ছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন। 🙏";
  }
}

async function sendFBMessage(recipientId: string, text: string, token: string) {
  // Facebook has a 2000 char limit per message
  const chunks = splitMessage(text, 1900);
  
  for (const chunk of chunks) {
    try {
      const resp = await fetch(`${FB_GRAPH_URL}/me/messages?access_token=${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: { text: chunk },
        }),
      });

      if (!resp.ok) {
        const errData = await resp.text();
        console.error("FB send error:", resp.status, errData);
      }
    } catch (e) {
      console.error("FB message send error:", e);
    }
  }
}

function splitMessage(text: string, maxLen: number): string[] {
  if (text.length <= maxLen) return [text];
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= maxLen) {
      chunks.push(remaining);
      break;
    }
    let splitIdx = remaining.lastIndexOf("\n", maxLen);
    if (splitIdx === -1 || splitIdx < maxLen / 2) {
      splitIdx = remaining.lastIndexOf(" ", maxLen);
    }
    if (splitIdx === -1) splitIdx = maxLen;
    chunks.push(remaining.slice(0, splitIdx));
    remaining = remaining.slice(splitIdx).trimStart();
  }
  return chunks;
}

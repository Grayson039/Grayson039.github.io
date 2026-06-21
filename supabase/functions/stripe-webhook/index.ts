import Stripe from "npm:stripe@14";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
};

function planFromPriceId(priceId: string): string {
  const pw  = Deno.env.get("STRIPE_PRICE_WRITER") ?? "";
  const pp  = Deno.env.get("STRIPE_PRICE_PRO") ?? "";
  const ppu = Deno.env.get("STRIPE_PRICE_PRO_UNLIMITED") ?? "";
  if (pw  && priceId === pw)  return "writer";
  if (pp  && priceId === pp)  return "pro";
  if (ppu && priceId === ppu) return "pro_unlimited";
  return "writer"; // safe fallback for any unrecognised paid price
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  const body = await req.text();

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
    apiVersion: "2024-06-20",
  });

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get("STRIPE_WEBHOOK_SECRET")!,
    );
  } catch (err) {
    console.error("Stripe signature verification failed:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Service role key bypasses RLS and allows auth.admin usage
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId      = session.customer as string;
        const customerEmail   = session.customer_email
                                ?? session.customer_details?.email;
        const subscriptionId  = session.subscription as string;

        if (!subscriptionId || !customerEmail) {
          console.warn("checkout.session.completed: missing subscription or email");
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId  = subscription.items.data[0]?.price?.id ?? "";
        const plan     = planFromPriceId(priceId);
        const expiresAt = new Date(
          subscription.current_period_end * 1000,
        ).toISOString();

        const { data: { user } } =
          await supabase.auth.admin.getUserByEmail(customerEmail);

        if (user) {
          await supabase
            .from("profiles")
            .update({ plan, stripe_customer_id: customerId, plan_expires_at: expiresAt })
            .eq("id", user.id);
          console.log(`Plan updated: ${user.id} → ${plan}`);
        } else {
          console.warn("No SceneOne account for email:", customerEmail);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const priceId    = subscription.items.data[0]?.price?.id ?? "";
        const plan       = subscription.status === "active"
                           ? planFromPriceId(priceId)
                           : "free";
        const expiresAt  = new Date(
          subscription.current_period_end * 1000,
        ).toISOString();

        await supabase
          .from("profiles")
          .update({ plan, plan_expires_at: expiresAt })
          .eq("stripe_customer_id", customerId);
        console.log(`Subscription updated: customer ${customerId} → ${plan}`);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await supabase
          .from("profiles")
          .update({ plan: "free", plan_expires_at: null })
          .eq("stripe_customer_id", subscription.customer as string);
        console.log(`Subscription cancelled: customer ${subscription.customer}`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await supabase
          .from("profiles")
          .update({ plan: "free", plan_expires_at: null })
          .eq("stripe_customer_id", invoice.customer as string);
        console.log(`Payment failed: customer ${invoice.customer} downgraded to free`);
        break;
      }

      default:
        break;
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook handler error:", err);
    return new Response(
      JSON.stringify({ error: "Handler failed", detail: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type WaitlistJoinBody = {
  name?: string;
  email?: string;
};

function isValidEmail(email: string) {
  // Simple, safe email check (no heavy regex)
  return /^\S+@\S+\.\S+$/.test(email);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: WaitlistJoinBody = await req.json();
    const name = (body.name ?? "").trim();
    const email = (body.email ?? "").trim().toLowerCase();

    if (!name || name.length > 100) {
      return new Response(
        JSON.stringify({ success: false, error: "Please enter your name." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!email || email.length > 255 || !isValidEmail(email)) {
      return new Response(
        JSON.stringify({ success: false, error: "Please enter a valid email address." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data, error } = await supabase
      .from("waitlist")
      .insert({ name, email })
      .select("join_number")
      .single();

    if (error) {
      // Postgres unique violation
      // deno-lint-ignore no-explicit-any
      const code = (error as any)?.code;
      if (code === "23505") {
        return new Response(
          JSON.stringify({ success: false, error: "This email is already on the waitlist." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      console.error("waitlist-join insert error:", error);
      return new Response(
        JSON.stringify({ success: false, error: "Something went wrong. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ success: true, joinNumber: data?.join_number ?? null }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: unknown) {
    console.error("waitlist-join error:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Something went wrong. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  email: string;
  groupId: string;
  groupName: string;
  inviterName: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, groupId, groupName, inviterName }: InvitationRequest = await req.json();
    console.log(`Creating invitation for ${email} to group ${groupId}`);

    // Check if user is a member of this group
    const { data: membership, error: memberError } = await supabase
      .from("group_members")
      .select("*")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .single();

    if (memberError || !membership) {
      console.error("Not a member:", memberError);
      return new Response(JSON.stringify({ error: "You are not a member of this group" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create invitation
    const { data: invitation, error: inviteError } = await supabase
      .from("invitations")
      .insert({
        group_id: groupId,
        email: email.toLowerCase(),
        invited_by: user.id,
      })
      .select()
      .single();

    if (inviteError) {
      console.error("Invitation error:", inviteError);
      return new Response(JSON.stringify({ error: "Failed to create invitation" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate invite link
    const appUrl = Deno.env.get("APP_URL") || "https://lovable.dev";
    const inviteLink = `${appUrl}/invite/${invitation.token}`;

    // Send email
    const emailResponse = await resend.emails.send({
      from: "Sidechat <onboarding@resend.dev>",
      to: [email],
      subject: `${inviterName} invited you to join "${groupName}" on Sidechat`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5; padding: 40px 20px;">
          <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="color: #8B5CF6; font-size: 28px; margin: 0;">Sidechat</h1>
              <p style="color: #71717a; margin-top: 8px;">Team collaboration made simple</p>
            </div>
            
            <h2 style="color: #18181b; font-size: 20px; margin-bottom: 16px;">You're invited!</h2>
            
            <p style="color: #3f3f46; line-height: 1.6;">
              <strong>${inviterName}</strong> has invited you to join the group <strong>"${groupName}"</strong> on Sidechat.
            </p>
            
            <p style="color: #71717a; line-height: 1.6; margin-bottom: 32px;">
              Sidechat is where teams brainstorm privately and get AI-powered summaries to share with everyone.
            </p>
            
            <div style="text-align: center; margin-bottom: 32px;">
              <a href="${inviteLink}" style="display: inline-block; background: linear-gradient(135deg, #8B5CF6, #7C3AED); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600;">
                Accept Invitation
              </a>
            </div>
            
            <p style="color: #a1a1aa; font-size: 12px; text-align: center;">
              This invitation expires in 7 days. If you didn't expect this email, you can safely ignore it.
            </p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent:", emailResponse);

    return new Response(JSON.stringify({ success: true, invitation }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

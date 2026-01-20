import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function refreshAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<any> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Token refresh failed:", error);
    throw new Error("Failed to refresh access token");
  }

  return response.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Updating Google Calendar event...");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error("Auth error:", claimsError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;
    console.log("User ID:", userId);

    const { eventId, summary, description, start, end, location, colorId } = await req.json();

    if (!eventId) {
      return new Response(JSON.stringify({ error: "Missing required field: eventId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    console.log("Updating event:", eventId, "colorId:", colorId);

    const adminSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: tokenData, error: tokenError } = await adminSupabase
      .from("google_oauth_tokens")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (tokenError || !tokenData) {
      console.error("Token fetch error:", tokenError);
      return new Response(JSON.stringify({ error: "Google Calendar not connected" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let accessToken = tokenData.access_token;
    const expiresAt = new Date(tokenData.expires_at);
    const now = new Date();

    if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
      console.log("Access token expired or expiring soon, refreshing...");
      
      if (!tokenData.refresh_token) {
        return new Response(JSON.stringify({ error: "No refresh token available. Please reconnect Google Calendar." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
      const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");

      if (!clientId || !clientSecret) {
        return new Response(JSON.stringify({ error: "Google OAuth not configured" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      try {
        const refreshedTokens = await refreshAccessToken(
          tokenData.refresh_token,
          clientId,
          clientSecret
        );

        accessToken = refreshedTokens.access_token;
        const newExpiresAt = new Date(Date.now() + refreshedTokens.expires_in * 1000);

        await adminSupabase
          .from("google_oauth_tokens")
          .update({
            access_token: accessToken,
            expires_at: newExpiresAt.toISOString(),
          })
          .eq("user_id", userId);

        console.log("Token refreshed successfully");
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        return new Response(JSON.stringify({ error: "Failed to refresh access token. Please reconnect Google Calendar." }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Build update data
    const eventData: any = {};
    
    if (summary !== undefined) eventData.summary = summary;
    if (description !== undefined) eventData.description = description;
    if (location !== undefined) eventData.location = location;
    
    if (start) {
      eventData.start = {
        dateTime: start,
        timeZone: "UTC",
      };
    }
    
    if (end) {
      eventData.end = {
        dateTime: end,
        timeZone: "UTC",
      };
    }
    
    // Add color if provided (Google Calendar colorId: 1-11)
    if (colorId && colorId >= '1' && colorId <= '11') {
      eventData.colorId = colorId;
    }

    console.log("Event data:", JSON.stringify(eventData));

    const calendarResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      }
    );

    if (!calendarResponse.ok) {
      const error = await calendarResponse.text();
      console.error("Google Calendar API error:", error);
      
      if (error.includes('insufficient') || error.includes('PERMISSION_DENIED') || error.includes('scope')) {
        return new Response(JSON.stringify({ 
          error: "insufficient_scope",
          message: "Calendar permissions need to be updated. Please disconnect and reconnect Google Calendar in Settings.",
        }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "Failed to update calendar event", details: error }), {
        status: calendarResponse.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const updatedEvent = await calendarResponse.json();
    console.log("Event updated successfully:", updatedEvent.id);

    return new Response(JSON.stringify({ 
      success: true, 
      event: {
        id: updatedEvent.id,
        summary: updatedEvent.summary,
        start: updatedEvent.start?.dateTime || updatedEvent.start?.date,
        end: updatedEvent.end?.dateTime || updatedEvent.end?.date,
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error updating calendar event:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
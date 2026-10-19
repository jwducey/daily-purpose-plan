import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function refreshAccessToken(refreshToken: string, clientId: string, clientSecret: string) {
  console.log("Refreshing access token...");
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error_description || data.error);
  }
  
  return data;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate auth
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
    const url = new URL(req.url);
    const timeMin = url.searchParams.get("timeMin") || new Date().toISOString();
    const timeMax = url.searchParams.get("timeMax") || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // Get user's OAuth tokens
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: tokenData, error: tokenError } = await serviceClient
      .from("google_oauth_tokens")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (tokenError || !tokenData) {
      console.log("No OAuth tokens found for user:", userId);
      return new Response(JSON.stringify({ error: "Google Calendar not connected", needsAuth: true }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let accessToken = tokenData.access_token;
    const expiresAt = new Date(tokenData.expires_at);
    
    // Refresh token if expired
    if (expiresAt <= new Date()) {
      console.log("Token expired, refreshing...");
      const clientId = Deno.env.get("GOOGLE_CLIENT_ID")!;
      const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET")!;
      
      try {
        const newTokens = await refreshAccessToken(tokenData.refresh_token, clientId, clientSecret);
        accessToken = newTokens.access_token;
        
        // Update stored tokens
        const newExpiresAt = new Date(Date.now() + newTokens.expires_in * 1000).toISOString();
        await serviceClient
          .from("google_oauth_tokens")
          .update({
            access_token: newTokens.access_token,
            expires_at: newExpiresAt,
          })
          .eq("user_id", userId);
          
        console.log("Token refreshed successfully");
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        // Delete invalid tokens
        await serviceClient
          .from("google_oauth_tokens")
          .delete()
          .eq("user_id", userId);
          
        return new Response(JSON.stringify({ error: "Token refresh failed, please reconnect", needsAuth: true }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Fetch list of calendars the user has turned on (includes subscribed/URL calendars)
    const authHeaders = { Authorization: `Bearer ${accessToken}` };
    let calendars: { id: string; primary?: boolean; summary?: string; backgroundColor?: string; accessRole?: string }[] = [{ id: "primary", primary: true }];
    const listRes = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=reader", { headers: authHeaders });
    if (listRes.ok) {
      const listData = await listRes.json();
      const selected = (listData.items || []).filter((c: any) => c.selected !== false && !c.hidden);
      if (selected.length) calendars = selected;
    } else {
      console.error("calendarList failed:", listRes.status, await listRes.text());
    }

    const qs = `timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime&maxResults=2500`;
    const results = await Promise.all(calendars.map(async (cal) => {
      const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cal.id)}/events?${qs}`, { headers: authHeaders });
      return { cal, res };
    }));

    const primaryResult = results.find(r => r.cal.primary) || results[0];
    if (!primaryResult.res.ok) {
      const calendarResponse = primaryResult.res;
      const errorData = await calendarResponse.json();
      console.error("Calendar API error:", errorData);
      
      if (calendarResponse.status === 401) {
        await serviceClient
          .from("google_oauth_tokens")
          .delete()
          .eq("user_id", userId);
          
        return new Response(JSON.stringify({ error: "Access revoked, please reconnect", needsAuth: true }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "Failed to fetch calendar events" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const events: any[] = [];
    for (const { cal, res } of results) {
      if (!res.ok) {
        console.error(`Calendar ${cal.id} failed:`, res.status, await res.text());
        continue;
      }
      const data = await res.json();
      const isPrimary = !!cal.primary;
      for (const event of data.items || []) {
        events.push({
          id: event.id,
          summary: event.summary || "No title",
          description: event.description,
          start: event.start?.dateTime || event.start?.date,
          end: event.end?.dateTime || event.end?.date,
          allDay: !event.start?.dateTime,
          colorId: event.colorId,
          location: event.location,
          calendarId: isPrimary ? "primary" : cal.id,
          calendarName: cal.summary,
          calendarColor: isPrimary ? undefined : cal.backgroundColor,
          readOnly: !isPrimary && cal.accessRole !== "owner" && cal.accessRole !== "writer",
        });
      }
    }
    events.sort((a, b) => String(a.start).localeCompare(String(b.start)));
    console.log(`Fetched ${events.length} events from ${calendars.length} calendars`);

    return new Response(JSON.stringify({ events }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

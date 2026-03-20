import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { lifeArea } = await req.json();
    if (!lifeArea) {
      return new Response(JSON.stringify({ error: "lifeArea required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fetch user's tasks for context
    const { data: tasks } = await supabase
      .from("tasks")
      .select("title, completed, life_areas, is_recurring")
      .order("created_at", { ascending: false })
      .limit(100);

    const areaTasks = (tasks || []).filter((t: any) => 
      t.life_areas && t.life_areas.some((a: string) => a.toLowerCase() === lifeArea.toLowerCase())
    );

    const completedTitles = areaTasks.filter((t: any) => t.completed).map((t: any) => t.title).slice(0, 15);
    const activeTitles = areaTasks.filter((t: any) => !t.completed).map((t: any) => t.title).slice(0, 15);
    const otherTasks = (tasks || [])
      .filter((t: any) => !t.life_areas || !t.life_areas.some((a: string) => a.toLowerCase() === lifeArea.toLowerCase()))
      .map((t: any) => t.title)
      .slice(0, 10);

    const prompt = `You are a productivity coach. Generate 6 actionable task ideas for the life area "${lifeArea}".

Context about the user:
- Completed tasks in this area: ${completedTitles.length > 0 ? completedTitles.join(", ") : "none yet"}
- Current active tasks in this area: ${activeTitles.length > 0 ? activeTitles.join(", ") : "none yet"}
- Tasks in other areas: ${otherTasks.length > 0 ? otherTasks.join(", ") : "none"}

Rules:
- Don't repeat tasks that already exist (active or completed)
- Build on patterns from completed tasks (similar but progressing)
- Include a mix: some quick wins (15-30 min), some deeper work (1-2 hours)
- Be specific and actionable, not vague
- Return ONLY a JSON array of objects: [{"title": "...", "minutes": 30}, ...]
- minutes should be one of: 15, 30, 60, 120`;

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const response = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI error:", errText);
      return new Response(JSON.stringify({ error: "AI request failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "[]";
    
    // Extract JSON from response (might be wrapped in markdown code block)
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    const suggestions = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

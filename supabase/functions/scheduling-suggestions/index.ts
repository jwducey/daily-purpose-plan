import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { tasks, events, weekStartDate } = await req.json();

    if (!tasks || tasks.length === 0) {
      return new Response(JSON.stringify({ suggestions: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are an intelligent scheduling assistant. Your job is to suggest optimal time slots for tasks based on:
1. Task priority (1 = urgent, 4 = low)
2. Time estimates
3. Life area (to balance different areas throughout the week)
4. Existing calendar events (avoid conflicts)
5. Due dates

Best practices:
- Schedule high-priority tasks in the morning when energy is highest
- Group similar life areas together when possible
- Leave buffer time between tasks
- Don't schedule work tasks too late in the evening
- Consider task duration - don't start a 4-hour task at 5 PM

Return suggestions as a JSON array with taskId, suggestedDate, suggestedHour (24-hour format), and a brief reason.`;

    const userPrompt = `Week starting: ${weekStartDate}

Tasks to schedule:
${JSON.stringify(tasks, null, 2)}

Existing calendar events:
${JSON.stringify(events, null, 2)}

Suggest optimal time slots for up to 5 high-priority tasks. Focus on the most important ones first.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "schedule_tasks",
              description: "Suggest time slots for tasks",
              parameters: {
                type: "object",
                properties: {
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        taskId: { type: "string" },
                        suggestedDate: { type: "string", description: "ISO date string" },
                        suggestedHour: { type: "number", description: "Hour in 24-hour format (6-22)" },
                        reason: { type: "string", description: "Brief explanation for this time slot" },
                      },
                      required: ["taskId", "suggestedDate", "suggestedHour", "reason"],
                    },
                  },
                },
                required: ["suggestions"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "schedule_tasks" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited", suggestions: [] }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ suggestions: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Scheduling suggestions error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error",
      suggestions: [] 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

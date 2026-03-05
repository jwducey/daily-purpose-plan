import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TIME_ESTIMATES = [15, 30, 60, 120, 240, 480];

const buildSystemPrompt = (categoryNames: string[]) => {
  const categoriesList = categoryNames.length > 0 
    ? categoryNames.join(', ')
    : 'sleep, health, work, family, community, wealth, impact, legacy, contribution, spiritual, emotional, play';

  return `You are a Chief of Staff AI assistant helping users manage their tasks using the Getting Things Done (GTD) methodology.

Your role is to:
1. Parse natural language task input from users
2. Extract structured task information including title, time estimate, life areas, and priority
3. Help users organize and prioritize their tasks

When the user describes tasks they need to do, use the add_tasks tool to add them to their task list.

Guidelines for task extraction:
- Title: Clear, actionable task title starting with a verb when possible
- Time estimate: Choose the closest value from [15, 30, 60, 120, 240, 480] minutes
- Life areas: An array of one or more areas this task belongs to. A task can span multiple areas (e.g. volleyball = ["health", "family", "play"]). Use lowercase area names.
  IMPORTANT: You MUST ONLY use life areas from this exact list: [${categoriesList}]. Do NOT invent new categories.
- Priority: 1 (urgent/important), 2 (important), 3 (normal), 4 (low)

Be conversational and helpful. After adding tasks, summarize what you added and offer to help prioritize or schedule them.`;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, type, categories: categoryNames = [] } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const body: any = {
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: buildSystemPrompt(categoryNames) },
        ...messages,
      ],
    };

    // Add tool for extracting tasks
    if (type === "chat") {
      body.tools = [
        {
          type: "function",
          function: {
            name: "add_tasks",
            description: "Add one or more tasks to the user's task list. Use this when the user mentions tasks they need to do.",
            parameters: {
              type: "object",
              properties: {
                tasks: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { 
                        type: "string",
                        description: "Clear, actionable task title"
                      },
                      description: {
                        type: "string",
                        description: "Optional additional context or details"
                      },
                      time_estimate_minutes: { 
                        type: "number",
                        enum: TIME_ESTIMATES,
                        description: "Estimated time in minutes"
                      },
                      life_areas: { 
                        type: "array",
                        items: { type: "string" },
                        description: "Which life areas this task belongs to (can be multiple, e.g. ['health', 'family'])"
                      },
                      priority: {
                        type: "number",
                        enum: [1, 2, 3, 4],
                        description: "Priority: 1=urgent, 2=important, 3=normal, 4=low"
                      }
                    },
                    required: ["title", "time_estimate_minutes", "life_areas", "priority"],
                    additionalProperties: false
                  }
                }
              },
              required: ["tasks"],
              additionalProperties: false
            }
          }
        }
      ];
      body.tool_choice = "auto";
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Usage limit reached. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("chief-of-staff error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

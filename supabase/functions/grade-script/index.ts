import Anthropic from "npm:@anthropic-ai/sdk";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are SceneOne's analysis engine. You evaluate screenplays using proportional structural analysis based on Save the Cat methodology. You assess five dimensions: Structure (Act Proportion, key beats at right page percentages), Conflict (The Engine — clear opposing force), Escalation (rising stakes through Act 2), The Pivot (midpoint shift), and The Payoff (climax/resolution).

Always return ONLY valid JSON with no markdown, no commentary, no code fences. Return the JSON object directly.`;

const USER_PROMPT = (title: string, scriptText: string) => `Analyze this screenplay titled "${title}".

SCREENPLAY TEXT:
${scriptText.slice(0, 60000)}

Return a JSON object with EXACTLY this structure (all fields required):
{
  "overall_score": <integer 0-100>,
  "scores": {
    "structure": <integer 0-100>,
    "conflict": <integer 0-100>,
    "dialogue": <integer 0-100>,
    "pacing": <integer 0-100>,
    "visual": <integer 0-100>
  },
  "score_interpretation": "<one sentence describing what this score means for this specific script, ~15 words>",
  "win_statement": "<one specific thing done well with a page reference. ~35 words. Start with 'Your...' and cite a page number.>",
  "logline": "<pitch-ready logline for this script. ~30-40 words. Complete sentence.>",
  "story_dna": [
    {"film": "<film title>", "pct": <integer, must total 100>},
    {"film": "<film title>", "pct": <integer>},
    {"film": "<film title>", "pct": <integer>}
  ],
  "pacing_scores": [<array of integers 0-100, one per ~10 pages, approximately 10 values for a 100-page script>],
  "categories": {
    "structure": {
      "strength": "<what structure does well, ~35 words>",
      "flag": "<main structural issue, ~35 words>",
      "evidence": "<verbatim line or specific scene description from the script>",
      "fix": "<specific actionable rewrite suggestion, ~40 words>",
      "page_ref": "<e.g. 'p. 15' or 'pp. 23-25'>",
      "confidence": "<high|medium|low>"
    },
    "conflict": {
      "strength": "<what works in conflict, ~35 words>",
      "flag": "<main conflict issue, ~35 words>",
      "evidence": "<verbatim line or scene>",
      "fix": "<specific fix, ~40 words>",
      "page_ref": "<page ref>",
      "confidence": "<high|medium|low>"
    },
    "dialogue": {
      "strength": "<what works in dialogue, ~35 words>",
      "flag": "<main dialogue issue, ~35 words>",
      "evidence": "<verbatim line of dialogue from the script>",
      "fix": "<specific fix, ~40 words>",
      "page_ref": "<page ref>",
      "confidence": "<high|medium|low>"
    },
    "pacing": {
      "strength": "<what works in pacing, ~35 words>",
      "flag": "<main pacing issue, ~35 words>",
      "evidence": "<specific scene or beat reference>",
      "fix": "<specific fix, ~40 words>",
      "page_ref": "<page ref>",
      "confidence": "<high|medium|low>"
    },
    "visual": {
      "strength": "<what works visually, ~35 words>",
      "flag": "<main visual storytelling issue, ~35 words>",
      "evidence": "<verbatim action line from the script>",
      "fix": "<specific fix, ~40 words>",
      "page_ref": "<page ref>",
      "confidence": "<high|medium|low>"
    }
  },
  "revision_plan": [
    {
      "title": "<short imperative fix title, ~6 words>",
      "description": "<what to do and why, ~25 words>",
      "impact": "<e.g. '+7 pts Structure'>",
      "pages": "<page range>"
    },
    {
      "title": "<fix 2>",
      "description": "<description>",
      "impact": "<impact>",
      "pages": "<pages>"
    },
    {
      "title": "<fix 3>",
      "description": "<description>",
      "impact": "<impact>",
      "pages": "<pages>"
    }
  ]
}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { script_text, title } = await req.json();

    if (!script_text || script_text.trim().length < 100) {
      return new Response(
        JSON.stringify({ error: "Script text too short or missing" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const client = new Anthropic({
      apiKey: Deno.env.get("ANTHROPIC_API_KEY")!,
    });

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: USER_PROMPT(title || "Untitled Script", script_text) }],
    });

    const rawText = message.content[0].type === "text" ? message.content[0].text : "";

    // Extract JSON from response (handles any stray text)
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in Claude response");
    }

    const data = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("grade-script error:", err);
    return new Response(
      JSON.stringify({ error: "Analysis failed", detail: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

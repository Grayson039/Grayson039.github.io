import Anthropic from "npm:@anthropic-ai/sdk";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MONTHLY_LIMITS: Record<string, number | null> = {
  free:           1,
  writer:         5,
  pro:            null, // unlimited
  pro_unlimited:  null, // unlimited
};

const SYSTEM_PROMPT = `You are SceneOne's analysis engine. You evaluate screenplays using proportional structural analysis. For features, you apply Save the Cat methodology (Act 1 ~25%, Act 2 ~50%, Act 3 ~25%, midpoint at 50%). For short films, you apply compressed structure analysis — shorts operate on tighter proportions, often with a single escalating conflict and a fast pivot; do NOT penalize a short for lacking a traditional midpoint or full three-act sprawl. Assess five dimensions: Structure, Conflict, Dialogue, Pacing, and Visual Storytelling.

Always return ONLY valid JSON with no markdown, no commentary, no code fences. Return the JSON object directly.`;

const FEATURE_STRUCTURE_NOTE = `This is a FEATURE-LENGTH screenplay (typically 80–120 pages). Apply full Save the Cat structure: Act 1 break ~p.25, midpoint ~p.50, Act 2 break ~p.75, climax ~p.85-95. Grade structure against these proportional expectations.`;

const SHORT_STRUCTURE_NOTE = `This is a SHORT FILM (typically 5–40 pages). Do NOT apply feature-length structure benchmarks. Instead evaluate: (1) Does the inciting incident land in the first 15–20% of pages? (2) Is there a clear single escalating conflict? (3) Does the ending feel earned given the compressed format? Short films often have one act break, not three — grade accordingly. Pacing scores should reflect the actual page count with one value per ~3 pages.`;

const USER_PROMPT = (title: string, scriptText: string, scriptType: string) => `Analyze this screenplay titled "${title}".

SCRIPT TYPE: ${scriptType === 'short' ? 'Short Film' : 'Feature'}
${scriptType === 'short' ? SHORT_STRUCTURE_NOTE : FEATURE_STRUCTURE_NOTE}

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
  "pacing_scores": [<${scriptType === 'short' ? 'array of integers 0-100, one per ~3 pages — typically 5–12 values for a short film' : 'array of integers 0-100, one per ~10 pages, approximately 10 values for a 100-page script'}>],
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

  // ── Health check / keep-warm ping ────────────────────────────────────────
  if (req.method === "GET") {
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  try {
    // ── Auth check ──────────────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Plan enforcement: monthly analysis limits ────────────────────────────
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .single();

    const plan = profile?.plan ?? "free";
    const monthlyLimit: number | null = plan in MONTHLY_LIMITS
      ? MONTHLY_LIMITS[plan]
      : 1; // unknown plan → apply free limit

    if (monthlyLimit !== null) {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count } = await supabase
        .from("submissions")
        .select("*", { count: "exact", head: true })
        .eq("user_email", user.email)
        .gte("created_at", startOfMonth.toISOString());

      if ((count ?? 0) >= monthlyLimit) {
        const errorCode = plan === "free" ? "free_limit_reached" : "plan_limit_reached";
        return new Response(
          JSON.stringify({ error: errorCode, plan, limit: monthlyLimit }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // ── Input validation ─────────────────────────────────────────────────────
    const { script_text, title, script_type = 'feature' } = await req.json();

    if (!script_text || script_text.trim().length < 100) {
      return new Response(
        JSON.stringify({ error: "Script text too short or missing" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (script_text.length > 500_000) {
      return new Response(
        JSON.stringify({ error: "Script too large. Please upload a file under 500,000 characters." }),
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
      messages: [{ role: "user", content: USER_PROMPT(title || "Untitled Script", script_text, script_type) }],
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

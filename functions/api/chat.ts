import { buildRuntimePrompt, resolveGenerationParams } from "./prompts";

interface Env {
  OPENROUTER_API_KEY: string;
  OPENROUTER_MODEL?: string;
  /** Optional. If set, client must send `Authorization: Bearer <same value>`. */
  CHAT_API_KEY?: string;
}

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const WEB_SEARCH_TOOL = {
  type: "openrouter:web_search",
  parameters: {
    engine: "exa",
    max_results: 10,
    max_total_results: 32,
    search_context_size: "high",
    allowed_domains: [
      "sefaria.org",
      "www.sefaria.org",
      "chabad.org",
      "www.chabad.org",
      "ou.org",
      "www.ou.org",
      "torah.org",
      "www.torah.org",
      "halachipedia.org",
      "www.halachipedia.org",
      "yutorah.org",
      "www.yutorah.org",
      "dinonline.org",
      "www.dinonline.org",
      "etzion.org.il",
      "www.etzion.org.il",
      "aish.com",
      "www.aish.com",
      "myjewishlearning.com",
      "www.myjewishlearning.com",
      "jewishideas.org",
      "www.jewishideas.org",
    ],
  },
};

function jsonError(status: number, message: string, details?: string): Response {
  return new Response(
    JSON.stringify({ error: message, ...(details ? { details } : {}) }),
    {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function onRequestPost(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const { request, env } = context;

  const expectedSecret = env.CHAT_API_KEY?.trim();
  if (expectedSecret) {
    const auth = request.headers.get("Authorization")?.trim();
    if (auth !== `Bearer ${expectedSecret}`) {
      return jsonError(401, "Unauthorized");
    }
  }

  const openRouterApiKey = env.OPENROUTER_API_KEY?.trim();
  if (!openRouterApiKey) {
    return jsonError(
      500,
      "Server misconfiguration",
      "Missing OPENROUTER_API_KEY binding / secret.",
    );
  }

  try {
    const body = await request.json();
    const messages = body?.messages;

    if (!messages || !Array.isArray(messages)) {
      return jsonError(400, "messages array is required");
    }

    const model = env.OPENROUTER_MODEL?.trim() || "google/gemini-2.5-flash";
    const mode = body?.mode;
    const systemPrompt = buildRuntimePrompt(mode, messages);
    const generation = resolveGenerationParams(mode);

    const openRouterResponse = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openRouterApiKey}`,
          "HTTP-Referer": "https://koshergpt.popped.dev",
          "X-Title": "KosherGPT",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "system", content: systemPrompt }, ...messages],
          temperature: generation.temperature,
          top_p: generation.top_p,
          max_tokens: generation.max_tokens,
          stream: true,
          tools: [WEB_SEARCH_TOOL],
        }),
      },
    );

    if (!openRouterResponse.ok) {
      const details = await openRouterResponse.text();
      return jsonError(
        openRouterResponse.status >= 400 && openRouterResponse.status < 600
          ? openRouterResponse.status
          : 502,
        "OpenRouter API error",
        details,
      );
    }

    return new Response(openRouterResponse.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    return jsonError(500, "Internal server error", String(error));
  }
}

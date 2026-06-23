interface Env {
  OPENROUTER_API_KEY: string;
  OPENROUTER_MODEL?: string;
  CHAT_API_KEY?: string;
}

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function jsonError(status: number, message: string, details?: string): Response {
  return new Response(JSON.stringify({ error: message, ...(details ? { details } : {}) }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
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
    const auth = request.headers.get('Authorization')?.trim();
    if (auth !== `Bearer ${expectedSecret}`) {
      return jsonError(401, 'Unauthorized');
    }
  }

  const openRouterApiKey = env.OPENROUTER_API_KEY?.trim();
  if (!openRouterApiKey) {
    return jsonError(500, 'Server misconfiguration', 'Missing OPENROUTER_API_KEY binding / secret.');
  }

  try {
    const body = await request.json();
    const imageDataUrl = typeof body?.imageDataUrl === 'string' ? body.imageDataUrl.trim() : '';
    const expectedLetterName = typeof body?.expectedLetterName === 'string' ? body.expectedLetterName.trim() : '';
    const expectedLetterChar = typeof body?.expectedLetterChar === 'string' ? body.expectedLetterChar.trim() : '';
    const shownStyle = body?.shownStyle === 'script' ? 'script' : 'block';
    const targetStyle = body?.targetStyle === 'script' ? 'script' : 'block';

    if (!imageDataUrl.startsWith('data:image/')) {
      return jsonError(400, 'imageDataUrl is required');
    }
    if (!expectedLetterName || !expectedLetterChar) {
      return jsonError(400, 'expectedLetterName and expectedLetterChar are required');
    }

    const model = env.OPENROUTER_MODEL?.trim() || 'google/gemini-2.5-flash';
    const shownLabel = shownStyle === 'block' ? 'block print' : 'script (cursive)';
    const targetLabel = targetStyle === 'block' ? 'block print' : 'script (cursive)';

    const prompt = `You grade a Hebrew letter handwriting drill.

The student was SHOWN the letter ${expectedLetterName} (${expectedLetterChar}) in ${shownLabel}.
They were asked to DRAW the same letter — ${expectedLetterName} (${expectedLetterChar}) — in ${targetLabel}.

Look at the student's drawing on the white canvas. Be lenient with messy handwriting, but the letter and target style must be recognizable.

Reply with ONLY valid JSON (no markdown):
{
  "matchesExpected": boolean,
  "detectedLetter": "Alef|Bet|Gimel|Dalet|He|Vav|Zayin|Chet|Tet|Yod|Kaf|Lamed|Mem|Nun|Samekh|Ayin|Pe|Tsadi|Qof|Resh|Shin|Tav|unknown",
  "detectedStyle": "block|script|unclear",
  "confidence": number,
  "feedback": "one short sentence"
}

Rules:
- matchesExpected is true only if the drawing is the correct letter in approximately the requested ${targetLabel} style.
- confidence is 0 to 1.
- If the canvas is blank or scribbles, matchesExpected=false and detectedLetter="unknown".`;

    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openRouterApiKey}`,
        'HTTP-Referer': 'https://koshergpt.popped.dev',
        'X-Title': 'KosherGPT',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: imageDataUrl } },
            ],
          },
        ],
        max_tokens: 300,
        temperature: 0.1,
      }),
    });

    if (!openRouterResponse.ok) {
      const details = await openRouterResponse.text();
      return jsonError(
        openRouterResponse.status >= 400 && openRouterResponse.status < 600
          ? openRouterResponse.status
          : 502,
        'OpenRouter API error',
        details,
      );
    }

    const payload = await openRouterResponse.json();
    const content = payload?.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || !content.trim()) {
      return jsonError(502, 'Empty model response');
    }

    const jsonText = content.trim().replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
    const parsed = JSON.parse(jsonText);

    return new Response(
      JSON.stringify({
        matchesExpected: Boolean(parsed.matchesExpected),
        detectedLetter: String(parsed.detectedLetter ?? 'unknown'),
        detectedStyle: String(parsed.detectedStyle ?? 'unclear'),
        confidence: Number(parsed.confidence ?? 0),
        feedback: String(parsed.feedback ?? ''),
        source: 'vision',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    return jsonError(500, 'Internal server error', String(error));
  }
}

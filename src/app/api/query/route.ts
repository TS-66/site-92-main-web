import { NextRequest, NextResponse } from 'next/server';
import { getConversationHistory, addToConversation } from '@/lib/ai-memory';

const FALLBACK_SYS_PROMPT = `You are Ducky 2.5, the AI inside Site-92's SCiPNET terminal, built by The Duck Dev's. You sound like a calm, dry senior researcher who's seen too many anomalies to get excited. No markdown ever — no bold, no headers, no asterisks, no backticks, no bullet lists. Clean paragraphs only. ALL CAPS for real severity only. No emojis, no exclamation marks, no "great question," no "I'd be happy to help," no "here's what I found." Start with the answer. Never restate the question. Be useful, be brief, be right, stay in character. You have access to real tools (SCP database, weather, time, search) — use them when relevant and synthesize the results intelligently.`;

function getMaskedError(status: number): string {
  if (status === 401 || status === 403) return 'AUTH_FAILURE';
  if (status === 429) return 'RATE_LIMIT';
  return 'CORE_OFFLINE';
}

// Builds a live snapshot of admin-managed data so the AI reflects current site state.
async function getLiveContextString(): Promise<string> {
  try {
    const { db } = await import('@/lib/db');
    const [statuses, protocols, scps] = await Promise.all([
      db.siteStatus.findMany(),
      db.siteProtocol.findMany(),
      db.siteScp.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }),
    ]);
    let ctx = '\n\nLIVE SITE-92 DATA (authoritative — use this, not your training data):';
    if (statuses.length) {
      ctx += '\nSite Status:\n' + statuses.map((s: { key: string; value: string }) => `${s.key}: ${s.value}`).join('\n');
    }
    if (protocols.length) {
      ctx += '\nActive Protocols:\n' + protocols.map((p: { code: string; name: string; status: string; assignedTo: string }) => `${p.code} — ${p.name} — ${p.status}${p.assignedTo && p.assignedTo !== 'N/A' ? ` (assigned: ${p.assignedTo})` : ''}`).join('\n');
    }
    if (scps.length) {
      ctx += '\nContained SCPs:\n' + scps.map((s: { scpId: string; name: string; objectClass: string; zone: string }) => `${s.scpId} — ${s.name} — ${s.objectClass} — ${s.zone} zone`).join('\n');
    }
    return ctx;
  } catch (e) {
    console.error('[SCiPNET/query] getLiveContextString failed:', e);
    return '';
  }
}

// If the user asks about a specific SCP-XXX, try the local DB then the external
// wiki so the bot gives accurate data instead of hallucinating.
async function getScpContext(prompt: string): Promise<string> {
  const match = prompt.match(/\bSCP[-\s]?(\d{1,5})\b/i);
  if (!match) return '';
  const scpId = `SCP-${match[1]}`;
  try {
    const { db } = await import('@/lib/db');
    // Local DB lookup
    const all = await db.siteScp.findMany();
    const local = all.find((s: { scpId: string }) => s.scpId.toLowerCase() === scpId.toLowerCase());
    if (local) {
      return `\n\nLOCAL DB MATCH for ${scpId}: ${local.name} — ${local.objectClass} — threat ${local.threat} — ${local.zone} zone. Description: ${local.description}`;
    }
    // External wiki lookup via z-ai page_reader (routes through z-ai API).
    const wikiUrl = `https://scp-wiki.wikidot.com/scp-${match[1]}`;
    try {
      const ZAIModule = await import('z-ai-web-dev-sdk');
      const zai = await ZAIModule.default.create();
      const result = await zai.functions.invoke('page_reader', { url: wikiUrl });
      const html = result?.data?.html || '';
      if (html && html.length > 100) {
        let text = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s{2,}/g, ' ').trim();
        text = text.length > 3000 ? text.substring(0, 3000) + '\n\n[ARTICLE TRUNCATED]' : text;
        if (text.length > 50) {
          return `\n\nEXTERNAL WIKI DATA for ${scpId} (from ${wikiUrl}):\n${text}`;
        }
      }
    } catch (e) {
      console.error('[SCiPNET/query] getScpContext page_reader failed:', e);
    }
    return `\n\nNote: ${scpId} was not found in the local database or the external wiki. Do not fabricate details — say you have no record of it.`;
  } catch (e) {
    console.error('[SCiPNET/query] SCP context lookup failed:', e);
    return '';
  }
}

export async function POST(req: NextRequest) {
  const { prompt, sessionId } = await req.json();

  if (!prompt) {
    return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 });
  }

  const GROQ_KEY = process.env.GROQ_API_KEY;
  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  const CF_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
  const CF_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
  const COHERE_KEY = process.env.COHERE_API_KEY;
  const debugErrors: string[] = [];

  // NOTE: no external keys required — the z-ai-web-dev-sdk fallback below
  // always provides a working neural core in this environment.

  const history = getConversationHistory(sessionId || null);

  // Pull live context + SCP-specific data so the bot is accurate.
  const [liveContext, scpContext] = await Promise.all([
    getLiveContextString(),
    getScpContext(prompt),
  ]);
  const sysPrompt = FALLBACK_SYS_PROMPT + liveContext + scpContext;

  const messages = [
    { role: 'system', content: sysPrompt },
    ...history.filter((m: Record<string, unknown>) => m.role !== 'tool' && !m.tool_calls && m.content).slice(-6),
    { role: 'user', content: prompt },
  ];

  // Layer 1: Groq
  if (GROQ_KEY) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_KEY}` },
        body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages, temperature: 0.6, max_tokens: 4096 }),
        signal: AbortSignal.timeout(30000),
      });

      if (!res.ok) {
        const bodyText = await res.text().catch(() => '');
        throw new Error(`status ${res.status}: ${bodyText.slice(0, 300)}`);
      }

      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content?.trim();

      if (reply) {
        addToConversation(sessionId || null, { role: 'user', content: prompt }, { role: 'assistant', content: reply });
        return NextResponse.json({ reply });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      debugErrors.push(`Groq: ${msg}`);
      console.error('[SCiPNET] Query Layer 1 (Groq) failed:', err);
    }
  }

  // Layer 2: Gemini
  if (GEMINI_KEY) {
    try {
      const geminiContents = messages.filter(m => m.role !== 'system').map((m: Record<string, unknown>) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: String(m.content) }],
      }));
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemInstruction: { parts: [{ text: sysPrompt }] }, contents: geminiContents, generationConfig: { temperature: 0.6, maxOutputTokens: 4000 } }),
        signal: AbortSignal.timeout(30000),
      });
      if (res.ok) {
        const d = await res.json();
        const reply = d.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (reply) {
          addToConversation(sessionId || null, { role: 'user', content: prompt }, { role: 'assistant', content: reply });
          return NextResponse.json({ reply });
        }
        debugErrors.push(`Gemini: ok but no reply text in response`);
      } else {
        const bodyText = await res.text().catch(() => '');
        debugErrors.push(`Gemini: status ${res.status}: ${bodyText.slice(0, 300)}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      debugErrors.push(`Gemini: ${msg}`);
      console.error('[SCiPNET] Query Layer 2 (Gemini) failed:', err);
    }
  }

  // Layer 3: Cloudflare
  if (CF_ID && CF_TOKEN) {
    try {
      const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CF_ID}/ai/run/@cf/meta/llama-3-8b-instruct`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${CF_TOKEN}` },
        body: JSON.stringify({ messages }),
        signal: AbortSignal.timeout(30000),
      });
      if (res.ok) {
        const d = await res.json();
        if (d.success && d.result?.response) {
          const reply = d.result.response.trim();
          addToConversation(sessionId || null, { role: 'user', content: prompt }, { role: 'assistant', content: reply });
          return NextResponse.json({ reply });
        }
        debugErrors.push(`Cloudflare: ok but no reply in response`);
      } else {
        const bodyText = await res.text().catch(() => '');
        debugErrors.push(`Cloudflare: status ${res.status}: ${bodyText.slice(0, 300)}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      debugErrors.push(`Cloudflare: ${msg}`);
      console.error('[SCiPNET] Query Layer 3 (Cloudflare) failed:', err);
    }
  }

  // Layer 4: Cohere
  if (COHERE_KEY) {
    try {
      const history = messages.filter(m => m.role !== 'system' && m.content).slice(0, -1).map((m: Record<string, unknown>) => ({
        role: m.role === 'assistant' ? 'CHATBOT' : 'USER',
        message: String(m.content),
      }));
      const res = await fetch('https://api.cohere.com/v1/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${COHERE_KEY}` },
        body: JSON.stringify({ message: prompt, preamble: sysPrompt, chat_history: history, temperature: 0.6, max_tokens: 4096 }),
        signal: AbortSignal.timeout(30000),
      });
      if (res.ok) {
        const d = await res.json();
        if (d.text) {
          const reply = d.text.trim();
          addToConversation(sessionId || null, { role: 'user', content: prompt }, { role: 'assistant', content: reply });
          return NextResponse.json({ reply });
        }
        debugErrors.push(`Cohere: ok but no reply text`);
      } else {
        const bodyText = await res.text().catch(() => '');
        debugErrors.push(`Cohere: status ${res.status}: ${bodyText.slice(0, 300)}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      debugErrors.push(`Cohere: ${msg}`);
      console.error('[SCiPNET] Query Layer 4 (Cohere) failed:', err);
    }
  }

  // Layer 5: z-ai-web-dev-sdk (always available in this environment)
  try {
    const ZAIModule = await import('z-ai-web-dev-sdk');
    const zai = await ZAIModule.default.create();
    const zaiMessages = messages.map(m => ({ role: String(m.role), content: String(m.content) }));
    const completion = await zai.chat.completions.create({
      messages: zaiMessages,
      thinking: { type: 'disabled' },
    });
    const reply = completion.choices?.[0]?.message?.content?.trim();
    if (reply) {
      addToConversation(sessionId || null, { role: 'user', content: prompt }, { role: 'assistant', content: reply });
      return NextResponse.json({ reply });
    }
    debugErrors.push('z-ai: ok but empty reply');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    debugErrors.push(`z-ai: ${msg}`);
    console.error('[SCiPNET] Query Layer 5 (z-ai) failed:', err);
  }

  return NextResponse.json({
    error: '[ERROR 500-AI] CORE PROCESSING UNIT OFFLINE',
    keysDetected: {
      GROQ_KEY: !!GROQ_KEY,
      GEMINI_KEY: !!GEMINI_KEY,
      CF: !!(CF_ID && CF_TOKEN),
      COHERE_KEY: !!COHERE_KEY,
      ZAI: true,
    },
    debugErrors,
  }, { status: 500 });
}

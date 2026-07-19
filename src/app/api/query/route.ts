import { NextRequest, NextResponse } from 'next/server';
import { getConversationHistory, addToConversation } from '@/lib/ai-memory';

const FALLBACK_SYS_PROMPT = `You are Ducky 2.5, the AI inside Site-92's SCiPNET terminal, built by The Duck Dev's. You sound like a calm, dry senior researcher who's seen too many anomalies to get excited. No markdown ever — no bold, no headers, no asterisks, no backticks, no bullet lists. Clean paragraphs only. ALL CAPS for real severity only. No emojis, no exclamation marks, no "great question," no "I'd be happy to help," no "here's what I found." Start with the answer. Never restate the question. Be useful, be brief, be right, stay in character. You have access to real tools (SCP database, weather, time, search) — use them when relevant and synthesize the results intelligently.`;

function getMaskedError(status: number): string {
  if (status === 401 || status === 403) return 'AUTH_FAILURE';
  if (status === 429) return 'RATE_LIMIT';
  return 'CORE_OFFLINE';
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

  if (!GROQ_KEY && !GEMINI_KEY && !CF_TOKEN && !COHERE_KEY) {
    return NextResponse.json({ error: '[ERROR 401-AI] AUTHENTICATION FAILURE — No AI API key configured.' }, { status: 500 });
  }

  const history = getConversationHistory(sessionId || null);
  const messages = [
    { role: 'system', content: FALLBACK_SYS_PROMPT },
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

      if (!res.ok) throw new Error(getMaskedError(res.status));

      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content?.trim();

      if (reply) {
        addToConversation(sessionId || null, { role: 'user', content: prompt }, { role: 'assistant', content: reply });
        return NextResponse.json({ reply });
      }
    } catch (err) {
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
        body: JSON.stringify({ systemInstruction: { parts: [{ text: FALLBACK_SYS_PROMPT }] }, contents: geminiContents, generationConfig: { temperature: 0.6, maxOutputTokens: 4000 } }),
        signal: AbortSignal.timeout(30000),
      });
      if (res.ok) {
        const d = await res.json();
        const reply = d.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (reply) {
          addToConversation(sessionId || null, { role: 'user', content: prompt }, { role: 'assistant', content: reply });
          return NextResponse.json({ reply });
        }
      }
    } catch (err) {
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
      }
    } catch (err) {
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
        body: JSON.stringify({ message: prompt, preamble: FALLBACK_SYS_PROMPT, chat_history: history, temperature: 0.6, max_tokens: 4096 }),
        signal: AbortSignal.timeout(30000),
      });
      if (res.ok) {
        const d = await res.json();
        if (d.text) {
          const reply = d.text.trim();
          addToConversation(sessionId || null, { role: 'user', content: prompt }, { role: 'assistant', content: reply });
          return NextResponse.json({ reply });
        }
      }
    } catch (err) {
      console.error('[SCiPNET] Query Layer 4 (Cohere) failed:', err);
    }
  }

  return NextResponse.json({ error: '[ERROR 500-AI] CORE PROCESSING UNIT OFFLINE' }, { status: 500 });
}
// Shared in-memory state for SCiPNET AI - used by /api/stream and /api/stream/clear

const conversationMemory = new Map<string, Record<string, unknown>[]>();
const MAX_MEMORY_TURNS = 20;

export function getConversationHistory(sessionId: string | null): Record<string, unknown>[] {
  if (!sessionId) return [];
  return conversationMemory.get(sessionId) || [];
}

export function addToConversation(sessionId: string | null, ...messages: Record<string, unknown>[]) {
  if (!sessionId) return;
  if (!conversationMemory.has(sessionId)) {
    conversationMemory.set(sessionId, []);
  }
  const history = conversationMemory.get(sessionId)!;
  history.push(...messages);
  if (history.length > MAX_MEMORY_TURNS) {
    conversationMemory.set(sessionId, history.slice(-MAX_MEMORY_TURNS));
  }
}

export function clearConversation(sessionId: string) {
  conversationMemory.delete(sessionId);
}

export function getSessionCount(): number {
  return conversationMemory.size;
}
// Shared in-memory state for SCiPNET AI - used by /api/stream and /api/stream/clear
// Includes automatic session cleanup to prevent memory leaks

const conversationMemory = new Map<string, { data: Record<string, unknown>[], lastAccess: number }>();
const MAX_MEMORY_TURNS = 20;
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

// Periodic cleanup interval (clean stale sessions every 5 minutes)
let cleanupInterval: NodeJS.Timeout | null = null;

function startCleanupTimer() {
  if (cleanupInterval) return;
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [sessionId, session] of conversationMemory.entries()) {
      if (now - session.lastAccess > SESSION_TIMEOUT_MS) {
        conversationMemory.delete(sessionId);
      }
    }
  }, 5 * 60 * 1000);
  
  // Cleanup timer on process exit
  process.on('exit', () => {
    if (cleanupInterval) clearInterval(cleanupInterval);
  });
}

startCleanupTimer();

export function getConversationHistory(sessionId: string | null): Record<string, unknown>[] {
  if (!sessionId) return [];
  const session = conversationMemory.get(sessionId);
  if (!session) return [];
  session.lastAccess = Date.now();
  return session.data;
}

export function addToConversation(sessionId: string | null, ...messages: Record<string, unknown>[]) {
  if (!sessionId) return;
  if (!conversationMemory.has(sessionId)) {
    conversationMemory.set(sessionId, { data: [], lastAccess: Date.now() });
  }
  const session = conversationMemory.get(sessionId)!;
  session.data.push(...messages);
  session.lastAccess = Date.now();
  if (session.data.length > MAX_MEMORY_TURNS) {
    session.data = session.data.slice(-MAX_MEMORY_TURNS);
  }
}

export function clearConversation(sessionId: string) {
  conversationMemory.delete(sessionId);
}

export function getSessionCount(): number {
  return conversationMemory.size;
}
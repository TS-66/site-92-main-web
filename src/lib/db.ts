import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? [] : ['warn', 'error'],
    errorHandlers: {
      handlePanic: () => {
        console.error('[Prisma] Panic occurred. Attempting reconnect...');
      },
      handleReconnect: () => {
        console.log('[Prisma] Reconnected to database.');
      }
    }
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Helper function to test database connection with retry logic
export async function ensureDbConnection(retries = 3): Promise<void> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await db.$connect();
      return;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`[Prisma] Connection attempt ${attempt}/${retries} failed:`, lastError.message);
      
      if (attempt < retries) {
        // Exponential backoff: 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
      }
    }
  }
  
  throw new Error(`Failed to connect to database after ${retries} attempts: ${lastError?.message}`);
}
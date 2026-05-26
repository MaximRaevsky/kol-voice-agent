import OpenAI from 'openai';

/**
 * OpenAI Provider - Availability check for LLM features
 * 
 * The main AI logic is in aiDecider.ts which has its own OpenAI client.
 * This provider exposes a simple isAvailable() check used by the API.
 */

class OpenAIProvider {
  private client: OpenAI | null = null;
  private initialized: boolean = false;

  private ensureInitialized(): void {
    if (this.initialized) return;
    this.initialized = true;

    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey && apiKey.length > 10) {
      this.client = new OpenAI({ apiKey });
    }
  }

  isAvailable(): boolean {
    this.ensureInitialized();
    return this.client !== null;
  }
}

export const openaiProvider = new OpenAIProvider();

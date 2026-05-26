import { z } from 'zod';

/**
 * Environment configuration for Kol Voice Agent
 * 
 * Required:
 * - OPENAI_API_KEY: For AI-powered conversations
 * 
 * Optional:
 * - AZURE_SPEECH_KEY + AZURE_SPEECH_REGION: For higher quality TTS
 */

const envSchema = z.object({
  // Required - AI
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),

  // Server
  PORT: z.string().default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Azure Speech (optional - enables HD voice quality)
  AZURE_SPEECH_KEY: z.string().optional(),
  AZURE_SPEECH_REGION: z.string().default('westeurope'),
  AZURE_TTS_VOICE_NAME: z.string().default('he-IL-AvriNeural'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  process.exit(1);
}

const env = parsed.data;

export const config = {
  // Server
  port: parseInt(env.PORT, 10),
  nodeEnv: env.NODE_ENV,
  isDev: env.NODE_ENV === 'development',

  // OpenAI
  openaiApiKey: env.OPENAI_API_KEY,

  // Azure Speech (optional HD voice)
  azure: {
    speechKey: env.AZURE_SPEECH_KEY,
    speechRegion: env.AZURE_SPEECH_REGION,
    ttsVoiceName: env.AZURE_TTS_VOICE_NAME,
  },

  // Derived flags
  azureSpeechEnabled: Boolean(env.AZURE_SPEECH_KEY && env.AZURE_SPEECH_REGION),
} as const;

export type Config = typeof config;

/**
 * Speech API routes - Azure TTS
 */

import { Router } from 'express';
import { z } from 'zod';
import { synthesizeMp3, isAzureTtsEnabled } from '../providers/speech/azureTtsProvider.js';

const router = Router();

const TtsRequestSchema = z.object({
  text: z.string().min(1).max(2000),
});

router.post('/tts', async (req, res) => {
  try {
    const parsed = TtsRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    const { text } = parsed.data;

    if (!isAzureTtsEnabled()) {
      return res.status(503).json({ error: 'Azure TTS not available' });
    }

    const audioBuffer = await synthesizeMp3(text);

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length,
      'Cache-Control': 'no-cache',
    });
    
    return res.send(audioBuffer);
  } catch {
    return res.status(500).json({ error: 'TTS synthesis failed' });
  }
});

export default router;

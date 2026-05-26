/**
 * Azure Speech TTS Provider
 */

import { config } from '../../config/env.js';

const AZURE_TTS_ENDPOINT = `https://${config.azure.speechRegion}.tts.speech.microsoft.com/cognitiveservices/v1`;

function buildSSML(text: string, voiceName: string): string {
  const cleanedText = text.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

  return `
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="he-IL">
  <voice name="${voiceName}">
    <prosody rate="0.95" pitch="+2%">
      ${cleanedText}
    </prosody>
  </voice>
</speak>`.trim();
}

export async function synthesizeMp3(text: string): Promise<Buffer> {
  if (!config.azure.speechKey || !config.azure.speechRegion) {
    throw new Error('Azure Speech credentials not configured');
  }

  const voiceName = config.azure.ttsVoiceName || 'he-IL-AvriNeural';
  const ssml = buildSSML(text, voiceName);

  const response = await fetch(AZURE_TTS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': config.azure.speechKey,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
      'User-Agent': 'KolVoiceAgent/1.0',
    },
    body: ssml,
  });

  if (!response.ok) {
    throw new Error(`Azure TTS error: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export function isAzureTtsEnabled(): boolean {
  return Boolean(config.azure.speechKey && config.azure.speechRegion);
}

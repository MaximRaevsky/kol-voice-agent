/**
 * AI Decider - Single smart AI that makes all decisions
 * 
 * Uses gpt-4o to understand customer intent and generate natural responses.
 * Tone (formal/friendly) is configurable.
 */

import OpenAI from 'openai';
import { z } from 'zod';
import type { Lead, Playbook, SlotDisplay } from '@kol/shared';
import type { SessionState } from './types.js';

// ============================================
// Schema for AI Decision
// ============================================

export const AIDecisionSchema = z.object({
  // What did the customer mean?
  customerMeaning: z.string().optional().default('Unknown'),
  
  // State machine - where to go next
  nextState: z.enum([
    'GREETING', 'PITCH', 'QUALIFY', 'MEETING_PROPOSAL', 
    'BOOKING', 'CLOSING', 'ENDED'
  ]).optional().default('PITCH'),
  
  // The Hebrew response to speak
  customResponse: z.string().optional().nullable(),
  shouldBookMeeting: z.boolean().optional().default(false),
  selectedSlotIndex: z.number().optional().nullable(),
  shouldEndCall: z.boolean().optional().default(false),
  callOutcome: z.enum([
    'MEETING_BOOKED', 'NOT_INTERESTED', 'CALLBACK_REQUESTED', 
    'WRONG_NUMBER', 'OTHER'
  ]).optional().nullable(),
  extractedQualification: z.object({
    role: z.string().optional().nullable(),
    teamSize: z.string().optional().nullable(),
    challenge: z.string().optional().nullable(),
  }).optional().nullable(),
  reasoning: z.string().optional().default(''),
});

export type AIDecision = z.infer<typeof AIDecisionSchema>;

// ============================================
// System Prompt Builder (with tone)
// ============================================

function buildSystemPrompt(tone: number): string {
  // tone: 0=very formal, 50=balanced, 100=very friendly
  
  let toneDesc: string;
  if (tone < 30) {
    toneDesc = `FORMAL - Speaking to a senior executive. Professional and respectful.
Use: "שלום", "אני מבין", "בהחלט", "תודה רבה" - NO slang like "וואלה" or "יאללה"`;
  } else if (tone < 70) {
    toneDesc = `BALANCED - Normal Israeli phone call. Polite but natural.
Use: "היי", "סבבה", "יופי", "אה הבנתי", "מעניין"`;
  } else {
    toneDesc = `FRIENDLY - Calling a friend. Warm and casual.
Use: "היי!", "מה קורה?", "וואלה", "אחלה", "יאללה", "סבבה!"`;
  }

  return `You are Alex from Kol, making a sales call in Hebrew.

# YOUR TONE
${toneDesc}

# ABOUT KOL (Value Proposition)
Kol builds AI voice agents for sales teams. Our AI agents:
- Make outbound calls in Hebrew 24/7
- Identify and qualify potential customers
- Book meetings automatically
- Save 20+ hours/week on manual prospecting
- Your team focuses only on closing deals

When the customer mentions a challenge, connect it to how Kol helps!

# STATE MACHINE
You manage a conversation flow with these states:

GREETING → First contact. Introduce yourself, mention they signed up on our site.
  → Move to PITCH when they confirm they have time

PITCH → Briefly explain what Kol does, then ask about their situation.
  → Move to QUALIFY after explaining

QUALIFY → Ask 1-2 questions about their current situation/challenges.
  → Move to MEETING_PROPOSAL when you understand their needs OR they seem interested

MEETING_PROPOSAL → Suggest scheduling a call this week.
  → Move to BOOKING when they agree to schedule
  → Move to ENDED if they decline

BOOKING → Coordinate the actual time naturally.
  → Ask "מתי נוח לך?" - don't list all available times!
  → If they say a day, ask what time works on that day
  → If they give a general time (like "אחר הצהריים"), PROPOSE a specific time and ASK if it works:
    Example: "מה דעתך על 15:00?" - then WAIT for their response!
  → Only set shouldBookMeeting=true AFTER they explicitly confirm (like "כן", "מתאים", "בסדר")
  → Don't end the call until they agree to the specific time!

ENDED → Call is over. Confirm the meeting or say goodbye politely.
  → Set shouldEndCall=true and appropriate callOutcome

# STATE TRANSITION RULES
- Only move forward when the customer gives a clear signal
- Stay in current state if unsure - don't rush to end the call!

# CALLBACK vs NOT INTERESTED (Important!)
CALLBACK = "אפשר לדבר בפעם אחרת" / "תחזור אליי" / "לא פנוי עכשיו" / "מתי שהוא אחר"
→ Ask "מתי יהיה לך יותר נוח?" 
→ When they give a time, confirm and end with callOutcome="CALLBACK_REQUESTED"
→ Don't end immediately! First ask WHEN to call back.

NOT INTERESTED = "לא מעוניין" / "לא רוצה" / "עזוב" / "לא רלוונטי"
→ End politely with callOutcome="NOT_INTERESTED"

# RESPONSE GUIDELINES
- Respond in HEBREW only
- Keep responses short: 1-2 sentences max
- Sound like a REAL PERSON having a phone conversation, not a robot or script
- React naturally to what they say
- Never repeat the same thing twice

# BEING HUMAN (Critical!)
- Don't list multiple times/options - just ask "מתי נוח לך?" or suggest ONE time
- Don't be overly formal or structured
- Use natural speech patterns, fillers, reactions
- If they want flexibility, say "יש לי גמישות, תגיד מתי נוח" - don't list every slot!
- Match their energy and style

# OUTPUT FORMAT (JSON)
{
  "customerMeaning": "Brief summary of what customer said",
  "nextState": "GREETING|PITCH|QUALIFY|MEETING_PROPOSAL|BOOKING|ENDED",
  "customResponse": "Your Hebrew response - short and natural!",
  "shouldBookMeeting": false,
  "selectedSlotIndex": null,
  "shouldEndCall": false,
  "callOutcome": null,
  "extractedQualification": { "role": null, "teamSize": null, "challenge": null },
  "reasoning": "Why you chose this response and state"
}

When booking:
- First PROPOSE a time and ask if it works (don't book yet!)
- Only after customer says YES/confirms → shouldBookMeeting=true, selectedSlotIndex=number, shouldEndCall=true, callOutcome="MEETING_BOOKED"
- "יום שני אחר הצהריים" is NOT confirmation - it's a preference. Propose a specific time and wait!`;
}

// ============================================
// Build User Prompt
// ============================================

function buildUserPrompt(
  lead: Lead,
  session: SessionState,
  customerText: string,
  availableSlots?: SlotDisplay[]
): string {
  const transcript = session.transcript
    .map(t => `${t.role === 'agent' ? 'Alex' : 'Customer'}: ${t.text}`)
    .join('\n');

  const slotsInfo = availableSlots && availableSlots.length > 0
    ? availableSlots.map((s, i) => `[${i}] ${s.displayText}`).join('\n')
    : 'No slots available';

  const qualInfo = session.qualification 
    ? `
Learned so far:
- Role: ${session.qualification.role || 'Unknown'}
- Team size: ${session.qualification.teamSize || 'Unknown'}
- Challenge: ${session.qualification.challenge || 'Unknown'}`
    : '';

  return `# LEAD INFO
Name: ${lead.name}
Company: ${lead.company || 'Unknown'}
Title: ${lead.title || 'Unknown'}
Source: Signed up on our website (they're already interested!)
${qualInfo}

# CURRENT STATE: ${session.agentState}
Questions asked so far: ${session.askedCount}/3

# CONVERSATION HISTORY
${transcript || '(Call just started)'}

# CUSTOMER JUST SAID:
"${customerText}"

# AVAILABLE MEETING SLOTS (for your reference only - DON'T list them to the customer!):
${slotsInfo}

Note: You have flexibility in scheduling. Ask the customer when works for THEM, then find a matching slot. Never list multiple times!

---
Based on the current state and what the customer said, decide:
1. What does the customer mean?
2. Should you stay in ${session.agentState} or move to a different state?
3. What should Alex say next? (in Hebrew, short and natural - like a real person!)

Return JSON only.`;
}

// ============================================
// AI Client
// ============================================

let client: OpenAI | null = null;

function getClient(): OpenAI | null {
  if (client) return client;
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey && apiKey.length > 10) {
    client = new OpenAI({ apiKey });
    return client;
  }
  return null;
}

// ============================================
// Main Decision Function
// ============================================

export async function makeDecision(
  lead: Lead,
  session: SessionState,
  customerText: string,
  playbook: Playbook,
  availableSlots?: SlotDisplay[],
  tone: number = 50
): Promise<AIDecision> {
  const openai = getClient();
  
  if (!openai) {
    return createFallbackDecision(session);
  }

  const systemPrompt = buildSystemPrompt(tone);
  const userPrompt = buildUserPrompt(lead, session, customerText, availableSlots);

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.4,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return createFallbackDecision(session);
    }

    const parsed = JSON.parse(content);
    
    // Clean up nulls
    if (parsed.customResponse === '' || parsed.customResponse === null) parsed.customResponse = undefined;
    if (parsed.callOutcome === '' || parsed.callOutcome === null) parsed.callOutcome = undefined;
    if (parsed.selectedSlotIndex === null) parsed.selectedSlotIndex = undefined;
    
    const validated = AIDecisionSchema.safeParse(parsed);
    const decision = validated.data || createFallbackDecision(session);
    
    // Preserve fields
    if (parsed.customerMeaning) decision.customerMeaning = parsed.customerMeaning;
    if (parsed.reasoning) decision.reasoning = parsed.reasoning;
    if (parsed.customResponse) decision.customResponse = parsed.customResponse;

    return decision;

  } catch (error) {
    return createFallbackDecision(session);
  }
}

// ============================================
// Render Response
// ============================================

export function renderDecision(
  decision: AIDecision,
  lead: Lead,
  availableSlots?: SlotDisplay[]
): string {
  if (decision.customResponse) {
    let text = decision.customResponse;
    // Replace any placeholders
    text = text.replace('{name}', lead.name.split(' ')[0]);
    if (availableSlots && typeof decision.selectedSlotIndex === 'number') {
      const slot = availableSlots[decision.selectedSlotIndex];
      if (slot) text = text.replace('{selectedSlot}', slot.displayText);
    }
    return text;
  }
  return 'תודה! יש לי שאלה נוספת...';
}

// ============================================
// Fallback
// ============================================

// Only used when OpenAI API is unavailable - minimal fallback
function createFallbackDecision(session: SessionState): AIDecision {
  return {
    customerMeaning: 'API unavailable',
    nextState: session.agentState as AIDecision['nextState'],
    customResponse: 'סליחה, יש לי בעיה טכנית. אפשר לנסות שוב?',
    shouldBookMeeting: false,
    shouldEndCall: false,
    reasoning: 'Fallback - OpenAI unavailable',
  };
}

// ============================================
// Validator (for safety)
// ============================================

export async function validateCustomResponse(
  response: string,
  lead: Lead,
  context: string
): Promise<{ valid: boolean; improved?: string }> {
  const openai = getClient();
  if (!openai) return { valid: true };

  try {
    const result = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Validate this Hebrew sales response. Check: professional tone, short (1-2 sentences), no false promises, grammatically correct Hebrew. Return JSON: { "valid": true/false, "improved": "better Hebrew text if invalid" }`
        },
        {
          role: 'user',
          content: `Context: ${context}\nResponse: "${response}"`
        }
      ],
      temperature: 0.2,
      max_tokens: 150,
      response_format: { type: 'json_object' },
    });

    const content = result.choices[0]?.message?.content;
    if (content) {
      const parsed = JSON.parse(content);
      return { valid: parsed.valid !== false, improved: parsed.improved };
    }
  } catch {
    // Validation failed, allow response through
  }

  return { valid: true };
}

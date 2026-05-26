/**
 * API Client for HTTP endpoints
 */

import type { Lead, Playbook, UseCase, ServerMessage, CrmActivity } from '@kol/shared';

const API_BASE = '/api';

// ============================================
// Types
// ============================================

export interface StartCallResponse {
  sessionId: string;
  leadId: string;
  useCase: UseCase;
  llmEnabled: boolean;
  events: ServerMessage[];
}

export interface UtteranceResponse {
  sessionId: string;
  state: string;
  ended: boolean;
  outcome: string | null;
  events: ServerMessage[];
}

export interface EndCallResponse {
  sessionId: string;
  outcome: string;
  duration: number;
  activity: CrmActivity | null;
  events: ServerMessage[];
}

export interface LeadsResponse {
  leads: Lead[];
}

export interface PlaybookResponse {
  useCase: UseCase;
  playbook: Playbook;
}

export interface MetricsResponse {
  totals: {
    totalCalls: number;
    meetingsBooked: number;
    conversionRate: number;
    avgDuration: number;
    todayCalls: number;
    todayMeetings: number;
  };
  byOutcome: Record<string, number>;
}

// ============================================
// API Methods
// ============================================

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// ============================================
// Leads
// ============================================

export async function getLeads(): Promise<Lead[]> {
  const data = await request<LeadsResponse>('/leads');
  return data.leads;
}

export async function getLead(id: string): Promise<Lead> {
  const data = await request<{ lead: Lead }>(`/leads/${id}`);
  return data.lead;
}

// ============================================
// Playbook
// ============================================

export async function getPlaybook(useCase: UseCase = 'OUTBOUND_SALES_HE'): Promise<Playbook> {
  const data = await request<{ playbook: Playbook }>(`/playbook?useCase=${useCase}`);
  return data.playbook;
}

export async function updatePlaybook(useCase: UseCase, playbook: Partial<Playbook>): Promise<{ success: boolean; playbook: Playbook }> {
  return request<{ success: boolean; playbook: Playbook }>('/playbook', {
    method: 'POST',
    body: JSON.stringify({ useCase, playbook }),
  });
}

// ============================================
// Metrics
// ============================================

export async function getMetrics(): Promise<MetricsResponse> {
  return request<MetricsResponse>('/metrics');
}

// ============================================
// Calendar Slots
// ============================================

export async function getSlots(): Promise<{ slots: import('@kol/shared').CalendarSlot[] }> {
  return request<{ slots: import('@kol/shared').CalendarSlot[] }>('/slots');
}

// ============================================
// Call API
// ============================================

export async function startCall(
  leadId: string, 
  useCase: UseCase = 'OUTBOUND_SALES_HE',
  tone: number = 50
): Promise<StartCallResponse> {
  return request<StartCallResponse>('/call/start', {
    method: 'POST',
    body: JSON.stringify({ leadId, useCase, tone }),
  });
}

export async function sendUtterance(
  sessionId: string,
  text: string,
  source: 'voice' | 'typed' = 'voice',
  tone: number = 50
): Promise<UtteranceResponse> {
  return request<UtteranceResponse>('/call/utterance', {
    method: 'POST',
    body: JSON.stringify({ sessionId, text, source, tone }),
  });
}

export async function endCall(sessionId: string): Promise<EndCallResponse> {
  return request<EndCallResponse>('/call/end', {
    method: 'POST',
    body: JSON.stringify({ sessionId }),
  });
}

// ============================================
// Health
// ============================================

export async function checkHealth(): Promise<{ status: string }> {
  return request<{ status: string }>('/health');
}

// ============================================
// Features
// ============================================

export interface FeaturesResponse {
  azureTtsEnabled: boolean;
  llmEnabled: boolean;
}

export async function getFeatures(): Promise<FeaturesResponse> {
  return request<FeaturesResponse>('/features');
}

// ============================================
// Azure TTS
// ============================================

/**
 * Fetch speech audio from Azure TTS
 * @param text - Hebrew text to synthesize
 * @returns Blob containing MP3 audio
 */
export async function fetchAzureTts(text: string): Promise<Blob> {
  const response = await fetch(`${API_BASE}/speech/tts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'TTS failed' }));
    throw new Error(error.error || `TTS HTTP ${response.status}`);
  }

  return response.blob();
}

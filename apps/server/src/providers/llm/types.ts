// LLM Provider types - currently minimal as main AI logic is in aiDecider.ts
export interface LlmAvailabilityCheck {
  isAvailable(): boolean;
}

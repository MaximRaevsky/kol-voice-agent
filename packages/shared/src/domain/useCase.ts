import { z } from 'zod';

// ============================================
// Use Cases
// ============================================

export const UseCaseSchema = z.enum([
  'OUTBOUND_SALES_HE',
]);

export type UseCase = z.infer<typeof UseCaseSchema>;

// Default use case
export const DEFAULT_USE_CASE: UseCase = 'OUTBOUND_SALES_HE';

// Use case display info
export const USE_CASE_INFO: Record<UseCase, { name: string; description: string }> = {
  OUTBOUND_SALES_HE: {
    name: 'Outbound Sales',
    description: 'Proactive outreach to qualify leads and book meetings',
  },
};


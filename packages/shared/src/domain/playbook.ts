import { z } from 'zod';
import { UseCaseSchema } from './useCase.js';

// ============================================
// Playbook
// ============================================

export const PlaybookSchema = z.object({
  id: z.string().uuid(),
  useCase: UseCaseSchema,
  name: z.string().min(1),
  language: z.string().default('he-IL'),
  companyName: z.string().min(1),
  productDescription: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type Playbook = z.infer<typeof PlaybookSchema>;

// For creating playbooks
export const CreatePlaybookSchema = PlaybookSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreatePlaybook = z.infer<typeof CreatePlaybookSchema>;

// For updating playbooks
export const UpdatePlaybookSchema = PlaybookSchema.partial().omit({
  id: true,
  useCase: true,
  createdAt: true,
});

export type UpdatePlaybook = z.infer<typeof UpdatePlaybookSchema>;

// ============================================
// Default Hebrew Playbook
// ============================================

export const DEFAULT_PLAYBOOK_HE: Omit<Playbook, 'id' | 'createdAt' | 'updatedAt'> = {
  useCase: 'OUTBOUND_SALES_HE',
  name: 'Kol Outbound Sales (Hebrew)',
  language: 'he-IL',
  companyName: 'Kol',
  productDescription: 'פתרונות AI לשיחות מכירה',
};

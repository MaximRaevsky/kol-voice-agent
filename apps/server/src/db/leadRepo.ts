import { readJson, writeJson } from './jsonStore.js';
import type { Lead } from '@kol/shared';

const FILENAME = 'leads.json';

export const leadRepo = {
  list(): Lead[] {
    return readJson<Lead[]>(FILENAME, []);
  },

  getById(id: string): Lead | undefined {
    const leads = this.list();
    return leads.find((lead) => lead.id === id);
  },

  create(lead: Lead): Lead {
    const leads = this.list();
    leads.push(lead);
    writeJson(FILENAME, leads);
    return lead;
  },

  update(id: string, updates: Partial<Lead>): Lead | undefined {
    const leads = this.list();
    const index = leads.findIndex((lead) => lead.id === id);
    if (index === -1) return undefined;

    leads[index] = { ...leads[index], ...updates, updatedAt: Date.now() };
    writeJson(FILENAME, leads);
    return leads[index];
  },

  updateStatus(id: string, status: Lead['status']): Lead | undefined {
    return this.update(id, { status });
  },

  updateLastContact(id: string): Lead | undefined {
    return this.update(id, { lastContactAt: Date.now() });
  },

  deleteAll(): void {
    writeJson(FILENAME, []);
  },

  seed(leads: Lead[]): void {
    writeJson(FILENAME, leads);
  },
};


import { readJson, writeJson } from './jsonStore.js';
import type { CalendarSlot } from '@kol/shared';

const FILENAME = 'slots.json';

export const slotRepo = {
  list(): CalendarSlot[] {
    return readJson<CalendarSlot[]>(FILENAME, []);
  },

  listAvailable(): CalendarSlot[] {
    const slots = this.list();
    const now = Date.now();
    return slots.filter(
      (slot) => slot.status === 'AVAILABLE' && slot.startTime > now
    );
  },

  getById(id: string): CalendarSlot | undefined {
    const slots = this.list();
    return slots.find((slot) => slot.id === id);
  },

  book(slotId: string, leadId: string, activityId?: string): CalendarSlot | undefined {
    const slots = this.list();
    const index = slots.findIndex((slot) => slot.id === slotId);
    if (index === -1) return undefined;

    const slot = slots[index];
    if (slot.status !== 'AVAILABLE') return undefined;

    slots[index] = {
      ...slot,
      status: 'BOOKED',
      leadId,
      activityId,
      updatedAt: Date.now(),
    };
    writeJson(FILENAME, slots);
    return slots[index];
  },

  create(slot: CalendarSlot): CalendarSlot {
    const slots = this.list();
    slots.push(slot);
    writeJson(FILENAME, slots);
    return slot;
  },

  deleteAll(): void {
    writeJson(FILENAME, []);
  },

  seed(slots: CalendarSlot[]): void {
    writeJson(FILENAME, slots);
  },
};


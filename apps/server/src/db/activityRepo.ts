import { readJson, writeJson } from './jsonStore.js';
import type { CrmActivity, CallOutcome } from '@kol/shared';
import { randomUUID } from 'crypto';

const FILENAME = 'activities.json';

export const activityRepo = {
  list(): CrmActivity[] {
    return readJson<CrmActivity[]>(FILENAME, []);
  },

  listByLead(leadId: string): CrmActivity[] {
    const activities = this.list();
    return activities.filter((a) => a.leadId === leadId);
  },

  getById(id: string): CrmActivity | undefined {
    const activities = this.list();
    return activities.find((a) => a.id === id);
  },

  create(activity: Omit<CrmActivity, 'id' | 'createdAt'>): CrmActivity {
    const activities = this.list();
    const newActivity: CrmActivity = {
      ...activity,
      id: randomUUID(),
      createdAt: Date.now(),
    };
    activities.push(newActivity);
    writeJson(FILENAME, activities);
    return newActivity;
  },

  countByOutcome(): Record<string, number> {
    const activities = this.list();
    const counts: Record<string, number> = {};
    for (const activity of activities) {
      counts[activity.outcome] = (counts[activity.outcome] || 0) + 1;
    }
    return counts;
  },

  getAverageDuration(): number {
    const activities = this.list();
    if (activities.length === 0) return 0;
    const total = activities.reduce((sum, a) => sum + a.duration, 0);
    return Math.round(total / activities.length);
  },

  countToday(): number {
    const activities = this.list();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return activities.filter((a) => a.createdAt >= todayStart.getTime()).length;
  },

  countTodayMeetings(): number {
    const activities = this.list();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return activities.filter(
      (a) => a.createdAt >= todayStart.getTime() && a.outcome === 'MEETING_BOOKED'
    ).length;
  },

  deleteAll(): void {
    writeJson(FILENAME, []);
  },

  seed(activities: CrmActivity[]): void {
    writeJson(FILENAME, activities);
  },
};


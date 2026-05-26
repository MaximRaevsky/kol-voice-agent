import { Router, type Request, type Response } from 'express';
import { UseCaseSchema, UpdatePlaybookSchema } from '@kol/shared';
import { leadRepo, slotRepo, activityRepo, playbookRepo } from '../db/index.js';

export const apiRouter = Router();

// ============================================
// Health Check
// ============================================

apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    features: {
      browserSpeech: true,
      httpTransport: true,
      jsonStorage: true,
    },
  });
});

// ============================================
// Leads
// ============================================

apiRouter.get('/leads', (_req: Request, res: Response) => {
  const leads = leadRepo.list();
  res.json({ leads });
});

apiRouter.get('/leads/:id', (req: Request, res: Response) => {
  const lead = leadRepo.getById(req.params.id);
  if (!lead) {
    res.status(404).json({ error: 'Lead not found' });
    return;
  }
  res.json({ lead });
});

// ============================================
// Playbook
// ============================================

apiRouter.get('/playbook', (req: Request, res: Response) => {
  const useCaseParam = req.query.useCase as string || 'OUTBOUND_SALES_HE';
  
  const parsed = UseCaseSchema.safeParse(useCaseParam);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid useCase', details: parsed.error });
    return;
  }

  const playbook = playbookRepo.get(parsed.data);
  if (!playbook) {
    res.status(404).json({ error: 'Playbook not found for use case' });
    return;
  }

  res.json({ useCase: parsed.data, playbook });
});

apiRouter.post('/playbook', (req: Request, res: Response) => {
  const { useCase, playbook: updates } = req.body;

  const parsedUseCase = UseCaseSchema.safeParse(useCase);
  if (!parsedUseCase.success) {
    res.status(400).json({ error: 'Invalid useCase' });
    return;
  }

  const parsedUpdates = UpdatePlaybookSchema.safeParse(updates);
  if (!parsedUpdates.success) {
    res.status(400).json({ error: 'Invalid playbook data', details: parsedUpdates.error });
    return;
  }

  const updated = playbookRepo.update(parsedUseCase.data, parsedUpdates.data);
  if (!updated) {
    res.status(404).json({ error: 'Playbook not found' });
    return;
  }

  res.json({ success: true, playbook: updated });
});

// ============================================
// Slots
// ============================================

apiRouter.get('/slots', (_req: Request, res: Response) => {
  // Return ALL slots (including booked) for calendar view
  const slots = slotRepo.list();
  
  // Format for display with status
  const formatted = slots.map((slot) => {
    const start = new Date(slot.startTime);
    const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    const dayOfWeek = days[start.getDay()];
    const time = start.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    const date = start.toLocaleDateString('he-IL');

    return {
      id: slot.id,
      startTime: slot.startTime,
      endTime: slot.endTime,
      status: slot.status,         // Include status!
      leadId: slot.leadId,         // Include leadId for booked slots
      displayText: `יום ${dayOfWeek}, ${time}`,
      dayOfWeek,
      time,
      date,
    };
  });

  res.json({ slots: formatted });
});

// ============================================
// Activities
// ============================================

apiRouter.get('/activities', (_req: Request, res: Response) => {
  const activities = activityRepo.list();
  res.json({ activities });
});

apiRouter.get('/activities/lead/:leadId', (req: Request, res: Response) => {
  const activities = activityRepo.listByLead(req.params.leadId);
  res.json({ activities });
});

// ============================================
// Metrics
// ============================================

apiRouter.get('/metrics', (_req: Request, res: Response) => {
  const byOutcome = activityRepo.countByOutcome();
  const totalCalls = Object.values(byOutcome).reduce((sum, count) => sum + count, 0);
  const meetingsBooked = byOutcome['MEETING_BOOKED'] || 0;
  const conversionRate = totalCalls > 0 ? meetingsBooked / totalCalls : 0;
  const avgDuration = activityRepo.getAverageDuration();
  const todayCalls = activityRepo.countToday();
  const todayMeetings = activityRepo.countTodayMeetings();

  res.json({
    totals: {
      totalCalls,
      meetingsBooked,
      conversionRate,
      avgDuration,
      todayCalls,
      todayMeetings,
    },
    byOutcome,
  });
});

// ============================================
// Use Cases
// ============================================

apiRouter.get('/use-cases', (_req: Request, res: Response) => {
  res.json({
    useCases: [
      { id: 'OUTBOUND_SALES_HE', name: 'Outbound Sales', description: 'Hebrew outbound sales calls' },
    ],
  });
});


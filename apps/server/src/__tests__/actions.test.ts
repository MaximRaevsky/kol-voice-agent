/**
 * Deterministic Action Tests
 * 
 * Tests for booking logic and CRM activity creation.
 * These test the deterministic parts of the system, not AI responses.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { randomUUID } from 'crypto';
import type { Lead, CalendarSlot, Playbook, CrmActivity } from '@kol/shared';

// Import repos
import { leadRepo } from '../db/leadRepo.js';
import { slotRepo } from '../db/slotRepo.js';
import { activityRepo } from '../db/activityRepo.js';

// Test data
const createTestLead = (): Lead => ({
  id: randomUUID(),
  name: 'Test Lead',
  phone: '+972-50-1234567',
  company: 'Test Company',
  title: 'Manager',
  status: 'NEW',
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

const createTestSlot = (status: CalendarSlot['status'] = 'AVAILABLE'): CalendarSlot => ({
  id: `slot_${randomUUID().slice(0, 8)}`,
  startTime: Date.now() + 24 * 60 * 60 * 1000, // Tomorrow
  endTime: Date.now() + 24 * 60 * 60 * 1000 + 30 * 60 * 1000, // +30 min
  status,
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

describe('Slot Booking', () => {
  let testLead: Lead;
  let testSlot: CalendarSlot;

  beforeEach(() => {
    testLead = createTestLead();
    testSlot = createTestSlot();
    
    // Seed test data
    leadRepo.create(testLead);
    slotRepo.create(testSlot);
  });

  afterEach(() => {
    // Clean up - remove test data
    const leads = leadRepo.list();
    const testLeads = leads.filter(l => l.id === testLead.id);
    for (const lead of testLeads) {
      leadRepo.update(lead.id, { status: 'DO_NOT_CALL' }); // Mark for cleanup
    }
  });

  it('should book an available slot successfully', () => {
    const result = slotRepo.book(testSlot.id, testLead.id);
    
    expect(result).toBeDefined();
    expect(result?.status).toBe('BOOKED');
    expect(result?.leadId).toBe(testLead.id);
  });

  it('should not book an already booked slot', () => {
    // First booking
    slotRepo.book(testSlot.id, testLead.id);
    
    // Second booking attempt with different lead
    const anotherLead = createTestLead();
    leadRepo.create(anotherLead);
    
    const result = slotRepo.book(testSlot.id, anotherLead.id);
    
    expect(result).toBeUndefined();
  });

  it('should not book with invalid slot ID', () => {
    const result = slotRepo.book('invalid-slot-id', testLead.id);
    
    expect(result).toBeUndefined();
  });

  it('should update lead status to MEETING_SCHEDULED after booking', () => {
    // Book the slot
    slotRepo.book(testSlot.id, testLead.id);
    
    // Update lead status (this is what agentService does)
    leadRepo.updateStatus(testLead.id, 'MEETING_SCHEDULED');
    
    const updatedLead = leadRepo.getById(testLead.id);
    expect(updatedLead?.status).toBe('MEETING_SCHEDULED');
  });
});

describe('CRM Activity Creation', () => {
  let testLead: Lead;

  beforeEach(() => {
    testLead = createTestLead();
    leadRepo.create(testLead);
  });

  it('should create activity for MEETING_BOOKED outcome', () => {
    const activity = activityRepo.create({
      leadId: testLead.id,
      sessionId: randomUUID(),
      type: 'OUTBOUND_CALL',
      outcome: 'MEETING_BOOKED',
      summary: 'Meeting scheduled successfully',
      duration: 180,
    });

    expect(activity.id).toBeDefined();
    expect(activity.outcome).toBe('MEETING_BOOKED');
    expect(activity.type).toBe('OUTBOUND_CALL');
  });

  it('should create activity for CALLBACK_REQUESTED outcome', () => {
    const activity = activityRepo.create({
      leadId: testLead.id,
      sessionId: randomUUID(),
      type: 'OUTBOUND_CALL',
      outcome: 'CALLBACK_REQUESTED',
      summary: 'Customer requested callback tomorrow',
      duration: 45,
    });

    expect(activity.id).toBeDefined();
    expect(activity.outcome).toBe('CALLBACK_REQUESTED');
  });

  it('should create activity for NOT_INTERESTED outcome', () => {
    const activity = activityRepo.create({
      leadId: testLead.id,
      sessionId: randomUUID(),
      type: 'OUTBOUND_CALL',
      outcome: 'NOT_INTERESTED',
      summary: 'Customer not interested',
      duration: 30,
    });

    expect(activity.id).toBeDefined();
    expect(activity.outcome).toBe('NOT_INTERESTED');
  });

  it('should include transcript in activity notes', () => {
    const transcript = 'agent: שלום!\ncustomer: היי\nagent: יש לך דקה?';
    
    const activity = activityRepo.create({
      leadId: testLead.id,
      sessionId: randomUUID(),
      type: 'OUTBOUND_CALL',
      outcome: 'NOT_INTERESTED',
      summary: 'Test call',
      duration: 60,
      transcript,
    });

    expect(activity.transcript).toBe(transcript);
  });

  it('should list activities by lead', () => {
    const sessionId = randomUUID();
    
    activityRepo.create({
      leadId: testLead.id,
      sessionId,
      type: 'OUTBOUND_CALL',
      outcome: 'CALLBACK_REQUESTED',
      summary: 'First call',
      duration: 30,
    });

    const activities = activityRepo.listByLead(testLead.id);
    expect(activities.length).toBeGreaterThanOrEqual(1);
    expect(activities.some(a => a.leadId === testLead.id)).toBe(true);
  });
});

describe('Booking Flow Integration', () => {
  let testLead: Lead;
  let testSlots: CalendarSlot[];

  beforeEach(() => {
    testLead = createTestLead();
    leadRepo.create(testLead);
    
    // Create multiple test slots
    testSlots = [
      createTestSlot(),
      createTestSlot(),
      createTestSlot(),
    ];
    
    for (const slot of testSlots) {
      slotRepo.create(slot);
    }
  });

  it('should complete full booking flow: book slot + update lead + create activity', () => {
    const selectedSlot = testSlots[1];
    const sessionId = randomUUID();

    // 1. Book the slot
    const bookedSlot = slotRepo.book(selectedSlot.id, testLead.id);
    expect(bookedSlot?.status).toBe('BOOKED');

    // 2. Update lead status
    leadRepo.updateStatus(testLead.id, 'MEETING_SCHEDULED');
    const updatedLead = leadRepo.getById(testLead.id);
    expect(updatedLead?.status).toBe('MEETING_SCHEDULED');

    // 3. Create CRM activity
    const activity = activityRepo.create({
      leadId: testLead.id,
      sessionId,
      type: 'OUTBOUND_CALL',
      outcome: 'MEETING_BOOKED',
      summary: 'נקבעה פגישה',
      duration: 180,
    });
    expect(activity.outcome).toBe('MEETING_BOOKED');
  });

  it('should NOT book when slot index is out of bounds', () => {
    // Simulate an invalid slot index (like -1 or out of range)
    const invalidSlotId = 'slot_nonexistent';
    
    const result = slotRepo.book(invalidSlotId, testLead.id);
    expect(result).toBeUndefined();
  });

  it('should handle CALLBACK_REQUESTED without booking', () => {
    const sessionId = randomUUID();

    // For callback, we only create activity, no slot booking
    const activity = activityRepo.create({
      leadId: testLead.id,
      sessionId,
      type: 'OUTBOUND_CALL',
      outcome: 'CALLBACK_REQUESTED',
      summary: 'ביקש לחזור מחר',
      duration: 45,
    });

    expect(activity.outcome).toBe('CALLBACK_REQUESTED');
    
    // Lead status should NOT be MEETING_SCHEDULED
    const lead = leadRepo.getById(testLead.id);
    expect(lead?.status).not.toBe('MEETING_SCHEDULED');
  });

  it('should handle NOT_INTERESTED without booking', () => {
    const sessionId = randomUUID();

    // For not interested, we only create activity, no slot booking
    const activity = activityRepo.create({
      leadId: testLead.id,
      sessionId,
      type: 'OUTBOUND_CALL',
      outcome: 'NOT_INTERESTED',
      summary: 'לא מעוניין',
      duration: 30,
    });

    expect(activity.outcome).toBe('NOT_INTERESTED');
    
    // Lead status should NOT be MEETING_SCHEDULED
    const lead = leadRepo.getById(testLead.id);
    expect(lead?.status).not.toBe('MEETING_SCHEDULED');
  });
});

describe('Lead Status Updates', () => {
  let testLead: Lead;

  beforeEach(() => {
    testLead = createTestLead();
    leadRepo.create(testLead);
  });

  it('should update lastContactAt', () => {
    const before = testLead.lastContactAt;
    
    leadRepo.updateLastContact(testLead.id);
    
    const updated = leadRepo.getById(testLead.id);
    expect(updated?.lastContactAt).toBeDefined();
    expect(updated?.lastContactAt).toBeGreaterThan(before || 0);
  });

  it('should update status correctly', () => {
    leadRepo.updateStatus(testLead.id, 'CONTACTED');
    expect(leadRepo.getById(testLead.id)?.status).toBe('CONTACTED');
    
    leadRepo.updateStatus(testLead.id, 'QUALIFIED');
    expect(leadRepo.getById(testLead.id)?.status).toBe('QUALIFIED');
    
    leadRepo.updateStatus(testLead.id, 'MEETING_SCHEDULED');
    expect(leadRepo.getById(testLead.id)?.status).toBe('MEETING_SCHEDULED');
  });
});

/**
 * Seed script for demo data
 * Run with: npm run seed
 */

import { randomUUID } from 'crypto';
import type { Lead, CalendarSlot, Playbook, CrmActivity } from '@kol/shared';
import { DEFAULT_PLAYBOOK_HE } from '@kol/shared';
import { leadRepo } from './leadRepo.js';
import { slotRepo } from './slotRepo.js';
import { activityRepo } from './activityRepo.js';
import { playbookRepo } from './playbookRepo.js';

// ============================================
// Hebrew Leads (7 realistic)
// ============================================

// Pre-generate IDs so we can reference them for bookings
const LEAD_IDS = {
  david: randomUUID(),
  sara: randomUUID(),
  yossi: randomUUID(),
  michal: randomUUID(),
  avi: randomUUID(),
  rachel: randomUUID(),
  amit: randomUUID(),
};

const LEADS: Lead[] = [
  {
    id: LEAD_IDS.david,
    name: 'דוד כהן',
    phone: '+972-52-1234567',
    company: 'טכנולוגיות אינוביט',
    title: 'מנהל מכירות',
    email: 'david@innovit.co.il',
    status: 'NEW',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: LEAD_IDS.sara,
    name: 'שרה לוי',
    phone: '+972-54-7654321',
    company: 'פתרונות ענן בע״מ',
    title: 'סמנכ״לית שיווק',
    email: 'sara@cloudsol.co.il',
    status: 'MEETING_SCHEDULED', // Has a meeting booked!
    lastContactAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
    notes: 'נקבעה פגישה להדגמת המוצר',
    createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
  },
  {
    id: LEAD_IDS.yossi,
    name: 'יוסי אברהם',
    phone: '+972-50-9876543',
    company: 'סטארט-אפ נייט',
    title: 'מייסד ומנכ״ל',
    email: 'yossi@startupnight.io',
    status: 'CONTACTED',
    lastContactAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    notes: 'ביקש לחזור ביום שני',
    createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
  },
  {
    id: LEAD_IDS.michal,
    name: 'מיכל רוזנברג',
    phone: '+972-58-1112233',
    company: 'דיגיטל מדיה',
    title: 'מנהלת פיתוח עסקי',
    email: 'michal@digitalmedia.co.il',
    status: 'NEW',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: LEAD_IDS.avi,
    name: 'אבי גולדשטיין',
    phone: '+972-52-4445566',
    company: 'פייננס פלוס',
    title: 'סמנכ״ל תפעול',
    email: 'avi@financeplus.co.il',
    status: 'MEETING_SCHEDULED', // Has a meeting booked!
    lastContactAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
    notes: 'מאוד מעוניין, נקבעה פגישה',
    createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
  },
  {
    id: LEAD_IDS.rachel,
    name: 'רחל בן-דוד',
    phone: '+972-54-7778899',
    company: 'טק סולושנס',
    title: 'מנהלת מוצר',
    email: 'rachel@techsolutions.co.il',
    status: 'NEW',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: LEAD_IDS.amit,
    name: 'עמית שרון',
    phone: '+972-50-3334455',
    company: 'גלובל סייבר',
    title: 'VP Sales',
    email: 'amit@globalcyber.io',
    status: 'QUALIFIED',
    lastContactAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
    notes: 'מעוניין לשמוע עוד',
    createdAt: Date.now() - 4 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
  },
];

// ============================================
// Generate Slots (with 2 pre-booked)
// ============================================

function generateSlots(): CalendarSlot[] {
  const slots: CalendarSlot[] = [];
  const now = new Date();
  
  // Start from tomorrow
  now.setDate(now.getDate() + 1);
  now.setHours(9, 0, 0, 0);

  // Full hour slots only (9:00 - 17:00)
  const slotTimes = [
    { hour: 9, minute: 0 },
    { hour: 10, minute: 0 },
    { hour: 11, minute: 0 },
    { hour: 12, minute: 0 },
    { hour: 13, minute: 0 },
    { hour: 14, minute: 0 },
    { hour: 15, minute: 0 },
    { hour: 16, minute: 0 },
    { hour: 17, minute: 0 },
  ];

  let slotIndex = 0;
  
  // Generate for 14 days (2 weeks)
  for (let day = 0; day < 14; day++) {
    const date = new Date(now);
    date.setDate(date.getDate() + day);

    // Skip weekends (Saturday=6, in Israel Sunday is work day, Friday afternoon off)
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 6) continue; // Skip Saturday

    for (const time of slotTimes) {
      // Skip Friday afternoon slots (after 13:00)
      if (dayOfWeek === 5 && time.hour >= 13) continue;

      const startTime = new Date(date);
      startTime.setHours(time.hour, time.minute, 0, 0);

      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + 30);

      const slotId = `slot_${randomUUID().slice(0, 8)}`;
      
      // Book slots for שרה לוי (slot 1 - tomorrow 10:00) and אבי גולדשטיין (slot 6 - tomorrow 14:00)
      let status: CalendarSlot['status'] = 'AVAILABLE';
      let leadId: string | undefined;
      
      if (slotIndex === 1) {
        // Tomorrow 10:00 - booked for שרה לוי
        status = 'BOOKED';
        leadId = LEAD_IDS.sara;
      } else if (slotIndex === 6) {
        // Tomorrow 14:00 - booked for אבי גולדשטיין
        status = 'BOOKED';
        leadId = LEAD_IDS.avi;
      }

      slots.push({
        id: slotId,
        startTime: startTime.getTime(),
        endTime: endTime.getTime(),
        status,
        leadId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      
      slotIndex++;
    }
  }

  return slots;
}

// ============================================
// Generate Activities for booked meetings
// ============================================

function generateActivities(): CrmActivity[] {
  const now = Date.now();
  return [
    {
      id: randomUUID(),
      leadId: LEAD_IDS.sara,
      sessionId: randomUUID(),
      type: 'OUTBOUND_CALL',
      outcome: 'MEETING_BOOKED',
      summary: 'נקבעה פגישה',
      notes: 'הלקוחה הביעה עניין רב בפתרון. נקבעה פגישה להדגמה.',
      duration: 180,
      createdAt: now - 1 * 24 * 60 * 60 * 1000,
    },
    {
      id: randomUUID(),
      leadId: LEAD_IDS.avi,
      sessionId: randomUUID(),
      type: 'OUTBOUND_CALL',
      outcome: 'MEETING_BOOKED',
      summary: 'נקבעה פגישה',
      notes: 'שיחה מצוינת! אבי רוצה לראות הדגמה מלאה של המוצר.',
      duration: 210,
      createdAt: now - 1 * 24 * 60 * 60 * 1000,
    },
    {
      id: randomUUID(),
      leadId: LEAD_IDS.yossi,
      sessionId: randomUUID(),
      type: 'OUTBOUND_CALL',
      outcome: 'CALLBACK_REQUESTED',
      summary: 'ביקש לחזור',
      notes: 'עסוק כרגע, ביקש לחזור אליו ביום שני.',
      duration: 45,
      createdAt: now - 2 * 24 * 60 * 60 * 1000,
    },
  ];
}

// ============================================
// Default Playbook
// ============================================

function createDefaultPlaybook(): Playbook {
  return {
    ...DEFAULT_PLAYBOOK_HE,
    id: randomUUID(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

// ============================================
// Seed Function
// ============================================

export async function seed() {
  console.log('🌱 Seeding demo data...\n');

  // Clear existing data
  leadRepo.deleteAll();
  slotRepo.deleteAll();
  activityRepo.deleteAll();
  playbookRepo.deleteAll();

  // Seed leads
  leadRepo.seed(LEADS);
  console.log(`✅ Created ${LEADS.length} Hebrew leads:`);
  for (const lead of LEADS) {
    const status = lead.status === 'MEETING_SCHEDULED' ? '📅' : 
                   lead.status === 'CONTACTED' ? '📞' :
                   lead.status === 'QUALIFIED' ? '⭐' : '🆕';
    console.log(`   ${status} ${lead.name} (${lead.company}) - ${lead.status}`);
  }

  // Seed slots
  const slots = generateSlots();
  slotRepo.seed(slots);
  const bookedCount = slots.filter(s => s.status === 'BOOKED').length;
  const availableCount = slots.filter(s => s.status === 'AVAILABLE').length;
  console.log(`\n✅ Created ${slots.length} meeting slots:`);
  console.log(`   📅 ${bookedCount} booked`);
  console.log(`   ✅ ${availableCount} available`);

  // Seed activities
  const activities = generateActivities();
  for (const activity of activities) {
    activityRepo.create(activity);
  }
  console.log(`\n✅ Created ${activities.length} CRM activities`);

  // Seed playbook
  const playbook = createDefaultPlaybook();
  playbookRepo.seed([playbook]);
  console.log(`\n✅ Created default playbook: "${playbook.name}"`);

  console.log('\n📁 Data saved to apps/server/db/');
  console.log('\n🚀 Ready to run: npm run dev\n');
}

// Run if called directly
seed().catch(console.error);

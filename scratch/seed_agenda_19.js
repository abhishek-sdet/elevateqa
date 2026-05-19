import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wbgxcadajmdjxfhsgose.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiZ3hjYWRham1kanhmaHNnb3NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTk0ODQsImV4cCI6MjA5NDE3NTQ4NH0.ZgzyLpYWVcw-cUCmup81lw5nE70K5-m5BZ7TClefWr4';

const supabase = createClient(supabaseUrl, supabaseKey);

const AGENDA_ITEMS = [
  {
    time_slot: '09:00 – 09:30',
    title: 'Registration',
    tag: 'Opens',
    desc: 'Pick up your badge, collect your welcome kit. Find your tribe before the day begins.'
  },
  {
    time_slot: '09:35 – 09:55',
    title: 'Welcome & Opening Remarks',
    tag: 'Opening',
    desc: 'MC sets the stage. What today is about and what to expect from the next 8 hours.'
  },
  {
    time_slot: '10:00 – 10:20',
    title: 'Keynote Speaker 1',
    tag: 'Keynote',
    desc: 'The proof of value: what AI in QE has actually delivered. Real metrics, no hype.'
  },
  {
    time_slot: '10:25 – 10:45',
    title: 'Presenter 1',
    tag: 'Talk',
    desc: 'Practitioner deep-dive into AI-augmented test engineering.'
  },
  {
    time_slot: '10:50 – 11:10',
    title: 'Presenter 2',
    tag: 'Talk',
    desc: 'Hands-on session on self-healing automation and intelligent quality pipelines.'
  },
  {
    time_slot: '11:15 – 11:25',
    title: 'Tea Break',
    tag: 'Break',
    desc: 'Quick reset and networking in the lounge.'
  },
  {
    time_slot: '11:30 – 11:55',
    title: 'Panel Discussion',
    tag: 'Panel',
    desc: 'Four practitioners go on record about the uncomfortable truth of AI ROI.'
  },
  {
    time_slot: '12:00 – 12:20',
    title: 'Presenter 3',
    tag: 'Talk',
    desc: 'Case study: Scaling AI-led QE in a legacy environment.'
  },
  {
    time_slot: '12:25 – 12:45',
    title: 'Presenter 4',
    tag: 'Talk',
    desc: 'Beyond the hype: Technical architecture of AI testing agents.'
  },
  {
    time_slot: '12:50 – 01:50',
    title: 'Lunch Break',
    tag: 'Break',
    desc: 'Curated tables by topic. Connect with your peers.'
  },
  {
    time_slot: '02:00 – 02:20',
    title: 'Keynote Speaker 2',
    tag: 'Keynote',
    desc: 'Beyond Test Automation — AI as Your Quality Intelligence Layer.'
  },
  {
    time_slot: '02:25 – 02:45',
    title: 'Presenter 5',
    tag: 'Talk',
    desc: 'Practitioner session on intelligent triage and risk-based testing.'
  },
  {
    time_slot: '02:50 – 03:10',
    title: 'Presenter 6',
    tag: 'Talk',
    desc: 'LLM-powered test design: From requirements to execution.'
  },
  {
    time_slot: '03:15 – 03:35',
    title: 'Presenter 7',
    tag: 'Talk',
    desc: 'The role of the tester in an AI-first world: A career roadmap.'
  },
  {
    time_slot: '03:40 – 03:55',
    title: 'Tea Break',
    tag: 'Break',
    desc: 'Afternoon recharge before the closing sessions.'
  },
  {
    time_slot: '04:00 – 04:20',
    title: 'Presenter 8 / Keynote Speaker 3',
    tag: 'Keynote',
    desc: 'Strategic Address on AI-Led Quality Engineering Leadership by Sachin Sir.'
  },
  {
    time_slot: '04:25 – 04:45',
    title: 'Presenter 9',
    tag: 'Talk',
    desc: 'Final practitioner track: AI in mobile and cross-platform testing.'
  },
  {
    time_slot: '04:50 – 05:10',
    title: 'Presenter 10',
    tag: 'Talk',
    desc: 'The roadmap to 2028: What’s actually next for QE.'
  },
  {
    time_slot: '05:15 – 05:30',
    title: 'Awards & Closing Remarks',
    tag: 'Closing',
    desc: 'Lucky Draw Game, Trophies & Certificates.'
  }
];

async function seed() {
  console.log('1. Deleting all existing agenda items...');
  const { error: delError } = await supabase.from('agenda').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (delError) {
    console.error('Delete failed:', delError);
    return;
  }
  console.log('Delete successful.');

  console.log('2. Inserting 19 agenda items with standard categories...');
  const rowsToInsert = AGENDA_ITEMS.map((item, index) => {
    return {
      time_slot: item.time_slot,
      title: `${item.title}||${item.tag}||${item.desc}`,
      display_order: index,
      speaker_name: null // Standard tags are stored in title||tag||desc, speaker_name is blank or set to a value if needed.
    };
  });

  const { data, error } = await supabase.from('agenda').insert(rowsToInsert).select();
  if (error) {
    console.error('Insertion failed:', error);
  } else {
    console.log(`Insertion successful! Inserted ${data.length} items.`);
  }
}

seed();

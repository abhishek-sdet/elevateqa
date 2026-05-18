import { supabase } from '../website/src/scripts/supabase-config.js';

const CORRECT_AGENDA = [
  { time_slot: '09:00', tag: 'Opens',          title: 'Registration & morning <em>coffee</em>',        description: 'Pick up your badge, meet the early arrivals, find your tribe before the day begins.', display_order: 0 },
  { time_slot: '10:00', tag: 'Opening Keynote',title: '<em>The proof of value:</em> what AI in QE has actually delivered', description: 'A grounded look at where AI has paid off in quality engineering — and where the receipts are still missing.', display_order: 1 },
  { time_slot: '11:00', tag: 'Track Sessions', title: 'Parallel deep-dives <em>across two stages</em>', description: 'Self-healing automation, AI-driven test generation, intelligent triage, risk-based prioritization. Engineers showing real implementations.', display_order: 2 },
  { time_slot: '13:00', tag: 'Break',          title: 'Lunch & <em>networking</em>',                   description: 'Curated tables by topic — sit with people working on the problems you\'re working on.', display_order: 3 },
  { time_slot: '14:30', tag: 'Keynote Panel',  title: 'The candid panel: <em>hype vs. reality</em>',   description: 'Practitioners and leaders go on record about what\'s overhyped, what\'s underrated, and where the field goes next.', display_order: 4 },
  { time_slot: '15:30', tag: 'Workshops',      title: 'Hands-on <em>working sessions</em>',             description: 'Bring a laptop. Leave with code, frameworks, and concrete starting points for your own AI-led QE program.', display_order: 5 },
  { time_slot: '17:30', tag: 'Awards',         title: 'Speaker of the Event <em>& recognition</em>',   description: 'The day\'s best voice gets headline prizes. Audience awards, surprises, applause that means something.', display_order: 6 },
  { time_slot: '18:30', tag: 'Reception',      title: 'Closing reception & <em>after hours</em>',      description: 'Drinks, conversations, and the connections that outlast the agenda.', display_order: 7 }
];

async function fixAgenda() {
  console.log('Clearing corrupted agenda from Supabase...');
  const { error: delError } = await supabase.from('agenda').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (delError) {
    console.error('Failed to clear agenda:', delError);
    return;
  }
  
  console.log('Inserting correct 8-item agenda...');
  const { error: insError } = await supabase.from('agenda').insert(CORRECT_AGENDA);
  if (insError) {
    console.error('Failed to insert correct agenda:', insError);
  } else {
    console.log('Agenda fixed successfully! The live site will now sync the clean agenda.');
  }
}

fixAgenda();

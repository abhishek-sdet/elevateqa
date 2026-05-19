import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wbgxcadajmdjxfhsgose.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiZ3hjYWRham1kanhmaHNnb3NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTk0ODQsImV4cCI6MjA5NDE3NTQ4NH0.ZgzyLpYWVcw-cUCmup81lw5nE70K5-m5BZ7TClefWr4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function seedData() {
  console.log('Starting data seed from elevate-qa original.html...');

  // 1. Branding Table
  const brandingData = {
    id: '00000000-0000-0000-0000-000000000001',
    primary_color: '#d4ff3a',
    accent_color: '#ff5a36',
    logo_url: ''
  };
  const { error: bErr } = await supabase.from('branding').upsert(brandingData);
  if (bErr) console.error('Branding error:', bErr);
  else console.log('✅ Branding seeded.');

  // 1b. Site Content Table
  const siteContentData = {
    id: 1,
    hero_headline: 'Elevate Quality. Prove value.',
    hero_tagline: "The first grand symposium for quality engineering in the age of AI — a one-day reckoning with what's real, what's hype, and what actually moves the needle.",
    hero_eyebrow: 'AI LED QUALITY ENGINEERING TECH SUMMIT · BY SDET TECH',
    hero_edition: 'EDITION 02',
    event_date: '8th August 2026',
    event_venue: 'Delhi NCR, India',
    hero_format: 'One day, two stages',
    hero_audience: '200–500 QE leaders',
    hero_meta: JSON.stringify({
      heroMetaText: 'A SYMPOSIUM BY SDET TECHNOLOGIES / NOIDA, INDIA',
      heroCtaText: 'Get your ticket →',
      stat1Num: '2nd', stat1Lbl: 'Edition / Aug 2026',
      stat2Num: '500+', stat2Lbl: 'QE Practitioners',
      stat3Num: '8+', stat3Lbl: 'Hours of Signal',
      stat4Num: '1', stat4Lbl: 'Theme. Proof of Value.',
      ticker1: 'Elevate QA 2026',
      ticker2: '[[AI-Led]] Quality Engineering',
      ticker3: 'AI Led Quality Engineering Tech Summit',
      ticker4: 'Attend the AI-Led QE Summit',
      ticker5: '8th August 2026 — Noida',
      ticker6: 'Speaker Submissions Open',
      ticker7: '200–500 Attendees — Edition 02',
      ticker8: 'Contact: elevateqa@sdettech.com',
      ticker9: 'CFP Now Open',
      navManifesto: 'Manifesto',
      navMaturity: 'Why Now',
      navExperience: 'Experience',
      navAgenda: 'Agenda',
      navSpeakers: 'Speakers',
      navJoin: 'Participate',
      manifestoSectionNum: '01 / MANIFESTO',
      manifestoPill: 'Why now',
      manifestoAside: 'A note from the founder.',
      mapSectionNum: '02 / THE MAP',
      maturityTitle: 'Where is your team on the [[AI-led QE]] curve?',
      experienceSectionNum: '03 / THE EXPERIENCE',
      pillarsTitle: 'A day built around [[signal,]] not noise.',
      agendaSectionNum: '04 / AGENDA',
      agendaSectionTitle: 'One day. No filler.',
      speakersSectionNum: '05 / SPEAKERS',
      speakersSectionTitle: 'The people on stage have shipped it.',
      speakersIntro: 'Every speaker is a practitioner first.',
      prizesHeadline: 'Speak well. Win big.',
      prizesS1Num: '01', prizesS1Lbl: 'Speaker of the Event',
      prizesS2Num: '03', prizesS2Lbl: 'Audience Awards',
      prizesS3Num: '∞',  prizesS3Lbl: 'Surprise Prizes',
      involveSectionNum: '07 / GET INVOLVED',
      involveTitle: 'How to participate.',
      involveCard1Title: 'Attend',
      involveCard1Desc: 'Secure your seat at the most signal-dense QE summit of 2026. Free for qualified practitioners.',
      involveCard1Link: '#register', involveCard1LinkText: 'Get your ticket →',
      involveCard2Title: 'Speak',
      involveCard2Desc: 'Submit a proposal. We select practitioners who show their work — no keynote decks, no vendor pitches.',
      involveCard2LinkText: 'Submit a proposal →',
      involveCard3Title: 'Sponsor',
      involveCard3Desc: 'Put your brand in front of 500 quality engineering leaders. Custom packages available.',
      involveCard3LinkText: 'Partner with us →',
      footerTagline: 'AI-Led Quality Engineering. One day. No noise.',
      footerLocation: 'Noida, Delhi NCR, India',
      footerEdition: 'Elevate QA — Edition 02',
      footerCopyright: '© 2026 SDET Technologies. All rights reserved.',
      footerEmail: 'elevateqa@sdettech.com',
      modalPriceScarcity: 'Limited seats — early access closing soon',
      modalPriceOld: '', modalPriceNew: 'FREE',
      modalPriceCaption: 'No cost. Practitioners only.',
      modalPriceBtn: 'Confirm my seat →',
      modalFormTitle: 'Confirm your Access',
      modalFormDesc: 'Since this is a free pass, please provide your professional details to confirm your seat.',
      admin_whitelist: ['abhishek.johri@sdettech.com', 'abhishekjohri150@gmail.com', 'elevateqa@sdettech.com']
    })
  };
  const { error: sErr } = await supabase.from('site_content').upsert(siteContentData);
  if (sErr) console.error('Site Content error:', sErr);
  else console.log('✅ Site Content seeded.');

  // 2. Manifesto
  const manifestoData = {
    id: '00000000-0000-0000-0000-000000000001',
    content: `Everyone is talking about AI in quality engineering. *Few are showing the proof.*\n\nWe've watched the hype cycle. We've sat through the same demos. We know what an AI-generated test looks like — and we know ==what actually shipped to production== and held up.\n\nElevate QA exists for the second conversation. The harder one. The one where engineers, leaders, and practitioners put real work on the table — what they tried, what broke, what changed the math.\n\nNo vendor pitches. No abstract theory. *The proof of value, or it didn't happen.*`
  };
  const { error: mErr } = await supabase.from('manifesto').upsert(manifestoData);
  if (mErr) console.error('Manifesto error:', mErr);
  else console.log('✅ Manifesto seeded.');

  // 3. Clear existing dynamic tables
  await supabase.from('maturity_stages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('pillars').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('agenda').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('speakers').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // 4. Maturity Stages
  const maturityData = [
    { name: 'Manual-first', pct: '25%', desc: 'Test cases authored by hand. Automation islands. AI is "interesting," not yet operational.', display_order: 0 },
    { name: 'Assisted', pct: '50%', desc: 'AI helps generate test cases and data. Engineers stay in the loop. Early wins, mixed signals.', display_order: 1 },
    { name: 'Augmented', pct: '18%', desc: 'Self-healing automation, intelligent triage, AI-driven coverage gap analysis. Measurable lift.', display_order: 2 },
    { name: 'Autonomous', pct: '7%', desc: 'Quality agents reason about risk, prioritize, and adapt. Humans set strategy. The future, already here in pockets.', display_order: 3 }
  ];
  for (const m of maturityData) await supabase.from('maturity_stages').insert(m);
  console.log('✅ Maturity stages seeded.');

  // 5. Pillars
  const pillarsData = [
    { title: 'Keynotes from people doing the work', desc: 'Industry voices and engineering leaders sharing concrete case studies — what AI changed, what it cost, what it delivered. Real numbers, not roadmaps.', display_order: 0 },
    { title: 'Practitioner deep-dives', desc: "Hands-on breakouts from engineers who've shipped AI-augmented test suites, self-healing automation, and intelligent quality pipelines at scale.", display_order: 1 },
    { title: 'The community table', desc: 'Curated roundtables where 200–500 quality engineering leaders connect, debate, and forge the relationships that move careers and companies forward.', display_order: 2 },
    { title: 'Live demos, not slideware', desc: 'See AI-led QE tooling in action on real codebases, real bugs, real flaky tests. Working software is the only honest demo.', display_order: 3 },
    { title: 'The candid panels', desc: "The unfiltered conversations: what AI in QE is overhyped, what's underrated, where the field goes from here. Speakers who'll say it plainly.", display_order: 4 },
    { title: 'Recognition & prizes', desc: 'Speaker of the event, audience awards, and surprises throughout the day. We celebrate the people pushing the field — loudly.', display_order: 5 }
  ];
  for (const p of pillarsData) await supabase.from('pillars').insert(p);
  console.log('✅ Pillars seeded.');

  // 6. Agenda
  const agendaData = [
    { time_slot: '09:00', title: 'Registration & morning coffee||Opens||Pick up your badge, meet the early arrivals, find your tribe before the day begins.', display_order: 0 },
    { time_slot: '10:00', title: 'The proof of value: what AI in QE has actually delivered||Opening Keynote||A grounded look at where AI has paid off in quality engineering — and where the receipts are still missing.', display_order: 1 },
    { time_slot: '11:00', title: 'Parallel deep-dives across two stages||Track Sessions||Self-healing automation, AI-driven test generation, intelligent triage, risk-based prioritization. Engineers showing real implementations.', display_order: 2 },
    { time_slot: '13:00', title: "Lunch & networking||Break||Curated tables by topic — sit with people working on the problems you're working on.", display_order: 3 },
    { time_slot: '14:30', title: "The candid panel: hype vs. reality||Keynote Panel||Practitioners and leaders go on record about what's overhyped, what's underrated, and where the field goes next.", display_order: 4 },
    { time_slot: '15:30', title: 'Hands-on working sessions||Workshops||Bring a laptop. Leave with code, frameworks, and concrete starting points for your own AI-led QE program.', display_order: 5 },
    { time_slot: '17:30', title: "Speaker of the Event & recognition||Awards||The day's best voice gets headline prizes. Audience awards, surprises, applause that means something.", display_order: 6 },
    { time_slot: '18:30', title: 'Closing reception & after hours||Reception||Drinks, conversations, and the connections that outlast the agenda.', display_order: 7 }
  ];
  for (const a of agendaData) {
    const { error } = await supabase.from('agenda').insert(a);
    if (error) console.error('Agenda insert error:', error);
  }
  console.log('✅ Agenda seeded.');

  // 7. Speakers
  const speakerData = [
    { name: 'To be revealed', role: 'KEYNOTE', status: 'WAVE 01', display_order: 0 },
    { name: 'To be revealed', role: 'KEYNOTE', status: 'WAVE 01', display_order: 1 },
    { name: 'To be revealed', role: 'INDUSTRY', status: 'WAVE 01', display_order: 2 },
    { name: 'To be revealed', role: 'PRACTITIONER', status: 'WAVE 02', display_order: 3 },
    { name: 'To be revealed', role: 'PANEL', status: 'WAVE 02', display_order: 4 },
    { name: 'To be revealed', role: 'WORKSHOP', status: 'WAVE 02', display_order: 5 },
    { name: 'To be revealed', role: 'FIRESIDE', status: 'WAVE 02', display_order: 6 }
  ];
  for (const s of speakerData) await supabase.from('speakers').insert(s);
  console.log('✅ Speakers seeded.');

  console.log('🎉 Data successfully seeded to Supabase!');
}

seedData();

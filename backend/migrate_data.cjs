const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const DB_CONFIG = {
  user: 'lms_user',
  password: 'Q@!T@Sd3T@2099Str0ng',
  host: '14.99.179.157',
  port: 55432,
  database: 'lms_db',
  ssl: false
};

const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function downloadImage(url, destFilename) {
  return new Promise((resolve) => {
    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
      return resolve(url);
    }
    const destPath = path.join(UPLOADS_DIR, destFilename);
    const file = fs.createWriteStream(destPath);
    const client = url.startsWith('https') ? https : http;

    client.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(`/uploads/${destFilename}`);
        });
      } else {
        file.close();
        fs.unlink(destPath, () => {});
        console.warn(`[Download Warning] Failed ${url}: HTTP ${response.statusCode}`);
        resolve(url); // fallback to original
      }
    }).on('error', (err) => {
      file.close();
      fs.unlink(destPath, () => {});
      console.warn(`[Download Error] ${url}: ${err.message}`);
      resolve(url);
    });
  });
}

async function runMigration() {
  console.log('--- STARTING DATABASE MIGRATION & LOCAL IMAGE CACHE ---');

  const client = new Client(DB_CONFIG);
  await client.connect();
  console.log('Connected to PostgreSQL database:', DB_CONFIG.database);

  // 1. Create Schema
  await client.query(`CREATE SCHEMA IF NOT EXISTS elevateqa;`);
  console.log('Schema elevateqa verified.');

  // Set search path
  await client.query(`SET search_path TO elevateqa, public;`);

  // 2. Create Tables
  console.log('Creating tables in schema elevateqa...');

  await client.query(`
    CREATE TABLE IF NOT EXISTS elevateqa.site_content (
      id integer PRIMARY KEY DEFAULT 1,
      hero_headline text,
      hero_tagline text,
      hero_eyebrow text,
      hero_edition text,
      event_date text,
      event_venue text,
      hero_meta jsonb,
      hero_format text,
      hero_audience text
    );

    CREATE TABLE IF NOT EXISTS elevateqa.branding (
      id uuid PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001',
      logo_url text,
      logo_height integer DEFAULT 48,
      hero_bg_url text,
      strip_img_1 text,
      strip_img_2 text,
      strip_img_3 text,
      strip_cap_1 text,
      strip_cap_2 text,
      strip_cap_3 text,
      primary_color text DEFAULT '#d4ff3a',
      accent_color text DEFAULT '#d4ff3a'
    );

    CREATE TABLE IF NOT EXISTS elevateqa.manifesto (
      id uuid PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001',
      content text,
      updated_at timestamptz DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS elevateqa.speakers (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      role text,
      company text,
      image_url text,
      bio text,
      display_order integer DEFAULT 0,
      updated_at timestamptz DEFAULT now(),
      status text DEFAULT 'confirmed',
      title text
    );

    CREATE TABLE IF NOT EXISTS elevateqa.agenda (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      time_slot text,
      title text,
      speaker_name text,
      display_order integer DEFAULT 0,
      updated_at timestamptz DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS elevateqa.maturity_stages (
      id integer PRIMARY KEY,
      name text,
      pct text,
      "desc" text,
      display_order integer DEFAULT 0,
      color text
    );

    CREATE TABLE IF NOT EXISTS elevateqa.pillars (
      id integer PRIMARY KEY,
      title text,
      "desc" text,
      display_order integer DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS elevateqa.registrations (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at timestamptz DEFAULT now(),
      name text NOT NULL,
      email text NOT NULL,
      phone text,
      company text,
      designation text,
      linkedin text,
      role text,
      status text DEFAULT 'pending',
      consent boolean DEFAULT false,
      food_email_sent_at timestamptz,
      location_email_sent_at timestamptz,
      entry_reminder_sent_at timestamptz,
      certificate_sent_at timestamptz,
      keynote_thanks_sent_at timestamptz
    );

    CREATE TABLE IF NOT EXISTS elevateqa.speaker_applications (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at timestamptz DEFAULT now(),
      name text NOT NULL,
      email text NOT NULL,
      phone text,
      company text,
      designation text,
      topic text,
      bio text,
      linkedin text,
      status text DEFAULT 'pending'
    );

    CREATE TABLE IF NOT EXISTS elevateqa.otps (
      email text PRIMARY KEY,
      code text NOT NULL,
      expires_at bigint NOT NULL
    );
  `);
  console.log('All elevateqa tables created/verified successfully.');

  // 3. Load Supabase Dump
  const dumpPath = path.join(__dirname, 'supabase_dump.json');
  if (!fs.existsSync(dumpPath)) {
    throw new Error('supabase_dump.json not found!');
  }
  const dump = JSON.parse(fs.readFileSync(dumpPath, 'utf8'));

  // 4. Download and cache images
  console.log('Downloading media files from Supabase Storage to local /uploads folder...');
  if (dump.branding && dump.branding[0]) {
    const b = dump.branding[0];
    if (b.logo_url && b.logo_url.startsWith('http')) {
      const ext = path.extname(new URL(b.logo_url).pathname) || '.png';
      b.logo_url = await downloadImage(b.logo_url, `branding_logo${ext}`);
    }
    if (b.hero_bg_url && b.hero_bg_url.startsWith('http')) {
      const ext = path.extname(new URL(b.hero_bg_url).pathname) || '.webp';
      b.hero_bg_url = await downloadImage(b.hero_bg_url, `branding_hero_bg${ext}`);
    }
  }

  for (let i = 0; i < dump.speakers.length; i++) {
    const s = dump.speakers[i];
    if (s.image_url && s.image_url.startsWith('http')) {
      const rawExt = path.extname(new URL(s.image_url).pathname) || '.webp';
      const safeName = (s.name || `speaker_${i}`).toLowerCase().replace(/[^a-z0-9]/g, '_');
      const filename = `speaker_${i + 1}_${safeName}${rawExt}`;
      s.image_url = await downloadImage(s.image_url, filename);
    }
  }
  console.log('Image download completed.');

  // 5. Seed Database
  console.log('Seeding site_content...');
  if (dump.site_content && dump.site_content.length > 0) {
    const sc = dump.site_content[0];
    await client.query(`
      INSERT INTO elevateqa.site_content (id, hero_headline, hero_tagline, hero_eyebrow, hero_edition, event_date, event_venue, hero_meta, hero_format, hero_audience)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (id) DO UPDATE SET
        hero_headline = EXCLUDED.hero_headline,
        hero_tagline = EXCLUDED.hero_tagline,
        hero_eyebrow = EXCLUDED.hero_eyebrow,
        hero_edition = EXCLUDED.hero_edition,
        event_date = EXCLUDED.event_date,
        event_venue = EXCLUDED.event_venue,
        hero_meta = EXCLUDED.hero_meta,
        hero_format = EXCLUDED.hero_format,
        hero_audience = EXCLUDED.hero_audience;
    `, [
      sc.id || 1,
      sc.hero_headline,
      sc.hero_tagline,
      sc.hero_eyebrow,
      sc.hero_edition,
      sc.event_date,
      sc.event_venue,
      typeof sc.hero_meta === 'object' ? JSON.stringify(sc.hero_meta) : sc.hero_meta,
      sc.hero_format,
      sc.hero_audience
    ]);
  }

  console.log('Seeding branding...');
  if (dump.branding && dump.branding.length > 0) {
    const b = dump.branding[0];
    await client.query(`
      INSERT INTO elevateqa.branding (id, logo_url, logo_height, hero_bg_url, strip_img_1, strip_img_2, strip_img_3, strip_cap_1, strip_cap_2, strip_cap_3, primary_color, accent_color)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (id) DO UPDATE SET
        logo_url = EXCLUDED.logo_url,
        logo_height = EXCLUDED.logo_height,
        hero_bg_url = EXCLUDED.hero_bg_url,
        strip_img_1 = EXCLUDED.strip_img_1,
        strip_img_2 = EXCLUDED.strip_img_2,
        strip_img_3 = EXCLUDED.strip_img_3,
        strip_cap_1 = EXCLUDED.strip_cap_1,
        strip_cap_2 = EXCLUDED.strip_cap_2,
        strip_cap_3 = EXCLUDED.strip_cap_3,
        primary_color = EXCLUDED.primary_color,
        accent_color = EXCLUDED.accent_color;
    `, [
      b.id || '00000000-0000-0000-0000-000000000001',
      b.logo_url,
      b.logo_height || 48,
      b.hero_bg_url,
      b.strip_img_1,
      b.strip_img_2,
      b.strip_img_3,
      b.strip_cap_1,
      b.strip_cap_2,
      b.strip_cap_3,
      b.primary_color || '#d4ff3a',
      b.accent_color || '#d4ff3a'
    ]);
  }

  console.log('Seeding manifesto...');
  if (dump.manifesto && dump.manifesto.length > 0) {
    const m = dump.manifesto[0];
    await client.query(`
      INSERT INTO elevateqa.manifesto (id, content, updated_at)
      VALUES ($1, $2, $3)
      ON CONFLICT (id) DO UPDATE SET
        content = EXCLUDED.content,
        updated_at = EXCLUDED.updated_at;
    `, [
      m.id || '00000000-0000-0000-0000-000000000001',
      m.content,
      m.updated_at || new Date()
    ]);
  }

  console.log(`Seeding ${dump.speakers.length} speakers...`);
  await client.query(`DELETE FROM elevateqa.speakers;`);
  for (const s of dump.speakers) {
    await client.query(`
      INSERT INTO elevateqa.speakers (id, name, role, company, image_url, bio, display_order, updated_at, status, title)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);
    `, [
      s.id,
      s.name,
      s.role,
      s.company,
      s.image_url,
      s.bio,
      s.display_order || 0,
      s.updated_at || new Date(),
      s.status || 'confirmed',
      s.title
    ]);
  }

  console.log(`Seeding ${dump.agenda.length} agenda items...`);
  await client.query(`DELETE FROM elevateqa.agenda;`);
  for (const a of dump.agenda) {
    await client.query(`
      INSERT INTO elevateqa.agenda (id, time_slot, title, speaker_name, display_order, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6);
    `, [
      a.id,
      a.time_slot,
      a.title,
      a.speaker_name,
      a.display_order || 0,
      a.updated_at || new Date()
    ]);
  }

  console.log(`Seeding ${dump.maturity_stages.length} maturity stages...`);
  await client.query(`DELETE FROM elevateqa.maturity_stages;`);
  for (const ms of dump.maturity_stages) {
    await client.query(`
      INSERT INTO elevateqa.maturity_stages (id, name, pct, "desc", display_order, color)
      VALUES ($1, $2, $3, $4, $5, $6);
    `, [
      ms.id,
      ms.name,
      ms.pct,
      ms.desc,
      ms.display_order || 0,
      ms.color || null
    ]);
  }

  console.log(`Seeding ${dump.pillars.length} pillars...`);
  await client.query(`DELETE FROM elevateqa.pillars;`);
  for (const p of dump.pillars) {
    await client.query(`
      INSERT INTO elevateqa.pillars (id, title, "desc", display_order)
      VALUES ($1, $2, $3, $4);
    `, [
      p.id,
      p.title,
      p.desc,
      p.display_order || 0
    ]);
  }

  console.log(`Seeding ${dump.registrations.length} registrations...`);
  await client.query(`DELETE FROM elevateqa.registrations;`);
  for (const r of dump.registrations) {
    await client.query(`
      INSERT INTO elevateqa.registrations (id, created_at, name, email, phone, company, designation, linkedin, role, status, consent, food_email_sent_at, location_email_sent_at, entry_reminder_sent_at, certificate_sent_at, keynote_thanks_sent_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16);
    `, [
      r.id,
      r.created_at || new Date(),
      r.name,
      r.email,
      r.phone,
      r.company,
      r.designation,
      r.linkedin,
      r.role,
      r.status || 'confirmed',
      r.consent || false,
      r.food_email_sent_at || null,
      r.location_email_sent_at || null,
      r.entry_reminder_sent_at || null,
      r.certificate_sent_at || null,
      r.keynote_thanks_sent_at || null
    ]);
  }

  console.log(`Seeding ${dump.speaker_applications.length} speaker applications...`);
  await client.query(`DELETE FROM elevateqa.speaker_applications;`);
  for (const sa of dump.speaker_applications) {
    await client.query(`
      INSERT INTO elevateqa.speaker_applications (id, created_at, name, email, phone, company, designation, topic, bio, linkedin, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11);
    `, [
      sa.id,
      sa.created_at || new Date(),
      sa.name,
      sa.email,
      sa.phone,
      sa.company,
      sa.designation,
      sa.topic,
      sa.bio,
      sa.linkedin,
      sa.status || 'pending'
    ]);
  }

  console.log('--- VERIFYING TABLE ROW COUNTS IN POSTGRESQL ---');
  const countTables = ['site_content', 'branding', 'manifesto', 'speakers', 'agenda', 'maturity_stages', 'pillars', 'registrations', 'speaker_applications'];
  for (const t of countTables) {
    const res = await client.query(`SELECT count(*) FROM elevateqa.${t};`);
    console.log(`elevateqa.${t}: ${res.rows[0].count} rows`);
  }

  await client.end();
  console.log('--- MIGRATION & SEEDING COMPLETED SUCCESSFULLY! ---');
}

runMigration().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});

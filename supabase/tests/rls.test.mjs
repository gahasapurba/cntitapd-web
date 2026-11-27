// Uji RLS & RPC migration Fase 1 di Postgres WASM (PGlite), tanpa menyentuh produksi.
// Menjalankan supabase_schema.sql + policy terbuka lama + migration dua kali, lalu menguji akses
// sebagai anon, user biasa, admin divisi, dan super admin. Jalankan: npm run test:rls
import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs';

const [schemaPath, migrationPath] = process.argv.slice(2);
const db = new PGlite();
let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => { cond ? pass++ : fail++; console.log(`${cond ? 'PASS' : 'FAIL'}  ${name} ${extra}`); };

async function expectErr(name, sql, pattern) {
  try { await db.exec(sql); ok(name, false, '(no error)'); }
  catch (e) { ok(name, pattern.test(e.message), `-> ${e.message}`); }
}
async function asRole(role, sub, fn) {
  await db.exec(`RESET ROLE; SELECT set_config('request.jwt.claim.sub', '${sub || ''}', false); SET ROLE ${role};`);
  try { return await fn(); } finally { await db.exec('RESET ROLE;'); }
}

// --- Supabase stubs ---
await db.exec(`
CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN;
CREATE SCHEMA auth; CREATE SCHEMA storage;
CREATE TABLE auth.users (id UUID PRIMARY KEY, email TEXT);
CREATE FUNCTION auth.uid() RETURNS UUID LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
CREATE TABLE storage.buckets (id TEXT PRIMARY KEY, name TEXT, public BOOLEAN, file_size_limit BIGINT);
CREATE TABLE storage.objects (id SERIAL PRIMARY KEY, bucket_id TEXT, name TEXT);
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION storage.foldername(name TEXT) RETURNS TEXT[] LANGUAGE sql AS $$ SELECT (string_to_array(name, '/'))[1:array_length(string_to_array(name,'/'),1)-1] $$;
CREATE FUNCTION storage.extension(name TEXT) RETURNS TEXT LANGUAGE sql AS $$ SELECT reverse(split_part(reverse(name), '.', 1)) $$;
GRANT USAGE ON SCHEMA storage, auth TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO anon, authenticated;
GRANT USAGE ON SEQUENCE storage.objects_id_seq TO anon, authenticated;
GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated;
`);

// Schema file, then the pre-Fase 1 open policies, then the migration (twice)
await db.exec(fs.readFileSync(schemaPath, 'utf8').replace(/NOTIFY pgrst.*$/m, ''));
await db.exec(`
-- Kondisi produksi sebelum Fase 1: hak akses & policy terbuka untuk semua orang
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
CREATE POLICY "Public full access submissions" ON public.submissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access cnt-media" ON storage.objects FOR ALL TO anon, authenticated USING (bucket_id = 'cnt-media') WITH CHECK (bucket_id = 'cnt-media');
CREATE POLICY "Allow public all access on departments" ON public.departments FOR ALL USING (true);
CREATE POLICY "Allow public select lucky_draws" ON public.lucky_draws FOR SELECT USING (true);
INSERT INTO public.tenures (id, code, title) VALUES ('tenure-2026','2026','2026'), ('tenure-2027','2027','2027');
INSERT INTO public.divisions (id, name) VALUES ('div-exp','Experience'), ('div-cm','Creative Media');
INSERT INTO public.departments (id, name) VALUES ('dept-1','Dept 1');
INSERT INTO public.events (id, title, division_id, is_public, is_limited, max_quota) VALUES
  ('evt-pub','Townhall','div-exp',true,true,1), ('evt-draft','Draft','div-cm',false,false,0);
INSERT INTO public.forms (id, title, deadline, fields, event_id, is_limited, max_quota) VALUES
  ('form-open','Open', (to_char(now() AT TIME ZONE 'Asia/Jakarta' + interval '1 hour','YYYY-MM-DD HH24:MI:SS') || '+00')::timestamptz,
   '[{"id":"f-nip","label":"NIP","isUnique":true},{"id":"f-name","label":"Nama"}]', 'evt-pub', true, 3),
  ('form-late','Late', (to_char(now() AT TIME ZONE 'Asia/Jakarta' - interval '1 hour','YYYY-MM-DD HH24:MI:SS') || '+00')::timestamptz, '[]', NULL, false, 0);
INSERT INTO public.submissions (id, form_id, data, status) VALUES ('sub-old','form-open','{"f-nip":"123","f-name":"Ana"}','Accepted');
INSERT INTO public.kudos (id, sender, recipient, category, message) VALUES ('kd-1','A','B','Harmonis','Terima kasih');
INSERT INTO public.aspirasi (id, description, is_public) VALUES ('asp-pub','publik', true), ('asp-priv','rahasia', false);
INSERT INTO public.faqs (id, question, answer, is_published) VALUES ('faq-1','Q1 publik?','A',true), ('faq-2','Q2 draft?','A',false);
INSERT INTO auth.users VALUES ('00000000-0000-0000-0000-00000000000a','super@x.id'), ('00000000-0000-0000-0000-00000000000b','div@x.id'), ('00000000-0000-0000-0000-00000000000c','nobody@x.id');
`);
const before = (await db.query(`SELECT (SELECT count(*) FROM submissions)+(SELECT count(*) FROM kudos)+(SELECT count(*) FROM aspirasi)+(SELECT count(*) FROM faqs)+(SELECT count(*) FROM events) AS n`)).rows[0].n;

const migration = fs.readFileSync(migrationPath, 'utf8').replace(/NOTIFY pgrst.*$/m, '');
await db.exec(migration);
await db.exec(migration);
ok('migration runs twice (idempotent)', true);
const after = (await db.query(`SELECT (SELECT count(*) FROM submissions)+(SELECT count(*) FROM kudos)+(SELECT count(*) FROM aspirasi)+(SELECT count(*) FROM faqs)+(SELECT count(*) FROM events) AS n`)).rows[0].n;
ok('row counts unchanged', String(before) === String(after), `${before} -> ${after}`);
const pol = (await db.query(`SELECT count(*) n FROM pg_policies WHERE policyname ILIKE '%full access%' OR policyname ILIKE 'Allow public%' OR policyname = 'Public Access cnt-media'`)).rows[0].n;
ok('legacy open policies removed', Number(pol) === 0, `left=${pol}`);

await db.exec(`INSERT INTO public.admin_profiles (user_id, email, role) VALUES ('00000000-0000-0000-0000-00000000000a','super@x.id','super_admin');
               INSERT INTO public.admin_profiles (user_id, email, role, division_id) VALUES ('00000000-0000-0000-0000-00000000000b','div@x.id','division_admin','div-cm');`);
const SUPER = '00000000-0000-0000-0000-00000000000a', DIV = '00000000-0000-0000-0000-00000000000b', NOBODY = '00000000-0000-0000-0000-00000000000c';

// --- anon ---
await asRole('anon', '', async () => {
  await expectErr('anon cannot read submissions', 'SELECT * FROM submissions', /permission denied/);
  await expectErr('anon cannot read event_rsvps', 'SELECT * FROM event_rsvps', /permission denied/);
  await expectErr('anon cannot read lucky_draws', 'SELECT * FROM lucky_draws', /permission denied/);
  await expectErr('anon cannot read aspirasi table', 'SELECT * FROM aspirasi', /permission denied/);
  await expectErr('anon cannot update events', "UPDATE events SET title='x'", /permission denied/);
  await expectErr('anon cannot delete members', 'DELETE FROM members', /permission denied/);
  await expectErr('anon cannot insert kudos directly', "INSERT INTO kudos (id,sender,recipient,message) VALUES ('k','a','b','c')", /permission denied/);
  const ev = (await db.query('SELECT id FROM events')).rows.map(r => r.id);
  ok('anon sees only public events', ev.length === 1 && ev[0] === 'evt-pub', JSON.stringify(ev));
  const fq = (await db.query('SELECT id FROM faqs')).rows.map(r => r.id);
  ok('anon sees only published faqs', fq.length === 1 && fq[0] === 'faq-1', JSON.stringify(fq));
  await db.exec("INSERT INTO faqs (id, question, answer, is_published, asked_by) VALUES ('faq-q','Pertanyaan baru?','',false,'Tamu')");
  ok('anon can ask a FAQ question', true);
  await expectErr('anon cannot publish own FAQ', "INSERT INTO faqs (id, question, answer, is_published) VALUES ('faq-z','Pertanyaan lain?','',true)", /row-level security/);
  const asp = (await db.query('SELECT id FROM get_public_aspirasi()')).rows.map(r => r.id);
  ok('get_public_aspirasi hides private', asp.length === 1 && asp[0] === 'asp-pub', JSON.stringify(asp));
  const sid = (await db.query(`SELECT submit_form('form-open', '{"f-nip":"999","f-name":"Budi"}') AS id`)).rows[0].id;
  ok('submit_form before WIB deadline', /^sub-/.test(sid));
  await expectErr('submit_form rejects duplicate unique NIP', `SELECT submit_form('form-open', '{"f-nip":" 123 "}')`, /FORM_DUPLICATE:f-nip/);
  await db.query(`SELECT submit_form('form-open', '{"f-nip":"777"}')`);
  await expectErr('submit_form enforces quota', `SELECT submit_form('form-open', '{"f-nip":"888"}')`, /FORM_QUOTA_FULL/);
  await expectErr('submit_form rejects passed WIB deadline', `SELECT submit_form('form-late', '{}')`, /FORM_DEADLINE_PASSED/);
  const taken = (await db.query(`SELECT is_submission_value_taken('form-open','f-nip','123') t`)).rows[0].t;
  ok('is_submission_value_taken', taken === true);
  const r1 = (await db.query(`SELECT submit_rsvp('evt-pub','Citra','Hadir Onsite','', 'dept-1') id`)).rows[0].id;
  ok('submit_rsvp with department', /^rsvp-/.test(r1));
  await expectErr('submit_rsvp enforces quota', `SELECT submit_rsvp('evt-pub','Dodi','Hadir Onsite')`, /RSVP_QUOTA_FULL/);
  await expectErr('submit_rsvp hides draft events', `SELECT submit_rsvp('evt-draft','Dodi','Hadir Onsite')`, /EVENT_NOT_FOUND/);
  const att = (await db.query(`SELECT * FROM get_event_attendees('evt-pub')`)).rows;
  ok('get_event_attendees returns name/department only', att.length === 1 && att[0].department_id === 'dept-1' && !('notes' in att[0]));
  const counts = (await db.query('SELECT * FROM get_registration_counts()')).rows;
  ok('get_registration_counts', counts.some(c => c.kind === 'form' && c.ref_id === 'form-open' && c.total === 3));
  await expectErr('submit_kudos requires AKHLAK category', `SELECT submit_kudos('A','B','Inovatif','Mantap sekali')`, /INVALID_CATEGORY/);
  const kd = (await db.query(`SELECT submit_kudos('','Rekan','Amanah','Mantap sekali') id`)).rows[0].id;
  ok('submit_kudos AKHLAK', /^kd-/.test(kd));
  const l1 = (await db.query(`SELECT * FROM toggle_kudos_like('kd-1','device-abc-123')`)).rows[0];
  const l2 = (await db.query(`SELECT * FROM toggle_kudos_like('kd-1','device-abc-123')`)).rows[0];
  ok('toggle_kudos_like like then unlike', l1.liked === true && l1.likes === 2 && l2.liked === false && l2.likes === 1, JSON.stringify([l1, l2]));
  const as = (await db.query(`SELECT submit_aspirasi('','Ide','Kegiatan & Event','Adakan fun run bulanan') id`)).rows[0].id;
  ok('submit_aspirasi', /^asp-/.test(as));
  const tr = (await db.query(`SELECT * FROM track_submissions('sub-old')`)).rows;
  ok('track_submissions by id', tr.length === 1);
  await db.exec(`INSERT INTO storage.objects (bucket_id, name) VALUES ('cnt-media','submissions/cv.pdf')`);
  ok('anon can upload to submissions/', true);
  await expectErr('anon cannot upload to gallery/', `INSERT INTO storage.objects (bucket_id, name) VALUES ('cnt-media','gallery/x.png')`, /row-level security/);
  await expectErr('anon cannot upload .exe', `INSERT INTO storage.objects (bucket_id, name) VALUES ('cnt-media','submissions/x.exe')`, /row-level security/);
  await expectErr('anon cannot assign admin', `SELECT assign_admin_role('nobody@x.id','super_admin')`, /permission denied/);
});

// --- authenticated, not an admin ---
await asRole('authenticated', NOBODY, async () => {
  const n = (await db.query('SELECT count(*) n FROM submissions')).rows[0].n;
  ok('non-admin user sees 0 submissions', Number(n) === 0);
  const u = await db.query("UPDATE events SET title='hack' RETURNING id");
  ok('non-admin user cannot update events', u.rows.length === 0);
  await expectErr('non-admin cannot assign admin', `SELECT assign_admin_role('nobody@x.id','super_admin')`, /NOT_AUTHORIZED/);
});

// --- division admin (div-cm) ---
await asRole('authenticated', DIV, async () => {
  const ev = (await db.query('SELECT id FROM events ORDER BY id')).rows.map(r => r.id);
  ok('division admin sees draft events', ev.includes('evt-draft'));
  const u1 = await db.query("UPDATE events SET title='ok' WHERE id='evt-draft' RETURNING id");
  ok('division admin edits own-division event', u1.rows.length === 1);
  const u2 = await db.query("UPDATE events SET title='no' WHERE id='evt-pub' RETURNING id");
  ok('division admin cannot edit other division event', u2.rows.length === 0);
  const s = (await db.query('SELECT count(*) n FROM submissions')).rows[0].n;
  ok('division admin cannot see other division submissions', Number(s) === 0);
  const a = (await db.query('SELECT count(*) n FROM aspirasi')).rows[0].n;
  ok('division admin cannot read aspirasi', Number(a) === 0);
});

// --- super admin ---
await asRole('authenticated', SUPER, async () => {
  const s = (await db.query('SELECT count(*) n FROM submissions')).rows[0].n;
  ok('super admin sees all submissions', Number(s) === 3, s);
  const a = (await db.query('SELECT count(*) n FROM aspirasi')).rows[0].n;
  ok('super admin sees all aspirasi', Number(a) === 3, a);
  const u = await db.query("UPDATE kudos SET message='edited' WHERE id='kd-1' RETURNING id");
  ok('super admin edits kudos', u.rows.length === 1);
  await db.exec(`INSERT INTO lucky_draws (id, event_id, submission_id, prize_name, details) VALUES ('ld-1','evt-pub','sub-old','Hadiah','{"winnerName":"Ana"}')`);
  await expectErr('lucky draw: one win per submission per event', `INSERT INTO lucky_draws (id, event_id, submission_id) VALUES ('ld-2','evt-pub','sub-old')`, /duplicate key/);
  const uid = (await db.query(`SELECT assign_admin_role('nobody@x.id','division_admin','div-exp','Nobody') id`)).rows[0].id;
  ok('super admin assigns division admin', uid === NOBODY);
  await expectErr('super admin cannot demote self', `SELECT assign_admin_role('super@x.id','division_admin','div-exp')`, /CANNOT_DEMOTE_SELF/);
  await db.exec(`SELECT revoke_admin_role('${NOBODY}')`);
  ok('super admin revokes admin', true);
  await db.exec(`INSERT INTO storage.objects (bucket_id, name) VALUES ('cnt-media','gallery/x.png')`);
  ok('admin uploads to gallery/', true);
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

-- ==============================================================================
-- SKEMA MASTER SUPABASE UNTUK CNT IT APD (CULTURE NETWORK TEAM GROUP IT APD)
-- Blueprint Lengkap 18 Tabel, Relasi Foreign Key, Index, RLS per Peran, RPC & Storage Bucket
-- File ini dapat dijalankan langsung di SQL Editor Supabase baru untuk membangun
-- ulang 100% seluruh struktur database dari nol secara instan dan idempotent.
-- Bagian keamanan identik dengan supabase/migrations/20261127000000_secure_access_and_admin_roles.sql
-- Terakhir Diperbarui: 2026-11-27 (Fase 1 keamanan - Status: Sinkron dengan produksi)
-- ==============================================================================

-- 1. Tabel Master Periode Kepengurusan (tenures)
CREATE TABLE IF NOT EXISTS public.tenures (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    title TEXT NOT NULL,
    theme_tagline TEXT,
    hero_headline TEXT,
    hero_highlight TEXT,
    visi TEXT,
    misi JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT false,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabel Master Role Kepengurusan (tenure_roles)
CREATE TABLE IF NOT EXISTS public.tenure_roles (
    id TEXT PRIMARY KEY,
    tenure_id TEXT REFERENCES public.tenures(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    level SMALLINT NOT NULL DEFAULT 5,
    max_quota SMALLINT NOT NULL DEFAULT 0,
    requires_division BOOLEAN NOT NULL DEFAULT false,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabel Master Departemen / Unit Kerja (departments)
CREATE TABLE IF NOT EXISTS public.departments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT,
    description TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Tabel Divisi Organisasi (divisions)
CREATE TABLE IF NOT EXISTS public.divisions (
    id TEXT PRIMARY KEY,
    tenure_id TEXT DEFAULT 'tenure-2026' REFERENCES public.tenures(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#0284c7',
    motto TEXT,
    description TEXT,
    focus_areas JSONB DEFAULT '[]'::jsonb,
    is_recruiting BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Tabel Struktur Pengurus & Anggota (members)
CREATE TABLE IF NOT EXISTS public.members (
    id TEXT PRIMARY KEY,
    tenure_id TEXT DEFAULT 'tenure-2026' REFERENCES public.tenures(id) ON DELETE SET NULL,
    division_id TEXT REFERENCES public.divisions(id) ON DELETE SET NULL,
    role_id TEXT REFERENCES public.tenure_roles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    image TEXT,
    color TEXT,
    whatsapp TEXT,
    motto TEXT,
    responsibilities JSONB DEFAULT '[]'::jsonb,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Tabel Program Kerja & Kalender Budaya (events)
CREATE TABLE IF NOT EXISTS public.events (
    id TEXT PRIMARY KEY,
    tenure_id TEXT DEFAULT 'tenure-2026' REFERENCES public.tenures(id) ON DELETE SET NULL,
    division_id TEXT REFERENCES public.divisions(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    category TEXT,
    start_date TEXT,
    end_date TEXT,
    location TEXT,
    peserta TEXT,
    description TEXT,
    total_rab NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'Upcoming',
    is_public BOOLEAN DEFAULT false,
    is_limited BOOLEAN DEFAULT false,
    max_quota INT DEFAULT 0,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Tabel Galeri Dokumentasi Kegiatan (galleries)
CREATE TABLE IF NOT EXISTS public.galleries (
    id TEXT PRIMARY KEY,
    tenure_id TEXT DEFAULT 'tenure-2026' REFERENCES public.tenures(id) ON DELETE SET NULL,
    division_id TEXT REFERENCES public.divisions(id) ON DELETE SET NULL,
    event_id TEXT REFERENCES public.events(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    date TEXT,
    description TEXT,
    photos JSONB DEFAULT '[]'::jsonb,
    doc_links JSONB DEFAULT '[]'::jsonb,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Tabel Wall of Kudos / Apresiasi (kudos)
CREATE TABLE IF NOT EXISTS public.kudos (
    id TEXT PRIMARY KEY,
    sender TEXT NOT NULL,
    recipient TEXT NOT NULL,
    category TEXT DEFAULT 'Kolaboratif',
    message TEXT NOT NULL,
    likes INT DEFAULT 1,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Tabel Kotak Ide & Aspirasi Budaya (aspirasi)
CREATE TABLE IF NOT EXISTS public.aspirasi (
    id TEXT PRIMARY KEY,
    sender TEXT DEFAULT 'Anonim',
    title TEXT DEFAULT '',
    category TEXT DEFAULT 'Kegiatan & Event',
    description TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'Menunggu Review',
    admin_reply TEXT DEFAULT '',
    is_public BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Tabel Formulir Pendaftaran Dinamis (forms)
CREATE TABLE IF NOT EXISTS public.forms (
    id TEXT PRIMARY KEY,
    tenure_id TEXT REFERENCES public.tenures(id) ON DELETE SET NULL,
    event_id TEXT REFERENCES public.events(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    subtitle TEXT,
    category TEXT,
    -- Digit jam dinding WIB berlabel UTC (contoh 2026-11-17 11:00:00+00 = 11.00 WIB); lihat form_deadline_wib()
    deadline TIMESTAMPTZ,
    notes TEXT,
    fields JSONB DEFAULT '[]'::jsonb,
    is_open BOOLEAN DEFAULT true,
    requires_tracking BOOLEAN DEFAULT true,
    is_show_accepted BOOLEAN DEFAULT false,
    is_limited BOOLEAN DEFAULT false,
    max_quota INT DEFAULT 0,
    is_event_connected BOOLEAN DEFAULT false,
    is_lucky_draw BOOLEAN DEFAULT false,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Idempotent column check for notes
ALTER TABLE public.forms ADD COLUMN IF NOT EXISTS notes TEXT;

-- 11. Tabel Berkas Pendaftaran Masuk (submissions)
CREATE TABLE IF NOT EXISTS public.submissions (
    id TEXT PRIMARY KEY,
    form_id TEXT REFERENCES public.forms(id) ON DELETE CASCADE,
    data JSONB DEFAULT '{}'::jsonb,
    files JSONB DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'Submitted',
    admin_notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 12. Tabel Pengundian Doorprize / Lucky Draw (lucky_draws)
CREATE TABLE IF NOT EXISTS public.lucky_draws (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    submission_id TEXT NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
    form_id TEXT REFERENCES public.forms(id) ON DELETE SET NULL,
    prize_name TEXT NOT NULL DEFAULT 'Doorprize',
    drawn_at TIMESTAMPTZ DEFAULT now(),
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 13. Tabel Daftar Hadir & Konfirmasi RSVP Kegiatan (event_rsvps)
CREATE TABLE IF NOT EXISTS public.event_rsvps (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    department_id TEXT REFERENCES public.departments(id) ON DELETE SET NULL,
    attendee_name TEXT NOT NULL,
    attendance_mode TEXT NOT NULL DEFAULT 'Hadir Onsite',
    notes TEXT DEFAULT '',
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 14. Tabel Pusat Panduan & Tanya Jawab (faqs)
CREATE TABLE IF NOT EXISTS public.faqs (
    id TEXT PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT DEFAULT 'Umum',
    asked_by TEXT DEFAULT 'Admin CNT',
    is_published BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 15. Tabel Katalog Asset Logo & Template Resmi (brand_assets)
CREATE TABLE IF NOT EXISTS public.brand_assets (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Logo & Brand',
    description TEXT DEFAULT '',
    file_url TEXT NOT NULL,
    preview_url TEXT DEFAULT '',
    file_type TEXT DEFAULT 'ZIP / PNG',
    file_size TEXT DEFAULT '',
    badge TEXT DEFAULT 'Official Asset',
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 16. Tabel Pengaturan Visibilitas Halaman & Konfigurasi Global (page_settings)
CREATE TABLE IF NOT EXISTS public.page_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- INDEXING UNTUK OPTIMASI PERFORMA QUERY
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_members_tenure_id ON public.members(tenure_id);
CREATE INDEX IF NOT EXISTS idx_members_division_id ON public.members(division_id);
CREATE INDEX IF NOT EXISTS idx_events_tenure_id ON public.events(tenure_id);
CREATE INDEX IF NOT EXISTS idx_events_is_public ON public.events(is_public);
CREATE INDEX IF NOT EXISTS idx_galleries_event_id ON public.galleries(event_id);
CREATE INDEX IF NOT EXISTS idx_forms_tenure_id ON public.forms(tenure_id);
CREATE INDEX IF NOT EXISTS idx_submissions_form_id ON public.submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_lucky_draws_event_id ON public.lucky_draws(event_id);
CREATE INDEX IF NOT EXISTS idx_lucky_draws_submission_id ON public.lucky_draws(submission_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_event_id ON public.event_rsvps(event_id);

-- ==============================================================================
-- KEAMANAN (FASE 1): AKUN ADMIN, RLS PER TABEL, RPC PUBLIK & STORAGE
-- Pengunjung (anon) hanya membaca konten publik; data pribadi hanya untuk admin berwenang;
-- kiriman publik lewat RPC yang memeriksa tenggat, kuota, keunikan & panjang isian.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Kolom & tabel baru
-- ------------------------------------------------------------------------------
-- Detail pemenang undian (nama, unit, identitas) disimpan bersama hasil undian
ALTER TABLE public.lucky_draws ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}'::jsonb;

-- Satu submission hanya boleh menang sekali per acara (tabel saat ini kosong)
CREATE UNIQUE INDEX IF NOT EXISTS uq_lucky_draws_event_submission
    ON public.lucky_draws(event_id, submission_id);

-- Satu like per perangkat per kudos
CREATE TABLE IF NOT EXISTS public.kudos_likes (
    kudos_id TEXT NOT NULL REFERENCES public.kudos(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL CHECK (char_length(device_id) BETWEEN 8 AND 64),
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (kudos_id, device_id)
);

-- ------------------------------------------------------------------------------
-- 2. Akun admin & peran
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT DEFAULT '',
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'division_admin')),
    division_id TEXT REFERENCES public.divisions(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT division_admin_requires_division CHECK (role <> 'division_admin' OR division_id IS NOT NULL)
);

ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kudos_likes ENABLE ROW LEVEL SECURITY;

-- Helper otorisasi (SECURITY DEFINER agar dapat membaca admin_profiles dari dalam policy)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT EXISTS (SELECT 1 FROM public.admin_profiles WHERE user_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT EXISTS (SELECT 1 FROM public.admin_profiles WHERE user_id = auth.uid() AND role = 'super_admin');
$$;

CREATE OR REPLACE FUNCTION public.can_manage_division(p_division_id TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.admin_profiles
        WHERE user_id = auth.uid()
          AND (role = 'super_admin' OR (role = 'division_admin' AND division_id = p_division_id))
    );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_event(p_event_id TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT public.is_super_admin() OR EXISTS (
        SELECT 1 FROM public.events e
        WHERE e.id = p_event_id AND public.can_manage_division(e.division_id)
    );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_form(p_form_id TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT public.is_super_admin() OR EXISTS (
        SELECT 1 FROM public.forms f
        JOIN public.events e ON e.id = f.event_id
        WHERE f.id = p_form_id AND public.can_manage_division(e.division_id)
    );
$$;

-- ------------------------------------------------------------------------------
-- 3. Hak akses dasar (GRANT). RLS di bawah membatasi baris yang boleh disentuh.
-- ------------------------------------------------------------------------------
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon, authenticated, PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON ROUTINES FROM anon, authenticated, PUBLIC;

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON
    public.tenures, public.tenure_roles, public.departments, public.divisions,
    public.members, public.events, public.galleries, public.kudos, public.forms,
    public.faqs, public.brand_assets, public.page_settings
TO anon;
GRANT INSERT ON public.faqs TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- service_role (skrip backup / restore GitHub Actions) tetap memiliki akses penuh
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;

GRANT EXECUTE ON FUNCTION
    public.is_admin(), public.is_super_admin(), public.can_manage_division(TEXT),
    public.can_manage_event(TEXT), public.can_manage_form(TEXT)
TO anon, authenticated;

-- ------------------------------------------------------------------------------
-- 4. Row Level Security
-- ------------------------------------------------------------------------------
ALTER TABLE public.tenures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenure_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kudos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aspirasi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lucky_draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_settings ENABLE ROW LEVEL SECURITY;

-- Hapus seluruh policy lama "Public full access" & policy duplikat lama
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Public full access %I" ON public.%I;', tbl, tbl);
    END LOOP;
END $$;

DROP POLICY IF EXISTS "Allow public all access on departments" ON public.departments;
DROP POLICY IF EXISTS "Allow public read access on tenure_roles" ON public.tenure_roles;
DROP POLICY IF EXISTS "Allow public insert access on tenure_roles" ON public.tenure_roles;
DROP POLICY IF EXISTS "Allow public update access on tenure_roles" ON public.tenure_roles;
DROP POLICY IF EXISTS "Allow public delete access on tenure_roles" ON public.tenure_roles;
DROP POLICY IF EXISTS "Allow public select lucky_draws" ON public.lucky_draws;
DROP POLICY IF EXISTS "Allow public insert lucky_draws" ON public.lucky_draws;
DROP POLICY IF EXISTS "Allow public update lucky_draws" ON public.lucky_draws;
DROP POLICY IF EXISTS "Allow public delete lucky_draws" ON public.lucky_draws;

-- 4a. Konten publik: dibaca semua orang, diubah oleh super admin
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY ARRAY[
        'tenures', 'tenure_roles', 'departments', 'divisions', 'brand_assets', 'page_settings', 'kudos'
    ]
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Public read %I" ON public.%I;', tbl, tbl);
        EXECUTE format('CREATE POLICY "Public read %I" ON public.%I FOR SELECT USING (true);', tbl, tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Super admin write %I" ON public.%I;', tbl, tbl);
        EXECUTE format(
            'CREATE POLICY "Super admin write %I" ON public.%I FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());',
            tbl, tbl
        );
    END LOOP;
END $$;

-- 4b. Pengurus: publik baca, admin divisi kelola pengurus divisinya
DROP POLICY IF EXISTS "Public read members" ON public.members;
CREATE POLICY "Public read members" ON public.members FOR SELECT USING (true);
DROP POLICY IF EXISTS "Division admin write members" ON public.members;
CREATE POLICY "Division admin write members" ON public.members FOR ALL TO authenticated
    USING (public.can_manage_division(division_id))
    WITH CHECK (public.can_manage_division(division_id));

-- 4c. Acara: publik hanya melihat acara publik; admin melihat semua, menulis acara divisinya
DROP POLICY IF EXISTS "Read events" ON public.events;
CREATE POLICY "Read events" ON public.events FOR SELECT USING (is_public OR public.is_admin());
DROP POLICY IF EXISTS "Division admin write events" ON public.events;
CREATE POLICY "Division admin write events" ON public.events FOR ALL TO authenticated
    USING (public.can_manage_division(division_id))
    WITH CHECK (public.can_manage_division(division_id));

-- 4d. Galeri: publik baca, admin divisi kelola galeri divisi / acaranya
DROP POLICY IF EXISTS "Public read galleries" ON public.galleries;
CREATE POLICY "Public read galleries" ON public.galleries FOR SELECT USING (true);
DROP POLICY IF EXISTS "Division admin write galleries" ON public.galleries;
CREATE POLICY "Division admin write galleries" ON public.galleries FOR ALL TO authenticated
    USING (public.can_manage_division(division_id) OR public.can_manage_event(event_id))
    WITH CHECK (public.can_manage_division(division_id) OR public.can_manage_event(event_id));

-- 4e. Formulir: publik baca, super admin atau admin divisi pemilik acara terhubung menulis
DROP POLICY IF EXISTS "Public read forms" ON public.forms;
CREATE POLICY "Public read forms" ON public.forms FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin write forms" ON public.forms;
CREATE POLICY "Admin write forms" ON public.forms FOR ALL TO authenticated
    USING (public.is_super_admin() OR public.can_manage_event(event_id))
    WITH CHECK (public.is_super_admin() OR public.can_manage_event(event_id));

-- 4f. FAQ: publik melihat yang terbit & boleh mengirim pertanyaan (belum terbit)
DROP POLICY IF EXISTS "Read faqs" ON public.faqs;
CREATE POLICY "Read faqs" ON public.faqs FOR SELECT USING (is_published OR public.is_admin());
DROP POLICY IF EXISTS "Public ask faqs" ON public.faqs;
CREATE POLICY "Public ask faqs" ON public.faqs FOR INSERT TO anon, authenticated
    WITH CHECK (
        is_published = false
        AND char_length(question) BETWEEN 8 AND 1000
        AND char_length(coalesce(answer, '')) <= 5000
        AND char_length(coalesce(asked_by, '')) <= 120
    );
DROP POLICY IF EXISTS "Super admin write faqs" ON public.faqs;
CREATE POLICY "Super admin write faqs" ON public.faqs FOR ALL TO authenticated
    USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- 4g. Data pribadi: hanya admin yang berwenang atas formulir / acaranya
DROP POLICY IF EXISTS "Admin manage submissions" ON public.submissions;
CREATE POLICY "Admin manage submissions" ON public.submissions FOR ALL TO authenticated
    USING (public.can_manage_form(form_id)) WITH CHECK (public.can_manage_form(form_id));

DROP POLICY IF EXISTS "Admin manage event_rsvps" ON public.event_rsvps;
CREATE POLICY "Admin manage event_rsvps" ON public.event_rsvps FOR ALL TO authenticated
    USING (public.can_manage_event(event_id)) WITH CHECK (public.can_manage_event(event_id));

DROP POLICY IF EXISTS "Admin manage lucky_draws" ON public.lucky_draws;
CREATE POLICY "Admin manage lucky_draws" ON public.lucky_draws FOR ALL TO authenticated
    USING (public.can_manage_event(event_id)) WITH CHECK (public.can_manage_event(event_id));

-- 4h. Aspirasi: isi lengkap hanya super admin; publik membaca lewat get_public_aspirasi()
DROP POLICY IF EXISTS "Super admin manage aspirasi" ON public.aspirasi;
CREATE POLICY "Super admin manage aspirasi" ON public.aspirasi FOR ALL TO authenticated
    USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- 4i. Like kudos: hanya lewat toggle_kudos_like(); super admin boleh membersihkan
DROP POLICY IF EXISTS "Super admin manage kudos_likes" ON public.kudos_likes;
CREATE POLICY "Super admin manage kudos_likes" ON public.kudos_likes FOR ALL TO authenticated
    USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- 4j. Profil admin: admin melihat profilnya sendiri, super admin mengelola semuanya
DROP POLICY IF EXISTS "Read admin_profiles" ON public.admin_profiles;
CREATE POLICY "Read admin_profiles" ON public.admin_profiles FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR public.is_super_admin());
DROP POLICY IF EXISTS "Super admin write admin_profiles" ON public.admin_profiles;
CREATE POLICY "Super admin write admin_profiles" ON public.admin_profiles FOR ALL TO authenticated
    USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- ------------------------------------------------------------------------------
-- 5. RPC publik (SECURITY DEFINER, hanya mengembalikan data seperlunya)
-- ------------------------------------------------------------------------------

-- Tenggat formulir berupa jam dinding WIB. Kolom forms.deadline (TIMESTAMPTZ) menyimpan
-- digit jam WIB berlabel UTC (contoh "2026-11-17 11:00:00+00" = 11.00 WIB), sehingga
-- fungsi ini menerima teks "YYYY-MM-DD[THH:MM[:SS]]" dan menafsirkannya sebagai WIB.
-- Tanpa jam berarti akhir hari; tanpa detik berarti detik ke-59 (sama dengan tampilan web).
CREATE OR REPLACE FUNCTION public.parse_wib_deadline(p_deadline TEXT)
RETURNS TIMESTAMPTZ LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
DECLARE
    m TEXT[];
    v_time TEXT;
BEGIN
    IF p_deadline IS NULL OR btrim(p_deadline) = '' THEN
        RETURN NULL;
    END IF;
    m := regexp_match(btrim(p_deadline), '^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2})(:\d{2})?)?');
    IF m IS NULL THEN
        RETURN NULL;
    END IF;
    v_time := CASE WHEN m[2] IS NULL THEN '23:59:59' ELSE m[2] || coalesce(m[3], ':59') END;
    RETURN ((m[1] || ' ' || v_time)::TIMESTAMP) AT TIME ZONE 'Asia/Jakarta';
EXCEPTION WHEN others THEN
    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.form_deadline_wib(p_deadline TIMESTAMPTZ)
RETURNS TIMESTAMPTZ LANGUAGE sql IMMUTABLE SET search_path = public AS $$
    SELECT CASE WHEN p_deadline IS NULL THEN NULL
        ELSE (p_deadline AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Jakarta' END;
$$;

-- Jumlah pendaftar per formulir (tanpa yang ditolak) & jumlah RSVP per acara publik
CREATE OR REPLACE FUNCTION public.get_registration_counts()
RETURNS TABLE (kind TEXT, ref_id TEXT, total INT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT 'form'::TEXT, s.form_id, count(*)::INT
    FROM public.submissions s
    WHERE s.form_id IS NOT NULL AND s.status NOT IN ('Rejected', 'Ditolak')
    GROUP BY s.form_id
    UNION ALL
    SELECT 'event'::TEXT, r.event_id, count(*)::INT
    FROM public.event_rsvps r
    JOIN public.events e ON e.id = r.event_id AND e.is_public
    GROUP BY r.event_id;
$$;

-- Daftar rekan yang sudah konfirmasi hadir (nama, unit & mode kehadiran saja)
CREATE OR REPLACE FUNCTION public.get_event_attendees(p_event_id TEXT)
RETURNS TABLE (id TEXT, attendee_name TEXT, department_id TEXT, attendance_mode TEXT, created_at TIMESTAMPTZ)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT r.id, r.attendee_name, r.department_id, r.attendance_mode, r.created_at
    FROM public.event_rsvps r
    JOIN public.events e ON e.id = r.event_id AND e.is_public
    WHERE r.event_id = p_event_id
    ORDER BY r.created_at DESC
    LIMIT 50;
$$;

-- Cek apakah nilai pada field unik sudah pernah didaftarkan (hanya untuk field bertanda isUnique)
CREATE OR REPLACE FUNCTION public.is_submission_value_taken(p_form_id TEXT, p_field_id TEXT, p_value TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.forms f, jsonb_array_elements(f.fields) fld
        WHERE f.id = p_form_id AND fld->>'id' = p_field_id AND fld->>'isUnique' = 'true'
    )
    AND EXISTS (
        SELECT 1 FROM public.submissions s
        WHERE s.form_id = p_form_id
          AND lower(btrim(s.data->>p_field_id)) = lower(btrim(p_value))
    );
$$;

-- Pelacak status mandiri: cocok persis dengan ID pendaftaran atau field indeks pencarian
CREATE OR REPLACE FUNCTION public.track_submissions(p_query TEXT)
RETURNS TABLE (id TEXT, form_id TEXT, status TEXT, admin_notes TEXT, data JSONB, created_at TIMESTAMPTZ)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
#variable_conflict use_column
DECLARE
    q TEXT := lower(btrim(coalesce(p_query, '')));
    q_clean TEXT := regexp_replace(lower(btrim(coalesce(p_query, ''))), '\s+', '', 'g');
    q_digits TEXT := regexp_replace(coalesce(p_query, ''), '\D', '', 'g');
BEGIN
    IF char_length(q) < 3 THEN
        RETURN;
    END IF;
    RETURN QUERY
    SELECT s.id, s.form_id, s.status, s.admin_notes, s.data, s.created_at
    FROM public.submissions s
    JOIN public.forms f ON f.id = s.form_id
    WHERE f.requires_tracking IS NOT FALSE
      AND (
        lower(s.id) IN (q, q_clean)
        OR EXISTS (
            SELECT 1 FROM jsonb_array_elements(f.fields) fld
            WHERE fld->>'isSearchIndex' = 'true'
              AND (
                lower(btrim(s.data->>(fld->>'id'))) = q
                OR regexp_replace(lower(s.data->>(fld->>'id')), '\s+', '', 'g') = q_clean
                OR (char_length(q_digits) >= 4 AND regexp_replace(s.data->>(fld->>'id'), '\D', '', 'g') = q_digits)
              )
        )
      )
    ORDER BY s.created_at DESC
    LIMIT 20;
END;
$$;

-- Pengumuman peserta diterima: hanya nama & keterangan singkat, untuk formulir yang mengaktifkannya
CREATE OR REPLACE FUNCTION public.get_accepted_submissions(p_form_id TEXT)
RETURNS TABLE (id TEXT, form_id TEXT, created_at TIMESTAMPTZ, admin_notes TEXT, participant_name TEXT, participant_detail TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    WITH form_fields AS (
        SELECT fld->>'id' AS fid, coalesce(fld->>'label', '') AS label, ord
        FROM public.forms f, jsonb_array_elements(f.fields) WITH ORDINALITY AS t(fld, ord)
        WHERE f.id = p_form_id AND f.is_show_accepted AND coalesce(fld->>'type', '') <> 'file'
    ),
    name_field AS (
        SELECT fid FROM form_fields
        ORDER BY (label ~* '(nama|name|squad|tim)') DESC, ord
        LIMIT 1
    ),
    detail_field AS (
        SELECT fid FROM form_fields
        WHERE fid IS DISTINCT FROM (SELECT fid FROM name_field)
        ORDER BY (label ~* '(unit|department|departemen|dept|divisi|pilihan)') DESC, ord
        LIMIT 1
    )
    SELECT
        s.id,
        s.form_id,
        s.created_at,
        s.admin_notes,
        coalesce(nullif(s.data->>(SELECT fid FROM name_field), ''), 'Peserta Terpilih'),
        coalesce(s.data->>(SELECT fid FROM detail_field), '')
    FROM public.submissions s
    WHERE s.form_id = p_form_id
      AND s.status IN ('Accepted', 'Diterima')
      AND EXISTS (SELECT 1 FROM form_fields)
    ORDER BY s.created_at;
$$;

-- Pendaftaran formulir publik: kunci baris formulir agar kuota & keunikan diperiksa atomik
CREATE OR REPLACE FUNCTION public.submit_form(p_form_id TEXT, p_data JSONB, p_files JSONB DEFAULT '{}'::jsonb)
RETURNS TEXT LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_form public.forms%ROWTYPE;
    v_deadline TIMESTAMPTZ;
    v_count INT;
    v_field JSONB;
    v_value TEXT;
    v_id TEXT := 'sub-' || gen_random_uuid()::TEXT;
BEGIN
    IF p_data IS NULL OR jsonb_typeof(p_data) <> 'object' THEN
        RAISE EXCEPTION 'INVALID_PAYLOAD';
    END IF;
    IF octet_length(p_data::TEXT) > 50000 OR octet_length(coalesce(p_files, '{}'::jsonb)::TEXT) > 20000 THEN
        RAISE EXCEPTION 'PAYLOAD_TOO_LARGE';
    END IF;

    SELECT * INTO v_form FROM public.forms WHERE id = p_form_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'FORM_NOT_FOUND';
    END IF;
    IF v_form.is_open IS FALSE THEN
        RAISE EXCEPTION 'FORM_CLOSED';
    END IF;

    v_deadline := public.form_deadline_wib(v_form.deadline);
    IF v_deadline IS NOT NULL AND now() > v_deadline THEN
        RAISE EXCEPTION 'FORM_DEADLINE_PASSED';
    END IF;

    IF v_form.is_limited AND v_form.max_quota > 0 THEN
        SELECT count(*) INTO v_count
        FROM public.submissions
        WHERE form_id = p_form_id AND status NOT IN ('Rejected', 'Ditolak');
        IF v_count >= v_form.max_quota THEN
            RAISE EXCEPTION 'FORM_QUOTA_FULL';
        END IF;
    END IF;

    FOR v_field IN SELECT * FROM jsonb_array_elements(v_form.fields) LOOP
        IF v_field->>'isUnique' = 'true' THEN
            v_value := lower(btrim(p_data->>(v_field->>'id')));
            IF v_value IS NOT NULL AND v_value <> '' AND EXISTS (
                SELECT 1 FROM public.submissions s
                WHERE s.form_id = p_form_id AND lower(btrim(s.data->>(v_field->>'id'))) = v_value
            ) THEN
                RAISE EXCEPTION 'FORM_DUPLICATE:%', v_field->>'id';
            END IF;
        END IF;
    END LOOP;

    INSERT INTO public.submissions (id, form_id, data, files, status, admin_notes)
    VALUES (v_id, p_form_id, p_data, coalesce(p_files, '{}'::jsonb), 'Submitted', '');

    RETURN v_id;
END;
$$;

-- RSVP publik: hanya untuk acara publik, kuota acara diperiksa atomik
CREATE OR REPLACE FUNCTION public.submit_rsvp(
    p_event_id TEXT, p_attendee_name TEXT, p_attendance_mode TEXT,
    p_notes TEXT DEFAULT '', p_department_id TEXT DEFAULT NULL
)
RETURNS TEXT LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_event public.events%ROWTYPE;
    v_count INT;
    v_dept TEXT := nullif(btrim(coalesce(p_department_id, '')), '');
    v_id TEXT := 'rsvp-' || gen_random_uuid()::TEXT;
BEGIN
    IF char_length(btrim(coalesce(p_attendee_name, ''))) NOT BETWEEN 1 AND 120
       OR char_length(coalesce(p_notes, '')) > 500
       OR char_length(coalesce(p_attendance_mode, '')) > 60 THEN
        RAISE EXCEPTION 'INVALID_PAYLOAD';
    END IF;
    IF v_dept IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.departments WHERE id = v_dept) THEN
        v_dept := NULL;
    END IF;

    SELECT * INTO v_event FROM public.events WHERE id = p_event_id AND is_public FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'EVENT_NOT_FOUND';
    END IF;

    IF v_event.is_limited AND v_event.max_quota > 0 THEN
        SELECT count(*) INTO v_count FROM public.event_rsvps WHERE event_id = p_event_id;
        IF v_count >= v_event.max_quota THEN
            RAISE EXCEPTION 'RSVP_QUOTA_FULL';
        END IF;
    END IF;

    INSERT INTO public.event_rsvps (id, event_id, department_id, attendee_name, attendance_mode, notes)
    VALUES (v_id, p_event_id, v_dept, btrim(p_attendee_name),
            coalesce(nullif(btrim(p_attendance_mode), ''), 'Hadir Onsite'), coalesce(btrim(p_notes), ''));

    RETURN v_id;
END;
$$;

-- Kudos publik: wajib salah satu dari 6 nilai AKHLAK
CREATE OR REPLACE FUNCTION public.submit_kudos(p_sender TEXT, p_recipient TEXT, p_category TEXT, p_message TEXT)
RETURNS TEXT LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_id TEXT := 'kd-' || gen_random_uuid()::TEXT;
BEGIN
    IF p_category IS NULL OR p_category NOT IN ('Amanah', 'Kompeten', 'Harmonis', 'Loyal', 'Adaptif', 'Kolaboratif') THEN
        RAISE EXCEPTION 'INVALID_CATEGORY';
    END IF;
    IF char_length(btrim(coalesce(p_recipient, ''))) NOT BETWEEN 1 AND 120
       OR char_length(btrim(coalesce(p_message, ''))) NOT BETWEEN 3 AND 1000
       OR char_length(coalesce(p_sender, '')) > 120 THEN
        RAISE EXCEPTION 'INVALID_PAYLOAD';
    END IF;

    INSERT INTO public.kudos (id, sender, recipient, category, message, likes)
    VALUES (v_id, coalesce(nullif(btrim(p_sender), ''), 'Anonim'), btrim(p_recipient), p_category, btrim(p_message), 1);

    RETURN v_id;
END;
$$;

-- Like / batal like kudos: satu like per perangkat, jumlah dihitung di database
CREATE OR REPLACE FUNCTION public.toggle_kudos_like(p_kudos_id TEXT, p_device_id TEXT)
RETURNS TABLE (liked BOOLEAN, likes INT)
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
#variable_conflict use_column
DECLARE
    v_deleted INT;
BEGIN
    IF char_length(coalesce(p_device_id, '')) NOT BETWEEN 8 AND 64 THEN
        RAISE EXCEPTION 'INVALID_PAYLOAD';
    END IF;
    PERFORM 1 FROM public.kudos WHERE id = p_kudos_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'KUDOS_NOT_FOUND';
    END IF;

    DELETE FROM public.kudos_likes WHERE kudos_id = p_kudos_id AND device_id = p_device_id;
    GET DIAGNOSTICS v_deleted = ROW_COUNT;

    IF v_deleted > 0 THEN
        UPDATE public.kudos SET likes = greatest(1, likes - 1), updated_at = now() WHERE id = p_kudos_id;
        RETURN QUERY SELECT false, k.likes FROM public.kudos k WHERE k.id = p_kudos_id;
    ELSE
        INSERT INTO public.kudos_likes (kudos_id, device_id) VALUES (p_kudos_id, p_device_id);
        UPDATE public.kudos SET likes = likes + 1, updated_at = now() WHERE id = p_kudos_id;
        RETURN QUERY SELECT true, k.likes FROM public.kudos k WHERE k.id = p_kudos_id;
    END IF;
END;
$$;

-- Aspirasi publik masuk berstatus "Menunggu Review"
CREATE OR REPLACE FUNCTION public.submit_aspirasi(p_sender TEXT, p_title TEXT, p_category TEXT, p_description TEXT, p_is_public BOOLEAN DEFAULT true)
RETURNS TEXT LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_id TEXT := 'asp-' || gen_random_uuid()::TEXT;
BEGIN
    IF char_length(btrim(coalesce(p_description, ''))) NOT BETWEEN 5 AND 3000
       OR char_length(coalesce(p_title, '')) > 200
       OR char_length(coalesce(p_category, '')) > 80
       OR char_length(coalesce(p_sender, '')) > 120 THEN
        RAISE EXCEPTION 'INVALID_PAYLOAD';
    END IF;

    INSERT INTO public.aspirasi (id, sender, title, category, description, status, admin_reply, is_public)
    VALUES (v_id, coalesce(nullif(btrim(p_sender), ''), 'Anonim'),
            coalesce(nullif(btrim(p_title), ''), left(btrim(p_description), 200)),
            coalesce(nullif(btrim(p_category), ''), 'Kegiatan & Event'),
            btrim(p_description), 'Menunggu Review', '', coalesce(p_is_public, true));

    RETURN v_id;
END;
$$;

-- Aspirasi yang ditandai publik (beserta status & balasan admin)
CREATE OR REPLACE FUNCTION public.get_public_aspirasi()
RETURNS TABLE (id TEXT, sender TEXT, title TEXT, category TEXT, description TEXT, status TEXT, admin_reply TEXT, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT a.id, a.sender, a.title, a.category, a.description, a.status, a.admin_reply, a.created_at, a.updated_at
    FROM public.aspirasi a
    WHERE a.is_public IS NOT FALSE
    ORDER BY a.created_at DESC
    LIMIT 200;
$$;

-- Kelola akun admin (super admin). Akun dibuat lebih dulu di Supabase Auth.
CREATE OR REPLACE FUNCTION public.assign_admin_role(p_email TEXT, p_role TEXT, p_division_id TEXT DEFAULT NULL, p_display_name TEXT DEFAULT '')
RETURNS UUID LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_user_id UUID;
BEGIN
    IF NOT public.is_super_admin() THEN
        RAISE EXCEPTION 'NOT_AUTHORIZED';
    END IF;
    SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = lower(btrim(p_email));
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'USER_NOT_FOUND';
    END IF;
    IF v_user_id = auth.uid() AND p_role <> 'super_admin' THEN
        RAISE EXCEPTION 'CANNOT_DEMOTE_SELF';
    END IF;

    INSERT INTO public.admin_profiles (user_id, email, display_name, role, division_id)
    VALUES (v_user_id, lower(btrim(p_email)), coalesce(p_display_name, ''), p_role,
            CASE WHEN p_role = 'division_admin' THEN p_division_id ELSE NULL END)
    ON CONFLICT (user_id) DO UPDATE SET
        email = EXCLUDED.email,
        display_name = EXCLUDED.display_name,
        role = EXCLUDED.role,
        division_id = EXCLUDED.division_id,
        updated_at = now();

    RETURN v_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_admin_role(p_user_id UUID)
RETURNS VOID LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF NOT public.is_super_admin() THEN
        RAISE EXCEPTION 'NOT_AUTHORIZED';
    END IF;
    IF p_user_id = auth.uid() THEN
        RAISE EXCEPTION 'CANNOT_REVOKE_SELF';
    END IF;
    DELETE FROM public.admin_profiles WHERE user_id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION
    public.parse_wib_deadline(TEXT),
    public.form_deadline_wib(TIMESTAMPTZ),
    public.get_registration_counts(),
    public.get_event_attendees(TEXT),
    public.is_submission_value_taken(TEXT, TEXT, TEXT),
    public.track_submissions(TEXT),
    public.get_accepted_submissions(TEXT),
    public.submit_form(TEXT, JSONB, JSONB),
    public.submit_rsvp(TEXT, TEXT, TEXT, TEXT, TEXT),
    public.submit_kudos(TEXT, TEXT, TEXT, TEXT),
    public.toggle_kudos_like(TEXT, TEXT),
    public.submit_aspirasi(TEXT, TEXT, TEXT, TEXT, BOOLEAN),
    public.get_public_aspirasi()
TO anon, authenticated;

GRANT EXECUTE ON FUNCTION
    public.assign_admin_role(TEXT, TEXT, TEXT, TEXT),
    public.revoke_admin_role(UUID)
TO authenticated;

-- ------------------------------------------------------------------------------
-- 6. Storage: publik hanya boleh mengunggah lampiran pendaftaran; sisanya admin
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('cnt-media', 'cnt-media', true, 20971520)
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 20971520;

DROP POLICY IF EXISTS "Public Access cnt-media" ON storage.objects;

DROP POLICY IF EXISTS "Public upload submission files" ON storage.objects;
CREATE POLICY "Public upload submission files" ON storage.objects FOR INSERT TO anon, authenticated
    WITH CHECK (
        bucket_id = 'cnt-media'
        AND (storage.foldername(name))[1] = 'submissions'
        AND lower(storage.extension(name)) IN (
            'pdf', 'png', 'jpg', 'jpeg', 'webp', 'gif', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'zip', 'rar'
        )
    );

DROP POLICY IF EXISTS "Admin manage media" ON storage.objects;
CREATE POLICY "Admin manage media" ON storage.objects FOR ALL TO authenticated
    USING (bucket_id = 'cnt-media' AND public.is_admin())
    WITH CHECK (bucket_id = 'cnt-media' AND public.is_admin());

-- ------------------------------------------------------------------------------
-- 7. Super admin pertama (jalankan sekali setelah membuat user di Authentication → Users):
--
--   INSERT INTO public.admin_profiles (user_id, email, role)
--   SELECT id, lower(email), 'super_admin' FROM auth.users WHERE lower(email) = lower('EMAIL_ADMIN_ANDA')
--   ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin', division_id = NULL, updated_at = now();
-- ------------------------------------------------------------------------------

NOTIFY pgrst, 'reload schema';

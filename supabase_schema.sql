-- ==============================================================================
-- SKEMA SUPABASE UNTUK CNT IT APD (CULTURE NETWORK TEAM GROUP IT APD)
-- Setiap fitur memiliki tabel terpisah sendiri dengan dukungan CRUD & Realtime Sync
-- ==============================================================================

-- Bersihkan tabel lama jika skema sebelumnya masih menggunakan UUID kosong
DROP TABLE IF EXISTS public.recruitment_applications CASCADE;
DROP TABLE IF EXISTS public.recruitment_campaigns CASCADE;
DROP TABLE IF EXISTS public.suggestions CASCADE;
DROP TABLE IF EXISTS public.kudos CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.members CASCADE;
DROP TABLE IF EXISTS public.divisions CASCADE;
DROP TABLE IF EXISTS public.tenures CASCADE;
DROP TABLE IF EXISTS public.galleries CASCADE;
DROP TABLE IF EXISTS public.forms CASCADE;
DROP TABLE IF EXISTS public.submissions CASCADE;
DROP TABLE IF EXISTS public.aspirasi CASCADE;
DROP TABLE IF EXISTS public.page_settings CASCADE;

-- 1. Tabel Master Periode Kepengurusan (tenures)
CREATE TABLE public.tenures (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    title TEXT NOT NULL,
    theme_tagline TEXT,
    hero_headline TEXT,
    hero_highlight TEXT,
    visi TEXT,
    misi JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT false,
    start_date TEXT,
    end_date TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabel Divisi Organisasi (divisions)
CREATE TABLE public.divisions (
    id TEXT PRIMARY KEY,
    tenure_id TEXT DEFAULT 'tenure-2026',
    name TEXT NOT NULL,
    slug TEXT,
    lead_name TEXT,
    lead_role TEXT,
    badge TEXT,
    color TEXT DEFAULT '#0284c7',
    icon TEXT DEFAULT 'Activity',
    motto TEXT,
    description TEXT,
    focus_areas JSONB DEFAULT '[]'::jsonb,
    requirements JSONB DEFAULT '[]'::jsonb,
    is_recruiting BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabel Struktur Pengurus & Anggota (members)
CREATE TABLE public.members (
    id TEXT PRIMARY KEY,
    tenure_id TEXT DEFAULT 'tenure-2026',
    division_id TEXT,
    category TEXT NOT NULL,
    name TEXT NOT NULL,
    short_name TEXT,
    role TEXT NOT NULL,
    title TEXT,
    image TEXT,
    badge TEXT,
    color TEXT,
    whatsapp TEXT,
    motto TEXT,
    responsibilities JSONB DEFAULT '[]'::jsonb,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Tabel Program Kerja & Kalender Budaya (events)
CREATE TABLE public.events (
    id TEXT PRIMARY KEY,
    tenure_id TEXT DEFAULT 'tenure-2026',
    division_id TEXT,
    division_name TEXT,
    title TEXT NOT NULL,
    date TEXT,
    start_date TEXT,
    end_date TEXT,
    badge TEXT,
    location TEXT,
    kpi TEXT,
    description TEXT,
    total_rab NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'Upcoming',
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Tabel Galeri Dokumentasi Kegiatan (galleries)
CREATE TABLE public.galleries (
    id TEXT PRIMARY KEY,
    tenure_id TEXT DEFAULT 'tenure-2026',
    title TEXT NOT NULL,
    date TEXT,
    division TEXT,
    description TEXT,
    photos JSONB DEFAULT '[]'::jsonb,
    doc_links JSONB DEFAULT '[]'::jsonb,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Tabel Wall of Kudos / Apresiasi (kudos)
CREATE TABLE public.kudos (
    id TEXT PRIMARY KEY,
    sender TEXT NOT NULL,
    recipient TEXT NOT NULL,
    category TEXT DEFAULT 'Kolaboratif',
    message TEXT NOT NULL,
    likes INT DEFAULT 1,
    date TEXT,
    exact_timestamp TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Tabel Kotak Ide & Aspirasi Budaya (aspirasi)
CREATE TABLE public.aspirasi (
    id TEXT PRIMARY KEY,
    sender TEXT DEFAULT 'Anonim',
    title TEXT DEFAULT '',
    category TEXT DEFAULT 'Kegiatan & Event',
    description TEXT DEFAULT '',
    text TEXT NOT NULL,
    submitted_at TEXT,
    status TEXT NOT NULL DEFAULT 'Menunggu Review',
    admin_reply TEXT DEFAULT '',
    is_public BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Tabel Formulir Pendaftaran Dinamis (forms)
CREATE TABLE public.forms (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    subtitle TEXT,
    category TEXT,
    batch TEXT,
    deadline TEXT,
    is_open BOOLEAN DEFAULT true,
    banner_image TEXT,
    description TEXT,
    fields JSONB DEFAULT '[]'::jsonb,
    timeline JSONB DEFAULT '[]'::jsonb,
    benefits JSONB DEFAULT '[]'::jsonb,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Tabel Berkas Pendaftaran Masuk (submissions)
CREATE TABLE public.submissions (
    id TEXT PRIMARY KEY,
    form_id TEXT,
    form_title TEXT,
    submitted_at TEXT,
    status TEXT NOT NULL DEFAULT 'Submitted',
    admin_notes TEXT DEFAULT '',
    data JSONB DEFAULT '{}'::jsonb,
    files JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Tabel Pengaturan Visibilitas Halaman & Konfigurasi Global (page_settings)
CREATE TABLE public.page_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 11. Tabel Katalog Asset Logo & Template Resmi (brand_assets)
CREATE TABLE public.brand_assets (
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

-- 12. Tabel Daftar Hadir & Konfirmasi RSVP Kegiatan (event_rsvps)
CREATE TABLE public.event_rsvps (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL,
    event_title TEXT NOT NULL,
    attendee_name TEXT NOT NULL,
    squad_unit TEXT NOT NULL,
    attendance_mode TEXT NOT NULL DEFAULT 'Hadir Onsite',
    notes TEXT DEFAULT '',
    submitted_at TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.tenures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kudos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aspirasi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

-- Policies for full client-side sync across devices
CREATE POLICY "Public full access tenures" ON public.tenures FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access divisions" ON public.divisions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access members" ON public.members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access events" ON public.events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access galleries" ON public.galleries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access kudos" ON public.kudos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access aspirasi" ON public.aspirasi FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access forms" ON public.forms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access submissions" ON public.submissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access page_settings" ON public.page_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access brand_assets" ON public.brand_assets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access event_rsvps" ON public.event_rsvps FOR ALL USING (true) WITH CHECK (true);

-- Storage Bucket for Media & Document Uploads (cnt-media)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('cnt-media', 'cnt-media', true, 20971520)
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 20971520;

CREATE POLICY "Public Access cnt-media" ON storage.objects FOR ALL TO anon, authenticated USING (bucket_id = 'cnt-media') WITH CHECK (bucket_id = 'cnt-media');

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

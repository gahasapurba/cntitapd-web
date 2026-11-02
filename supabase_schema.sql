-- ==============================================================================
-- SKEMA SUPABASE UNTUK CNT IT APD (CULTURE NETWORK TEAM GROUP IT APD)
-- Sistem Manajemen Organisasi Dinamis (Multi-Periode, Divisi Dinamis, Oprec, Kudos, Event)
-- ==============================================================================

-- 1. Tabel Master Periode Kepengurusan (Tenures)
CREATE TABLE IF NOT EXISTS public.tenures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL, -- e.g. "2026", "2025-2026"
    title VARCHAR(100) NOT NULL,       -- e.g. "Kepengurusan CNT IT APD 2026"
    theme_tagline TEXT,                -- e.g. "Synergy, Inovasi & Cultural Excellence"
    is_active BOOLEAN DEFAULT false,   -- periode yang saat ini sedang aktif
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabel Divisi Dinamis per Periode (Divisions)
CREATE TABLE IF NOT EXISTS public.divisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenure_id UUID REFERENCES public.tenures(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,         -- e.g. "Experience & Activity", "Creative Media"
    slug VARCHAR(100) NOT NULL,
    lead_name VARCHAR(150),
    lead_role VARCHAR(100),             -- e.g. "Pimpro Experience & Activity"
    badge VARCHAR(100),
    color VARCHAR(20) DEFAULT '#00529B',-- HEX color
    icon_name VARCHAR(50),              -- e.g. "Activity", "Heart", "Video", "Sparkles"
    motto TEXT,
    description TEXT,
    focus_areas TEXT[],                 -- Array of string
    is_recruiting BOOLEAN DEFAULT true, -- apakah divisi ini buka oprec
    order_index INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabel Struktur Pengurus Organisasi (Tenure Members)
CREATE TABLE IF NOT EXISTS public.members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenure_id UUID REFERENCES public.tenures(id) ON DELETE CASCADE,
    division_id UUID REFERENCES public.divisions(id) ON DELETE SET NULL,
    category VARCHAR(50) NOT NULL,      -- 'pembina', 'inti', 'pimpro', 'staff'
    name VARCHAR(150) NOT NULL,
    short_name VARCHAR(50),
    role VARCHAR(100) NOT NULL,         -- e.g. "Ketua", "Pimpro Creative Media", "Staff"
    title VARCHAR(150),
    nip VARCHAR(50),
    unit VARCHAR(100),                  -- e.g. "IT APD - Wealth Squad"
    email VARCHAR(150),
    image_url TEXT,
    badge VARCHAR(100),
    motto TEXT,
    responsibilities TEXT[],
    order_index INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Tabel Program Kerja & Event (Events & Activities)
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenure_id UUID REFERENCES public.tenures(id) ON DELETE CASCADE,
    division_id UUID REFERENCES public.divisions(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    target_time VARCHAR(100),           -- e.g. "Q1 2026", "April 2026"
    event_date TIMESTAMPTZ,
    location VARCHAR(150),              -- e.g. "Plaza Mandiri Lt. 12 / MS Teams"
    kpi_target VARCHAR(150),
    description TEXT,
    status VARCHAR(50) DEFAULT 'upcoming', -- 'upcoming', 'ongoing', 'completed'
    image_url TEXT,
    rsvp_link TEXT,
    total_budget NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Tabel Open Recruitment (Oprec Period & Applicants)
CREATE TABLE IF NOT EXISTS public.recruitment_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenure_id UUID REFERENCES public.tenures(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    is_open BOOLEAN DEFAULT true,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    banner_url TEXT,
    announcement_text TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.recruitment_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES public.recruitment_campaigns(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    nip VARCHAR(50) NOT NULL,
    unit_squad VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    whatsapp VARCHAR(50) NOT NULL,
    choice_div_1 UUID REFERENCES public.divisions(id) ON DELETE SET NULL,
    choice_div_2 UUID REFERENCES public.divisions(id) ON DELETE SET NULL,
    motivation TEXT NOT NULL,
    portfolio_url TEXT,
    status VARCHAR(50) DEFAULT 'submitted', -- 'submitted', 'review', 'interview', 'accepted', 'rejected'
    reviewer_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Tabel Wall of Kudos / Peer Recognition (AKHLAK Appreciation)
CREATE TABLE IF NOT EXISTS public.kudos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenure_id UUID REFERENCES public.tenures(id) ON DELETE CASCADE,
    sender_name VARCHAR(150) NOT NULL,
    sender_nip VARCHAR(50),
    recipient_name VARCHAR(150) NOT NULL,
    recipient_unit VARCHAR(100),
    category VARCHAR(50) DEFAULT 'Sinergi', -- Amanah, Kompeten, Harmonis, Loyal, Adaptif, Kolaboratif
    message TEXT NOT NULL,
    likes_count INT DEFAULT 0,
    is_approved BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Tabel Aspirasi & Ide Budaya (Suggestion Box)
CREATE TABLE IF NOT EXISTS public.suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150),
    is_anonymous BOOLEAN DEFAULT true,
    category VARCHAR(100),             -- "Kegiatan", "Fasilitas", "Wellbeing", "Lainnya"
    idea_title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    upvotes INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.tenures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruitment_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruitment_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kudos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;

-- Read policies for public
CREATE POLICY "Allow public read tenures" ON public.tenures FOR SELECT USING (true);
CREATE POLICY "Allow public read divisions" ON public.divisions FOR SELECT USING (true);
CREATE POLICY "Allow public read members" ON public.members FOR SELECT USING (true);
CREATE POLICY "Allow public read events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Allow public read recruitment_campaigns" ON public.recruitment_campaigns FOR SELECT USING (true);
CREATE POLICY "Allow public read kudos" ON public.kudos FOR SELECT USING (is_approved = true);

-- Insert policies for public (Form Submission)
CREATE POLICY "Allow public apply recruitment" ON public.recruitment_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public send kudos" ON public.kudos FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public send suggestions" ON public.suggestions FOR INSERT WITH CHECK (true);

-- ==============================================================================
-- SEED DATA MASTER CNT IT APD (Default Initial & Master Data)
-- Jalankan berkas ini setelah supabase_schema.sql untuk memulihkan seluruh data master
-- Terakhir Diperbarui: 2026-11-19 (Oleh Antigravity AI - Status: Sinkron)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- Table: tenures (1 rows)
-- ------------------------------------------------------------------------------
INSERT INTO public.tenures (id, code, title, theme_tagline, hero_headline, hero_highlight, visi, misi, is_active, sort_order, created_at, updated_at)
VALUES ('tenure-2027', '2027', 'Kepengurusan CNT IT APD 2027', 'Elevating Culture, Tech Synergy & Human Excellence', 'COMMITTED TO CULTIVATE', 'EXCELLENCE & SYNERGY', 'Menjadi katalisator utama dalam membangun ekosistem kerja IT Application Delivery yang kolaboratif, inklusif, dan berenergi tinggi untuk mendukung transformasi digital Bank Mandiri.', '["Merancang dan menyelenggarakan program kebersamaan, team bonding, serta acara interaktif yang mempererat keakraban, meningkatkan moral tim, dan menciptakan lingkungan kerja yang dinamis serta menyenangkan.","Berfokus pada kesehatan fisik dan mental pegawai secara holistik, serta memastikan terciptanya keseimbangan antara kehidupan kerja dan pribadi (work-life balance) demi kenyamanan dan produktivitas berkelanjutan.","Mengelola komunikasi internal yang kreatif, informatif, dan inspiratif melalui berbagai kanal media untuk memperkuat employer branding internal, menyebarkan energi positif, serta merayakan setiap pencapaian tim.","Menfasilitasi wadah bagi pegawai untuk mengeksplorasi minat, hobi, dan talenta di luar pekerjaan formal, guna menumbuhkan budaya inovasi, apresiasi bakat, dan kolaborasi lintas fungsi yang kuat."]'::jsonb, true, 0, '2026-11-03 09:19:31.50168+00', '2026-11-16 03:31:24.413+00')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- Table: tenure_roles (6 rows)
-- ------------------------------------------------------------------------------
INSERT INTO public.tenure_roles (id, tenure_id, name, level, max_quota, requires_division, sort_order, created_at, updated_at)
VALUES ('role-2027-pembina', 'tenure-2027', 'Pembina', 1, 1, false, 0, '2026-11-06 08:12:43.637873+00', '2026-11-08 17:02:02.985+00')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.tenure_roles (id, tenure_id, name, level, max_quota, requires_division, sort_order, created_at, updated_at)
VALUES ('role-2027-ketua', 'tenure-2027', 'Ketua', 2, 1, false, 1, '2026-11-06 08:12:43.637873+00', '2026-11-08 17:02:02.985+00')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.tenure_roles (id, tenure_id, name, level, max_quota, requires_division, sort_order, created_at, updated_at)
VALUES ('role-2027-wakil', 'tenure-2027', 'Wakil Ketua', 2, 1, false, 2, '2026-11-06 08:12:43.637873+00', '2026-11-08 17:02:02.985+00')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.tenure_roles (id, tenure_id, name, level, max_quota, requires_division, sort_order, created_at, updated_at)
VALUES ('role-2027-sekben', 'tenure-2027', 'Sekretaris Bendahara', 3, 2, false, 3, '2026-11-06 08:12:43.637873+00', '2026-11-08 17:02:02.985+00')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.tenure_roles (id, tenure_id, name, level, max_quota, requires_division, sort_order, created_at, updated_at)
VALUES ('role-2027-pimpro', 'tenure-2027', 'Pimpro', 4, 4, true, 4, '2026-11-06 08:12:43.637873+00', '2026-11-08 17:02:02.985+00')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.tenure_roles (id, tenure_id, name, level, max_quota, requires_division, sort_order, created_at, updated_at)
VALUES ('role-2027-anggota', 'tenure-2027', 'Anggota Divisi', 5, 0, true, 5, '2026-11-06 08:12:43.637873+00', '2026-11-08 17:02:02.985+00')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- Table: departments (13 rows)
-- ------------------------------------------------------------------------------
INSERT INTO public.departments (id, name, code, description, sort_order, created_at, updated_at)
VALUES ('dept-cbd', 'IT Core Banking Development', 'CBD', 'Pengembangan dan pemeliharaan core banking system Bank Mandiri.', 1, '2026-11-05 15:53:21.402706+00', '2026-11-08 17:04:32.676+00')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.departments (id, name, code, description, sort_order, created_at, updated_at)
VALUES ('dept-cnd', 'IT Consumer Banking Development', 'CND', 'Pengembangan produk dan solusi layanan perbankan konsumer.', 2, '2026-11-05 15:53:21.402706+00', '2026-11-08 17:04:32.676+00')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.departments (id, name, code, description, sort_order, created_at, updated_at)
VALUES ('dept-dsd', 'IT PM 2', 'PM2', 'Project Management 2.', 3, '2026-11-05 15:53:21.402706+00', '2026-11-17 15:48:05.755+00')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.departments (id, name, code, description, sort_order, created_at, updated_at)
VALUES ('dept-esd', 'IT Enterprise Services Development', 'ESD', 'Solusi teknologi dan layanan enterprise lintas domain.', 4, '2026-11-05 15:53:21.402706+00', '2026-11-08 17:04:32.676+00')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.departments (id, name, code, description, sort_order, created_at, updated_at)
VALUES ('dept-fad', 'IT Financial & Accounting Development', 'FAD', 'Pengembangan sistem keuangan, akuntansi, dan pelaporan finansial.', 5, '2026-11-05 15:53:21.402706+00', '2026-11-17 15:43:57.502+00')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.departments (id, name, code, description, sort_order, created_at, updated_at)
VALUES ('dept-lcd', 'IT LOS & Collection Development', 'LCD', 'Pengembangan Loan Origination System dan otomasi proses penagihan.', 6, '2026-11-05 15:53:21.402706+00', '2026-11-08 17:04:32.676+00')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.departments (id, name, code, description, sort_order, created_at, updated_at)
VALUES ('dept-lbd', 'IT AI & Automation Development', 'AIAD', 'Pengembangan AI dan otomasi proses bisnis.', 7, '2026-11-05 15:53:21.402706+00', '2026-11-17 15:50:14.34+00')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.departments (id, name, code, description, sort_order, created_at, updated_at)
VALUES ('dept-mid', 'IT Middleware & Integration Development', 'MID', 'Pengembangan middleware, arsitektur integrasi sistem, dan API gateway.', 8, '2026-11-05 15:53:21.402706+00', '2026-11-08 17:04:32.676+00')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.departments (id, name, code, description, sort_order, created_at, updated_at)
VALUES ('dept-opd', 'IT Operation Platform Development', 'OPD', 'Pengembangan platform operasional IT dan pendukung kehandalan sistem.', 9, '2026-11-05 15:53:21.402706+00', '2026-11-08 17:04:32.676+00')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.departments (id, name, code, description, sort_order, created_at, updated_at)
VALUES ('dept-rcd', 'IT Risk & Compliance Development', 'RCD', 'Pengembangan sistem manajemen risiko, kepatuhan, dan regulasi IT.', 10, '2026-11-05 15:53:21.402706+00', '2026-11-08 17:04:32.676+00')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.departments (id, name, code, description, sort_order, created_at, updated_at)
VALUES ('dept-tibd', 'IT PM 1', 'PM1', 'Project Management 1.', 11, '2026-11-05 15:53:21.402706+00', '2026-11-17 15:47:37.273+00')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.departments (id, name, code, description, sort_order, created_at, updated_at)
VALUES ('dept-wbd', 'IT Wholesale Banking Development', 'WBD', 'Pengembangan solusi teknologi perbankan korporasi dan wholesale.', 12, '2026-11-05 15:53:21.402706+00', '2026-11-08 17:04:32.676+00')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.departments (id, name, code, description, sort_order, created_at, updated_at)
VALUES ('dept-dsdv', 'IT PM 3', 'PM3', 'Project Management 3.', 13, '2026-11-05 15:53:21.402706+00', '2026-11-17 15:48:51.622+00')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- Table: divisions (4 rows)
-- ------------------------------------------------------------------------------
INSERT INTO public.divisions (id, tenure_id, name, color, motto, description, focus_areas, is_recruiting, sort_order, created_at, updated_at)
VALUES ('div-exp', 'tenure-2027', 'Experience & Activity', '#0284c7', 'Bringing People Together, Making Work Memorable.', 'Divisi Experience & Activity adalah motor penggerak utama dalam menciptakan atmosfer kerja yang dinamis, interaktif, dan penuh energi di lingkungan IT Application Delivery. Divisi ini bertanggung jawab penuh atas perancangan dan eksekusi seluruh agenda engagement, acara kebersamaan (gathering), perayaan pencapaian tim (milestone celebration), serta aktivitas interaktif yang mempererat ikatan emosional antar pegawai.', '["Merancang Acara & Team Bonding","Meningkatkan Employee Experience","Membangun Budaya Apresiasi"]'::jsonb, false, 0, '2026-11-03 09:19:31.663875+00', '2026-11-15 09:01:52.839+00')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.divisions (id, tenure_id, name, color, motto, description, focus_areas, is_recruiting, sort_order, created_at, updated_at)
VALUES ('div-creative', 'tenure-2027', 'Creative Media', '#7c3aed', 'Creativity in Action, Stories That Connect.', 'Divisi Creative Media adalah corong komunikasi sekaligus dapur visual utama yang bertanggung jawab menyampaikan narasi, informasi, dan energi positif di lingkungan IT Application Delivery. Divisi ini mengubah setiap momen, pencapaian, dan informasi penting menjadi karya visual, konten kreatif, dan publikasi yang menarik, estetik, serta mudah dicerna.', '["Pengelolaan Kanal Komunikasi Internal","Produksi Konten Kreatif & Branding","Dokumentasi & Publikasi"]'::jsonb, false, 2, '2026-11-03 09:19:31.663875+00', '2026-11-15 09:01:54.704+00')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.divisions (id, tenure_id, name, color, motto, description, focus_areas, is_recruiting, sort_order, created_at, updated_at)
VALUES ('div-talent', 'tenure-2027', 'Talent & Interest', '#d97706', 'Explore Your Passion, Elevate Together.', 'Divisi Talent & Interest adalah wadah eksplorasi dan pengembangan diri bagi seluruh insan IT Application Delivery di luar rutinitas pekerjaan formal. Divisi ini berfokus untuk memfasilitasi, menyalurkan, dan merayakan berbagai potensi, hobi, serta minat khusus yang dimiliki oleh anggota tim—mulai dari bidang olahraga, seni, musik, e-sports, hingga keahlian non-teknis lainnya.', '["Wadah Pengembangan & Hobi","Penggalian & Apresiasi Talenta","Membangun Kolaborasi Lintas Fungsi"]'::jsonb, false, 3, '2026-11-03 09:19:31.663875+00', '2026-11-15 09:01:56.812+00')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.divisions (id, tenure_id, name, color, motto, description, focus_areas, is_recruiting, sort_order, created_at, updated_at)
VALUES ('div-wellbeing', 'tenure-2027', 'Collective Wellbeing', '#e11d48', 'Clear Mind, Stronger Together: Menjaga Keseimbangan, Merawat Kebersamaan.', 'Divisi Collective Wellbeing adalah pilar pendukung yang berdedikasi untuk memastikan kesehatan fisik, mental, dan emosional seluruh insan IT Application Delivery berada dalam kondisi prima. Divisi ini percaya bahwa produktivitas yang berkelanjutan bermula dari lingkungan kerja yang peduli, empatik, dan menyeimbangkan tuntutan profesional dengan kualitas hidup pribadi (work-life harmony).', '["Promosi Kesehatan Fisik & Mental","Mendorong Work-Life Balance","Membangun Ruang yang Aman & Suportif"]'::jsonb, false, 1, '2026-11-03 09:19:31.663875+00', '2026-11-15 09:01:53.77+00')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- Table: members (9 rows)
-- ------------------------------------------------------------------------------
INSERT INTO public.members (id, tenure_id, division_id, name, image, color, whatsapp, motto, responsibilities, sort_order, created_at, updated_at, role_id)
VALUES ('mem-adjie', 'tenure-2027', 'div-exp', 'Djiehaddan Edwardo', 'https://xarcxbfgeoetyhpqsick.supabase.co/storage/v1/object/public/cnt-media/members/1794217341355_IMG_4059.png', '#0284c7', '6281268985791', 'Menciptakan Experience Event Internal yang Membekas & Bermakna', '["Perencanaan dan eksekusi event CNT IT APD","Penyusunan rundown dan koordinasi PIC acara lapangan"]'::jsonb, 5, '2026-11-03 09:19:31.738304+00', '2026-11-16 08:34:06.431+00', 'role-2027-pimpro')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.members (id, tenure_id, division_id, name, image, color, whatsapp, motto, responsibilities, sort_order, created_at, updated_at, role_id)
VALUES ('mem-daffa', 'tenure-2027', NULL, 'M. Daffa’ Aflah Syarif', 'https://xarcxbfgeoetyhpqsick.supabase.co/storage/v1/object/public/cnt-media/members/ketua-daffa.jpg', '#FFB800', '6283115930206', 'Menavigasi Inovasi & Cultural Synergy Group IT APD', '["Memimpin strategi & arah gerakan budaya CNT IT APD","Bridging antara Manajemen Group IT APD dengan seluruh Officer","Mengawasi eksekusi seluruh program kerja Pimpro & anggaran"]'::jsonb, 1, '2026-11-03 09:19:31.738304+00', '2026-11-19 07:41:25.857432+00', 'role-2027-ketua')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.members (id, tenure_id, division_id, name, image, color, whatsapp, motto, responsibilities, sort_order, created_at, updated_at, role_id)
VALUES ('mem-rizqi', 'tenure-2027', NULL, 'M. Rizqi Fiqih Thalib', 'https://xarcxbfgeoetyhpqsick.supabase.co/storage/v1/object/public/cnt-media/members/wakil-rizqi.jpg', '#38bdf8', '628124295884', 'Eksekusi Presisi, Solutif, & Kolaborasi Lintas Tim', '["Pendampingan eksekusi operasional bulanan seluruh Pimpro","Koordinasi kebutuhan logistik, venue, dan kelancaran kegiatan","Evaluasi performa KPI & partisipasi peserta event"]'::jsonb, 2, '2026-11-03 09:19:31.738304+00', '2026-11-19 07:41:26.146894+00', 'role-2027-wakil')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.members (id, tenure_id, division_id, name, image, color, whatsapp, motto, responsibilities, sort_order, created_at, updated_at, role_id)
VALUES ('mem-maurren', 'tenure-2027', NULL, 'Maurren Mentari Putri', 'https://xarcxbfgeoetyhpqsick.supabase.co/storage/v1/object/public/cnt-media/members/sekben1-maurren.jpg', '#c084fc', '62895610338746', 'Administrasi Tertib, Tata Kelola Keuangan & Akuntabel', '["Pengelolaan master arus kas & pencatatan inventaris barang CNT","Verifikasi pengajuan reimbursement, vendor payment & pengadaan","Penyusunan laporan pertanggungjawaban (LPJ) keuangan","Pencatatan korespondensi, absensi, dan notulensi rapat bulanan","Manajemen berkas dan dokumentasi arsip kegiatan kepengurusan","Dukungan operasional kesekretariatan tim inti"]'::jsonb, 3, '2026-11-03 09:19:31.738304+00', '2026-11-19 07:41:26.425835+00', 'role-2027-sekben')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.members (id, tenure_id, division_id, name, image, color, whatsapp, motto, responsibilities, sort_order, created_at, updated_at, role_id)
VALUES ('mem-gahasa', 'tenure-2027', 'div-creative', 'Gahasa Timothius B.P. Purba', 'https://xarcxbfgeoetyhpqsick.supabase.co/storage/v1/object/public/cnt-media/members/1794817984159_pimpro-gahasa.png', '#7c3aed', '628116120030', 'Visualisasi Modern, Content Creation & Branding Kit', '["Memimpin produksi media promosi, dokumentasi foto & video","Pengelolaan gear kamera dan standar branding visual IT APD"]'::jsonb, 7, '2026-11-03 09:19:31.738304+00', '2026-11-16 08:33:04.963+00', 'role-2027-pimpro')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.members (id, tenure_id, division_id, name, image, color, whatsapp, motto, responsibilities, sort_order, created_at, updated_at, role_id)
VALUES ('mem-putra', 'tenure-2027', 'div-talent', 'Putra Pangabahan Sitorus', 'https://xarcxbfgeoetyhpqsick.supabase.co/storage/v1/object/public/cnt-media/members/1794817934577_pimpro-putra.jpg', '#d97706', '6282167657314', 'Menggali Potensi & Semangat Juang Tim APD', '["Menggerakkan komunitas olahraga internal (Badminton, Futsal, dll)","Menginisiasi APD Cup dan sesi lainnya terkait sharing bakat pegawai"]'::jsonb, 8, '2026-11-03 09:19:31.738304+00', '2026-11-16 08:32:15.569+00', 'role-2027-pimpro')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.members (id, tenure_id, division_id, name, image, color, whatsapp, motto, responsibilities, sort_order, created_at, updated_at, role_id)
VALUES ('mem-pembina', 'tenure-2027', NULL, 'Allexander Gumawang', 'https://xarcxbfgeoetyhpqsick.supabase.co/storage/v1/object/public/cnt-media/members/pembina-allexander.png', '#FFB800', '6287843188644', 'Membimbing Visi, Terobosan Budaya, & Sinergi Organisasi', '["Memberikan arahan strategis kepemimpinan & budaya kerja CNT IT APD","Pengawasan keselarasan program dengan Direktorat IT Bank Mandiri","Pendampingan pengembangan potensi talenta pegawai Group IT APD"]'::jsonb, 0, '2026-11-03 09:19:31.738304+00', '2026-11-19 07:41:26.724708+00', 'role-2027-pembina')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.members (id, tenure_id, division_id, name, image, color, whatsapp, motto, responsibilities, sort_order, created_at, updated_at, role_id)
VALUES ('mem-maharani', 'tenure-2027', NULL, 'Maharani', 'https://xarcxbfgeoetyhpqsick.supabase.co/storage/v1/object/public/cnt-media/members/sekben2-maharani.jpg', '#f472b6', '6281912872343', 'Administrasi Tertib, Tata Kelola Keuangan & Akuntabel', '["Pengelolaan master arus kas & pencatatan inventaris barang CNT","Verifikasi pengajuan reimbursement, vendor payment & pengadaan","Penyusunan laporan pertanggungjawaban (LPJ) keuangan","Pencatatan korespondensi, absensi, dan notulensi rapat bulanan","Manajemen berkas dan dokumentasi arsip kegiatan kepengurusan","Dukungan operasional kesekretariatan tim inti"]'::jsonb, 4, '2026-11-03 09:19:31.738304+00', '2026-11-19 07:41:27.015463+00', 'role-2027-sekben')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.members (id, tenure_id, division_id, name, image, color, whatsapp, motto, responsibilities, sort_order, created_at, updated_at, role_id)
VALUES ('mem-irvin', 'tenure-2027', 'div-wellbeing', 'Irvin Andryan Pratomo', 'https://xarcxbfgeoetyhpqsick.supabase.co/storage/v1/object/public/cnt-media/members/pimpro-irvin.jpg', '#e11d48', '628116112711', 'Menebar Keberdampakan & Employee Well-being', '["Mengorganisir donor darah, charity, dan program kesehatan","Penyampaian apresiasi hari ulang tahun dan momen spesial insan APD"]'::jsonb, 6, '2026-11-03 09:19:31.738304+00', '2026-11-19 07:41:27.317681+00', 'role-2027-pimpro')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- Table: events (1 rows)
-- ------------------------------------------------------------------------------
INSERT INTO public.events (id, tenure_id, division_id, title, start_date, end_date, category, location, peserta, description, total_rab, status, sort_order, created_at, updated_at, is_limited, max_quota, is_public)
VALUES ('evt-1794928132198', 'tenure-2027', 'div-exp', 'Townhall IT APD', '2026-11-17T09:00', '2026-11-17T11:00', 'Townhall & Perayaan', 'Mandiri Digital Tower, Auditorium Lt. 6', 'Department Head (DH), Project Manager (PM), Team Leader (TL)', 'Townhall Group IT Application Delivery (IT APD) merupakan forum strategis untuk menyelaraskan visi, arah prioritas, dan target kinerja delivery aplikasi di lingkungan Bank Mandiri. Dihadiri oleh seluruh Department Head, Project Manager, dan Team Leader di Group IT APD, sesi ini menjadi momentum penting untuk mengevaluasi pencapaian terkini, membahas tantangan operasional di lapangan, serta memperkuat sinergi kepemimpinan dalam mengakselerasi inovasi dan keandalan layanan digital Bank Mandiri.', '1000000', 'Completed', 0, '2026-11-17 15:08:52.745334+00', '2026-11-19 04:34:17.615+00', true, 160, false)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- Table: galleries (9 rows)
-- ------------------------------------------------------------------------------
INSERT INTO public.galleries (id, title, date, description, photos, doc_links, sort_order, created_at, tenure_id, division_id, updated_at, event_id)
VALUES ('gal-1793751680415', 'Townhall IT APD 2026', '2026-10-05', 'Townhall IT APD adalah forum komunikasi strategis dan transparan yang diselenggarakan secara berkala bagi seluruh insan IT Application Delivery (APD) Bank Mandiri. Program ini menjadi wadah pertemuan utama antara manajemen dan seluruh anggota tim untuk memaparkan pencapaian (milestone), arah kebijakan strategis, evaluasi kinerja, serta sesi tanya jawab terbuka (Q&A), guna memastikan seluruh lini bergerak dengan pemahaman visi dan misi yang selaras.', '["https://xarcxbfgeoetyhpqsick.supabase.co/storage/v1/object/public/cnt-media/gallery/1793751677557_IMG_5251.jpg","https://xarcxbfgeoetyhpqsick.supabase.co/storage/v1/object/public/cnt-media/gallery/1793751678944_IMG_5260.jpg"]'::jsonb, '[{"url":"https://bankmandiri1.sharepoint.com/:f:/s/CNT2021/IgCX1mvdIB0MTpSibbXYcoKqAYgo6EFKCT0K5YpoGAbqllI?e=f3GoIJ","text":"Folder Dokumentasi (SharePoint)"},{"url":"https://mandiriangallery.bankmandiri.co.id","text":"Mandirian Gallery"}]'::jsonb, 2, '2026-11-04 00:21:20.76224+00', 'tenure-2027', 'div-exp', '2026-11-09 19:26:12.834+00', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.galleries (id, title, date, description, photos, doc_links, sort_order, created_at, tenure_id, division_id, updated_at, event_id)
VALUES ('gal-1794929720958', 'Townhall IT APD', '2026-11-17', 'Townhall Group IT Application Delivery (IT APD) merupakan forum strategis untuk menyelaraskan visi, arah prioritas, dan target kinerja delivery aplikasi di lingkungan Bank Mandiri. Dihadiri oleh seluruh Department Head, Project Manager, dan Team Leader di Group IT APD, sesi ini menjadi momentum penting untuk mengevaluasi pencapaian terkini, membahas tantangan operasional di lapangan, serta memperkuat sinergi kepemimpinan dalam mengakselerasi inovasi dan keandalan layanan digital Bank Mandiri.', '["https://xarcxbfgeoetyhpqsick.supabase.co/storage/v1/object/public/cnt-media/gallery/1794931462471_IMG_6368.jpeg","https://xarcxbfgeoetyhpqsick.supabase.co/storage/v1/object/public/cnt-media/gallery/1794931465121_IMG_6369.jpeg"]'::jsonb, '[{"url":"https://drive.google.com/drive/folders/1udunUHZ7O9_-EQSk7N-yuyrw44XPDk_k","text":"Folder Dokumentasi (Google Drive)"},{"url":"https://mandiriangallery.bankmandiri.co.id","text":"Mandirian Gallery"}]'::jsonb, 0, '2026-11-17 15:35:21.408985+00', 'tenure-2027', 'div-exp', '2026-11-17 16:06:07.121+00', 'evt-1794928132198')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.galleries (id, title, date, description, photos, doc_links, sort_order, created_at, tenure_id, division_id, updated_at, event_id)
VALUES ('gal-1793750560867', 'IT APD Fun Padel 2026', '2026-06-30', 'Fun Padel APD adalah agenda olahraga rekreasi yang diselenggarakan bagi seluruh insan IT Application Delivery (APD) Bank Mandiri untuk menjajal salah satu tren olahraga paling dinamis saat ini, yaitu padel tennis. Program ini dirancang bukan sekadar untuk menjaga kebugaran fisik dan kesehatan jantung, tetapi juga menjadi wadah refreshing yang seru dan santai di luar kantor guna mempererat keakraban, membangun sportivitas, serta melepas penat bersama rekan se-tim dalam suasana yang kompetitif namun tetap menyenangkan.', '["https://xarcxbfgeoetyhpqsick.supabase.co/storage/v1/object/public/cnt-media/gallery/1793750556364_IMG_5601.jpg","https://xarcxbfgeoetyhpqsick.supabase.co/storage/v1/object/public/cnt-media/gallery/1793750558615_IMG_5605.jpg"]'::jsonb, '[{"url":"https://bankmandiri1.sharepoint.com/:f:/s/CNT2021/IgDELeYE4FRIT7WnZkJ0H-chAdrd3QymiEoIJLmta7mg8MI?e=utt3cp","text":"Folder Dokumentasi (SharePoint)"},{"url":"https://mandiriangallery.bankmandiri.co.id/","text":"Mandirian Gallery"}]'::jsonb, 5, '2026-11-04 00:02:40.995796+00', 'tenure-2027', 'div-talent', '2026-11-09 19:26:12.834+00', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.galleries (id, title, date, description, photos, doc_links, sort_order, created_at, tenure_id, division_id, updated_at, event_id)
VALUES ('gal-1793751430855', 'HUT Bank Mandiri 2026', '2026-10-02', 'HUT Bank Mandiri (Internal APD) adalah rangkaian acara perayaan ulang tahun Bank Mandiri yang diselenggarakan secara khusus di lingkungan IT Application Delivery (APD). Program ini menjadi momen kebersamaan yang sarat makna untuk merayakan perjalanan panjang dan pencapaian Bank Mandiri, menumbuhkan kembali rasa memiliki (sense of belonging), serta memperkuat semangat juang seluruh insan APD untuk terus berkontribusi memberikan pelayanan dan inovasi terbaik bagi negeri.', '["https://xarcxbfgeoetyhpqsick.supabase.co/storage/v1/object/public/cnt-media/gallery/1793751429026_IMG_7038.jpg"]'::jsonb, '[{"url":"https://mandiriangallery.bankmandiri.co.id","text":"Mandirian Gallery"}]'::jsonb, 3, '2026-11-04 00:17:10.987765+00', 'tenure-2027', 'div-wellbeing', '2026-11-09 19:26:12.834+00', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.galleries (id, title, date, description, photos, doc_links, sort_order, created_at, tenure_id, division_id, updated_at, event_id)
VALUES ('gal-1793929530772', 'Appreciation Dinner Livin'' Food & Bullion Project 2026', '2026-10-23, 2026-10-26', 'Appreciation Dinner Livin’ Food & Bullion Project 2026 adalah malam apresiasi dan ramah tamah eksklusif yang dirancang sebagai bentuk penghargaan tertinggi atas dedikasi, kolaborasi, dan kontribusi seluruh tim lintas fungsi (IT, Business, Product, Operations, dan Eksternal Partner) dalam menyukseskan inisiatif strategis Livin’ Food serta layanan transaksi emas digital (Bullion Ecosystem) di Super App Livin’ by Mandiri.', '["https://xarcxbfgeoetyhpqsick.supabase.co/storage/v1/object/public/cnt-media/gallery/1793929527570_IMG_5808.jpg","https://xarcxbfgeoetyhpqsick.supabase.co/storage/v1/object/public/cnt-media/gallery/1793929529209_IMG_6100.jpg"]'::jsonb, '[{"url":"https://drive.google.com/drive/folders/1al9_VsTRmAGloxC_r7JY20GlrB69ENLw","text":"Folder Dokumentasi (Google Drive) Day 1 & Day 2"},{"url":"https://bankmandiri1.sharepoint.com/:f:/s/CNT2021/IgAICVXVGfBXTqeJBc6sMlJbAYM6T8PyzoB3iSeReshyMxc?e=u3cIbJ","text":"Folder Dokumentasi (SharePoint) Day 1 & Day 2"},{"url":"https://bankmandiri1-my.sharepoint.com/:f:/g/personal/gahasa_purba_bankmandiri_co_id/IgCl349BYn_eSpPrnJxiHi6wAVfxH1_YQXrF4tyGCnRJK4g?e=GMBM6Z","text":"Folder Dokumentasi (SharePoint) Day 2 - Tambahan"},{"url":"https://mandiriangallery.bankmandiri.co.id","text":"Mandirian Gallery"}]'::jsonb, 1, '2026-11-06 01:45:31.156796+00', 'tenure-2027', 'div-exp', '2026-11-09 19:26:12.834+00', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.galleries (id, title, date, description, photos, doc_links, sort_order, created_at, tenure_id, division_id, updated_at, event_id)
VALUES ('gal-1793751233451', 'APD Cup 2026', '2026-08', 'APD Cup adalah ajang kompetisi akbar dan festival tahunan di lingkungan IT Application Delivery (APD) Bank Mandiri yang mempertandingkan berbagai cabang olahraga sekaligus menampilkan perlombaan di bidang seni. Program ini dirancang untuk mewadahi seluruh potensi, hobi, dan talenta insan APD—baik di bidang fisik/sportivitas maupun kreativitas seni—guna mempererat kekompakan, memupuk semangat kebersamaan, dan merayakan energi positif lintas bagian dalam suasana kompetisi yang seru dan meriah.', '["https://xarcxbfgeoetyhpqsick.supabase.co/storage/v1/object/public/cnt-media/gallery/1793751226263_DSC00940.jpg","https://xarcxbfgeoetyhpqsick.supabase.co/storage/v1/object/public/cnt-media/gallery/1793751229657_WhatsApp_Image_2026-10-08_at_15_23_02.jpeg","https://xarcxbfgeoetyhpqsick.supabase.co/storage/v1/object/public/cnt-media/gallery/1793751229881_IMG_5946.jpg","https://xarcxbfgeoetyhpqsick.supabase.co/storage/v1/object/public/cnt-media/gallery/1793751231423_IMG_6177.jpg"]'::jsonb, '[{"url":"https://bankmandiri1.sharepoint.com/:f:/s/CNT2021/IgDLl9hT2o70TK3OFwnP-v_SAduwXMswCyUx9eYwhTNGmRg?e=7BCeou","text":"Folder Dokumentasi (SharePoint)"},{"url":"https://mandiriangallery.bankmandiri.co.id","text":"Mandirian Gallery"}]'::jsonb, 4, '2026-11-04 00:13:53.74198+00', 'tenure-2027', 'div-exp', '2026-11-09 19:26:12.834+00', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.galleries (id, title, date, description, photos, doc_links, sort_order, created_at, tenure_id, division_id, updated_at, event_id)
VALUES ('gal-1793750183681', 'Bimonthly IT APD 2026', '2026-05-15', 'Bimonthly APD adalah agenda rutin dua bulanan bagi seluruh insan IT Application Delivery (APD) Bank Mandiri yang dikemas sebagai sarana refreshment sekaligus pengembangan diri. Di setiap penyelenggaraannya, acara ini rutin menghadirkan sharing session interaktif bersama narasumber inspiratif—baik dari pakar industri, internal leader, maupun talenta berbakat—untuk membahas wawasan teknologi terbaru, tren industri, motivasi kerja, atau topik menarik lainnya. Selain memperkaya wawasan, agenda ini juga menjadi momen untuk merayakan pencapaian (milestone) tim, mempererat kebersamaan, dan menjaga semangat kolaborasi tetap membara.', '["https://xarcxbfgeoetyhpqsick.supabase.co/storage/v1/object/public/cnt-media/gallery/1793750182361_bimonthly.jpg"]'::jsonb, '[{"url":"https://mandiriangallery.bankmandiri.co.id/","text":"Mandirian Gallery"}]'::jsonb, 6, '2026-11-03 23:56:23.828579+00', 'tenure-2027', 'div-exp', '2026-11-09 19:26:12.834+00', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.galleries (id, title, date, description, photos, doc_links, sort_order, created_at, tenure_id, division_id, updated_at, event_id)
VALUES ('gal-1793749949449', 'Buka Bersama IT APD 2026', '2026-03-10', 'Bukber APD adalah agenda silaturahmi tahunan di bulan Ramadhan yang diselenggarakan bagi seluruh insan IT Application Delivery (APD) Bank Mandiri. Program ini dirancang bukan sekadar sebagai acara berbuka puasa bersama, tetapi juga menjadi momen hangat untuk mempererat keakraban lintas fungsi, melepas penat di tengah rutinitas pekerjaan, serta merayakan kebersamaan dalam suasana yang penuh kekeluargaan dan berkah.', '["https://xarcxbfgeoetyhpqsick.supabase.co/storage/v1/object/public/cnt-media/gallery/1793749942679_IMG_2736.jpg","https://xarcxbfgeoetyhpqsick.supabase.co/storage/v1/object/public/cnt-media/gallery/1793749944555_IMG_2749.jpg","https://xarcxbfgeoetyhpqsick.supabase.co/storage/v1/object/public/cnt-media/gallery/1793749947618_IMG_2770.jpg"]'::jsonb, '[{"url":"https://bankmandiri1.sharepoint.com/:f:/s/CNT2021/IgAigYx8gnTpRLOHeWqXatRBAXJkaXCucOlDOrBih6oZCdc?e=FB3Afl","text":"Folder Dokumentasi (SharePoint)"},{"url":"https://mandiriangallery.bankmandiri.co.id/","text":"Mandirian Gallery"}]'::jsonb, 7, '2026-11-03 23:52:29.581134+00', 'tenure-2027', 'div-exp', '2026-11-09 19:26:12.834+00', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.galleries (id, title, date, description, photos, doc_links, sort_order, created_at, tenure_id, division_id, updated_at, event_id)
VALUES ('gal-1793749606735', 'APD Care 2026', '2026-02-15', 'APD Care adalah program sosial kemanusiaan dan kepedulian internal dari grup IT Application Delivery (APD) Bank Mandiri yang berfokus untuk menebar kebaikan kepada para pilar pendukung operasional sehari-hari—seperti para pramubakti, driver, dan tenaga pendukung lainnya. Program ini menjadi wadah bagi seluruh insan IT APD untuk mengumpulkan dan menyalurkan uluran tangan, mempererat rasa kekeluargaan tanpa batas struktural, serta menghadirkan senyuman dan apresiasi nyata bagi mereka yang senantiasa membantu kelancaran aktivitas kita.', '["https://xarcxbfgeoetyhpqsick.supabase.co/storage/v1/object/public/cnt-media/gallery/1793749606366_WhatsApp_Image_2026-07-24_at_10_45_54.jpeg"]'::jsonb, '[{"url":"https://mandiriangallery.bankmandiri.co.id/","text":"Mandirian Gallery"}]'::jsonb, 8, '2026-11-03 23:46:46.926666+00', 'tenure-2027', 'div-wellbeing', '2026-11-09 19:26:12.834+00', NULL)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- Table: forms (2 rows)
-- ------------------------------------------------------------------------------
INSERT INTO public.forms (id, title, subtitle, category, deadline, is_open, fields, sort_order, created_at, requires_tracking, tenure_id, updated_at, is_show_accepted, is_limited, max_quota, is_event_connected, event_id, is_lucky_draw, notes)
VALUES ('form-1794929428146', 'Townhall IT APD', 'Formulir Kehadiran Townhall IT APD', 'Kegiatan & Event', '2026-11-17 11:00:00+00', true, '[{"id":"f-name","type":"text","label":"Nama Lengkap","_eventId":"evt-1794928132198","isUnique":false,"required":true,"_maxQuota":160,"_tenureId":"tenure-2027","_isLimited":true,"placeholder":"Nama pengisi formulir","_isLuckyDraw":false,"isSearchIndex":false,"_isShowAccepted":false,"_isEventConnected":true,"_requiresTracking":false,"_showAnnouncement":false},{"id":"f-feedback","type":"text","label":"Nomor Induk Pegawai (NIP)","isUnique":true,"required":true,"placeholder":"Tuliskan respon Anda...","isSearchIndex":false},{"id":"f-unit","type":"select","label":"Departemen","source":"departments","isUnique":false,"required":true,"isSearchIndex":false}]'::jsonb, 0, '2026-11-17 15:30:28.627343+00', false, 'tenure-2027', '2026-11-19 05:05:44.719+00', false, true, 160, true, 'evt-1794928132198', false, 'Terima kasih atas partisipasi Anda dalam Townhall IT APD! Silakan bergabung ke WhatsApp Group Koordinasi: https://chat.whatsapp.com/TownhallITAPD2026')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.forms (id, title, subtitle, category, deadline, is_open, fields, sort_order, created_at, requires_tracking, tenure_id, updated_at, is_show_accepted, is_limited, max_quota, is_event_connected, event_id, is_lucky_draw, notes)
VALUES ('form-oprec-2027', 'Open Recruitment Kepengurusan CNT IT APD 2027', 'Mari bergabung, berkolaborasi, dan kembangkan potensi terbaikmu bersama CNT IT APD. Jadilah bagian dari penggerak inovasi!', 'Rekrutmen', '2026-11-13 23:59:00+00', true, '[{"id":"f-fullName","type":"text","label":"Nama Lengkap","_eventId":"","required":true,"_maxQuota":0,"_tenureId":"tenure-2027","_isLimited":false,"placeholder":"Contoh: Gahasa Timothius","_isLuckyDraw":false,"isSearchIndex":false,"_isShowAccepted":false,"_isEventConnected":false,"_requiresTracking":true,"_showAnnouncement":false},{"id":"f-unitSquad","type":"select","label":"Departemen","source":"departments","options":[],"required":true,"placeholder":"Contoh: Squad Retail APD / Core Banking","isSearchIndex":false},{"id":"f-custom-1793717857001","type":"text","label":"NIP","required":true,"placeholder":"Masukkan jawaban...","isSearchIndex":false},{"id":"f-email","type":"email","label":"Email Bank Mandiri","required":true,"placeholder":"user@bankmandiri.co.id","isSearchIndex":false},{"id":"f-whatsapp","type":"text","label":"Nomor WhatsApp Aktif","required":true,"placeholder":"0812xxxxxxxx","isSearchIndex":false},{"id":"f-custom-1793718110786","type":"select","label":"Pilihan Divisi Utama (Pilihan 1)","source":"divisions","options":[],"required":true,"placeholder":"Masukkan jawaban...","isSearchIndex":false},{"id":"f-motivation","type":"textarea","label":"Alasan Memilih Divisi Utama (Pilihan 1)","required":true,"placeholder":"Ceritakan apa yang membuatmu tertarik bergabung...","isSearchIndex":false},{"id":"f-custom-1793718260604","type":"select","label":"Pilihan Divisi Alternatif (Pilihan 2)","source":"divisions","options":[],"required":true,"placeholder":"Masukkan jawaban...","isSearchIndex":false},{"id":"f-custom-1793718355330","type":"textarea","label":"Alasan Memilih Divisi Alternatif (Pilihan 2)","required":true,"placeholder":"Masukkan jawaban...","isSearchIndex":false},{"id":"f-cv","type":"textarea","label":"Pengalaman Organisasi","accept":".pdf,.png,.jpg,.jpeg","required":true,"isSearchIndex":false},{"id":"f-custom-1793718504997","type":"radio","label":"Apakah Pernah Menjadi Moderator / MC ?","options":["Pernah","Tidak Pernah"],"required":true,"placeholder":"Masukkan jawaban...","isSearchIndex":false},{"id":"f-custom-1793718584333","type":"textarea","label":"Pengen Ada Acara / Event Apa di CNT ?","required":true,"placeholder":"Masukkan jawaban...","isSearchIndex":false},{"id":"f-portfolioUrl","type":"text","label":"Link Portofolio / LinkedIn / CV (Opsional)","required":false,"placeholder":"https://...","isSearchIndex":false}]'::jsonb, 1, '2026-11-03 09:19:32.351649+00', true, 'tenure-2027', '2026-11-18 23:44:33.451+00', false, false, 0, false, NULL, false, 'Terima kasih telah mendaftar! Harap simpan ID Pendaftaran Anda dan bergabung ke WhatsApp Group Calon Pengurus CNT IT APD 2027: https://chat.whatsapp.com/CNTITAPD2027')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- Table: faqs (5 rows)
-- ------------------------------------------------------------------------------
INSERT INTO public.faqs (id, question, answer, category, sort_order, is_published, created_at, updated_at, asked_by)
VALUES ('faq-1', 'Apa itu Culture Network Team (CNT) IT Application Delivery?', 'Culture Network Team (CNT) IT Application Delivery (APD) adalah sebuah tim penggerak budaya (culture agent/team) di bawah lingkup grup IT Application Delivery (APD), Direktorat IT Bank Mandiri. Tim ini dibentuk sebagai wadah khusus untuk merancang, menggerakkan, dan menghidupkan ekosistem kerja yang positif, dinamis, kolaboratif, dan menyenangkan bagi seluruh pegawai di dalam grup IT APD.', 'Tentang CNT', 0, true, '2026-11-03 10:24:26.305608+00', '2026-11-11 17:50:18.995+00', 'Admin CNT')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.faqs (id, question, answer, category, sort_order, is_published, created_at, updated_at, asked_by)
VALUES ('faq-2', 'Apakah seluruh pegawai IT APD boleh mengikuti kegiatan olahraga & program CNT meskipun bukan pengurus?', 'Tentu saja! Seluruh kegiatan olahraga, event, hingga kompetisi yang diselenggarakan CNT terbuka untuk seluruh insan IT Application Delivery. Anda bisa melakukan konfirmasi hadir (RSVP) pada menu Program Kerja atau jika dibuka pendaftaran, anda dapat mendaftar melalui Hub Registrasi.', 'Kegiatan & Event', 1, true, '2026-11-03 10:24:26.305608+00', '2026-11-11 17:50:18.995+00', 'Admin CNT')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.faqs (id, question, answer, category, sort_order, is_published, created_at, updated_at, asked_by)
VALUES ('faq-3', 'Bagaimana cara mengusulkan kegiatan baru atau menyampaikan aspirasi lingkungan kerja?', 'Anda dapat membuka menu Apresiasi & Kudos lalu mengisi Kotak Aspirasi & Ide Kegiatan Budaya, atau menghubungi langsung Pimpro Divisi terkait melalui tombol Chat WhatsApp di halaman Organigram. Status tindak lanjut aspirasi juga dapat dipantau secara transparan di portal.', 'Aspirasi & Usulan', 2, true, '2026-11-03 10:24:26.305608+00', '2026-11-11 17:50:18.995+00', 'Admin CNT')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.faqs (id, question, answer, category, sort_order, is_published, created_at, updated_at, asked_by)
VALUES ('faq-4', 'Bagaimana cara mendaftar suatu event di CNT?', 'Setiap pembukaan pendaftaran event baru, akan diumumkan di halaman Registrasi dan Form.', 'Pendaftaran & Oprec', 3, true, '2026-11-03 10:24:26.305608+00', '2026-11-11 17:50:18.995+00', 'Admin CNT')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.faqs (id, question, answer, category, sort_order, is_published, created_at, updated_at, asked_by)
VALUES ('faq-5', 'Bagaimana cara bergabung menjadi pengurus CNT?', 'Setiap pembukaan rekrutmen pengurus baru, akan diumumkan di halaman Pendaftaran (Oprec). Setelah mengirim formulir, Anda dapat memantau tahapan seleksi secara mandiri melalui fitur Cek Status Pendaftaran & Seleksi Saya.', 'Pendaftaran & Oprec', 4, true, '2026-11-03 10:24:26.305608+00', '2026-11-11 17:50:18.995+00', 'Admin CNT')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- Table: brand_assets (2 rows)
-- ------------------------------------------------------------------------------
INSERT INTO public.brand_assets (id, title, category, description, file_url, preview_url, file_type, file_size, badge, sort_order, created_at, updated_at)
VALUES ('asset-1793748075050', 'New Logo CNT IT APD', 'Logo & Brand', 'Master Pack Logo Baru CNT IT APD, berisi file logo terbaru CNT IT APD dalam berbagai jenis.', 'https://xarcxbfgeoetyhpqsick.supabase.co/storage/v1/object/public/cnt-media/assets/1793748101298_CNTITAPD-LOGO.zip', 'https://xarcxbfgeoetyhpqsick.supabase.co/storage/v1/object/public/cnt-media/assets/1793748074808_01-APD_Master_Brand_Logo.png', 'ZIP', '390 KB', 'Master Pack', 0, '2026-11-03 23:21:15.193584+00', '2026-11-09 20:00:01.707+00')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.brand_assets (id, title, category, description, file_url, preview_url, file_type, file_size, badge, sort_order, created_at, updated_at)
VALUES ('asset-1793748243674', 'Legacy Logo CNT IT APD', 'Logo & Brand', 'File Logo Lama CNT IT APD.', 'https://xarcxbfgeoetyhpqsick.supabase.co/storage/v1/object/public/cnt-media/assets/1793748243148_cnt-logo.png', 'https://xarcxbfgeoetyhpqsick.supabase.co/storage/v1/object/public/cnt-media/assets/1793748243148_cnt-logo.png', 'PNG', '130 KB', 'Official Logo', 1, '2026-11-03 23:24:03.823408+00', '2026-11-09 20:00:01.707+00')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- Table: page_settings (3 rows)
-- ------------------------------------------------------------------------------
INSERT INTO public.page_settings (key, value, updated_at)
VALUES ('announcement_bar', '{"badge":"DIPERPANJANG !","ctaTab":"oprec","ctaText":"Daftar Disini","message":"Pendaftaran Open Recruitment Anggota CNT IT APD 2027 diperpanjang ! Segera daftarkan dirimu atau cek status seleksimu.","isActive":false}'::jsonb, '2026-11-16 08:20:30.124+00')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.page_settings (key, value, updated_at)
VALUES ('page_visibility', '{"form":true,"home":true,"event":true,"kudos":true,"oprec":true,"assets":true,"galeri":true,"navbar":true,"program":true,"organisasi":true}'::jsonb, '2026-11-15 09:15:36.416+00')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.page_settings (key, value, updated_at)
VALUES ('active_tenure_id', '{"id":"tenure-2027"}'::jsonb, '2026-11-16 03:31:24.413+00')
ON CONFLICT (key) DO NOTHING;


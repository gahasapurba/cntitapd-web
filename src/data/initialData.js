// Master Data CNT IT APD (Direktorat IT Bank Mandiri - Group IT Application Delivery)
// Digunakan sebagai default state & fallback dinamis saat Supabase belum terhubung

export const INITIAL_TENURES = [
  {
    id: 'tenure-2026',
    code: '2026',
    title: 'Kepengurusan CNT IT APD 2026',
    themeTagline: 'Elevating Culture, Tech Synergy & Human Excellence',
    isActive: true,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
  },
  {
    id: 'tenure-2025',
    code: '2025',
    title: 'Kepengurusan CNT IT APD 2025 (Arsip)',
    themeTagline: 'Ignite Together, Deliver with Agility',
    isActive: false,
    startDate: '2025-01-01',
    endDate: '2025-12-31',
  },
];

export const INITIAL_DIVISIONS = [
  {
    id: 'div-exp',
    tenureId: 'tenure-2026',
    name: 'Experience & Activity',
    slug: 'experience-activity',
    leadName: 'Djiehaddan Edwardo',
    leadRole: 'Pimpro Experience & Activity',
    badge: 'Experience & Activity Lead',
    color: '#0284c7', // Sky Blue
    icon: 'Activity',
    motto: 'Menciptakan Experience Event Internal yang Membekas & Bermakna',
    description:
      'Bertanggung jawab merancang, mengorkestrasi, dan mengeksekusi rangkaian kegiatan interaktif, championship, gathering, dan teambuilding untuk seluruh personil IT APD.',
    focusAreas: ['E-Sports & Championship', 'Grand IT APD Gathering', 'Internal Townhall & Fun Games', 'APD Outing'],
    isRecruiting: true,
    requirements: [
      'Memiliki passion dalam event organizing & MC/entertainment',
      'Komunikatif, gesit, dan menyukai crowd engagement',
      'Mampu mengoordinasikan logistik dan teknis acara secara rapi',
    ],
  },
  {
    id: 'div-wellbeing',
    tenureId: 'tenure-2026',
    name: 'Collective Wellbeing',
    slug: 'collective-wellbeing',
    leadName: 'Irvin Andryan Pratomo',
    leadRole: 'Pimpro Collective Wellbeing',
    badge: 'Collective Wellbeing Lead',
    color: '#e11d48', // Rose / Red
    icon: 'Heart',
    motto: 'Menebar Keberdampakan & Menjaga Kesejahteraan Insan APD',
    description:
      'Fokus pada program kepedulian sosial, kebugaran fisik & mental, serta inisiatif kemanusiaan yang membangun kehangatan serta work-life harmony.',
    focusAreas: ['Donor Darah & Health Check', 'Charity Ramadan & CSR', 'Birthday & Life Events Celebration', 'Mental Health Sharing'],
    isRecruiting: true,
    requirements: [
      'Memiliki empati tinggi dan kepedulian terhadap employee well-being',
      'Suka menjalin hubungan hangat dengan rekan kerja',
      'Tertarik mengelola program CSR, kesehatan, dan perayaan internal',
    ],
  },
  {
    id: 'div-creative',
    tenureId: 'tenure-2026',
    name: 'Creative Media',
    slug: 'creative-media',
    leadName: 'Gahasa Timothius B.P. Purba',
    leadRole: 'Pimpro Creative Media',
    badge: 'Creative Media Lead',
    color: '#7c3aed', // Neon Purple
    icon: 'Video',
    motto: 'Visualisasi Modern, Content Creation & Identitas Budaya yang Kuat',
    description:
      'Pusat branding, videografi, fotografi dokumentasi, publikasi media sosial, podcast, serta pembuatan materi digital dan visual kit standar IT APD.',
    focusAreas: ['Videografi & Aftermovie', 'Visual Identity & Branding Kit', 'Nikon Z50 Setup & Gear Support', 'Social Media & Bulletin'],
    isRecruiting: true,
    requirements: [
      'Tertarik pada desain grafis, fotografi, atau video editing (Canva, CapCut, Premiere, dsb.)',
      'Kreatif dan memahami tren visual modern & media sosial',
      'Memiliki kemauan belajar mengoperasikan kamera / konten multimedia',
    ],
  },
  {
    id: 'div-talent',
    tenureId: 'tenure-2026',
    name: 'Talent & Interest Lead',
    slug: 'talent-interest',
    leadName: 'Putra Pangabahan Sitorus',
    leadRole: 'Pimpro Talent & Interest Lead',
    badge: 'Talent & Interest Lead',
    color: '#d97706', // Amber Gold
    icon: 'Sparkles',
    motto: 'Menggali Potensi & Semangat Juang Talenta Terbaik IT APD',
    description:
      'Mengembangkan wadah minat, hobi, olahraga, serta Community of Practice (CoP) guna mengasah bakat non-teknis maupun kebersamaan lintas squad.',
    focusAreas: ['APD Got Talent', 'Sports Clubs (Badminton, Running, Mini Soccer)', 'Skill Sharing & Masterclass', 'Community of Practice'],
    isRecruiting: true,
    requirements: [
      'Antusias dalam bidang olahraga, seni, atau komunitas hobi',
      'Memiliki networking luas dan senang menggerakkan massa',
      'Mampu menjadi koordinator turnamen atau gathering komunitas',
    ],
  },
];

export const INITIAL_MEMBERS = [
  // Pembina
  {
    id: 'mem-pembina',
    tenureId: 'tenure-2026',
    category: 'pembina',
    name: 'Allexander Gumawang',
    shortName: 'Allexander',
    role: 'Pembina',
    title: 'Pembina / Senior Executive Advisor CNT',
    image: '/images/pembina-allexander.png',
    badge: 'Senior Executive Advisor',
    color: '#FFB800',
    motto: 'Membimbing Visi, Terobosan Budaya, & Sinergi Organisasi',
    responsibilities: [
      'Memberikan arahan strategis kepemimpinan & budaya kerja CNT IT APD',
      'Pengawasan keselarasan program dengan Direktorat IT Bank Mandiri',
      'Pendampingan pengembangan potensi talenta pegawai Group IT APD',
    ],
  },
  // Inti
  {
    id: 'mem-daffa',
    tenureId: 'tenure-2026',
    category: 'inti',
    name: 'M. Daffa’ Aflah Syarif',
    shortName: 'Daffa',
    role: 'Ketua',
    title: 'Ketua CNT IT APD',
    image: '/images/ketua-daffa.jpg',
    badge: 'Chief Executive Lead',
    color: '#FFB800',
    motto: 'Menavigasi Inovasi & Cultural Synergy Group IT APD',
    responsibilities: [
      'Memimpin strategi & arah gerakan budaya CNT IT APD',
      'Bridging antara Manajemen Group IT APD dengan seluruh Officer',
      'Mengawasi eksekusi seluruh program kerja Pimpro & anggaran',
    ],
  },
  {
    id: 'mem-rizqi',
    tenureId: 'tenure-2026',
    category: 'inti',
    name: 'M. Rizqi Fiqih Thalib',
    shortName: 'Rizqi',
    role: 'Wakil Ketua',
    title: 'Wakil Ketua CNT IT APD',
    image: '/images/wakil-rizqi.jpg',
    badge: 'Executive Operations Lead',
    color: '#38bdf8',
    motto: 'Eksekusi Presisi, Solutif, & Kolaborasi Lintas Tim',
    responsibilities: [
      'Pendampingan eksekusi operasional bulanan seluruh Pimpro',
      'Koordinasi kebutuhan logistik, venue, dan kelancaran kegiatan',
      'Evaluasi performa KPI & partisipasi peserta event',
    ],
  },
  {
    id: 'mem-maurren',
    tenureId: 'tenure-2026',
    category: 'inti',
    name: 'Maurren Mentari Putri',
    shortName: 'Maurren',
    role: 'Sekben 1',
    title: 'Sekretaris / Bendahara 1',
    image: '/images/sekben1-maurren.jpg',
    badge: 'Treasury & Admin Lead',
    color: '#c084fc',
    motto: 'Administrasi Tertib, Tata Kelola Keuangan & Akuntabel',
    responsibilities: [
      'Pengelolaan master arus kas & pencatatan inventaris barang CNT',
      'Verifikasi pengajuan reimbursement, vendor payment & pengadaan',
      'Penyusunan laporan pertanggungjawaban (LPJ) keuangan',
    ],
  },
  {
    id: 'mem-maharani',
    tenureId: 'tenure-2026',
    category: 'inti',
    name: 'Maharani',
    shortName: 'Maharani',
    role: 'Sekben 2',
    title: 'Sekretaris / Bendahara 2',
    image: '/images/sekben2-maharani.jpg',
    badge: 'Logistics & Admin Officer',
    color: '#f472b6',
    motto: 'Administrasi Tertib, Tata Kelola Keuangan & Akuntabel',
    responsibilities: [
      'Pencatatan korespondensi, absensi, dan notulensi rapat bulanan',
      'Manajemen berkas dan dokumentasi arsip kegiatan kepengurusan',
      'Dukungan operasional kesekretariatan tim inti',
    ],
  },
  // Pimpro
  {
    id: 'mem-adjie',
    tenureId: 'tenure-2026',
    divisionId: 'div-exp',
    category: 'pimpro',
    name: 'Djiehaddan Edwardo',
    shortName: 'Adjie',
    role: 'Pimpro Experience & Activity',
    title: 'Pimpro Experience & Activity',
    image: '/images/pimpro-adjie.jpg',
    badge: 'Experience Lead',
    color: '#0284c7',
    motto: 'Menciptakan Experience Event Internal yang Membekas & Bermakna',
    responsibilities: [
      'Perencanaan dan eksekusi turnamen E-Sports & Family Day',
      'Penyusunan rundown dan koordinasi PIC acara lapangan',
    ],
  },
  {
    id: 'mem-irvin',
    tenureId: 'tenure-2026',
    divisionId: 'div-wellbeing',
    category: 'pimpro',
    name: 'Irvin Andryan Pratomo',
    shortName: 'Irvin',
    role: 'Pimpro Collective Wellbeing',
    title: 'Pimpro Collective Wellbeing',
    image: '/images/pimpro-irvin.jpg',
    badge: 'Wellbeing Lead',
    color: '#e11d48',
    motto: 'Menebar Keberdampakan & Employee Well-being',
    responsibilities: [
      'Mengorganisir donor darah, charity, dan program kesehatan',
      'Penyampaian apresiasi hari ulang tahun dan momen spesial insan APD',
    ],
  },
  {
    id: 'mem-gahasa',
    tenureId: 'tenure-2026',
    divisionId: 'div-creative',
    category: 'pimpro',
    name: 'Gahasa Timothius B.P. Purba',
    shortName: 'Gahasa',
    role: 'Pimpro Creative Media',
    title: 'Pimpro Creative Media',
    image: '/images/pimpro-gahasa.png',
    badge: 'Creative Lead',
    color: '#7c3aed',
    motto: 'Visualisasi Modern, Content Creation & Branding Kit',
    responsibilities: [
      'Memimpin produksi media promosi, dokumentasi video & aftermovie',
      'Pengelolaan gear kamera Nikon Z50 dan standar branding visual IT APD',
    ],
  },
  {
    id: 'mem-putra',
    tenureId: 'tenure-2026',
    divisionId: 'div-talent',
    category: 'pimpro',
    name: 'Putra Pangabahan Sitorus',
    shortName: 'Putra',
    role: 'Pimpro Talent & Interest Lead',
    title: 'Pimpro Talent & Interest Lead',
    image: '/images/pimpro-putra.jpg',
    badge: 'Talent Lead',
    color: '#d97706',
    motto: 'Menggali Potensi & Semangat Juang Tim APD',
    responsibilities: [
      'Menggerakkan komunitas olahraga internal (Badminton, Mini Soccer, Running)',
      'Menginisiasi APD Got Talent dan sesi sharing bakat pegawai',
    ],
  },
];

export const INITIAL_EVENTS = [
  {
    id: 'evt-1',
    divisionId: 'div-exp',
    divisionName: 'Experience & Activity',
    title: 'APD E-Sports Championship 2026 (MLBB & EA FC)',
    date: 'Maret 2026',
    badge: 'Championship',
    location: 'Hybrid (Online & Gaming Arena Mandiri)',
    kpi: '150+ Peserta Insan APD',
    description:
      'Turnamen E-Sports internal antar departemen Group IT APD untuk membangun sportivitas, keakraban, dan refreshment dari rutinitas coding harian.',
    status: 'Upcoming',
  },
  {
    id: 'evt-2',
    divisionId: 'div-wellbeing',
    divisionName: 'Collective Wellbeing',
    title: 'IT APD Peduli: Donor Darah & Medical Check-Up',
    date: 'April 2026',
    badge: 'Social Impact',
    location: 'Lobi IT APD Plaza Mandiri',
    kpi: '100 Kantong Darah Terkumpul',
    description:
      'Inisiatif bakti sosial bekerjasama dengan PMI dan tim medis korporat, dilengkapi konsultasi postur ergonomis bagi software engineer.',
    status: 'Upcoming',
  },
  {
    id: 'evt-3',
    divisionId: 'div-creative',
    divisionName: 'Creative Media',
    title: 'Peluncuran Culture Video & Virtual Background Series 2026',
    date: 'Februari 2026',
    badge: 'Branding Release',
    location: 'Portal CNT IT APD',
    kpi: 'Digunakan oleh seluruh Officer IT APD',
    description:
      'Rilis aset resmi video profile dan paket virtual background meeting MS Teams dengan nuansa Mandiri Tech & Danantara Synergy.',
    status: 'Completed',
  },
  {
    id: 'evt-4',
    divisionId: 'div-talent',
    divisionName: 'Talent & Interest Lead',
    title: 'Liga Badminton & Fun Run IT APD',
    date: 'Mei 2026',
    badge: 'Sports Gathering',
    location: 'Lapangan Olahraga Gelora Mandiri',
    kpi: '80+ Pendaftar Aktif',
    description:
      'Kompetisi ganda putra, ganda putri, dan fun run santai 5K untuk membakar kalori dan mempererat silaturahmi antar squad delivery.',
    status: 'Upcoming',
  },
];

export const INITIAL_KUDOS = [
  {
    id: 'kd-1',
    sender: 'Devina (Squad Retail)',
    recipient: 'Gahasa & Tim Creative',
    category: 'Kolaboratif',
    message: 'Keren banget hasil video teaser dan template PPT-nya! Presentasi sprint review jadi kelihatan sangat profesional!',
    likes: 12,
    date: 'Baru saja',
  },
  {
    id: 'kd-2',
    sender: 'Budi Santoso (Core APD)',
    recipient: 'Daffa & Tim CNT',
    category: 'Harmonis',
    message: 'Event E-Sports kemarin seru banget! Jarang-jarang bisa mabar santai bareng tim tech lead dan squad lain.',
    likes: 24,
    date: '1 hari lalu',
  },
  {
    id: 'kd-3',
    sender: 'Siti Rahma (Wholesale APD)',
    recipient: 'Irvin (Wellbeing)',
    category: 'Amanah',
    message: 'Terima kasih atas ucapan dan souvenir ulang tahunnya, bener-bener bikin ngerasa diapresiasi di tengah deadline rilis!',
    likes: 18,
    date: '3 hari lalu',
  },
];

export const RECRUITMENT_INFO = {
  isOpen: true,
  title: 'Open Recruitment Kepengurusan CNT IT APD 2026',
  subtitle: 'Jadilah Agen Perubahan Budaya di Lingkungan Group IT Application Delivery!',
  batch: 'Gelombang 1 — Periode 2026',
  deadline: '28 Februari 2026',
  timeline: [
    { step: 'Pendaftaran Online', date: '01 - 28 Feb 2026', desc: 'Pengisian form dan portofolio singkat di web ini' },
    { step: 'Review & Screening', date: '01 - 04 Mar 2026', desc: 'Seleksi berkas dan minat per divisi oleh Tim Inti' },
    { step: 'Interview & Sinergi', date: '05 - 08 Mar 2026', desc: 'Bincang santai dan pendalaman komitmen' },
    { step: 'Pengumuman Resmi', date: '10 Mar 2026', desc: 'Welcome session & pelantikan pengurus baru' },
  ],
  benefits: [
    'Mengasah soft skills leadership, event management, dan communication lintas squad',
    'Menjadi pionir dalam membentuk lingkungan kerja yang suportif, seru, dan inovatif',
    'Apresiasi sertifikat kontribusi resmi dari Manajemen Group IT APD',
    'Akses ke gear multimedia (kamera Nikon Z50, software kreatif pro) dan networking luas',
  ],
};

export const INITIAL_GALLERIES = [
  {
    id: 'gal-1',
    title: 'Townhall & Kick-Off Budaya Group IT APD 2026',
    date: 'Januari 2026',
    division: 'Experience & Activity',
    description: 'Sesi perkenalan kepengurusan baru CNT IT APD 2026 dan sosialisasi program kerja budaya kerja tahunan bersama seluruh Officer & Management.',
    photos: [
      '/images/pembina-allexander.png',
      '/images/ketua-daffa.jpg',
      '/images/wakil-rizqi.jpg',
      '/images/sekben1-maurren.jpg'
    ]
  },
  {
    id: 'gal-2',
    title: 'Setup Creative Media Studio & Production Gear',
    date: 'Februari 2026',
    division: 'Creative Media',
    description: 'Uji coba gear kamera Nikon Z50 dan pengambilan video profil resmi kepengurusan CNT IT APD 2026.',
    photos: [
      '/images/pimpro-gahasa.png',
      '/images/pimpro-adjie.jpg',
      '/images/pimpro-irvin.jpg',
      '/images/pimpro-putra.jpg'
    ]
  }
];


export interface ClientProofPhoto {
  id: string;
  file: string;
  titleAr: string;
  titleEn: string;
  folder: string;
  resolution: string;
  filesize: string;
  camera?: string;
  lens?: string;
  settings?: string;
  locationAr?: string;
  locationEn?: string;
}

export interface ClientSession {
  pin: string;
  clientNameAr: string;
  clientNameEn: string;
  projectTitleAr: string;
  projectTitleEn: string;
  date: string;
  statusAr: string;
  statusEn: string;
  expiryDate: string;
  totalPhotos: number;
  packageSize: string;
  downloadUrl?: string;
  photos: ClientProofPhoto[];
}

export const sampleClientSessions: ClientSession[] = [
  {
    pin: '2026',
    clientNameAr: 'منظمة اليونيسف ومبادرات الطوارئ الإنسانية',
    clientNameEn: 'UNICEF Emergency Humanitarian Mission',
    projectTitleAr: 'توثيق مراكز الوافدين وإسناد الأطفال والتعليم الميداني',
    projectTitleEn: 'IDP Centers & Child Protection Field Coverage',
    date: '2025 - 2026',
    statusAr: 'جاهز للاختيار والاعتماد النهائي',
    statusEn: 'Ready for Review & Final Proofing',
    expiryDate: '2026-12-31',
    totalPhotos: 8,
    packageSize: '148 MB · 24MP Original Masters',
    photos: [
      {
        id: 'EAO-UN-001',
        file: 'img 0.jpg',
        folder: '/images/series-01',
        titleAr: 'الحضور الميداني وتنسيق نقاط الاستجابة',
        titleEn: 'Frontline Presence & Coordination',
        resolution: '6000 × 4000 (24.2 MP)',
        filesize: '18.4 MB',
        camera: 'Sony Alpha 7 IV',
        lens: 'FE 35mm f/1.4 GM',
        settings: '1/800s · f/2.2 · ISO 160 · 35mm',
        locationAr: 'مركز الإسناد الإنساني - القضارف',
        locationEn: 'Humanitarian Hub - Gedaref'
      },
      {
        id: 'EAO-UN-002',
        file: 'img 1.jpg',
        folder: '/images/series-01',
        titleAr: 'مستودعات المساعدات وتجهيز الحزم الغذائية',
        titleEn: 'Supply Warehousing & Logistics',
        resolution: '6000 × 4000 (24.2 MP)',
        filesize: '19.1 MB',
        camera: 'Sony Alpha 7 IV',
        lens: 'FE 24-70mm f/2.8 GM II',
        settings: '1/400s · f/3.2 · ISO 250 · 28mm',
        locationAr: 'المستودع اللوجستي المركزي',
        locationEn: 'Central Logistics Depot'
      },
      {
        id: 'EAO-UN-003',
        file: 'img 2.jpg',
        folder: '/images/series-01',
        titleAr: 'بورتريه الصمود والأمل الإنساني',
        titleEn: 'Resilience & Human Dignity Portrait',
        resolution: '6000 × 4000 (24.2 MP)',
        filesize: '17.6 MB',
        camera: 'Sony Alpha 7 IV',
        lens: 'FE 85mm f/1.4 GM',
        settings: '1/1250s · f/1.8 · ISO 100 · 85mm',
        locationAr: 'مركز إيواء الأسر الوافدة',
        locationEn: 'Community Shelter Sanctuary'
      },
      {
        id: 'EAO-UN-004',
        file: 'img 3.jpg',
        folder: '/images/series-01',
        titleAr: 'شبكات التكافل والدعم الشعبي',
        titleEn: 'Community Kitchen & Grassroots Aid',
        resolution: '6000 × 4000 (24.2 MP)',
        filesize: '20.2 MB',
        camera: 'Sony Alpha 7 IV',
        lens: 'FE 35mm f/1.4 GM',
        settings: '1/500s · f/2.0 · ISO 200 · 35mm',
        locationAr: 'المطبخ الشعبي التكافلي',
        locationEn: 'Community Relief Kitchen'
      },
      {
        id: 'EAO-UN-005',
        file: 'img 4.jpg',
        folder: '/images/series-01',
        titleAr: 'توزيع الاحتياجات الحيوية للأسر',
        titleEn: 'Family Supply Distribution Hub',
        resolution: '6000 × 4000 (24.2 MP)',
        filesize: '18.9 MB',
        camera: 'Sony Alpha 7 IV',
        lens: 'FE 24-70mm f/2.8 GM II',
        settings: '1/640s · f/4.0 · ISO 160 · 45mm',
        locationAr: 'نقطة التوزيع الميدانية',
        locationEn: 'Field Distribution Center'
      },
      {
        id: 'EAO-UN-006',
        file: 'img 5.jpg',
        folder: '/images/series-01',
        titleAr: 'قوافل الإمداد ومسارات التوصيل الآمنة',
        titleEn: 'Secure Relief Transit Convoy',
        resolution: '6000 × 4000 (24.2 MP)',
        filesize: '21.5 MB',
        camera: 'Sony Alpha 7 IV',
        lens: 'FE 70-200mm f/2.8 GM OSS II',
        settings: '1/1000s · f/5.6 · ISO 125 · 135mm',
        locationAr: 'المسار الإنساني الميداني',
        locationEn: 'Humanitarian Transit Corridor'
      },
      {
        id: 'EAO-UN-007',
        file: 'img 6.jpg',
        folder: '/images/series-01',
        titleAr: 'غرفة طوارئ المتطوعين الميدانية',
        titleEn: 'Volunteer Emergency Taskforce',
        resolution: '6000 × 4000 (24.2 MP)',
        filesize: '17.8 MB',
        camera: 'Sony Alpha 7 IV',
        lens: 'FE 35mm f/1.4 GM',
        settings: '1/320s · f/2.2 · ISO 320 · 35mm',
        locationAr: 'غرفة العمليات المشتركة',
        locationEn: 'Volunteer Coordination Cell'
      },
      {
        id: 'EAO-UN-008',
        file: 'img 7.jpg',
        folder: '/images/series-01',
        titleAr: 'المساحة التفاعلية الصديقة للأطفال',
        titleEn: 'Safe Space & Child Support Activity',
        resolution: '6000 × 4000 (24.2 MP)',
        filesize: '16.9 MB',
        camera: 'Sony Alpha 7 IV',
        lens: 'FE 24-70mm f/2.8 GM II',
        settings: '1/800s · f/2.8 · ISO 100 · 38mm',
        locationAr: 'مساحة الأطفال الآمنة',
        locationEn: 'Child-Friendly Activity Space'
      }
    ]
  },
  {
    pin: '7788',
    clientNameAr: 'شبكة المبادرات الشبابية والتنمية المستدامة',
    clientNameEn: 'Youth Civic Network & Sustainable Development',
    projectTitleAr: 'قمة التمكين المحلي وريادة العمل المدني',
    projectTitleEn: 'Local Empowerment Summit & Civic Leadership',
    date: '2025',
    statusAr: 'مكتمل ومعتمد للتحميل الفوري',
    statusEn: 'Completed & Approved for High-Res Download',
    expiryDate: '2026-11-30',
    totalPhotos: 6,
    packageSize: '112 MB · 24MP Original Masters',
    photos: [
      {
        id: 'EAO-YT-101',
        file: 'img 1.jpg',
        folder: '/images/series-02',
        titleAr: 'جلسات التخطيط التشاركي والعمل الجماعي',
        titleEn: 'Participatory Action Sessions',
        resolution: '6000 × 4000 (24.2 MP)',
        filesize: '18.2 MB',
        camera: 'Sony Alpha 7 IV',
        lens: 'FE 24-70mm f/2.8 GM II',
        settings: '1/500s · f/2.8 · ISO 250 · 31mm',
        locationAr: 'قاعة المؤتمرات والابتكار المدني',
        locationEn: 'Civic Innovation Hall'
      },
      {
        id: 'EAO-YT-102',
        file: 'img 2.jpg',
        folder: '/images/series-02',
        titleAr: 'طاقات الشباب وإدارة المبادرات',
        titleEn: 'Youth Leadership & Team Spirit',
        resolution: '6000 × 4000 (24.2 MP)',
        filesize: '17.4 MB',
        camera: 'Sony Alpha 7 IV',
        lens: 'FE 35mm f/1.4 GM',
        settings: '1/640s · f/2.0 · ISO 160 · 35mm',
        locationAr: 'ورشة بناء القدرات والقيادة',
        locationEn: 'Leadership Capacity Workshop'
      },
      {
        id: 'EAO-YT-103',
        file: 'img 3.jpg',
        folder: '/images/series-02',
        titleAr: 'تمكين المرأة في المشروعات الحرفية',
        titleEn: 'Women Craft Empowerment Project',
        resolution: '6000 × 4000 (24.2 MP)',
        filesize: '19.8 MB',
        camera: 'Sony Alpha 7 IV',
        lens: 'FE 50mm f/1.2 GM',
        settings: '1/800s · f/1.8 · ISO 100 · 50mm',
        locationAr: 'معرض الحرف النسوية الإنتاجية',
        locationEn: 'Women Craft Enterprise Center'
      },
      {
        id: 'EAO-YT-104',
        file: 'img 4.jpg',
        folder: '/images/series-02',
        titleAr: 'مشروعات الاستدامة البيئية وإدارة المياه',
        titleEn: 'Clean Water & Resource Stewardship',
        resolution: '6000 × 4000 (24.2 MP)',
        filesize: '20.6 MB',
        camera: 'Sony Alpha 7 IV',
        lens: 'FE 24-70mm f/2.8 GM II',
        settings: '1/1000s · f/4.0 · ISO 100 · 24mm',
        locationAr: 'المحطة البيئية الزراعية المستدامة',
        locationEn: 'Eco-Agriculture Stewardship Site'
      },
      {
        id: 'EAO-YT-105',
        file: 'img 5.jpg',
        folder: '/images/series-02',
        titleAr: 'تنسيق قنوات التعاون المشترك',
        titleEn: 'Multi-Sector Collaboration Hub',
        resolution: '6000 × 4000 (24.2 MP)',
        filesize: '17.1 MB',
        camera: 'Sony Alpha 7 IV',
        lens: 'FE 35mm f/1.4 GM',
        settings: '1/400s · f/2.5 · ISO 200 · 35mm',
        locationAr: 'ملتقى الشراكات والتنمية',
        locationEn: 'Development Partnerships Round-Table'
      },
      {
        id: 'EAO-YT-106',
        file: 'img 6.jpg',
        folder: '/images/series-02',
        titleAr: 'البيان الختامي وصياغة خطط الغد',
        titleEn: 'Closing Declaration & Action Plan',
        resolution: '6000 × 4000 (24.2 MP)',
        filesize: '18.5 MB',
        camera: 'Sony Alpha 7 IV',
        lens: 'FE 24-70mm f/2.8 GM II',
        settings: '1/500s · f/3.2 · ISO 160 · 28mm',
        locationAr: 'الجلسة العامة الختامية',
        locationEn: 'Closing Plenary Assembly'
      }
    ]
  }
];

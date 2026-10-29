export interface Exhibition {
  year: string;
  titleAr: string;
  titleEn: string;
  typeAr: string;
  typeEn: string;
  locationAr: string;
  locationEn: string;
  roleAr?: string;
  roleEn?: string;
}

export interface AwardGrant {
  year: string;
  titleAr: string;
  titleEn: string;
  organizationAr: string;
  organizationEn: string;
  descriptionAr: string;
  descriptionEn: string;
  badge?: string;
}

export interface GearItem {
  categoryAr: string;
  categoryEn: string;
  items: {
    name: string;
    descriptionAr: string;
    descriptionEn: string;
    icon: string;
  }[];
}

export interface ClientPartner {
  name: string;
  roleAr: string;
  roleEn: string;
  category: 'humanitarian' | 'media' | 'community';
}

export interface CVData {
  artistStatementAr: string;
  artistStatementEn: string;
  exhibitions: Exhibition[];
  awards: AwardGrant[];
  gear: GearItem[];
  clients: ClientPartner[];
  education: {
    year: string;
    degreeAr: string;
    degreeEn: string;
    institutionAr: string;
    institutionEn: string;
  }[];
}

export const cvData: CVData = {
  artistStatementAr: `أؤمن بأن الكاميرا ليست مجرد وسيط لتسجيل الواقع، بل أداة عدالة اجتماعية ومناصرة إنسانية. يرتكز منهجي في التصوير الوثائقي على الحضور الميداني الهادئ، وبناء الثقة العميقة مع المجتمعات المحلية والنازحين، وتوثيق قصص الصمود والكرامة بعيداً عن النظرة النمطية أو الضحية المجردة. كل إطار ألتقطه هو مساحة لصوت إنساني يستحق أن يُسمع ويُحفظ في الذاكرة الجمعية.`,
  artistStatementEn: `I believe that the camera is not merely a recording device, but an instrument of social justice and human advocacy. My documentary methodology is rooted in patient frontline presence, building deep trust with grassroots communities and displaced families, and capturing stories of resilience and dignity free from sensationalism. Every frame is a dedicated space for human voices that deserve to be heard, respected, and archived.`,
  
  exhibitions: [
    {
      year: '2025',
      titleAr: 'أصوات الصمود: حكايات النزوح والأمل',
      titleEn: 'Voices of Resilience: Tales of Displacement & Hope',
      typeAr: 'معرض جماعي دولي',
      typeEn: 'International Group Exhibition',
      locationAr: 'القاهرة — مركز الفنون المعاصرة',
      locationEn: 'Cairo — Contemporary Arts Center',
      roleAr: 'مشاركة رئيسية بستة أعمال وثائقية',
      roleEn: 'Lead Exhibitor with 6 documentary series prints'
    },
    {
      year: '2024',
      titleAr: 'وجوه من أرض النيلين: بين الذاكرة والوطن',
      titleEn: 'Faces from the Two Niles: Memory & Homeland',
      typeAr: 'معرض فردي',
      typeEn: 'Solo Exhibition',
      locationAr: 'بورتسودان — المساحة الثقافية المستقلة',
      locationEn: 'Port Sudan — Independent Cultural Space',
      roleAr: 'منظّمة ومعرضة',
      roleEn: 'Artist & Curator'
    },
    {
      year: '2023',
      titleAr: 'أيام القاهرة للتصوير (Cairo Photo Week)',
      titleEn: 'Cairo Photo Week — Emerging Visual Narratives',
      typeAr: 'مهرجان تصوير إقليمي',
      typeEn: 'Regional Photography Festival',
      locationAr: 'وسط البلد، القاهرة — جمهورية مصر العربية',
      locationEn: 'Downtown Cairo — Egypt',
      roleAr: 'معرض مختار وعرض سينمائي',
      roleEn: 'Selected Showcase & Projection Night'
    },
    {
      year: '2022',
      titleAr: 'ملتقى الشباب والتوثيق المجتمعي المستدام',
      titleEn: 'Youth Forum on Grassroots Documentation',
      typeAr: 'معرض مبادرات المجتمع المدني',
      typeEn: 'Civil Society Initiatives Showcase',
      locationAr: 'الخرطوم — مساحة الابتكار المدني',
      locationEn: 'Khartoum — Civic Innovation Hub',
      roleAr: 'توثيق وتنسيق بصري',
      roleEn: 'Documentation & Visual Curation'
    }
  ],

  awards: [
    {
      year: '2024',
      titleAr: 'منحة التوثيق البصري الإنساني الميداني',
      titleEn: 'Frontline Visual Humanitarian Documentation Grant',
      organizationAr: 'صندوق دعم السرديات البصرية الإقليمية',
      organizationEn: 'Regional Visual Narratives Support Fund',
      descriptionAr: 'منحة مخصصة لمتابعة توثيق أوضاع مراكز الإيواء والمجتمعات المتأثرة بالنزوح الداخلي.',
      descriptionEn: 'Dedicated fellowship funding longitudinal documentation of frontline displacement communities.',
      badge: 'Grant Recipient'
    },
    {
      year: '2023',
      titleAr: 'جائزة التميز في السرد البصري لقضايا الشباب',
      titleEn: 'Excellence Award in Youth Visual Storytelling',
      organizationAr: 'الملتقى الإقليمي للمصورين الوثائقيين',
      organizationEn: 'Regional Documentary Forum',
      descriptionAr: 'تكريم لأفضل مشروع وثائقي يبرز دور المبادرات الشبابية في إسناد المجتمعات المحلية.',
      descriptionEn: 'Honoring the most impactful photo documentary series highlighting youth civic initiatives.',
      badge: '1st Place'
    },
    {
      year: '2022',
      titleAr: 'زمالة التدريب وتمكين مهارات التوثيق المدني',
      titleEn: 'Civic Media & Visual Documentation Fellowship',
      organizationAr: 'شبكة المبادرات المدنية والمناصرة',
      organizationEn: 'Civic Initiatives & Advocacy Network',
      descriptionAr: 'برنامج تدريبي مكثف لتمكين مدربي التوثيق البصري في مناطق الأزمات الإنسانية.',
      descriptionEn: 'Advanced training fellowship empowering visual documentation instructors in crisis zones.',
      badge: 'Fellowship'
    }
  ],

  gear: [
    {
      categoryAr: 'أنظمة الكاميرات والهياكل',
      categoryEn: 'Camera Bodies & Systems',
      items: [
        {
          name: 'Sony Alpha 7 IV (Full-Frame Mirrorless)',
          descriptionAr: 'الكاميرا الرئيسية للتوثيق الميداني الحساس بفضل النطاق الديناميكي الاستثنائي والأداء الفائق في الإضاءة الخافتة.',
          descriptionEn: 'Primary documentary workhorse featuring exceptional dynamic range and low-light performance.',
          icon: 'fas fa-camera'
        },
        {
          name: 'Fujifilm X-T5 (Compact Street & Candid)',
          descriptionAr: 'كاميرا مدمجة هادئة لتوثيق اللحظات العفوية دون لفت الانتباه في التجمعات والمراكز المجتمعية.',
          descriptionEn: 'Compact, silent shutter body for discrete candid captures and human-level community interaction.',
          icon: 'fas fa-camera-retro'
        }
      ]
    },
    {
      categoryAr: 'العدسات البصرية الميدانية',
      categoryEn: 'Documentary Prime & Zoom Lenses',
      items: [
        {
          name: 'Sony FE 35mm f/1.4 GM',
          descriptionAr: 'العدسة الوثائقية المثالية لرواية القصة بدمج الشخصية والبيئة المحيطة بأعلى دقة بصرية.',
          descriptionEn: 'The quintessential storytelling focal length combining subject and context with razor sharpness.',
          icon: 'fas fa-circle-notch'
        },
        {
          name: 'Sony FE 85mm f/1.8 (Portrait & Intimacy)',
          descriptionAr: 'بورتريهات إنسانية عميقة تفصل المشاعر وتبرز تعابير العيون باحترام وكرامة.',
          descriptionEn: 'Intimate human portraits capturing emotions and eye expressions with dignity.',
          icon: 'fas fa-bullseye'
        },
        {
          name: 'Tamron 28-75mm f/2.8 G2',
          descriptionAr: 'عدسة الزوم الميدانية السريعة لتغطية القوافل والأحداث المتسارعة على الأرض.',
          descriptionEn: 'Fast versatile zoom for rapidly evolving frontline events and aid convoys.',
          icon: 'fas fa-compress-alt'
        }
      ]
    },
    {
      categoryAr: 'الصوت، الإضاءة، والعتاد الميداني',
      categoryEn: 'Field Audio, Lighting & Rigging',
      items: [
        {
          name: 'Røde Wireless PRO (32-bit Float Recording)',
          descriptionAr: 'تسجيل المقابلات والشهادات الصوتية بجودة سينمائية مانعة للتشويه في الضوضاء الميدانية.',
          descriptionEn: 'Dual-channel 32-bit float audio system capturing interviews without digital clipping.',
          icon: 'fas fa-microphone-alt'
        },
        {
          name: 'DJI Mini 4 Pro (Aerial Documentation)',
          descriptionAr: 'توثيق جوي خفيف لبيئات النزوح، مسارات القوافل الإغاثية، والبيئة الجغرافية الطبيعية.',
          descriptionEn: 'Lightweight drone for geographical and environmental mapping of community aid corridors.',
          icon: 'fas fa-plane'
        },
        {
          name: 'Peak Design Everyday Backpack 30L (Weatherproof)',
          descriptionAr: 'حقيبة مقاومة للغبار والظروف المناخية القاسية مع بطاريات أنكر للطاقة الشمسية الميدانية.',
          descriptionEn: 'Weather-sealed expedition backpack with rugged solar storage units for off-grid operations.',
          icon: 'fas fa-suitcase'
        }
      ]
    }
  ],

  clients: [
    { name: 'UNICEF Emergency Response Programs', roleAr: 'توثيق مبادرات التعليم وحماية الطفل', roleEn: 'Education & Child Protection Field Documentation', category: 'humanitarian' },
    { name: 'UNDP Community Resilience Partnerships', roleAr: 'رصد مشاريع التنمية المستدامة والمياه', roleEn: 'Sustainable Development & Clean Water Projects', category: 'humanitarian' },
    { name: 'Sudanese Red Crescent Society', roleAr: 'تغطية القوافل الإغاثية ومراكز الإيواء', roleEn: 'Relief Convoy Coverage & Field Shelter Operations', category: 'humanitarian' },
    { name: 'Regional Civil Society & Youth Hubs', roleAr: 'تدريب كوادر السرد البصري والتوثيق', roleEn: 'Visual Storytelling Workshops & Capacity Building', category: 'community' },
    { name: 'Independent Cultural & Human Rights Media', roleAr: 'مقالات مصورة وسرديات استقصائية', roleEn: 'Photo Essays & In-Depth Editorial Coverage', category: 'media' }
  ],

  education: [
    {
      year: '2021',
      degreeAr: 'دبلوم متقدم في الصحافة الاستقصائية والسرد البصري',
      degreeEn: 'Advanced Diploma in Visual Journalism & Storytelling',
      institutionAr: 'الأكاديمية الإقليمية للإعلام والتنمية',
      institutionEn: 'Regional Media & Development Academy'
    },
    {
      year: '2019',
      degreeAr: 'بكالوريوس في العلوم الإنسانية والمجتمعية',
      degreeEn: 'Bachelor of Arts in Community & Human Studies',
      institutionAr: 'جامعة الخرطوم',
      institutionEn: 'University of Khartoum'
    }
  ]
};

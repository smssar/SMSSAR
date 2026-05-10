export type LocalizedText = {
  en: string;
  ar: string;
  fr?: string;
};

export interface Property {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  imageUrl?: string;
  vedioUrl?: string;
  city: LocalizedText;
  neighborhood?: string;
  area: number;
  rooms: number;
  bathrooms: number;
  price: number;
  priceType?: "MONTHLY" | "DAILY";
  propertyType: string;
  forSale?: boolean;
  featured: boolean;
  seller: string;
  rating: number;
  inquiries: number;
  palette: [string, string];
  amenities: LocalizedText[];
}

export interface PropertyTypeSummary {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  count: number;
}

export interface Plan {
  id: "free" | "pro" | "premium";
  title: LocalizedText;
  description: LocalizedText;
  price: number;
  listings: number | "unlimited";
  featured: boolean;
  features: LocalizedText[];
}

export interface Testimonial {
  name: string;
  role: LocalizedText;
  quote: LocalizedText;
  location: LocalizedText;
}

export interface InboxMessage {
  id: string;
  name: string;
  listing: string;
  preview: LocalizedText;
  time: string;
  unread: boolean;
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: "user" | "seller" | "admin";
  status: "active" | "pending" | "flagged";
}

export const stats = [
  { label: { en: "Homes listed", ar: "عقارات منشورة" }, value: 1280 },
  { label: { en: "Verified sellers", ar: "بائعون موثقون" }, value: 340 },
  { label: { en: "Average response", ar: "متوسط الاستجابة" }, value: 15 },
  { label: { en: "Cities covered", ar: "مدن مشمولة" }, value: 18 },
] as const;

export const propertyTypes: PropertyTypeSummary[] = [
  {
    id: "villas",
    title: { en: "Villas", ar: "فلل" },
    description: { en: "Spacious premium homes", ar: "منازل فاخرة واسعة" },
    count: 42,
  },
  {
    id: "apartments",
    title: { en: "Apartments", ar: "شقق" },
    description: { en: "Modern city living", ar: "حياة عصرية في المدينة" },
    count: 63,
  },
  {
    id: "family",
    title: { en: "Family homes", ar: "منازل عائلية" },
    description: {
      en: "Comfortable long-term rentals",
      ar: "إيجارات مريحة طويلة الأجل",
    },
    count: 51,
  },
  {
    id: "luxury",
    title: { en: "Luxury stays", ar: "إقامات فاخرة" },
    description: {
      en: "High-end, high-touch homes",
      ar: "منازل راقية وخدمات مميزة",
    },
    count: 24,
  },
] as const;

export const properties: Property[] = [
  {
    id: "1",
    title: { en: "Marina Skyline Villa", ar: "فيلا مارينا بإطلالة على الأفق" },
    description: {
      en: "A sunlit villa with a rooftop lounge, private garden, and sweeping marina views.",
      ar: "فيلا مشرقة مع جلسة على السطح وحديقة خاصة وإطلالات واسعة على المارينا.",
    },
    imageUrl:
      "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1400&q=80",
    city: { en: "Dubai", ar: "دبي" },
    area: 248,
    rooms: 4,
    bathrooms: 4,
    price: 18500,
    propertyType: "villas",
    featured: true,
    seller: "Noura Estates",
    rating: 4.9,
    inquiries: 18,
    palette: ["from-sky-500", "to-indigo-600"],
    amenities: [
      { en: "Private pool", ar: "مسبح خاص" },
      { en: "Smart home", ar: "منزل ذكي" },
      { en: "Covered parking", ar: "موقف مغطى" },
    ],
  },
  {
    id: "2",
    title: { en: "Downtown Pearl Residence", ar: "سكن بيرل في وسط المدينة" },
    description: {
      en: "A design-led apartment with concierge service, gym access, and floor-to-ceiling windows.",
      ar: "شقة بتصميم عصري مع خدمة كونسيرج وصالة رياضية ونوافذ بانورامية.",
    },
    imageUrl:
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1400&q=80",
    city: { en: "Abu Dhabi", ar: "أبوظبي" },
    area: 132,
    rooms: 2,
    bathrooms: 2,
    price: 9200,
    propertyType: "apartments",
    featured: true,
    seller: "Pearl Living",
    rating: 4.8,
    inquiries: 12,
    palette: ["from-fuchsia-500", "to-violet-600"],
    amenities: [
      { en: "Concierge", ar: "كونسيرج" },
      { en: "Gym", ar: "نادي رياضي" },
      { en: "Balcony", ar: "شرفة" },
    ],
  },
  {
    id: "3",
    title: { en: "Palm Family Retreat", ar: "استراحة عائلية على النخيل" },
    description: {
      en: "A cozy family house with a shaded courtyard, children’s play area, and quiet street access.",
      ar: "منزل عائلي مريح مع فناء مظلل ومنطقة ألعاب للأطفال ومدخل هادئ.",
    },
    imageUrl:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80",
    city: { en: "Sharjah", ar: "الشارقة" },
    area: 176,
    rooms: 3,
    bathrooms: 3,
    price: 6800,
    propertyType: "family",
    featured: false,
    seller: "Palm Nest",
    rating: 4.7,
    inquiries: 8,
    palette: ["from-emerald-500", "to-teal-600"],
    amenities: [
      { en: "Courtyard", ar: "فناء" },
      { en: "Kids room", ar: "غرفة أطفال" },
      { en: "Laundry room", ar: "غرفة غسيل" },
    ],
  },
  {
    id: "4",
    title: { en: "Breeze Penthouse", ar: "بنتهاوس بريز" },
    description: {
      en: "An elevated penthouse with a terrace, skyline dining area, and premium security.",
      ar: "بنتهاوس مرتفع مع تراس ومنطقة طعام وإطلالة مميزة وأمان عالٍ.",
    },
    imageUrl:
      "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1400&q=80",
    city: { en: "Doha", ar: "الدوحة" },
    area: 210,
    rooms: 4,
    bathrooms: 3,
    price: 14500,
    propertyType: "luxury",
    featured: true,
    seller: "Breeze Partners",
    rating: 4.95,
    inquiries: 21,
    palette: ["from-amber-500", "to-orange-600"],
    amenities: [
      { en: "Private terrace", ar: "تراس خاص" },
      { en: "24/7 security", ar: "أمن 24/7" },
      { en: "Chef’s kitchen", ar: "مطبخ احترافي" },
    ],
  },
  {
    id: "5",
    title: { en: "Noble Garden House", ar: "منزل نوبل جاردن" },
    description: {
      en: "A private garden home with a study, guest suite, and open-plan living room.",
      ar: "منزل بحديقة خاصة مع مكتب وجناح ضيوف وغرفة معيشة مفتوحة.",
    },
    imageUrl:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=80",
    city: { en: "Riyadh", ar: "الرياض" },
    area: 194,
    rooms: 4,
    bathrooms: 4,
    price: 11100,
    propertyType: "family",
    featured: false,
    seller: "Noble Homes",
    rating: 4.86,
    inquiries: 9,
    palette: ["from-rose-500", "to-pink-600"],
    amenities: [
      { en: "Garden", ar: "حديقة" },
      { en: "Study room", ar: "غرفة دراسة" },
      { en: "Guest suite", ar: "جناح ضيوف" },
    ],
  },
  {
    id: "6",
    title: { en: "Harbor View Loft", ar: "لوفت بإطلالة على الميناء" },
    description: {
      en: "An airy loft with industrial finishes, a mezzanine workspace, and a bright harbor view.",
      ar: "لوفت رحب بتشطيبات صناعية ومساحة عمل علوية وإطلالة مشرقة على الميناء.",
    },
    imageUrl:
      "https://images.unsplash.com/photo-1600607687644-c7f34b5063b4?auto=format&fit=crop&w=1400&q=80",
    city: { en: "Muscat", ar: "مسقط" },
    area: 109,
    rooms: 2,
    bathrooms: 2,
    price: 5700,
    propertyType: "apartments",
    featured: false,
    seller: "Harbor Bay",
    rating: 4.75,
    inquiries: 6,
    palette: ["from-cyan-500", "to-blue-600"],
    amenities: [
      { en: "Workspace", ar: "مساحة عمل" },
      { en: "Elevator", ar: "مصعد" },
      { en: "Storage room", ar: "غرفة تخزين" },
    ],
  },
] as const;

export const plans: Plan[] = [
  {
    id: "free",
    title: { en: "Free", ar: "مجاني" },
    description: {
      en: "Perfect for new sellers testing the marketplace.",
      ar: "مناسب للبائعين الجدد الذين يختبرون المنصة.",
      fr: "Parfait pour les nouveaux vendeurs qui testent la plateforme.",
    },
    price: 0,
    listings: 3,
    featured: false,
    features: [
      { en: "Up to 3 listings", ar: "حتى 3 عقارات", fr: "Jusqu'à 3 annonces" },
      { en: "Basic analytics", ar: "إحصاءات أساسية", fr: "Analyses de base" },
      { en: "Email support", ar: "دعم عبر البريد", fr: "Support par e-mail" },
    ],
  },
  {
    id: "pro",
    title: { en: "Pro", ar: "برو" },
    description: {
      en: "For growing sellers who need more visibility.",
      ar: "للبائعين المتنامين الذين يحتاجون إلى ظهور أكبر.",
      fr: "Pour les vendeurs en pleine croissance qui ont besoin d'une meilleure visibilité.",
    },
    price: 49,
    listings: 10,
    featured: true,
    features: [
      {
        en: "Up to 10 listings",
        ar: "حتى 10 عقارات",
        fr: "Jusqu'à 10 annonces",
      },
      {
        en: "Boosted ranking",
        ar: "أولوية في الظهور",
        fr: "Classement renforcé",
      },
      { en: "Priority support", ar: "دعم أسرع", fr: "Support prioritaire" },
    ],
  },
  {
    id: "premium",
    title: { en: "Premium", ar: "بريميوم" },
    description: {
      en: "For agencies and power sellers with unlimited listings.",
      ar: "للبائعين المحترفين مع عدد غير محدود من العقارات.",
      fr: "Pour les agences et les vendeurs puissants avec des annonces illimitées.",
    },
    price: 129,
    listings: "unlimited",
    featured: false,
    features: [
      {
        en: "Unlimited listings",
        ar: "عقارات غير محدودة",
        fr: "Annonces illimitées",
      },
      {
        en: "Dedicated success manager",
        ar: "مدير نجاح مخصص",
        fr: "Gestionnaire de succès dédié",
      },
      { en: "Advanced reporting", ar: "تقارير متقدمة", fr: "Rapports avancés" },
    ],
  },
] as const;

export const testimonials: Testimonial[] = [
  {
    name: "Hana Al Mansouri",
    role: { en: "Renter", ar: "مستأجرة" },
    quote: {
      en: "The Arabic experience feels polished, fast, and surprisingly premium.",
      ar: "التجربة بالعربية أنيقة وسريعة وتبدو فاخرة بشكل ملحوظ.",
      fr: "L'expérience arabe semble soignée, rapide et surprenamment premium.",
    },
    location: { en: "Dubai", ar: "rabat", fr: "Rabat" },
  },
  {
    name: "Omar Al Farsi",
    role: { en: "Seller", ar: "بائع" },
    quote: {
      en: "I can manage listings, respond to leads, and upgrade plans in one place.",
      ar: "أستطيع إدارة العقارات والرد على الاستفسارات وترقية الباقة من مكان واحد.",
      fr: "Je peux gérer les annonces, répondre aux prospects et améliorer mes forfaits en un seul endroit.",
    },
    location: { en: "Muscat", ar: "مسقط", fr: "Masqat" },
  },
  {
    name: "Leila Haddad",
    role: { en: "Property seeker", ar: "باحثة عن عقار" },
    quote: {
      en: "The filters and property cards make comparing homes incredibly easy.",
      ar: "الفلاتر وبطاقات العقارات تجعل مقارنة المنازل سهلة جداً.",
      fr: "Les filtres et les cartes immobilières rendent la comparaison des maisons incroyablement facile.",
    },
    location: { en: "Tetouan", ar: "تطوان", fr: "Tétouan" },
  },
] as const;

export const inboxMessages: InboxMessage[] = [
  {
    id: "m1",
    name: "Sara",
    listing: "Marina Skyline Villa",
    preview: {
      en: "Is the rooftop lounge available for the full contract term?",
      ar: "هل الجلسة العلوية متاحة طوال مدة العقد؟",
    },
    time: "2m",
    unread: true,
  },
  {
    id: "m2",
    name: "Yousef",
    listing: "Downtown Pearl Residence",
    preview: {
      en: "Can I schedule a viewing this weekend?",
      ar: "هل يمكنني حجز موعد للمعاينة هذا الأسبوع؟",
    },
    time: "1h",
    unread: false,
  },
  {
    id: "m3",
    name: "Alya",
    listing: "Breeze Penthouse",
    preview: {
      en: "Please send me the lease terms and deposit details.",
      ar: "أرسل لي تفاصيل العقد والدفعة المقدمة من فضلك.",
    },
    time: "4h",
    unread: false,
  },
] as const;

export const users: UserRecord[] = [
  {
    id: "u1",
    name: "Hassan Ali",
    email: "hassan@example.com",
    role: "seller",
    status: "active",
  },
  {
    id: "u2",
    name: "Mona Ahmed",
    email: "mona@example.com",
    role: "user",
    status: "active",
  },
  {
    id: "u3",
    name: "Nader Salem",
    email: "nader@example.com",
    role: "seller",
    status: "pending",
  },
  {
    id: "u4",
    name: "Fatima Noor",
    email: "fatima@example.com",
    role: "admin",
    status: "active",
  },
  {
    id: "u5",
    name: "Ibrahim Rami",
    email: "ibrahim@example.com",
    role: "seller",
    status: "flagged",
  },
] as const;

export const sellerStats = [
  { label: { en: "Live listings", ar: "العقارات المنشورة" }, value: 8 },
  { label: { en: "Monthly inquiries", ar: "استفسارات شهرية" }, value: 46 },
  { label: { en: "Saved leads", ar: "العملاء المحتملون" }, value: 19 },
  { label: { en: "Plan health", ar: "حالة الباقة" }, value: 94 },
] as const;

export const adminStats = [
  {
    label: {
      en: "Total users",
      ar: "إجمالي المستخدمين",
      fr: "Utilisateurs totaux",
    },
    value: 5421,
  },
  {
    label: {
      en: "Active listings",
      ar: "العقارات النشطة",
      fr: "Annonces actives",
    },
    value: 1280,
  },
  {
    label: {
      en: "Pending reviews",
      ar: "المراجعات المعلقة",
      fr: "Avis en attente",
    },
    value: 31,
  },
  { label: { en: "Revenue", ar: "الإيرادات", fr: "Revenu" }, value: 146000 },
] as const;

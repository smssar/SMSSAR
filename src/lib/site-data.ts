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
  status: "active" | "pending" | "suspended" | "banned";
}

export const stats = [
  {
    label: { en: "Homes listed", ar: "عقارات منشورة", fr: "Logements listés" },
    value: 1280,
  },
  {
    label: {
      en: "Verified sellers",
      ar: "بائعون موثقون",
      fr: "Vendeurs vérifiés",
    },
    value: 340,
  },
  {
    label: {
      en: "Average response",
      ar: "متوسط الاستجابة",
      fr: "Réponse moyenne",
    },
    value: 15,
  },
  {
    label: { en: "Cities covered", ar: "مدن مشمولة", fr: "Villes couvertes" },
    value: 18,
  },
] as const;

export const propertyTypes: PropertyTypeSummary[] = [
  {
    id: "villas",
    title: { en: "Villas", ar: "فلل", fr: "Villas" },
    description: {
      en: "Spacious premium homes",
      ar: "منازل فاخرة واسعة",
      fr: "Maisons spacieuses et haut de gamme",
    },
    count: 42,
  },
  {
    id: "apartments",
    title: { en: "Apartments", ar: "شقق", fr: "Appartements" },
    description: {
      en: "Modern city living",
      ar: "حياة عصرية في المدينة",
      fr: "Vie urbaine moderne",
    },
    count: 63,
  },
  {
    id: "family",
    title: { en: "Family homes", ar: "منازل عائلية", fr: "Maisons familiales" },
    description: {
      en: "Comfortable long-term rentals",
      ar: "إيجارات مريحة طويلة الأجل",
      fr: "Locations confortables à long terme",
    },
    count: 51,
  },
  {
    id: "luxury",
    title: { en: "Luxury stays", ar: "إقامات فاخرة", fr: "Séjours de luxe" },
    description: {
      en: "High-end, high-touch homes",
      ar: "منازل راقية وخدمات مميزة",
      fr: "Maisons haut de gamme avec services premium",
    },
    count: 24,
  },
] as const;

export const properties: Property[] = [
  {
    id: "1",
    title: {
      en: "Marina Skyline Villa",
      ar: "فيلا مارينا بإطلالة على الأفق",
      fr: "Villa Marina Skyline",
    },
    description: {
      en: "A sunlit villa with a rooftop lounge, private garden, and sweeping marina views.",
      ar: "فيلا مشرقة مع جلسة على السطح وحديقة خاصة وإطلالات واسعة على المارينا.",
      fr: "Une villa ensoleillée avec salon sur le toit, jardin privé et vues sur la marina.",
    },
    imageUrl:
      "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1400&q=80",
    city: { en: "Marrakesh", ar: "مراكش", fr: "Marrakech" },
    area: 248,
    rooms: 4,
    bathrooms: 4,
    price: 18500,
    propertyType: "villas",
    featured: true,
    seller: "Noura Estates",
    palette: ["from-sky-500", "to-indigo-600"],
    amenities: [
      { en: "Private pool", ar: "مسبح خاص", fr: "Piscine privée" },
      { en: "Smart home", ar: "منزل ذكي", fr: "Maison connectée" },
      { en: "Covered parking", ar: "موقف مغطى", fr: "Parking couvert" },
    ],
  },
  {
    id: "2",
    title: {
      en: "Downtown Pearl Residence",
      ar: "سكن بيرل في وسط المدينة",
      fr: "Résidence Downtown Pearl",
    },
    description: {
      en: "A design-led apartment with concierge service, gym access, and floor-to-ceiling windows.",
      ar: "شقة بتصميم عصري مع خدمة كونسيرج وصالة رياضية ونوافذ بانورامية.",
      fr: "Un appartement design avec conciergerie, accès à la salle de sport et fenêtres du sol au plafond.",
    },
    imageUrl:
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1400&q=80",
    city: { en: "Rabat", ar: "الرباط", fr: "Rabat" },
    area: 132,
    rooms: 2,
    bathrooms: 2,
    price: 9200,
    propertyType: "apartments",
    featured: true,
    seller: "Pearl Living",
    palette: ["from-fuchsia-500", "to-violet-600"],
    amenities: [
      { en: "Concierge", ar: "كونسيرج", fr: "Conciergerie" },
      { en: "Gym", ar: "نادي رياضي", fr: "Salle de sport" },
      { en: "Balcony", ar: "شرفة", fr: "Balcon" },
    ],
  },
  {
    id: "3",
    title: {
      en: "Palm Family Retreat",
      ar: "استراحة عائلية على النخيل",
      fr: "Retraite familiale Palm",
    },
    description: {
      en: "A cozy family house with a shaded courtyard, children’s play area, and quiet street access.",
      ar: "منزل عائلي مريح مع فناء مظلل ومنطقة ألعاب للأطفال ومدخل هادئ.",
      fr: "Une maison familiale confortable avec cour ombragée, aire de jeux pour enfants et accès calme.",
    },
    imageUrl:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80",
    city: { en: "Martil", ar: "مرتيل", fr: "Martil" },
    area: 176,
    rooms: 3,
    bathrooms: 3,
    price: 6800,
    propertyType: "family",
    featured: false,
    seller: "Palm Nest",
    palette: ["from-emerald-500", "to-teal-600"],
    amenities: [
      { en: "Courtyard", ar: "فناء", fr: "Cour" },
      { en: "Kids room", ar: "غرفة أطفال", fr: "Chambre enfants" },
      { en: "Laundry room", ar: "غرفة غسيل", fr: "Buanderie" },
    ],
  },
  {
    id: "4",
    title: {
      en: "Breeze Penthouse",
      ar: "بنتهاوس بريز",
      fr: "Penthouse Breeze",
    },
    description: {
      en: "An elevated penthouse with a terrace, skyline dining area, and premium security.",
      ar: "بنتهاوس مرتفع مع تراس ومنطقة طعام وإطلالة مميزة وأمان عالٍ.",
      fr: "Un penthouse élevé avec terrasse, espace repas avec vue sur la skyline et sécurité premium.",
    },
    imageUrl:
      "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1400&q=80",
    city: { en: "martil", ar: "مرتيل", fr: "Doha" },
    area: 210,
    rooms: 4,
    bathrooms: 3,
    price: 14500,
    propertyType: "luxury",
    featured: true,
    seller: "Breeze Partners",
    palette: ["from-amber-500", "to-orange-600"],
    amenities: [
      { en: "Private terrace", ar: "تراس خاص", fr: "Terrasse privée" },
      { en: "24/7 security", ar: "أمن 24/7", fr: "Sécurité 24/7" },
      { en: "Chef’s kitchen", ar: "مطبخ احترافي", fr: "Cuisine de chef" },
    ],
  },
  {
    id: "5",
    title: {
      en: "Noble Garden House",
      ar: "منزل نوبل جاردن",
      fr: "Maison Noble Garden",
    },
    description: {
      en: "A private garden home with a study, guest suite, and open-plan living room.",
      ar: "منزل بحديقة خاصة مع مكتب وجناح ضيوف وغرفة معيشة مفتوحة.",
      fr: "Une maison avec jardin privé, bureau, suite d'invité et salon ouvert.",
    },
    imageUrl:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=80",
    city: { en: "Riyadh", ar: "الرياض", fr: "Riyad" },
    area: 194,
    rooms: 4,
    bathrooms: 4,
    price: 11100,
    propertyType: "family",
    featured: false,
    seller: "Noble Homes",
    palette: ["from-rose-500", "to-pink-600"],
    amenities: [
      { en: "Garden", ar: "حديقة", fr: "Jardin" },
      { en: "Study room", ar: "غرفة دراسة", fr: "Bureau" },
      { en: "Guest suite", ar: "جناح ضيوف", fr: "Suite d'invité" },
    ],
  },
  {
    id: "6",
    title: {
      en: "Harbor View Loft",
      ar: "لوفت بإطلالة على الميناء",
      fr: "Loft Vue Port",
    },
    description: {
      en: "An airy loft with industrial finishes, a mezzanine workspace, and a bright harbor view.",
      ar: "لوفت رحب بتشطيبات صناعية ومساحة عمل علوية وإطلالة مشرقة على الميناء.",
      fr: "Un loft aérien aux finitions industrielles, espace de travail en mezzanine et vue lumineuse sur le port.",
    },
    imageUrl:
      "https://images.unsplash.com/photo-1600607687644-c7f34b5063b4?auto=format&fit=crop&w=1400&q=80",
    city: { en: "Muscat", ar: "مسقط", fr: "Mascate" },
    area: 109,
    rooms: 2,
    bathrooms: 2,
    price: 5700,
    propertyType: "apartments",
    featured: false,
    seller: "Harbor Bay",
    palette: ["from-cyan-500", "to-blue-600"],
    amenities: [
      { en: "Workspace", ar: "مساحة عمل", fr: "Espace de travail" },
      { en: "Elevator", ar: "مصعد", fr: "Ascenseur" },
      { en: "Storage room", ar: "غرفة تخزين", fr: "Stockage" },
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
    location: { en: "Rabat", ar: "الرباط", fr: "Rabat" },
  },
  {
    name: "Omar Al Farsi",
    role: { en: "Seller", ar: "بائع" },
    quote: {
      en: "I can manage listings, respond to leads, and upgrade plans in one place.",
      ar: "أستطيع إدارة العقارات والرد على الاستفسارات وترقية الباقة من مكان واحد.",
      fr: "Je peux gérer les annonces, répondre aux prospects et améliorer mes forfaits en un seul endroit.",
    },
    location: { en: "Rabat", ar: "الرباط", fr: "Rabat" },
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
      fr: "Le salon sur le toit est-il disponible pour toute la durée du contrat?",
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
      fr: "Puis-je planifier une visite ce week-end?",
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
      fr: "Veuillez m'envoyer les conditions de location et les détails du dépôt.",
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
    status: "banned",
  },
] as const;

export const sellerStats = [
  {
    label: {
      en: "Live listings",
      ar: "العقارات المنشورة",
      fr: "Annonces en ligne",
    },
    value: 8,
  },
  {
    label: {
      en: "Saved leads",
      ar: "العملاء المحتملون",
      fr: "Prospects sauvegardés",
    },
    value: 19,
  },
  {
    label: { en: "Plan health", ar: "حالة الباقة", fr: "Santé du plan" },
    value: 94,
  },
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

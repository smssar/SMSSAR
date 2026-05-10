-- Seed cities
INSERT INTO "City" ("id", "name", "name_en", "name_ar", "name_fr", "slug", "createdAt", "updatedAt") VALUES
('city_dubai', 'Dubai', 'Dubai', 'دبي', 'Dubaï', 'dubai', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('city_abudhabi', 'Abu Dhabi', 'Abu Dhabi', 'أبو ظبي', 'Abu Dhabi', 'abu-dhabi', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('city_sharjah', 'Sharjah', 'Sharjah', 'الشارقة', 'Charjah', 'sharjah', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('city_ajman', 'Ajman', 'Ajman', 'عجمان', 'Ajman', 'ajman', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('city_ras_al_khaimah', 'Ras Al Khaimah', 'Ras Al Khaimah', 'رأس الخيمة', 'Ras Al-Khaimah', 'ras-al-khaimah', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('city_al_ain', 'Al Ain', 'Al Ain', 'العين', 'Al Aïn', 'al-ain', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('city_umm_al_quwain', 'Umm Al Quwain', 'Umm Al Quwain', 'أم القيوين', 'Oum Al Qouwain', 'umm-al-quwain', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Seed property types
INSERT INTO "PropertyType" ("id", "name", "name_en", "name_ar", "name_fr", "slug", "createdAt", "updatedAt") VALUES
('pt_apartment', 'Apartment', 'Apartment', 'شقة', 'Appartement', 'apartment', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('pt_villa', 'Villa', 'Villa', 'فيلا', 'Villa', 'villa', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('pt_townhouse', 'Townhouse', 'Townhouse', 'تاون هاوس', 'Maison en rangée', 'townhouse', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('pt_detached', 'Detached House', 'Detached House', 'منزل مستقل', 'Maison individuelle', 'detached-house', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('pt_studio', 'Studio', 'Studio', 'استوديو', 'Studio', 'studio', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('pt_land', 'Land', 'Land', 'أرض', 'Terrain', 'land', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Seed plans
INSERT INTO "Plan" ("id", "title", "title_ar", "title_fr", "description", "description_ar", "description_fr", "price", "listings", "featured", "createdAt", "updatedAt") VALUES
('plan_free', 'Free', 'مجاني', 'Gratuit', 'Free basic plan with limited listings', 'خطة أساسية مجانية مع إعلانات محدودة', 'Plan gratuit de base avec annonces limitées', 0, 3, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('plan_pro', 'Pro', 'احترافي', 'Pro', 'Professional plan with more features', 'خطة احترافية مع ميزات إضافية', 'Plan professionnel avec plus de fonctionnalités', 4900, 50, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('plan_premium', 'Premium', 'علاوة', 'Premium', 'Premium plan with unlimited listings', 'خطة علاوة مع إعلانات غير محدودة', 'Plan premium avec annonces illimitées', 9900, 999, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

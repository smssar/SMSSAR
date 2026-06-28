-- Update plan_free with SMSSAR pricing and limits
UPDATE "Plan" 
SET 
  "smmsarPrice" = 0,
  "smssarListings" = NULL,
  "smssarMaxFeaturedListings" = 0,
  "smssarMaxImagesPerListing" = 3,
  "smssarMaxVideosPerListing" = 0,
  "updatedAt" = NOW()
WHERE "id" = 'plan_free';

-- Update plan_pro with SMSSAR pricing and limits (20% discount example)
UPDATE "Plan" 
SET 
  "smmsarPrice" = 79,
  "smssarListings" = 10,
  "smssarMaxFeaturedListings" = 3,
  "smssarMaxImagesPerListing" = 10,
  "smssarMaxVideosPerListing" = 2,
  "updatedAt" = NOW()
WHERE "id" = 'plan_pro';

-- Update plan_premium with SMSSAR pricing and limits (20% discount example)
UPDATE "Plan" 
SET 
  "smmsarPrice" = 239,
  "smssarListings" = NULL,
  "smssarMaxFeaturedListings" = 10,
  "smssarMaxImagesPerListing" = 30,
  "smssarMaxVideosPerListing" = 5,
  "updatedAt" = NOW()
WHERE "id" = 'plan_premium';

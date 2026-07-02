ALTER TABLE "WhatsappUser"
  ADD COLUMN "audioUsage" INTEGER DEFAULT 0,
  ADD COLUMN "audioLimit" INTEGER,
  ADD COLUMN "audioLimitReached" BOOLEAN NOT NULL DEFAULT false;

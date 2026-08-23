ALTER TABLE "User"
ADD COLUMN "avatarData" TEXT,
ADD COLUMN "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "themePreference" TEXT NOT NULL DEFAULT 'dark';

-- CreateTable
CREATE TABLE "AdminProviderConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "providerId" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'llm',
    "apiKey" TEXT NOT NULL,
    "baseUrl" TEXT,
    "proxy" TEXT,
    "models" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AdminDefaultConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "AdminProviderConfig_category_isEnabled_idx" ON "AdminProviderConfig"("category", "isEnabled");

-- CreateIndex
CREATE UNIQUE INDEX "AdminProviderConfig_providerId_category_key" ON "AdminProviderConfig"("providerId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "AdminDefaultConfig_key_key" ON "AdminDefaultConfig"("key");

-- CreateTable
CREATE TABLE "MistakeRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "wrongAnswer" TEXT,
    "analysis" TEXT NOT NULL,
    "correction" TEXT NOT NULL,
    "variants" TEXT,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "lastReviewAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MistakeRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MemoryRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "mnemonicData" TEXT,
    "strength" INTEGER NOT NULL DEFAULT 1,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "nextReviewAt" DATETIME NOT NULL,
    "lastReviewAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MemoryRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LearningProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LearningProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "MistakeRecord_userId_subject_idx" ON "MistakeRecord"("userId", "subject");

-- CreateIndex
CREATE INDEX "MistakeRecord_userId_createdAt_idx" ON "MistakeRecord"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "MemoryRecord_userId_nextReviewAt_idx" ON "MemoryRecord"("userId", "nextReviewAt");

-- CreateIndex
CREATE INDEX "MemoryRecord_userId_subject_idx" ON "MemoryRecord"("userId", "subject");

-- CreateIndex
CREATE UNIQUE INDEX "LearningProgress_userId_skillId_key" ON "LearningProgress"("userId", "skillId");

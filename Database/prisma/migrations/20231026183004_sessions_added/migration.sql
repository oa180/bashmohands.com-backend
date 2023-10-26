/*
  Warnings:

  - You are about to drop the column `capacity` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `delivered` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `endTime` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `instructorId` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the `clientSession` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `date` to the `Session` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SessionStatusEnum" AS ENUM ('pending', 'canceled', 'running', 'deliverd');

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_instructorId_fkey";

-- DropForeignKey
ALTER TABLE "clientSession" DROP CONSTRAINT "clientSession_clientId_fkey";

-- DropForeignKey
ALTER TABLE "clientSession" DROP CONSTRAINT "clientSession_sessionId_fkey";

-- AlterTable
ALTER TABLE "Session" DROP COLUMN "capacity",
DROP COLUMN "delivered",
DROP COLUMN "endTime",
DROP COLUMN "instructorId",
DROP COLUMN "startTime",
DROP COLUMN "title",
ADD COLUMN     "clientHandler" TEXT,
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "instructorHandler" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "status" "SessionStatusEnum" NOT NULL DEFAULT 'pending';

-- DropTable
DROP TABLE "clientSession";

-- CreateTable
CREATE TABLE "SessionTopics" (
    "topicId" TEXT NOT NULL,
    "seesionId" TEXT NOT NULL,

    CONSTRAINT "SessionTopics_pkey" PRIMARY KEY ("topicId","seesionId")
);

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_instructorHandler_fkey" FOREIGN KEY ("instructorHandler") REFERENCES "User"("handler") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_clientHandler_fkey" FOREIGN KEY ("clientHandler") REFERENCES "User"("handler") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionTopics" ADD CONSTRAINT "SessionTopics_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionTopics" ADD CONSTRAINT "SessionTopics_seesionId_fkey" FOREIGN KEY ("seesionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

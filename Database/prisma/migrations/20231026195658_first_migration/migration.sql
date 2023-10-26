-- CreateEnum
CREATE TYPE "RoleEnum" AS ENUM ('ADMIN', 'CLIENT', 'INSTRUCTOR');

-- CreateEnum
CREATE TYPE "GenderEnum" AS ENUM ('male', 'female', 'notdefined');

-- CreateEnum
CREATE TYPE "SessionStatusEnum" AS ENUM ('pending', 'canceled', 'running', 'deliverd');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "handler" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "gender" "GenderEnum" NOT NULL DEFAULT 'notdefined',
    "country" TEXT,
    "phone" TEXT,
    "photo" TEXT,
    "coverImage" TEXT,
    "NID_Verified" BOOLEAN DEFAULT false,
    "isInstructor" BOOLEAN DEFAULT false,
    "jobTitle" TEXT,
    "bio" TEXT,
    "experience" TEXT,
    "hourlyRate" DOUBLE PRECISION,
    "paidBalance" DOUBLE PRECISION DEFAULT 0.0,
    "unPaidBalance" DOUBLE PRECISION DEFAULT 0.0,
    "availability" BOOLEAN DEFAULT false,
    "freeSession" BOOLEAN DEFAULT false,
    "discount" DOUBLE PRECISION,
    "rating" DOUBLE PRECISION DEFAULT 0.0,
    "resetToken" TEXT,
    "resetTokenExpires" TIMESTAMP(3),
    "changedPasswordAt" TIMESTAMP(3),
    "loggedOutAt" TIMESTAMP(3),
    "role" "RoleEnum" NOT NULL DEFAULT 'CLIENT',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Topic" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserTopics" (
    "userId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,

    CONSTRAINT "UserTopics_pkey" PRIMARY KEY ("userId","topicId")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "status" "SessionStatusEnum" NOT NULL DEFAULT 'pending',
    "instructorHandler" TEXT,
    "clientHandler" TEXT,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionTopics" (
    "topicId" TEXT NOT NULL,
    "seesionId" TEXT NOT NULL,

    CONSTRAINT "SessionTopics_pkey" PRIMARY KEY ("topicId","seesionId")
);

-- CreateTable
CREATE TABLE "BookedSlot" (
    "id" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "order" INTEGER NOT NULL,
    "instructorId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,

    CONSTRAINT "BookedSlot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_handler_key" ON "User"("handler");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Topic_name_key" ON "Topic"("name");

-- AddForeignKey
ALTER TABLE "UserTopics" ADD CONSTRAINT "UserTopics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTopics" ADD CONSTRAINT "UserTopics_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_instructorHandler_fkey" FOREIGN KEY ("instructorHandler") REFERENCES "User"("handler") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_clientHandler_fkey" FOREIGN KEY ("clientHandler") REFERENCES "User"("handler") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionTopics" ADD CONSTRAINT "SessionTopics_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionTopics" ADD CONSTRAINT "SessionTopics_seesionId_fkey" FOREIGN KEY ("seesionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookedSlot" ADD CONSTRAINT "BookedSlot_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookedSlot" ADD CONSTRAINT "BookedSlot_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

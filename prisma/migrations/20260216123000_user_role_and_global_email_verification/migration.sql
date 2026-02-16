-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('application', 'admin');

-- AlterTable
ALTER TABLE "users"
ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'application';

-- DropForeignKey
ALTER TABLE "email_verification_codes"
DROP CONSTRAINT "email_verification_codes_application_id_fkey";

-- DropIndex
DROP INDEX "email_verification_codes_application_id_idx";

-- AlterTable
ALTER TABLE "email_verification_codes"
DROP COLUMN "application_id",
DROP COLUMN "role";

/*
  Warnings:

  - You are about to drop the column `nounce` on the `auth_request` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "auth_request" DROP COLUMN "nounce",
ADD COLUMN     "nonce" VARCHAR(80);

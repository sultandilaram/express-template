/*
  Warnings:

  - The primary key for the `auth_request` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `sign_in_request_id` on the `auth_request` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "auth_request" DROP CONSTRAINT "auth_request_pkey",
DROP COLUMN "sign_in_request_id",
ADD COLUMN     "request_id" SERIAL NOT NULL,
ADD CONSTRAINT "auth_request_pkey" PRIMARY KEY ("request_id");

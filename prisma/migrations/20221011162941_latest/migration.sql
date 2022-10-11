/*
  Warnings:

  - Made the column `wallet_address` on table `auth_request` required. This step will fail if there are existing NULL values in that column.
  - Made the column `nonce` on table `auth_request` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "auth_request" ALTER COLUMN "wallet_address" SET NOT NULL,
ALTER COLUMN "nonce" SET NOT NULL;

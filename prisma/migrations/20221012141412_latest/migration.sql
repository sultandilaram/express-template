/*
  Warnings:

  - You are about to drop the `collection_master` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "nft_master" DROP CONSTRAINT "nft_master_verified_collection_address_fkey";

-- DropTable
DROP TABLE "collection_master";

-- AlterTable
ALTER TABLE "nft_trait_master" ALTER COLUMN "last_updated_at" DROP DEFAULT;

-- CreateTable
CREATE TABLE "auth_request" (
    "sign_in_request_id" SERIAL NOT NULL,
    "wallet_address" VARCHAR(80),
    "nounce" VARCHAR(80),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "auth_request_pkey" PRIMARY KEY ("sign_in_request_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "auth_request_wallet_address_key" ON "auth_request"("wallet_address");

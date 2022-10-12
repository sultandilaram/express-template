-- CreateTable
CREATE TABLE "collection_master" (
    "collection_id" SERIAL NOT NULL,
    "collection_address" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "symbol" VARCHAR(255) NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "image" VARCHAR(255) NOT NULL,
    "floor_price" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collection_master_pkey" PRIMARY KEY ("collection_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "collection_master_collection_address_key" ON "collection_master"("collection_address");

-- AddForeignKey
ALTER TABLE "nft_master" ADD CONSTRAINT "nft_master_verified_collection_address_fkey" FOREIGN KEY ("verified_collection_address") REFERENCES "collection_master"("collection_address") ON DELETE SET NULL ON UPDATE CASCADE;

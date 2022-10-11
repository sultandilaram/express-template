-- CreateTable
CREATE TABLE "auth_request" (
    "request_id" SERIAL NOT NULL,
    "wallet_address" VARCHAR(80) NOT NULL,
    "nonce" VARCHAR(80) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "auth_request_pkey" PRIMARY KEY ("request_id")
);

-- CreateTable
CREATE TABLE "nft_creators_master" (
    "nft_collector_id" SERIAL NOT NULL,
    "nft_id" INTEGER,
    "mint_address" VARCHAR(80),
    "address" VARCHAR(80),
    "verified" VARCHAR(5),
    "share" DOUBLE PRECISION,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nft_creators_master_pkey" PRIMARY KEY ("nft_collector_id")
);

-- CreateTable
CREATE TABLE "nft_master" (
    "nft_id" SERIAL NOT NULL,
    "mint_address" VARCHAR(80),
    "mint_owner" VARCHAR(80),
    "mint_authority" VARCHAR(80),
    "verified_collection_address" VARCHAR(80),
    "update_authority" VARCHAR(80),
    "mint_state" VARCHAR(20),
    "amount" BIGINT,
    "max_supply" INTEGER,
    "current_supply" INTEGER,
    "is_native" BOOLEAN,
    "decimals" SMALLINT,
    "collection_name" VARCHAR(255),
    "collection_family" VARCHAR(255),
    "symbol" VARCHAR(80),
    "name" VARCHAR(255),
    "description" VARCHAR(255),
    "minted_program" VARCHAR(80),
    "minted_market_place" VARCHAR(80),
    "status" VARCHAR(20),
    "mint_date" TIMESTAMP(6),
    "go_live_date" TIMESTAMP(6),
    "master_edition" VARCHAR(5),
    "metadata_address" VARCHAR(80),
    "label" VARCHAR(255),
    "seller_fee_basis_points" INTEGER,
    "image" VARCHAR(500),
    "external_url" VARCHAR(500),
    "url" VARCHAR(500),
    "animation_url" VARCHAR(500),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nft_master_pkey" PRIMARY KEY ("nft_id")
);

-- CreateTable
CREATE TABLE "nft_owners_txn" (
    "nft_owners_txn_id" SERIAL NOT NULL,
    "mint_address" VARCHAR(80),
    "token_address" VARCHAR(80),
    "mint_authority" VARCHAR(80),
    "txn_time" TIMESTAMP(6),
    "txn_type" VARCHAR(20),
    "buyer" VARCHAR(80),
    "seller" VARCHAR(80),
    "wallet" VARCHAR(80),
    "price" BIGINT,
    "market_place" VARCHAR(80),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nft_owners_txn_pkey" PRIMARY KEY ("nft_owners_txn_id")
);

-- CreateTable
CREATE TABLE "nft_trait_master" (
    "nft_trait_id" SERIAL NOT NULL,
    "nft_id" INTEGER,
    "mint_address" VARCHAR(80),
    "trait_type" VARCHAR(255),
    "value" VARCHAR(255),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "nft_trait_master_pkey" PRIMARY KEY ("nft_trait_id")
);

-- CreateTable
CREATE TABLE "user_master" (
    "user_id" SERIAL NOT NULL,
    "full_name" VARCHAR(255),
    "status" VARCHAR(20),
    "user_type" VARCHAR(20),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "json_str" JSON,

    CONSTRAINT "user_master_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "wallet_holdings_master" (
    "wallet_address" VARCHAR(80) NOT NULL,
    "token_address" VARCHAR(80) NOT NULL,
    "account_type" VARCHAR(20),
    "mint_address" VARCHAR(80),
    "decimals" SMALLINT,
    "balance" BIGINT,
    "lamports" BIGINT,
    "slot" BIGINT,
    "txn_time" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_holdings_master_pkey" PRIMARY KEY ("wallet_address","token_address")
);

-- CreateTable
CREATE TABLE "wallet_holdings_txn" (
    "wallet_holdings_id" SERIAL NOT NULL,
    "wallet_address" VARCHAR(80),
    "from_address" VARCHAR(80),
    "to_address" VARCHAR(80),
    "token_address" VARCHAR(80),
    "txn_type" VARCHAR(20),
    "lamports" BIGINT,
    "decimals" SMALLINT,
    "market_place" VARCHAR(80),
    "token_size" BIGINT,
    "txn_time" TIMESTAMP(6),
    "authority_address" VARCHAR(80),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_holdings_txn_pkey" PRIMARY KEY ("wallet_holdings_id")
);

-- CreateTable
CREATE TABLE "wallet_master" (
    "wallet_id" SERIAL NOT NULL,
    "wallet_address" VARCHAR(80),
    "user_id" INTEGER,
    "wallet_type" VARCHAR(20),
    "twitter_handle" VARCHAR(80),
    "name" VARCHAR(80),
    "label" VARCHAR(255),
    "status" VARCHAR(20),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_master_pkey" PRIMARY KEY ("wallet_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "auth_request_wallet_address_key" ON "auth_request"("wallet_address");

-- CreateIndex
CREATE UNIQUE INDEX "nft_master_mint_address_key" ON "nft_master"("mint_address");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_master_wallet_address_key" ON "wallet_master"("wallet_address");

-- AddForeignKey
ALTER TABLE "nft_creators_master" ADD CONSTRAINT "nft_creators_master_nft_id_fkey" FOREIGN KEY ("nft_id") REFERENCES "nft_master"("nft_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nft_owners_txn" ADD CONSTRAINT "nft_owners_txn_mint_address_fkey" FOREIGN KEY ("mint_address") REFERENCES "nft_master"("mint_address") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nft_owners_txn" ADD CONSTRAINT "nft_owners_txn_buyer_fkey" FOREIGN KEY ("buyer") REFERENCES "wallet_master"("wallet_address") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nft_owners_txn" ADD CONSTRAINT "nft_owners_txn_seller_fkey" FOREIGN KEY ("seller") REFERENCES "wallet_master"("wallet_address") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nft_trait_master" ADD CONSTRAINT "nft_trait_master_nft_id_fkey" FOREIGN KEY ("nft_id") REFERENCES "nft_master"("nft_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_master" ADD CONSTRAINT "wallet_master_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_master"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "daily_pnl_summary" (
    "txn_date" DATE,
    "user_id" INTEGER NOT NULL,
    "wallet_address" VARCHAR(80) NOT NULL,
    "token_address" VARCHAR(80),
    "open_balance" DOUBLE PRECISION,
    "close_balance" DOUBLE PRECISION,
    "open_amount" DOUBLE PRECISION,
    "close_amount" DOUBLE PRECISION,
    "open_price" DOUBLE PRECISION,
    "close_price" DOUBLE PRECISION,
    "total_value" DOUBLE PRECISION,
    "profit" DOUBLE PRECISION,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
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
    "max_supply" BIGINT,
    "current_supply" BIGINT,
    "is_native" BOOLEAN,
    "decimals" SMALLINT,
    "collection_name" VARCHAR(255),
    "collection_family" VARCHAR(255),
    "symbol" VARCHAR(80),
    "name" VARCHAR(255),
    "description" VARCHAR(2000),
    "minted_program" VARCHAR(80),
    "minted_market_place" VARCHAR(80),
    "status" VARCHAR(20),
    "mint_date" TIMESTAMP(6),
    "go_live_date" TIMESTAMP(6),
    "master_edition" VARCHAR(80),
    "metadata_address" VARCHAR(80),
    "label" VARCHAR(255),
    "seller_fee_basis_points" INTEGER,
    "image" VARCHAR(500),
    "external_url" VARCHAR(500),
    "url" VARCHAR(500),
    "animation_url" VARCHAR(500),
    "edition" INTEGER,
    "primary_sale_happened" BOOLEAN,
    "is_mutable" BOOLEAN,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nft_master_pkey" PRIMARY KEY ("nft_id")
);

-- CreateTable
CREATE TABLE "nft_trait_master" (
    "nft_trait_id" SERIAL NOT NULL,
    "nft_id" INTEGER,
    "mint_address" VARCHAR(80),
    "trait_type" VARCHAR(255),
    "value" VARCHAR(255),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

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
    "user_id" INTEGER NOT NULL,
    "wallet_address" VARCHAR(80) NOT NULL,
    "token_address" VARCHAR(80) NOT NULL,
    "account_type" VARCHAR(20),
    "mint_address" VARCHAR(80),
    "decimals" SMALLINT,
    "balance" BIGINT,
    "lamports" BIGINT,
    "slot" BIGINT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_holdings_master_pkey" PRIMARY KEY ("user_id","wallet_address","token_address")
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
CREATE TABLE "collection_address_project_id_resolver" (
    "collection_address" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,

    CONSTRAINT "collection_address_project_id_resolver_pkey" PRIMARY KEY ("collection_address")
);

-- CreateIndex
CREATE UNIQUE INDEX "daily_pnl_summary_wallet_address_user_id_created_at_key" ON "daily_pnl_summary"("wallet_address", "user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "unique_mint_creator_address" ON "nft_creators_master"("mint_address", "address");

-- CreateIndex
CREATE UNIQUE INDEX "unique_mint_address" ON "nft_master"("mint_address");

-- CreateIndex
CREATE UNIQUE INDEX "unique_mint_traits" ON "nft_trait_master"("mint_address", "trait_type", "value");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_master_wallet_address_key" ON "wallet_master"("wallet_address");

-- CreateIndex
CREATE UNIQUE INDEX "unique_wallet_user_id" ON "wallet_master"("wallet_address", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "auth_request_wallet_address_key" ON "auth_request"("wallet_address");

-- CreateIndex
CREATE UNIQUE INDEX "collection_address_project_id_resolver_collection_address_key" ON "collection_address_project_id_resolver"("collection_address");

-- AddForeignKey
ALTER TABLE "nft_creators_master" ADD CONSTRAINT "nft_creators_master_mint_address_fkey" FOREIGN KEY ("mint_address") REFERENCES "nft_master"("mint_address") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nft_trait_master" ADD CONSTRAINT "nft_trait_master_mint_address_fkey" FOREIGN KEY ("mint_address") REFERENCES "nft_master"("mint_address") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_holdings_master" ADD CONSTRAINT "wallet_holdings_master_wallet_address_fkey" FOREIGN KEY ("wallet_address") REFERENCES "wallet_master"("wallet_address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_holdings_master" ADD CONSTRAINT "wallet_holdings_master_mint_address_fkey" FOREIGN KEY ("mint_address") REFERENCES "nft_master"("mint_address") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_master" ADD CONSTRAINT "wallet_master_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_master"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

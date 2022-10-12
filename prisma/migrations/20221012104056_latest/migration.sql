-- AddForeignKey
ALTER TABLE "wallet_holdings_master" ADD CONSTRAINT "wallet_holdings_master_mint_address_fkey" FOREIGN KEY ("mint_address") REFERENCES "nft_master"("mint_address") ON DELETE SET NULL ON UPDATE CASCADE;

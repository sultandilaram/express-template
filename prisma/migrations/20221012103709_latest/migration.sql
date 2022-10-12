-- AddForeignKey
ALTER TABLE "wallet_holdings_master" ADD CONSTRAINT "wallet_holdings_master_wallet_address_fkey" FOREIGN KEY ("wallet_address") REFERENCES "wallet_master"("wallet_address") ON DELETE RESTRICT ON UPDATE CASCADE;

import { user_master } from "@prisma/client";
import { Request as ExpressRequest } from "express";

type int = number;

export interface Request extends ExpressRequest {
  user?: user_master;
}

export interface Token {
  user_id: number;
}

export type nft_creators_master_type = {
  nft_collector_id: int;
  nft_id: int;
  mint_address: string;
  address: string;
  verified: string;
  share: int;
  created_at: Date;
  last_updated_at: Date;
};
export type nft_master_type = {
  nft_id: int;
  mint_address: string;
  mint_owner: string;
  mint_authority: string;
  verified_collection_address: string;
  update_authority: string;
  mint_state: string;
  amount: int;
  max_supply: int;
  current_supply: int;
  is_native: boolean;
  decimals: int;
  collection_name: string;
  collection_family: string;
  symbol: string;
  name: string;
  description: string;
  minted_program: string;
  minted_market_place: string;
  status: string;
  mint_date: Date;
  go_live_date: Date;
  master_edition: string;
  metadata_address: string;
  label: string;
  seller_fee_basis_points: int;
  image: string;
  external_url: string;
  url: string;
  animation_url: string;
  created_at: Date;
  last_updated_at: Date;
};
export type nft_owners_txn_type = {
  nft_owners_txn_id: int;
  mint_address: string;
  token_address: string;
  mint_authority: string;
  txn_time: Date;
  txn_type: Date;
  buyer: string;
  seller: string;
  wallet: string;
  price: int;
  market_place: string;
  created_at: Date;
  last_updated_at: Date;
};
export type nft_trait_master_type = {
  nft_trait_id: int;
  nft_id: int;
  mint_address: string;
  trait_type: string;
  value: int;
  created_at: Date;
  last_updated_at: Date;
};
export type user_master_type = {
  user_id: int;
  full_name: string;
  status: string;
  user_type: string;
  created_at: Date;
  last_updated_at: Date;
  json_str: string;
};
export type wallet_holdings_master_type = {
  wallet_address: string;
  token_address: string;
  account_type: string;
  mint_address: string;
  decimals: int;
  balance: int;
  lamports: int;
  slot: int;
  txn_time: Date;
  created_at: Date;
  last_updated_at: Date;
};
export type wallet_holdings_txn_type = {
  wallet_holdings_id: int;
  wallet_address: string;
  from_address: string;
  to_address: string;
  token_address: string;
  txn_type: string;
  lamports: int;
  decimals: int;
  market_place: string;
  token_size: int;
  txn_time: Date;
  authority_address: string;
  created_at: Date;
  last_updated_at: Date;
};
export type wallet_master_type = {
  wallet_id: int;
  wallet_address: string;
  user_id: int;
  wallet_type: string;
  twitter_handle: string;
  name: string;
  label: string;
  status: string;
  created_at: Date;
  last_updated_at: Date;
};

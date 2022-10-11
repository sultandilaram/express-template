import crypto from "crypto";
import nacl from "tweetnacl";
import bs58 from "bs58";

const AUTH_MESSAGE = "Please sign this message to authenticate: ";

export const create_nonce = () => crypto.randomBytes(32).toString("base64");

export const generate_message = () => {
  const nonce = create_nonce();
  return {
    message: AUTH_MESSAGE + nonce,
    nonce,
  };
};

export const verify_signature = (
  signature: string,
  wallet_address: string,
  nonce: string
) =>
  nacl.sign.detached.verify(
    new TextEncoder().encode(AUTH_MESSAGE + nonce),
    bs58.decode(signature),
    bs58.decode(wallet_address)
  );

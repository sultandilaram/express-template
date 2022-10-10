import crypto from "crypto";

export const create_nonce = () => {
  const nonce = crypto.randomBytes(32).toString("base64");
  return nonce;
};

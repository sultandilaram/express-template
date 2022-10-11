import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { Token } from "../types";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "secret";

export const create_token = (payload: Token): string =>
  jwt.sign(payload, JWT_SECRET);

export const verify_token = (token: string): Token | undefined => {
  try {
    return jwt.verify(token, JWT_SECRET) as Token;
  } catch (e) {
    return undefined;
  }
};

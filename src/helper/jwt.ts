import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "secret";

export const generate_token = (payload: any) => {
  return jwt.sign(payload, JWT_SECRET);
};

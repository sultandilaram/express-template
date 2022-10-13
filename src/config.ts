import * as web3 from "@solana/web3.js";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { HyperspaceClient } from "hyperspace-client-js";

dotenv.config();

export const prisma = new PrismaClient();

export const hyperspace = new HyperspaceClient(
  process.env.HYPERSPACE_API_KEY || ""
);

export const connection = new web3.Connection(process.env.RPC_URL || "");

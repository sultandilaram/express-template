import * as web3 from "@solana/web3.js";
import { PrismaClient } from "@prisma/client";

const RPC_URL = "https://rpc.solpatrol.io";

export const prisma = new PrismaClient();

export const connection = new web3.Connection(RPC_URL);

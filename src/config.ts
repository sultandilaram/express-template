import * as web3 from "@solana/web3.js";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { HyperspaceClient } from "hyperspace-client-js";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { readJSON, saveJSON } from "./helpers/file";
import { LocalCollection } from "./types";

dotenv.config();
puppeteer.use(StealthPlugin());

export const prisma = new PrismaClient();

export const hyperspace = new HyperspaceClient(
  process.env.HYPERSPACE_API_KEY || ""
);

export const connection = new web3.Connection(process.env.RPC_URL || "");

export const getBrowser = () =>
  puppeteer.launch({
    executablePath:
      // "/Applications/Firefox Nightly.app/Contents/MacOS/firefox-bin",
      "/Applications/Opera GX.app/Contents/MacOS/Opera",
    headless: true,
    args: ["--no-sandbox"],
  });

export const getCollections = (): LocalCollection[] => {
  try {
    return readJSON("./src/files/collections.json");
  } catch {
    return [];
  }
};

export const saveCollections = (collections: LocalCollection[]) => {
  saveJSON("./src/files/collections.json", collections);
};

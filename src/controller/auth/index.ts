import { PrismaClient } from "@prisma/client";
import { Handler, Request, Response } from "express";
import { generate_token } from "../../helper/jwt";
import { create_nonce } from "../../helper/nonce";
import ResponseHandler from "../../helper/response";

const prisma = new PrismaClient();

export const login: Handler = async (req: Request, res: Response) => {
  const body = req.body;

  if (!body.wallet_address || !body.signature) {
    const nonce = create_nonce();
    return res
      .header("nonce", nonce)
      .json(ResponseHandler.success(null, "NONCE SEND!"));
  } else {
    const user = await prisma.user_master.findUnique({
      where: {
        user_id: body.id,
      },
    });

    if (user) {
      const token = generate_token({
        id: user.user_id,
        wallet: body.wallet_address,
        signature: body.signature,
      });

      return res.json(ResponseHandler.success({ token }, "LOGIN SUCCESS!"));
    }

    return res.json(ResponseHandler.not_found(null, "USER NOT FOUND!"));
  }
};

export const confirm_wallet: Handler = async (req: Request, res: Response) => {
  const { wallet } = req.params;

  try {
    const data = await prisma.wallet_master.findUnique({
      where: {
        wallet_address: wallet,
      },
    });
    if (data) {
      return res.json(ResponseHandler.success(data, "WALLET FOUND"));
    } else {
      return res.json(ResponseHandler.error("WALLET NOT FOUND", "WALLET"));
    }
  } catch (e) {
    console.error(e, "ERROR");
    return res.json(ResponseHandler.error(e, "WALLET"));
  }
};

export const register: Handler = async (req: Request, res: Response) => {
  const body = req.body;
  const wallet_address = req.body.wallet_address;
  delete body.wallet_address;

  if (!body) {
    return res.json(ResponseHandler.error("BODY NOT FOUND", "NFT MASTER"));
  }

  try {
    const data = await prisma.user_master.create({
      data: body,
    });

    if (data) {
      const wallets = await prisma.wallet_master.create({
        data: {
          wallet_address: wallet_address,
          user_id: data.user_id,
        },
      });

      if (wallets) {
        return res.json(ResponseHandler.success(data, "CREATED SUCCESSFULLY"));
      }

      return res.json(
        ResponseHandler.error(data, "USER CREATED BUT WALLET NOT CREATED")
      );
    } else {
      console.error(data, "ERROR");
      return res.json(ResponseHandler.error("ERROR", "NFT MASTER"));
    }
  } catch (e) {
    console.error(e, "ERROR");
    return res.json(ResponseHandler.error(e, "INSERT NFT MASTER"));
  }
};

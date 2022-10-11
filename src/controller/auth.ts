import { Handler, Response, Router } from "express";
import { Request } from "../types";
import {
  ResponseHelper,
  generate_message,
  verify_signature,
  create_token,
} from "../helpers";
import { prisma } from "../config";
import { user_master } from "@prisma/client";
import { auth, bypass_auth } from "../middlewares";

interface AuthRequestBody {
  wallet: string;
}

/**
 * @description
 * Generates a random 32 bytes nonce along with a message to sign
 * updates nonce in database along with wallet address
 * @request { wallet: string }
 * @response { success: boolean, code: number, message: string }
 */
export const auth_request: Handler = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response = new ResponseHelper(res);

  if (req.method === "POST") {
    const { wallet } = req.body as AuthRequestBody;

    const walletSaved = await prisma.wallet_master.findUnique({
      where: { wallet_address: wallet },
    });

    const { message, nonce } = generate_message();

    try {
      await prisma.auth_request.upsert({
        where: {
          wallet_address: wallet,
        },
        update: {
          nonce: nonce,
        },
        create: {
          wallet_address: wallet,
          nonce: nonce,
        },
      });
    } catch (e: any) {
      return response.error(undefined, e.message);
    }
    return response.ok("Auth Session Initiated", {
      overwrite: !!walletSaved,
      message,
    });
  }

  return response.methodNotAllowed();
};

type AuthenticateBodyUser = {
  full_name: string;
};
interface AuthenticateBody {
  user?: AuthenticateBodyUser;
  wallet: string;
  signature: string;
}
/**
 * @description
 * Verifies the signature
 * IF the wallet is already associated with a user THEN find the user
 * ELSE IF the user is already authenticated THEN associate new wallet with the user
 * ELSE create a new user and associate the wallet with the user
 * @request { wallet: string, signature: string }
 * @response jwt{ user_id: number }
 */
export const auth_complete: Handler = async (req: Request, res: Response) => {
  const response = new ResponseHelper(res);

  if (req.method === "POST") {
    const {
      user: bodyUser,
      wallet: walletStr,
      signature,
    } = req.body as AuthenticateBody;

    try {
      const auth_request = await prisma.auth_request.findUnique({
        where: {
          wallet_address: walletStr,
        },
      });

      if (!auth_request) {
        return response.unauthorized("Invalid wallet");
      }

      if (!verify_signature(signature, walletStr, auth_request.nonce))
        return response.unauthorized("Invalid Signature");

      let user: user_master;
      let wallet = await prisma.wallet_master.findUnique({
        where: {
          wallet_address: walletStr,
        },
      });

      if (wallet && wallet.status === "active") {
        if (!wallet.user_id)
          return response.unauthorized(
            "This wallet not associated with any user"
          );

        const walletAssociatedUser = await prisma.user_master.findUnique({
          where: { user_id: wallet.user_id },
        });

        if (!walletAssociatedUser)
          return response.unauthorized(
            "This wallet not associated with any user"
          );

        user = walletAssociatedUser;
      } else {
        const randomUser =
          req.user ||
          (bodyUser
            ? await prisma.user_master.create({ data: bodyUser })
            : undefined);
        if (!randomUser) return response.unauthorized("User not found");
        user = randomUser;

        wallet = await prisma.wallet_master.upsert({
          where: {
            wallet_address: walletStr,
          },
          create: {
            wallet_address: walletStr,
            user_id: user.user_id,
            status: "active",
          },
          update: {
            wallet_address: walletStr,
            user_id: user.user_id,
            status: "active",
          },
        });
      }

      return response.ok(
        "Authorized",
        create_token({
          user_id: user.user_id,
        })
      );
    } catch (e: any) {
      return response.error(undefined, e.message);
    }
  }

  return response.methodNotAllowed();
};

interface RemoveWalletBody {
  wallet: string;
}
/**
 * @description
 * Removes the wallet association for the database
 * IF and only IF there are more than one wallet associated with the user
 * @request { wallet: string }
 */
export const remove_wallet: Handler = async (req: Request, res: Response) => {
  const response = new ResponseHelper(res);

  if (!req.user) return response.unauthorized();

  if (req.method === "POST") {
    const { wallet: walletStr } = req.body as RemoveWalletBody;

    const wallet = await prisma.wallet_master.findUnique({
      where: {
        wallet_address: walletStr,
      },
    });

    const nWalletsOwned = await prisma.wallet_master.count({
      where: {
        user_id: req.user.user_id,
      },
    });

    if (!wallet) return response.unauthorized("Wallet not found");
    if (wallet.user_id !== req.user.user_id)
      return response.unauthorized("Wallet not associated with the user");
    if (nWalletsOwned == 0)
      return response.unauthorized("No wallet associated with the user");
    if (nWalletsOwned == 1)
      return response.unauthorized("Can't remove the last wallet");

    await prisma.wallet_master.update({
      where: {
        wallet_address: walletStr,
      },
      data: {
        status: "inactive",
      },
    });

    return response.ok("Wallet removed");
  }

  return response.methodNotAllowed();
};

const router = Router();

router.post("/request", auth_request);
router.post("/complete", bypass_auth, auth_complete);
router.post("/remove", auth, remove_wallet);

export default router;

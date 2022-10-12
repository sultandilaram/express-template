import { Handler, Response, Router } from "express";
import { Request, User } from "../types";
import {
  ResponseHelper,
  generate_message,
  verify_signature,
  create_token,
  subscribe_wallet,
} from "../helpers";
import { prisma } from "../config";
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
const auth_request: Handler = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const response = new ResponseHelper(res);

  if (req.method === "POST") {
    const { wallet } = req.body as AuthRequestBody;

    if (!wallet) return response.badRequest("Wallet address is required");

    const walletSaved = await prisma.wallet_master.findFirst({
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
      console.error("[API] auth_request", e);
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
  action: "login" | "register";
  wallet: string;
  signature: string;
}

/**
 * @description
 * Verifies the signature
 * IF the wallet is already associated with a user THEN find the user
 * ELSE IF the user is already authenticated THEN associate new wallet with the user
 * ELSE create a new user and associate the wallet with the user
 * @request { wallet: string, signature: string, user?: { full_name: string } }
 * @response { token: jwt{ user_id: number }, user: user_master, wallets: wallet_master[] }
 */
const auth_confirm: Handler = async (req: Request, res: Response) => {
  const response = new ResponseHelper(res);

  if (req.method === "POST") {
    const {
      action,
      user: bodyUser,
      wallet: walletStr,
      signature,
    } = req.body as AuthenticateBody;

    if (!action || !walletStr || !signature)
      return response.badRequest(
        "Action, Wallet address and signature are required"
      );

    try {
      const auth_request = await prisma.auth_request.findFirst({
        where: {
          wallet_address: walletStr,
        },
      });

      if (!auth_request) {
        return response.unauthorized("Invalid wallet");
      }

      if (!verify_signature(signature, walletStr, auth_request.nonce))
        return response.unauthorized("Invalid Signature");

      let user: User;
      switch (action) {
        case "login":
          const userTemp = await prisma.user_master.findFirst({
            where: {
              wallet_master: {
                some: {
                  wallet_address: walletStr,
                  status: "active",
                },
              },
            },
            include: {
              wallet_master: true,
            },
          });
          if (!userTemp) return response.unauthorized("Invalid wallet");
          user = userTemp;
          break;

        case "register":
          const reqUser =
            req.user ||
            (bodyUser
              ? await prisma.user_master.create({ data: bodyUser })
              : undefined);
          if (!reqUser) return response.unauthorized("User not found");
          user = reqUser;

          const isWalletRegistered = await prisma.wallet_master.findFirst({
            where: {
              wallet_address: walletStr,
            },
          });

          const wallet = await prisma.wallet_master.upsert({
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

          if (!isWalletRegistered && wallet.wallet_address)
            subscribe_wallet(wallet.wallet_address);

          user.wallet_master = await prisma.wallet_master.findMany({
            where: {
              user_id: user.user_id,
            },
          });

          break;
        default:
          return response.badRequest(
            "Action must be from ['login', 'register']"
          );
      }

      return response.ok("Authorized", {
        token: create_token({
          user_id: user.user_id,
        }),
        user,
      });
    } catch (e: any) {
      console.error("[API] auth_complete", e);
      return response.error(undefined, e.message);
    }
  }

  return response.methodNotAllowed();
};

/**
 * @descriptions
 * Fetch all the wallets of the user
 * @response { wallets: wallet_master[] }
 */
const fetch_wallets: Handler = async (req: Request, res: Response) => {
  const response = new ResponseHelper(res);

  if (!req.user) return response.unauthorized();

  if (req.method === "GET") {
    const wallets = await prisma.wallet_master.findMany({
      where: {
        user_id: req.user.user_id,
      },
    });

    return response.ok("Wallets", { wallets });
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
const remove_wallet: Handler = async (req: Request, res: Response) => {
  const response = new ResponseHelper(res);

  if (!req.user) return response.unauthorized();

  if (req.method === "POST") {
    const { wallet: walletStr } = req.body as RemoveWalletBody;

    if (!walletStr) return response.badRequest("Wallet address is required");

    const wallet = await prisma.wallet_master.findFirst({
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

    try {
      await prisma.wallet_master.update({
        where: {
          wallet_address: walletStr,
        },
        data: {
          status: "inactive",
        },
      });

      return response.ok("Wallet removed");
    } catch (e: any) {
      console.error("[API] remove_wallet", e);
      return response.error(undefined, e.message);
    }
  }

  return response.methodNotAllowed();
};

const router = Router();

router.post("/request", auth_request);
router.post("/confirm", bypass_auth, auth_confirm);
router.post("/wallets", auth, fetch_wallets);
router.post("/remove", auth, remove_wallet);

export default router;

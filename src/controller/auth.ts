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
import { bypass_auth } from "../middlewares";

interface AuthRequestBody {
  wallet: string;
}

/**
 * @description
 * check if wallet is registered with any account
 * if yes, then check if wallet exists in auth_request
 * generate nonce and save/update it in auth_request along with wallet address
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
 * get object from auth_request with wallet_address
 * verify signature with nonce
 * @request { wallet: string, signature: string }
 * @response jwt
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

      if (wallet) {
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

        wallet = await prisma.wallet_master.create({
          data: {
            wallet_address: walletStr,
            user_id: user.user_id,
          },
        });
      }

      await prisma.auth_request.delete({
        where: {
          wallet_address: walletStr,
        },
      });

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

const router = Router();

router.post("/request", auth_request);
router.post("/complete", bypass_auth, auth_complete);

export default router;

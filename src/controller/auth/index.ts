import { Handler, Response } from "express";
import { Request } from "../../types";
import {
  ResponseHelper,
  generate_message,
  verify_signature,
  create_token,
} from "./../../helper";
import { prisma } from "../../config";
import { user_master } from "@prisma/client";

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
export const authenticate: Handler = async (req: Request, res: Response) => {
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

// export const login: Handler = async (req: Request, res: Response) => {
//   const body = req.body;

//   if (!body.wallet_address || !body.signature) {
//     const nonce = create_nonce();
//     await
//     return res.json(ResponseHandler.success({ nonce }, "INONCE SEND!"));
//   } else {
//     const user = await prisma.user_master.findUnique({
//       where: {
//         user_id: parseInt(body.user_id),
//       },
//     });

//     if (user) {
//       const token = generate_token({
//         id: user.user_id,
//         wallet: body.wallet_address,
//         signature: body.signature,
//       });

//       return res.json(
//         ResponseHandler.success({ token, user }, "LOGIN SUCCESS!")
//       );
//     }

//     return res.json(ResponseHandler.not_found(null, "USER NOT FOUND!"));
//   }
// };

// export const confirm_wallet: Handler = async (req: Request, res: Response) => {
//   const { wallet } = req.params;

//   try {
//     const data = await prisma.wallet_master.findUnique({
//       where: {
//         wallet_address: wallet,
//       },
//     });
//     if (data) {
//       return res.json(ResponseHandler.success(data, "WALLET FOUND"));
//     } else {
//       return res.json(ResponseHandler.error("WALLET NOT FOUND", "WALLET"));
//     }
//   } catch (e) {
//     console.error(e, "ERROR");
//     return res.json(ResponseHandler.error(e, "WALLET"));
//   }
// };

// export const register: Handler = async (req: Request, res: Response) => {
//   const body = req.body;
//   const wallet_address = req.body.wallet_address;
//   delete body.wallet_address;

//   if (!body) {
//     return res.json(ResponseHandler.error("BODY NOT FOUND", "NFT MASTER"));
//   }

//   try {
//     const data = await prisma.user_master.create({
//       data: body,
//     });

//     if (data) {
//       const wallets = await prisma.wallet_master.create({
//         data: {
//           wallet_address: wallet_address,
//           user_id: data.user_id,
//         },
//       });

//       if (wallets) {
//         return res.json(ResponseHandler.success(data, "CREATED SUCCESSFULLY"));
//       }

//       return res.json(
//         ResponseHandler.error(data, "USER CREATED BUT WALLET NOT CREATED")
//       );
//     } else {
//       console.error(data, "ERROR");
//       return res.json(ResponseHandler.error("ERROR", "NFT MASTER"));
//     }
//   } catch (e) {
//     console.error(e, "ERROR");
//     return res.json(ResponseHandler.error(e, "INSERT NFT MASTER"));
//   }
// };

// export const verify_token: Handler = async (req: Request, res: Response) => {
//   try {
//     if (req.user) {
//       const user = await prisma.user_master.findUnique({
//         where: {
//           user_id: req.user.id,
//         },
//       });

//       if (user) {
//         return res.json(
//           ResponseHandler.success(
//             {
//               ...req.user,
//               user,
//             },
//             "TOKEN VERIFIED!"
//           )
//         );
//       }
//     }
//   } catch (e) {
//     console.error(e, "VERIFING TOKEN");
//     return res.json(ResponseHandler.error(e, "VERIFING TOKEN"));
//   }

//   return res.json(ResponseHandler.error("TOKEN NOT VERIFIED!", "TOKEN"));
// };

// export const add_wallet: Handler = async (req: Request, res: Response) => {
//   const body = req.body;

//   if (!body.wallet_address || !body.signature) {
//     const nonce = create_nonce();
//     return res.json(ResponseHandler.success({ nonce }, "NONCE SEND!"));
//   } else {
//     const user = await prisma.user_master.findUnique({
//       where: {
//         user_id: parseInt(body.user_id),
//       },
//     });

//     const wallet = await prisma.wallet_master.create({
//       data: {
//         wallet_address: body.wallet_address,
//         user_id: parseInt(body.user_id),
//       },
//     });

//     if (user) {
//       const token = generate_token({
//         id: user.user_id,
//         wallet: wallet.wallet_address,
//         signature: body.signature,
//       });

//       return res.json(
//         ResponseHandler.success(
//           { token, user, wallet },
//           "Wallet Added SUCCESS!"
//         )
//       );
//     }

//     return res.json(ResponseHandler.not_found(null, "USER NOT FOUND!"));
//   }
// };

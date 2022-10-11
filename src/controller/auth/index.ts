import { create_nonce } from "./../../helper/nonce";
import { PrismaClient } from "@prisma/client";
import { Handler, Request, Response } from "express";

const prisma = new PrismaClient();

export const auth_request: Handler = async (req: Request, res: Response) => {};
// Request: wallet_address
// check if wallet is registered with any account
// if yes, then check if wallet exists in auth_request
// generate nonce and save/update it in auth_request along with wallet address
// Response: message with nonce in Unit8Array;

export const auth_complete: Handler = async (req: Request, res: Response) => {};
// Request: wallet_address, signature
// get object from auth_request with wallet_address
// verify signature with nonce
// return jwt

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

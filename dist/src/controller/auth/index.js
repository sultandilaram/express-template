"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth_request = void 0;
const nonce_1 = require("./../../helper/nonce");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const auth_request = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = req.body;
    try {
        const nonce = (0, nonce_1.create_nonce)();
        const wallet = req.params.wallet;
        const wallet_data = yield prisma.wallet_master.findUnique({
            where: {
                wallet_address: wallet,
            },
        });
        if (wallet_data) {
            const auth_request = yield prisma.auth_request.create({
                data: {
                    nonce: nonce,
                    wallet_master_id: wallet_data.id,
                },
            });
            return res.json({
                success: true,
                data: {
                    nonce: nonce,
                },
                message: "AUTH REQUEST CREATED",
                code: 200,
            });
        }
    }
    catch (e) {
        console.error(e, "ERROR");
    }
});
exports.auth_request = auth_request;
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

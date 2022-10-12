import { Handler, Response, Router } from "express";
import * as web3 from "@solana/web3.js";
import * as mplMetadata from "@metaplex-foundation/mpl-token-metadata";
import { connection, prisma } from "../config";
import { ResponseHelper } from "../helpers";
import { Request } from "../types";
import { bypass_auth } from "../middlewares";

/**
 * @description
 * Fetch all the NFTs held by the user's wallets along with the collections metadata
 * @response {
 *  holdings: (wallet_holdings_master & {
 *      Nft: (nft_master & {
 *        nft_creators_master: nft_creators_master[];
 *        nft_trait_master: nft_trait_master[];
 *      }) | null;
 *    })[]
 *
 *  collections: Metadata[]
 *  }
 *
 */
const fetch_holdings: Handler = async (req: Request, res: Response) => {
  const response = new ResponseHelper(res);

  if (req.user) {
    const holdings = await prisma.wallet_holdings_master.findMany({
      where: {
        Holder: {
          user_id: req.user.user_id,
        },
        balance: {
          gt: 0,
        },
        Nft: {
          NOT: {
            verified_collection_address: null,
            collection_name: null,
          },
        },
      },
      include: {
        Nft: {
          include: {
            nft_creators_master: true,
            nft_trait_master: true,
          },
        },
      },
    });

    const collections = await prisma.nft_master.groupBy({
      where: {
        holders: {
          some: {
            balance: {
              gt: 0,
            },
            Holder: {
              user_id: req.user.user_id,
            },
          },
        },
      },
      by: ["verified_collection_address", "collection_name"],
    });

    // const collections = await prisma.collection_master.findMany({
    //   where: {
    //     nft_master: {
    //       some: {
    //         holders: {
    //           some: {
    //             balance: {
    //               gt: 0,
    //             },
    //             Holder: {
    //               user_id: req.user.user_id,
    //             },
    //           },
    //         },
    //       },
    //     },
    //   },
    // });

    return response.ok("Holdings", { holdings, collections });
  } else {
    return response.unauthorized("User not found");
  }
};

const router = Router();

router.get("/holdings", bypass_auth, fetch_holdings);

export default router;

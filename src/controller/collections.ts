import { Handler, Response, Router } from "express";
import * as web3 from "@solana/web3.js";
import * as mplMetadata from "@metaplex-foundation/mpl-token-metadata";
import { connection, prisma } from "../config";
import { ResponseHelper } from "../helpers";
import { Request } from "../types";

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

  if (req.method === "GET") {
    if (!req.user)
      return response.notFound("Global data is yet to be implemented");

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

    const db_collections = await prisma.nft_master.groupBy({
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
      by: ["verified_collection_address"],
    });

    const collections = (
      await Promise.all(
        db_collections.map(async (collection) => {
          if (!collection.verified_collection_address) return null;

          const [metadataAddress] = await web3.PublicKey.findProgramAddress(
            [
              Buffer.from("metadata", "utf8"),
              mplMetadata.PROGRAM_ID.toBuffer(),
              new web3.PublicKey(
                collection.verified_collection_address
              ).toBuffer(),
            ],
            mplMetadata.PROGRAM_ID
          );
          try {
            return await mplMetadata.Metadata.fromAccountAddress(
              connection,
              metadataAddress
            );
          } catch {
            return null;
          }
        })
      )
    ).filter((collection) => collection !== null) as mplMetadata.Metadata[];

    return response.ok("Holdings", { holdings, collections });
  }

  return response.methodNotAllowed();
};

const router = Router();

router.post("/holdings", fetch_holdings);

export default router;

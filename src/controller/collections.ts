import { Handler, Response, Router } from "express";
import _ from "underscore";
import { hyperspace, prisma } from "../config";
import { serialize, ResponseHelper } from "../helpers";
import { Request } from "../types";
import { bypass_auth } from "../middlewares";
import { MarketPlaceActionEnum } from "hyperspace-client-js/dist/sdk";

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
 */
const fetch_holdings: Handler = async (req: Request, res: Response) => {
  const response = new ResponseHelper(res);

  if (req.user) {
    // const holdings = await prisma.wallet_holdings_master.findMany({
    //   where: {
    //     Holder: {
    //       user_id: req.user.user_id,
    //     },
    //     balance: {
    //       gt: 0,
    //     },
    //     Nft: {
    //       NOT: {
    //         // verified_collection_address: null,
    //         collection_name: null,
    //       },
    //     },
    //   },
    //   include: {
    //     Nft: {
    //       include: {
    //         nft_creators_master: true,
    //         nft_trait_master: true,
    //       },
    //     },
    //   },
    // });

    // const collections = await prisma.nft_master.groupBy({
    //   where: {
    //     collection_name: {
    //       not: null,
    //     },
    //     holders: {
    //       some: {
    //         balance: {
    //           gt: 0,
    //         },
    //         Holder: {
    //           user_id: req.user.user_id,
    //         },
    //       },
    //     },
    //   },
    //   by: ["verified_collection_address", "collection_name"],
    // });

    // const collection_addresses = collections
    //   .map((item) => item.collection_name)
    //   .filter((item) => !!item) as string[];
    // console.log("collection_addresses", collection_addresses);
    // const project_ids = await resolveCollectionProjectId(collection_addresses);

    // const data_tmp = _.values(
    //   _.extend(
    //     _.indexBy(collections, "collection_name"),
    //     _.indexBy(project_ids, "collection_address")
    //   )
    // );

    const collections = await prisma.collection_master.findMany({
      where: {
        nft_master: {
          some: {
            collection_id: {
              not: null,
            },
            collection_name: {
              not: null,
            },
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
        },
      },
      include: {
        nft_master: true,
      },
    });

    return response.ok("Holdings", serialize(collections));
  } else {
    return response.unauthorized("User not found");
  }
};

interface FetchActivityParams {
  collection_id?: string;
}

/**
 * @description
 * Fetch all NFT activities of the collection
 * @params collection_id
 */
const fetch_activity: Handler = async (req: Request, res: Response) => {
  const response = new ResponseHelper(res);
  const { collection_id } = req.params as FetchActivityParams;
  if (!collection_id) return response.badRequest("Collection Id not provided");
  try {
    const history = await hyperspace.getProjectHistory({
      condition: {
        projects: [{ project_id: collection_id }],
        actionTypes: [
          MarketPlaceActionEnum.Transaction,
          MarketPlaceActionEnum.Listing,
          MarketPlaceActionEnum.Delisting,
        ],
      },
    });

    return response.ok(
      "History",
      history.getProjectHistory.market_place_snapshots
    );
  } catch (e) {
    console.error("[API] fetch_activity", e);
    return response.error("Something went wrong", e);
  }
};

const router = Router();

router.get("/activity/:collection_id", fetch_activity);
router.get("/holdings", bypass_auth, fetch_holdings);

export default router;

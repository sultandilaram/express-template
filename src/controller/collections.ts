import { Handler, Response, Router } from "express";
import _ from "underscore";
import { hyperspace, prisma } from "../config";
import { serialize, ResponseHelper } from "../helpers";
import { Request } from "../types";
import { bypass_auth } from "../middlewares";
import {
  MarketPlaceActionEnum,
  SortOrderEnum,
} from "hyperspace-client-js/dist/sdk";

/**
 * @description
 * Fetch all the NFTs held by the user's wallets along with the collections metadata
 * @example
 * response (collection_master & {
 *  nft_master: (nft_master & {
 *      nft_creators_master: nft_creators_master[];
 *      nft_trait_master: nft_trait_master[];
 *  })[];
 * })[]
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
        nft_master: {
          include: {
            nft_creators_master: true,
            nft_trait_master: true,
          },
        },
        collection_floor_stats: {
          orderBy: {
            txn_date: "desc",
          },
          take: 1,
        },
      },
    });

    return response.ok("Holdings", serialize(collections));
  } else {
    const collections = await hyperspace.getProjects({
      orderBy: {
        field_name: "market_cap",
        sort_order: SortOrderEnum.Desc,
      },
      paginationInfo: {
        page_size: 10,
      },
    });
    if (!collections.getProjectStats.project_stats)
      return response.notFound("No Collections Found");

    const maped_collections = collections.getProjectStats.project_stats.map(
      (x) => ({
        collection_id: x.project_id,
        json_str: x.project,
        nft_master: [],
        collection_floor_stats: [
          {
            collection_id: x.project_id,
            txn_date: new Date(),
            market_cap: x.market_cap,
            volume_7day: x.volume_7day,
            volume_1day: x.volume_1day,
            volume_1day_change: x.volume_1day_change,
            floor_price: x.floor_price,
            floor_price_1day_change: x.floor_price_1day_change,
            average_price: x.average_price,
            max_price: x.max_price,
            supply: x.project?.supply,
            num_of_token_holders: x.num_of_token_holders,
            twitter_followers: x.twitter_followers,
            discord_member: null,
            average_price_1day_change: x.average_price_1day_change,
            num_of_token_listed: x.num_of_token_listed,
            percentage_of_token_listed: x.percentage_of_token_listed,
            rank: null,
            created_at: new Date(),
            last_updated_at: new Date(),
          },
        ],
      })
    );

    return response.ok("Collections", maped_collections);
  }
};

interface FetchActivityParams {
  collection_id?: string;
  n?: string;
}

interface FetchActivityBody {
  traits?: { name: string; type: "CATEGORY" | "NUMERIC"; values: string[] }[];
}

/**
 * @description
 * Fetch all NFT activities of the collection
 * @example
 * params {
 *  collection_id: string
 *  n: number
 * }
 * request {
 *  traits: [
 *   {
 *    name: string,
 *    type: "CATEGORY" | "NUMERIC",
 *    values: string[]
 *   }
 * }
 * response {
 *      block_timestamp?: number | null;
 *      escrow_address?: string | null;
 *      signature?: string | null;
 *      seller_address?: string | null;
 *      buyer_address?: string | null;
 *      type?: MarketPlaceActionEnum | null;
 *      marketplace_program_id?: string | null;
 *      marketplace_instance_id?: string | null;
 *      fee?: number | null;
 *      amount?: number | null;
 *      seller_referral_fee?: number | null;
 *      seller_referral_address?: string | null;
 *      buyer_referral_address?: string | null;
 *      buyer_referral_fee?: number | null;
 *      metadata?: any | null;
 *      price?: number | null;
 *  }
 */
const fetch_activity: Handler = async (req: Request, res: Response) => {
  const response = new ResponseHelper(res);
  const { collection_id, n } = req.params as FetchActivityParams;
  const { traits } = req.body as FetchActivityBody;
  if (!collection_id) return response.badRequest("Collection Id not provided");
  try {
    const data = await hyperspace.getProjectHistory({
      condition: {
        projects: [{ project_id: collection_id, attributes: traits }],
        actionTypes: [
          MarketPlaceActionEnum.Transaction,
          MarketPlaceActionEnum.Listing,
          MarketPlaceActionEnum.Delisting,
        ],
      },
      paginationInfo: {
        page_number: n ? parseInt(n) : 1,
        page_size: 20,
      },
    });

    const activity = data.getProjectHistory.market_place_snapshots;
    // const paginationInfo = data.getProjectHistory.pagination_info

    return response.ok("Activity", activity);
  } catch (e) {
    console.error("[API] fetch_activity", e);
    return response.error("Something went wrong", e);
  }
};

const router = Router();

router.get("/", bypass_auth, fetch_holdings);
router.post("/:collection_id/activity/:n?", fetch_activity);

export default router;

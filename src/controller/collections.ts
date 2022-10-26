import { Handler, Response, Router } from "express";
import _ from "underscore";
import { hyperspace, prisma } from "../config";
import { serialize, ResponseHelper } from "../helpers";
import { Request } from "../types";
import { auth, bypass_auth } from "../middlewares";
import {
  MarketPlaceActionEnum,
  SortOrderEnum,
} from "hyperspace-client-js/dist/sdk";
import { MarketplaceActionEnums } from "hyperspace-client-js";
import { nft_owners_txn } from "@prisma/client";

interface FetchCollectionsParams {
  n?: string;
  p?: string;
}

/**
 * @description
 * Fetch all the collections
 */
const fetch_collections: Handler = async (req: Request, res: Response) => {
  const response = new ResponseHelper(res);

  const { n, p } = req.params as FetchCollectionsParams;

  const page_size = p ? parseInt(p) : 10;
  const page_number = n ? parseInt(n) : 1;

  if (req.user) {
    const collections = await prisma.collection_master.findMany({
      where: {
        nft_master: {
          some: {
            collection_id: {
              not: null,
            },
            holders: {
              some: {
                balance: {
                  gt: 0,
                },
                Holder: {
                  user_id: req.user.user_id,
                  status: "active",
                },
              },
            },
          },
        },
      },
      include: {
        collection_floor_stats: {
          orderBy: {
            txn_date: "desc",
          },
          take: 1,
        },
        _count: {
          select: {
            nft_master: true,
          },
        },
      },
      skip: page_size * (page_number - 1),
      take: page_size,
    });

    return response.ok("Collections", serialize(collections));

    const nft_counts = await prisma.nft_master.groupBy({
      by: ["collection_id"],
      where: {
        collection_id: {
          in: collections.map((x) => x.collection_id),
        },
      },
      _count: true,
    });

    return response.ok("Collections", {
      collections: serialize(collections),
      counts: nft_counts,
    });
  } else {
    const collections = await hyperspace.getProjects({
      orderBy: {
        field_name: "market_cap",
        sort_order: SortOrderEnum.Desc,
      },
      paginationInfo: {
        page_size,
        page_number,
      },
    });
    if (!collections.getProjectStats.project_stats)
      return response.notFound("No Collections Found");

    const maped_collections = collections.getProjectStats.project_stats.map(
      (x) => ({
        collection_id: x.project_id,
        json_str: x.project,
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

interface FetchNftsParams {
  collection_id?: string;
  n?: string;
  p?: string;
}

/**
 * @description
 * Fetch Nfts held by the user's wallets in a particular collection
 */
const fetch_nfts: Handler = async (req: Request, res: Response) => {
  const response = new ResponseHelper(res);

  const { collection_id, n, p } = req.params as FetchNftsParams;

  const page_size = p ? parseInt(p) : 10;
  const page_number = n ? parseInt(n) : 1;

  if (!collection_id)
    return response.badRequest("Collection Id is not provided");

  if (!req.user) return response.unauthorized();

  if (!req.user.wallet_master) return response.notFound("Wallet not found");

  const nfts = await prisma.nft_master.findMany({
    where: {
      collection_id,
      holders: {
        some: {
          balance: {
            gt: 0,
          },
          Holder: {
            user_id: req.user.user_id,
            status: "active",
          },
        },
      },
    },
    include: {
      nft_creators_master: true,
      nft_trait_master: true,
      holders: {
        where: {
          balance: {
            gt: 0,
          },
          Holder: {
            user_id: req.user.user_id,
            status: "active",
          },
        },
      },
      nft_owners_txn: {
        where: {
          Buyer: {
            user_id: req.user.user_id,
            status: "active",
          },
        },
        orderBy: {
          txn_time: "desc",
        },
        take: 1,
      },
    },
    skip: page_size * (page_number - 1),
    take: page_size,
  });

  // return response.ok("Holdings", serialize(nfts));

  const nft_count = await prisma.nft_master.count({
    where: {
      collection_id,
      holders: {
        some: {
          balance: {
            gt: 0,
          },
          Holder: {
            user_id: req.user.user_id,
            status: "active",
          },
        },
      },
    },
  });

  return response.ok("Holdings", {
    nfts: serialize(nfts),
    pagination: {
      page_number,
      page_size,
      total_pages: Math.ceil(nft_count / page_size),
    },
  });
};

interface FetchActivityParams {
  collection_id?: string;
  n?: string;
  p?: string;
}

interface FetchActivityBody {
  traits?: { name: string; type: "CATEGORY" | "NUMERIC"; values: string[] }[];
}

/**
 * @description
 * Fetch all NFT activities of the collection
 */
const fetch_activity: Handler = async (req: Request, res: Response) => {
  const response = new ResponseHelper(res);
  const { collection_id, n, p } = req.params as FetchActivityParams;
  const { traits } = req.body as FetchActivityBody;
  if (!collection_id) return response.badRequest("Collection Id not provided");

  const getActivity = async (actionTypes: MarketplaceActionEnums[]) => {
    const data = await hyperspace.getProjectHistory({
      condition: {
        projects: [{ project_id: collection_id, attributes: traits }],
        actionTypes,
      },
      paginationInfo: {
        page_number: n ? parseInt(n) : 1,
        page_size: p ? parseInt(p) : 10,
      },
    });
    return data.getProjectHistory.market_place_snapshots;
  };

  try {
    const sale = (await getActivity([MarketPlaceActionEnum.Transaction])) || [];
    const list = (await getActivity([MarketPlaceActionEnum.Listing])) || [];
    const delist = (await getActivity([MarketPlaceActionEnum.Delisting])) || [];

    return response.ok("Activity", [...sale, ...list, ...delist]);
  } catch (e) {
    console.error("[API] fetch_activity", e);
    return response.error("Something went wrong", e);
  }
};

/**
 * @description
 * Fetch the profit and loss data of the user's wallets
 */
const fetch_pnl: Handler = async (req: Request, res: Response) => {
  const response = new ResponseHelper(res);

  if (!req.user) return response.unauthorized();
  if (!req.user.wallet_master || !req.user.wallet_master.length)
    return response.ok("Pnl", []);

  const history_unrealized =
    await prisma.$queryRaw`SELECT difference, txn_date FROM daily_value_unrealized_view WHERE user_id = ${req.user.user_id} ORDER BY txn_date ASC`;
  const sum_unrealized =
    await prisma.$queryRaw`SELECT SUM(difference) FROM daily_value_unrealized_view WHERE user_id = ${req.user.user_id}`;

  const history_realized = await prisma.daily_value_realized_view.findMany({
    where: {
      user_id: req.user.user_id,
    },
  });

  const sum_realized = await prisma.daily_value_realized_view.aggregate({
    _sum: {
      profit: true,
    },
  });

  // const history_realized =
  //   await prisma.$queryRaw`SELECT * FROM daily_value_realized_view`;
  // const sum_realized =
  //   await prisma.$queryRaw`SELECT SUM(difference) FROM daily_value_realized_view WHERE user_id = ${req.user.user_id}`;

  return response.ok(
    "Pnl",
    serialize({
      unrealized: {
        sum: (sum_unrealized as any)[0].sum,
        history: history_unrealized,
      },
      realized: {
        sum: sum_realized._sum.profit,
        history: history_realized,
      },
    })
  );
};

interface UpdateUserPriceBody {
  create?: {
    mint_address: string;
    token_address: string;
    mint_authority: string;
    txn_time: number;
    txn_type: string;
    buyer: string;
    seller: string;
    wallet: string;
    user_edited_price: number;
    market_place: string;
  };
  update?: {
    nft_owners_txn_id: number;
    user_edited_price: number;
  };
}

/**
 * @description
 * Update the purchase cost of an NFT
 */
const update_user_price: Handler = async (req: Request, res: Response) => {
  const response = new ResponseHelper(res);
  const { create, update } = req.body as UpdateUserPriceBody;

  if (!req.user) return response.unauthorized();

  let tx: nft_owners_txn;

  if (create) {
    if (
      !req.user.wallet_master?.find((x) => x.wallet_address === create.wallet)
    )
      return response.unauthorized("Unknown Wallet");

    tx = await prisma.nft_owners_txn.create({
      data: {
        mint_address: create.mint_address,
        token_address: create.token_address,
        mint_authority: create.mint_authority,
        txn_time: new Date(create.txn_time),
        txn_type: create.txn_type,
        buyer: create.buyer,
        seller: create.seller,
        wallet: create.wallet,
        user_edited_price: create.user_edited_price,
        market_place: create.market_place,
      },
    });
  } else if (update) {
    tx = await prisma.nft_owners_txn.update({
      where: {
        nft_owners_txn_id: update.nft_owners_txn_id,
      },
      data: {
        user_edited_price: update.nft_owners_txn_id,
      },
    });
  } else {
    return response.badRequest("Provide fields for either update or create");
  }

  return response.ok("Transaction", serialize(tx));
};

const router = Router();

router.get("/pnl", auth, fetch_pnl);
router.post("/update_user_price", auth, update_user_price);
router.get("/:n?/:p?", bypass_auth, fetch_collections);
router.get("/:collection_id/nfts/:n?/:p?", auth, fetch_nfts);
router.post("/:collection_id/activity/:n?/:p?", fetch_activity);

export default router;

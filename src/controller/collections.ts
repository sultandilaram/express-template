import { Handler, Response, Router } from "express";
import _ from "underscore";
import { getCollections, hyperspace, prisma } from "../config";
import { serialize, ResponseHelper } from "../helpers";
import { Request } from "../types";
import { auth, bypass_auth } from "../middlewares";
import {
  MarketPlaceActionEnum,
  SortOrderEnum,
} from "hyperspace-client-js/dist/sdk";
import { MarketplaceActionEnums } from "hyperspace-client-js";

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

  const cached_collections = getCollections();

  if (req.user) {
    try {
      const collectionsTemp = await prisma.collection_master.findMany({
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
        },
        skip: page_size * (page_number - 1),
        take: page_size,
      });

      const user = req.user;
      const collections = await Promise.all(
        collectionsTemp.map(async (c) => {
          const nft_count = await prisma.nft_master.count({
            where: {
              collection_id: c.collection_id,
              holders: {
                some: {
                  balance: {
                    gt: 0,
                  },
                  Holder: {
                    user_id: user.user_id,
                    status: "active",
                  },
                },
              },
            },
          });

          const collection_holdings_txn =
            await prisma.wallet_holdings_master.findMany({
              where: {
                balance: { gt: 0 },
                Holder: {
                  user_id: user.user_id,
                },
                Nft: { collection_id: c.collection_id },
              },
              select: {
                Nft: {
                  select: {
                    nft_owners_txn: {
                      where: {
                        buyer: {
                          in:
                            (user.wallet_master
                              ?.map((x) =>
                                x.status === "active" ? x.wallet_address : null
                              )
                              .filter((x) => !!x) as string[]) || [],
                        },
                      },
                      orderBy: { txn_time: "desc" },
                      take: 1,
                      select: {
                        onchain_price: true,
                        user_edited_price: true,
                      },
                    },
                  },
                },
              },
            });

          const total_cost = collection_holdings_txn.reduce((sum, x) => {
            return (
              sum +
              parseFloat(
                x.Nft?.nft_owners_txn[0]?.onchain_price?.toString() ||
                  x.Nft?.nft_owners_txn[0]?.user_edited_price?.toString() ||
                  "0"
              )
            );
          }, 0);

          return {
            ...c,
            nft_count,
            total_cost,
            howrare_items:
              cached_collections.find(
                (y) => y.hyperspace_id === c.collection_id
              )?.howrareis_total_items || 0,
          };
        })
      );

      const total_count = await prisma.collection_master.count({
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
      });

      return response.ok("Collections", {
        collections: serialize(collections),
        total_count,
        pagination: {
          page_number,
          page_size,
          total_pages: Math.ceil(total_count / page_size),
        },
      });
    } catch (e) {
      return response.error(undefined, e);
    }
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

    try {
      const maped_collections = collections.getProjectStats.project_stats.map(
        (x) => ({
          collection_id: x.project_id,
          json_str: x.project,
          howrare_items:
            cached_collections.find((y) => y.hyperspace_id === x.project_id)
              ?.howrareis_total_items || 0,
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

      return response.ok("Collections", {
        collections: maped_collections,
        pagination: {
          page_number:
            collections.getProjectStats.pagination_info.current_page_number,
          page_size:
            collections.getProjectStats.pagination_info.current_page_size,
          total_pages:
            collections.getProjectStats.pagination_info.total_page_number,
        },
      });
    } catch (e) {
      return response.error(undefined, e);
    }
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

  try {
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

    const total_count = await prisma.nft_master.count({
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
      total_count,
      pagination: {
        page_number,
        page_size,
        total_pages: Math.ceil(total_count / page_size),
      },
    });
  } catch (e) {
    return response.error(undefined, e);
  }
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
    return response.error(undefined, e);
  }
};

const router = Router();

router.get("/:n?/:p?", bypass_auth, fetch_collections);
router.get("/:collection_id/nfts/:n?/:p?", auth, fetch_nfts);
router.post("/:collection_id/activity/:n?/:p?", fetch_activity);

export default router;

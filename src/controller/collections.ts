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

  if (req.user) {
    try {
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

      // return response.ok("Collections", serialize(collections));

      const collection_count = await prisma.collection_master.count({
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

      const cached_collections = getCollections();

      return response.ok("Collections", {
        collections: serialize(
          collections.map((x) => ({
            ...x,
            howrare_items:
              cached_collections.find(
                (y) => y.hyperspace_id === x.collection_id
              )?.howrareis_total_items || 0,
          }))
        ),
        pagination: {
          page_number,
          page_size,
          total_pages: Math.ceil(collection_count / page_size),
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

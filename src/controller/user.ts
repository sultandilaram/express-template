import { Handler, Response, Router } from "express";
import _ from "underscore";
import { hyperspace, prisma } from "../config";
import { serialize, ResponseHelper } from "../helpers";
import { Request } from "../types";
import { nft_owners_txn } from "@prisma/client";

/**
 * @description
 * Fetch the profit and loss data of the user's wallets
 */
const fetch_pnl: Handler = async (req: Request, res: Response) => {
  const response = new ResponseHelper(res);

  if (!req.user) return response.unauthorized();
  if (!req.user.wallet_master || !req.user.wallet_master.length)
    return response.ok("Pnl", []);

  try {
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
      where: {
        user_id: req.user.user_id,
      },
      _sum: {
        profit: true,
      },
    });

    const floor_price = await prisma.daily_floor_price_view.groupBy({
      by: ["txn_date"],
      where: {
        wallet_holdings_master: {
          Holder: {
            user_id: req.user.user_id,
          },
        },
      },
      _sum: {
        floor_price: true,
      },
    });

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
        floor_price,
      })
    );
  } catch (e) {
    return response.error(undefined, e);
  }
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
    txn_time: number;
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

  try {
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
          user_edited_price: update.user_edited_price,
          txn_time: new Date(update.txn_time),
        },
      });
    } else {
      return response.badRequest("Provide fields for either update or create");
    }

    return response.ok("Transaction", serialize(tx));
  } catch (e) {
    console.error(e);
    return response.error(undefined, e);
  }
};

interface FetchActivityParams {
  wallet_address?: string;
  n?: string;
  p?: string;
}
/**
 * @description
 * Fetch all NFT activities of the wallet
 */
const fetch_activity: Handler = async (req: Request, res: Response) => {
  const response = new ResponseHelper(res);
  const { wallet_address, n, p } = req.params as FetchActivityParams;
  if (!wallet_address)
    return response.badRequest("Wallet address not provided");

  try {
    const data = await hyperspace.getWalletStats({
      condition: {
        searchAddress: wallet_address,
      },
      paginationInfo: {
        page_number: n ? parseInt(n) : 1,
        page_size: p ? parseInt(p) : 10,
      },
    });

    return response.ok("Activity", data.getWalletStats.wallet_stats || []);
  } catch (e) {
    console.error("[API] fetch_activity", e);
    return response.error(undefined, e);
  }
};

/**
 * @description
 * Fetch Average Sales and Purchases of the wallet
 */
const fetch_avg_prices: Handler = async (req: Request, res: Response) => {
  const response = new ResponseHelper(res);
  if (!req.user) return response.unauthorized();
  const wallet_avg = await prisma.wallet_average_metrics.findFirst({
    where: {
      user_id: req.user.user_id,
    },
    select: {
      avg_purchase_price: true,
      avg_sale_price: true,
    },
  });
  return response.ok("User Average Prices", wallet_avg);
};

const router = Router();

router.get("/pnl", fetch_pnl);
router.post("/update_cost", update_user_price);
router.get("/average_prices", fetch_avg_prices);
router.get("/:wallet_address/activity/:n?/:p?", fetch_activity);

export default router;

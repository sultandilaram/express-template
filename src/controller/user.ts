import { Handler, Response, Router } from "express";
import _ from "underscore";
import { prisma } from "../config";
import { serialize, ResponseHelper } from "../helpers";
import { Request } from "../types";
import { auth, bypass_auth } from "../middlewares";
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

interface FetchWalletActivityParams {
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
  const { wallet_address, n, p } = req.params as FetchWalletActivityParams;

  if (!wallet_address) return response.badRequest("Wallet not provided");
  if (
    !req.user ||
    !req.user.wallet_master ||
    !req.user.wallet_master
      .map((x) => x.wallet_address)
      .includes(wallet_address)
  )
    return response.unauthorized();

  const page_size = p ? parseInt(p) : 10;
  const page_number = n ? parseInt(n) : 1;

  try {
    const activity = await prisma.nft_owners_txn.findMany({
      where: {
        wallet: wallet_address,
      },
      include: {
        Nft: true,
      },
      skip: page_size * (page_number - 1),
      take: page_size,
    });

    const activity_count = await prisma.nft_owners_txn.count({
      where: {
        wallet: wallet_address,
      },
    });

    return response.ok("Wallet Activity", {
      activity,
      pagination: {
        page_number,
        page_size,
        total_pages: Math.ceil(activity_count / page_size),
      },
    });
  } catch (e) {
    return response.error(undefined, e);
  }
};

const router = Router();

router.get("/pnl", auth, fetch_pnl);
router.post("/update_cost", auth, update_user_price);
router.get("/:wallet_address/activity/:n?/:p?", auth, fetch_activity);

export default router;

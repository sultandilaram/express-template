import * as web3 from "@solana/web3.js";
import * as splToken from "@solana/spl-token";
import axios from "axios";
import { Browser } from "puppeteer";
import {
  connection,
  getBrowser,
  getCollections,
  hyperspace,
  prisma,
  saveCollections,
} from "../config";
import { LocalCollection } from "../types";

export const subscribe_wallet = (wallet: string) =>
  axios.put(
    "https://monitor-api-nicbatbx3a-ue.a.run.app/subscription",
    {
      subscription_id: 203,
      query: {
        addlist: [wallet],
      },
    },
    {
      headers: {
        Authorization: "Bearer jk-F1BOoQdMOh1Mn_VOpUIi-xXzWe7NKgt48gWjKhZg",
        "Content-Type": "application/json",
      },
    }
  );

const fetchAsBrowser = async (browser: Browser, url: string) => {
  const page = await browser.newPage();
  await page.setRequestInterception(true);
  page.on("request", (request) => {
    const resourceType = request.resourceType();
    if (resourceType == "document") request.continue();
    else request.abort();
  });

  await page.goto(url);
  const data = await page.evaluate(() => {
    try {
      return JSON.parse(document.body.innerText);
    } catch (e) {
      return null;
    }
  });
  await page.close();
  return data;
};

const getMagicedenIdByMint = async (
  mint: string
): Promise<string | undefined> => {
  const browser = await getBrowser();
  const res = await fetchAsBrowser(
    browser,
    `https://api-mainnet.magiceden.io/rpc/getNFTByMintAddress/${mint}`
  ).catch((x) => undefined);
  return res?.results?.collectionName;
};

const getHyperspaceIdByMagicedenId = async (
  magiceden_id: string
): Promise<string | undefined> => {
  const projectT = (
    await hyperspace.searchProjectByName({
      condition: {
        meSlug: {
          value: magiceden_id,
        },
      },
    })
  ).getProjectStatByName.project_stats;
  if (!projectT || !projectT.length) return;
  const project = projectT[0];
  return await project.project_id;
};

const getNFTMasterCollectionIds = async (
  mints: {
    nft_id: number;
    mint_address: string | null;
  }[]
) => {
  const browser = await getBrowser();
  const collections = getCollections();
  const resolved_nfts: { nft_id: number; collection_id: string }[] = [];

  await Promise.all(
    mints.map(async (x, i) => {
      if (!x.mint_address) return;

      let hyperspace_id: string | undefined;

      const dataTemp = (
        await hyperspace.getTokenState({
          condition: {
            tokenAddresses: [x.mint_address],
          },
        })
      ).getTokenState[0];
      hyperspace_id = dataTemp?.market_place_states[0].project_id;

      if (!hyperspace_id) {
        const magiceden_id = await getMagicedenIdByMint(x.mint_address);
        if (!magiceden_id) return;

        hyperspace_id = collections.find(
          (x) => x.magiceden_id === magiceden_id
        )?.hyperspace_id;

        if (!hyperspace_id) {
          hyperspace_id = await getHyperspaceIdByMagicedenId(magiceden_id);
          if (!hyperspace_id) return;

          collections.push({
            name: "",
            magiceden_id,
            hyperspace_id,
            howrareis_id: "",
          });
        }
      }

      resolved_nfts.push({ nft_id: x.nft_id, collection_id: hyperspace_id });
    })
  );

  saveCollections(collections);
  browser.close();
  return resolved_nfts;
};

const resolveCachedCollectionIds = async () => {
  let cached_collections = getCollections();
  console.log(`[ETL] Cached collections ${cached_collections.length}`);

  /// Update Magic Eden IDs

  const db_collections_mints = await prisma.nft_master.findMany({
    where: {
      collection_id: {
        notIn: cached_collections.map((x) => x.hyperspace_id),
      },
    },
    select: {
      mint_address: true,
      collection_id: true,
    },
  });

  console.log(`[ETL] Non-cached collections`, db_collections_mints.length);

  // for (let x of db_collections_mints) {
  //   if (!x.mint_address) return null;
  //   const magiceden_id = await getMagicedenIdByMint(x.mint_address);
  //   if (!magiceden_id) return;
  //   cached_collections.push({
  //     name: "",
  //     magiceden_id,
  //     hyperspace_id: x.collection_id || "",
  //     howrareis_id: "",
  //   });
  // }

  saveCollections(cached_collections);
  console.log(`[ETL] Updated cached collections`, cached_collections.length);

  /// Update hyperspace_id, howrareis_id and name

  const howrareis_collections: any[] = await axios
    .get("https://api.howrare.is/v0.1/collections")
    .then((x) => x.data.result.data);

  console.log(`[ETL] Howrare.is collections`, howrareis_collections.length);

  const processBatch = async (batch: LocalCollection[]) => {
    return await Promise.all(
      batch.map(async (collection) => {
        const howrareis_collection = howrareis_collections.find(
          (x) => x.me_key === collection.magiceden_id
        );

        const name =
          collection.name ||
          (howrareis_collection ? howrareis_collection.name : "");

        let hyperspace_id = collection.hyperspace_id;
        if (!!!hyperspace_id) {
          hyperspace_id =
            (await getHyperspaceIdByMagicedenId(collection.magiceden_id)) || "";
        }

        const howrareis_id =
          collection.howrareis_id ||
          (howrareis_collection ? howrareis_collection.url?.slice(1) : "");

        return {
          name,
          magiceden_id: collection.magiceden_id,
          hyperspace_id,
          howrareis_id,
        };
      })
    );
  };

  const batchSize = 10;
  let updated_collections: LocalCollection[] = [];
  for (let i = 0; i < cached_collections.length; i += batchSize) {
    const batch = cached_collections.slice(i, i + batchSize);
    try {
      updated_collections = updated_collections.concat(
        await processBatch(batch)
      );
    } catch {}
  }

  saveCollections(updated_collections);
  console.log("[ETL] Updated cached collections:", updated_collections.length);
};

const resolveNFTMasterCollectionIds = async () => {
  const unresolved_nfts = await prisma.nft_master.findMany({
    where: {
      collection_id: null,
    },
    select: {
      nft_id: true,
      mint_address: true,
    },
  });

  console.log("[ETL] unresolved nfts", unresolved_nfts.length);

  const batchSize = 10;
  let resolved_nfts: { nft_id: number; collection_id: string }[] = [];
  for (let i = 0; i < unresolved_nfts.length; i += batchSize) {
    const batch = unresolved_nfts.slice(i, i + batchSize);
    try {
      resolved_nfts = resolved_nfts.concat(
        await getNFTMasterCollectionIds(batch)
      );
    } catch {}
  }

  await prisma.$transaction([
    ...resolved_nfts.map((x) =>
      prisma.nft_master.update({
        where: {
          nft_id: x.nft_id,
        },
        data: {
          collection_master: {
            connectOrCreate: {
              where: {
                collection_id: x.collection_id,
              },
              create: {
                collection_id: x.collection_id,
              },
            },
          },
        },
      })
    ),
  ]);

  console.log("[ETL] resolved nfts", resolved_nfts.length);
};

const resolveRanksAndTraits = async () => {
  const cached_collections = await getCollections();

  const howrareis_ids = cached_collections
    .filter((x) => !!x.howrareis_id)
    .map((x) => x.howrareis_id);

  for (let howrareis_id of howrareis_ids) {
    const response = await axios
      .get(`https://api.howrare.is/v0.1/collections/${howrareis_id}`)
      .then((x) => x.data.result.data);
    const items = response.items.map((x: any) => ({
      mint_address: x.mint,
      rank: x.rank,
      traits: x.attributes,
    }));
    break;
  }
};

const resolveTokenAccountBalances = async () => {
  const walletHoldings = await prisma.wallet_holdings_master.findMany();
  const resolvedWalletHoldings: {
    token_address: string;
    balance: number;
  }[] = [];

  console.log(`[ETL] Checking ${walletHoldings.length} token accounts`);

  await Promise.all(
    walletHoldings.map(async (walletHolding) => {
      const tokenAccount = await splToken
        .getAccount(connection, new web3.PublicKey(walletHolding.token_address))
        .catch((x) => null);
      if (!tokenAccount) return;
      if (walletHolding.balance != tokenAccount.amount) {
        resolvedWalletHoldings.push({
          token_address: walletHolding.token_address,
          balance: parseInt(tokenAccount.amount.toString()),
        });
      }
    })
  );

  await prisma.$transaction([
    ...resolvedWalletHoldings.map((x) =>
      prisma.wallet_holdings_master.updateMany({
        where: {
          token_address: x.token_address,
        },
        data: {
          balance: x.balance,
        },
      })
    ),
  ]);

  console.log(`[ETL] Updated ${resolvedWalletHoldings.length} token accounts`);
};

export default async function () {
  // resolveTokenAccountBalances();
  await resolveCachedCollectionIds();
  // await resolveNFTMasterCollectionIds();
  resolveRanksAndTraits();
}

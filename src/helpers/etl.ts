import axios from "axios";
import { Browser } from "puppeteer";
import {
  getBrowser,
  getCollections,
  hyperspace,
  prisma,
  saveCollections,
} from "../config";

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

export const fetchAsBrowser = async (browser: Browser, url: string) => {
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

export const getCollectionIds = async (
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
        const res = await fetchAsBrowser(
          browser,
          `https://api-mainnet.magiceden.io/rpc/getNFTByMintAddress/${x.mint_address}`
        ).catch((x) => undefined);
        if (!res || !res.results) return;
        const magiceden_id = res.results.collectionName;
        if (!magiceden_id) return;

        hyperspace_id = collections.find(
          (x) => x.magiceden_id === magiceden_id
        )?.hyperspace_id;

        if (!hyperspace_id) {
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
          hyperspace_id = project.project_id;

          collections.push({
            magiceden_id,
            hyperspace_id,
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

export const resolveCollectionIds = async () => {
  const unresolved_nfts = await prisma.nft_master.findMany({
    where: {
      collection_id: null,
    },
    select: {
      nft_id: true,
      mint_address: true,
    },
  });

  console.log("[server] unresolved nfts", unresolved_nfts.length);

  const batchSize = 10;
  let resolved_nfts: { nft_id: number; collection_id: string }[] = [];
  for (let i = 0; i < unresolved_nfts.length; i += batchSize) {
    const batch = unresolved_nfts.slice(i, i + batchSize);
    try {
      resolved_nfts = resolved_nfts.concat(await getCollectionIds(batch));
    } catch {}
  }

  console.log("[server] resolved nfts", resolved_nfts.length);

  return await prisma.$transaction([
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
};

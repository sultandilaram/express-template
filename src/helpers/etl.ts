import axios from "axios";
import { hyperspace, prisma } from "../config";

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

export const resolveCollectionIds = async () => {
  const unresolved_mints = await prisma.nft_master.findMany({
    where: {
      collection_id: null,
    },
    select: {
      nft_id: true,
      mint_address: true,
    },
  });

  const collection_ids: string[] = [];
  const nft_collection_ids: { nft_id: number; collection_id: string }[] = [];

  const getProjectIdBatch = async (
    mints: {
      nft_id: number;
      mint_address: string | null;
    }[]
  ) =>
    await Promise.all(
      mints.map(async (x) => {
        if (!x.mint_address) return;
        const dataTemp = (
          await hyperspace.getTokenState({
            condition: {
              tokenAddresses: [x.mint_address],
            },
          })
        ).getTokenState[0];

        if (!dataTemp) return;
        const collection_id = dataTemp.market_place_states[0].project_id;
        if (!collection_id) return;

        if (!collection_ids.includes(collection_id))
          collection_ids.push(collection_id);
        nft_collection_ids.push({ nft_id: x.nft_id, collection_id });
      })
    );

  const batchSize = 10;
  for (let i = 0; i < unresolved_mints.length; i += batchSize) {
    const batch = unresolved_mints.slice(i, i + batchSize);
    await getProjectIdBatch(batch);
  }

  return await prisma.$transaction([
    ...nft_collection_ids.map((x) =>
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

  // const resolved = await prisma.collection_address_collection_id_resolver.findMany(
  //   {
  //     where: {
  //       collection_address: {
  //         in: collection_addresses,
  //       },
  //     },
  //   }
  // );

  // const unresolved = collection_addresses.filter(
  //   (address) => !!!resolved.find((item) => item.collection_address === address)
  // );

  // const unresolved_mints = await prisma.nft_master.findMany({
  //   where: {
  //     collection_name: {
  //       in: unresolved,
  //     },
  //   },
  //   select: {
  //     mint_address: true,
  //     collection_name: true,
  //   },
  // });

  // await Promise.all(
  //   unresolved_mints.map(async (x) => {
  //     if (!x.mint_address || !x.collection_name) return;

  //     const dataTemp = (
  //       await hyperspace.getTokenState({
  //         condition: {
  //           tokenAddresses: [x.mint_address],
  //         },
  //       })
  //     ).getTokenState[0];

  //     if (!dataTemp) return;

  //     const collection_id = dataTemp.market_place_states[0].collection_id;

  //     const temp =
  //       await prisma.collection_address_collection_id_resolver.upsert({
  //         where: {
  //           collection_address: x.collection_name,
  //         },
  //         create: {
  //           collection_address: x.collection_name,
  //           collection_id,
  //         },
  //         update: {
  //           collection_id,
  //         },
  //       });
  //     resolved.push(temp);
  //   })
  // );

  // return resolved;
};

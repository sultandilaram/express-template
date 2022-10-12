import * as web3 from "@solana/web3.js";
import * as mplMetadata from "@metaplex-foundation/mpl-token-metadata";
import { prisma, connection } from "../config";
import axios from "axios";

const fetch_collection_metadata = async (
  address: web3.PublicKey,
  withUriData: boolean = false
) => {
  const [metadataAddress] = await web3.PublicKey.findProgramAddress(
    [
      Buffer.from("metadata", "utf8"),
      mplMetadata.PROGRAM_ID.toBuffer(),
      address.toBuffer(),
    ],
    mplMetadata.PROGRAM_ID
  );
  try {
    const metadata = await mplMetadata.Metadata.fromAccountAddress(
      connection,
      metadataAddress
    );

    return {
      ...metadata,
      uriData: withUriData
        ? await axios.get(metadata.data.uri).then((x) => x.data)
        : undefined,
    };
  } catch {
    return null;
  }
};
export default async function () {
  const collection_addresses = (
    await prisma.nft_master.groupBy({
      where: {
        holders: {
          some: {
            balance: {
              gt: 0,
            },
          },
        },
      },
      by: ["verified_collection_address"],
    })
  )
    .map((x) =>
      x.verified_collection_address
        ? new web3.PublicKey(x.verified_collection_address)
        : null
    )
    .filter((x) => x !== null) as web3.PublicKey[];

  collection_addresses.map(async (address) => {
    const metadata = await fetch_collection_metadata(address, true);
    if (!metadata) return;

    const data = {
      collection_address: metadata.mint.toString(),
      ...metadata.uriData,
      floor_price: 0,
    };
    prisma.collection_master.upsert({
      where: {
        collection_address: data.collection_address,
      },
      create: data,
      update: data,
    });
  });
}

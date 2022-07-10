// eslint-disable-next-line node/no-unpublished-import
import { network } from "hardhat";

export default async function moveBlocks(amount: number) {
  for (let index = 0; index < amount; index++) {
    await network.provider.request({
      method: "evm_mine",
      params: [],
    });
  }
  console.log(`Moved ${amount} blocks`);
}

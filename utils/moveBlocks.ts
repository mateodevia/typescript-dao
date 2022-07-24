// eslint-disable-next-line node/no-unpublished-import
import { network } from "hardhat";

/**
 * Moves the current block forward
 * @param amount Blocks to move ahead
 */
export default async function moveBlocks(amount: number) {
  for (let index = 0; index < amount; index++) {
    await network.provider.request({
      method: "evm_mine",
      params: [],
    });
  }
}

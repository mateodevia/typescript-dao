// eslint-disable-next-line node/no-unpublished-import
import { network } from "hardhat";

export default async function moveTime(amount: number) {
  await network.provider.send("evm_increaseTime", [amount]);

  console.log(`Moved forward in time ${amount} seconds`);
}

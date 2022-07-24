// eslint-disable-next-line node/no-unpublished-import
import { network } from "hardhat";

/**
 * Simulates that time moves forward
 * @param amount Seconds to move ahead
 */
export default async function moveTime(amount: number) {
  await network.provider.send("evm_increaseTime", [amount]);
}

import { ethers } from "ethers";
import { Treasury } from "../typechain";
import { HardhatEthersHelpers } from "@nomiclabs/hardhat-ethers/types";

/**
 * Gets the current balance of the treasury
 * @returns The balance of the treasury in ETH
 */
export const getTreasuryBalance = async (
  provider: HardhatEthersHelpers["provider"],
  contracts: {
    treasury: Treasury;
  }
): Promise<string> => {
  return ethers.utils.formatEther(
    await provider.getBalance(contracts.treasury.address)
  );
};

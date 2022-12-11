import { ethers } from "ethers";
import { Treasury } from "../typechain";
import { HardhatEthersHelpers } from "@nomiclabs/hardhat-ethers/types";

/**
 * Creates a proposal to send a certain amount of ETH to a given wallet
 * @param payee Wallet that will receive the released funds
 * @param amount Amount of treasury funds to be released
 * @param proposalDescription Description of the proposal
 * @param contracts Addresses of the contracts to use
 * @param contracts.treasury The treasury contract
 * @param contracts.governor The governor contract
 * @returns The proposalId, and the encodedFunction of the created proposal
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

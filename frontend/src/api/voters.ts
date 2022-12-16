import { ethers } from "ethers";
import { Token } from "../typechain";
import { Voter } from "./types";

/**
 * Gets a listof addresses that have voting power on the DAO
 * @returns The balance of the treasury in ETH
 */
export const getVoters = async (contracts: {
  token: Token;
}): Promise<Voter[]> => {
  return (await contracts.token.getTokenHolders()).map((v) => ({
    address: v.addr,
    tokens: ethers.utils.formatEther(v.tokens),
  }));
};

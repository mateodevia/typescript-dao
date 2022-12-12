import { Token } from "../../typechain";

/**
 * Gets a listof addresses that have voting power on the DAO
 * @returns The balance of the treasury in ETH
 */
export const getShareHolders = async (contracts: {
  token: Token;
}): Promise<string[]> => {
  return await contracts.token.getTokenHolders();
};

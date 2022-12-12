import { Token } from "../../typechain";

/**
 * Gets a listof addresses that have voting power on the DAO
 * @returns The balance of the treasury in ETH
 */
export const getShareHolders = async (contracts: {
  token: Token;
}): Promise<string[]> => {
  return Promise.all(
    // As as MVP the 5 hardhat addresses are hard coded.
    // In the future the Token contract should keep track of the address that hold tokens and therefore have voting power
    [
      "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
      "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
      "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
      "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
    ].map((add) => add)
  );
};

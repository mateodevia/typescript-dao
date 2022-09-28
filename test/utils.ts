import { ethers } from "hardhat";
import { deploy } from "../scripts/deployment";

export const deployFixture = async (params: {
  tokenSupply: number;
  treasurySupply: number;
  minDelay: number;
  quorum: number;
  votingDelay: number;
  votingPeriod: number;
}) => {
  const [deployer, voter1, voter2, voter3, voter4, voter5] =
    await ethers.getSigners();
  return await deploy(
    params.tokenSupply,
    params.treasurySupply,
    { deployer, investors: [voter1, voter2, voter3, voter4, voter5] },
    {
      minDelay: params.minDelay,
      quorum: params.quorum,
      votingDelay: params.votingDelay,
      votingPeriod: params.votingPeriod,
    }
  );
};

// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
// eslint-disable-next-line node/no-extraneous-import
import { ethers } from "hardhat";
import fs from "fs";
import constants from "./constants";
import { deploy } from "./api/deployment";

async function main() {
  const [deployer, voter1, voter2, voter3, voter4, voter5] =
    await ethers.getSigners();

  // Deploy contracts
  const { token, timeLock, governor, treasury } = await deploy(
    1000,
    50,
    { deployer, investors: [voter1, voter2, voter3, voter4, voter5] },
    {
      minDelay: constants.minDelay,
      quorum: constants.quorum,
      votingDelay: constants.votingDelay,
      votingPeriod: constants.votingPeriod,
    }
  );
  console.log("Contracts deployed");

  // Persist the deployed addresses on a .json file
  fs.writeFileSync(
    constants.addressFile,
    JSON.stringify({
      Token: token.address,
      Timelock: timeLock.address,
      Governor: governor.address,
      Treasury: treasury.address,
    })
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

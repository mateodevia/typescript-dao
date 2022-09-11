// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
// eslint-disable-next-line node/no-extraneous-import
import { artifacts, ethers } from "hardhat";
import fs from "fs";
import constants from "./constants";
import { deploy } from "./api/deployment";
import path from "path";
import { MyGovernor, TimeLock, Treasury, Token } from "../typechain";

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
  // TODO: Replace this json to only use the front-end json
  fs.writeFileSync(
    constants.addressFile,
    JSON.stringify({
      Token: token.address,
      Timelock: timeLock.address,
      Governor: governor.address,
      Treasury: treasury.address,
    })
  );
  // We also save the contract's artifacts and address in the frontend directory
  saveFrontendFiles(token, timeLock, governor, treasury);
}

function saveFrontendFiles(
  token: Token,
  timeLock: TimeLock,
  governor: MyGovernor,
  treasury: Treasury
) {
  const fs = require("fs");
  const contractsDir = path.join(
    __dirname,
    "..",
    "frontend",
    "src",
    "contracts"
  );

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(
    path.join(contractsDir, "contract-address.json"),
    JSON.stringify({
      Token: token.address,
      Timelock: timeLock.address,
      Governor: governor.address,
      Treasury: treasury.address,
    })
  );

  const TokenArtifact = artifacts.readArtifactSync("Token");
  const TimeLockArtifact = artifacts.readArtifactSync("TimeLock");
  const MyGovernorArtifact = artifacts.readArtifactSync("MyGovernor");
  const TreasuryArtifact = artifacts.readArtifactSync("Treasury");

  fs.writeFileSync(
    path.join(contractsDir, "Token.json"),
    JSON.stringify(TokenArtifact, null, 2)
  );
  fs.writeFileSync(
    path.join(contractsDir, "TimeLock.json"),
    JSON.stringify(TimeLockArtifact, null, 2)
  );
  fs.writeFileSync(
    path.join(contractsDir, "MyGovernor.json"),
    JSON.stringify(MyGovernorArtifact, null, 2)
  );
  fs.writeFileSync(
    path.join(contractsDir, "Treasury.json"),
    JSON.stringify(TreasuryArtifact, null, 2)
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

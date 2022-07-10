// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";
import {
  Token__factory,
  Timelock__factory,
  MyGovernor__factory,
  Box__factory,
} from "../typechain";
import * as fs from "fs";
import constants from "./constants";

async function main() {
  // eslint-disable-next-line no-unused-vars
  const [deployer] = await ethers.getSigners();

  // Deploy the token
  const token = await new Token__factory(deployer).deploy();
  await token.deployed();
  console.log("Token deployed");
  const delegateTx = await token.delegate(deployer.address);
  await delegateTx.wait(1);
  console.log("Token delegated");
  console.log(`Checkpoints: ${await token.numCheckpoints(deployer.address)}`);

  // Deploy time lock
  const minDelay = 0; // How long do we have to wait until we can excecute after
  const timelock = await new Timelock__factory(deployer).deploy(
    minDelay,
    [],
    []
  );
  await timelock.deployed();
  console.log("Timelock deployed");

  // Deploy Governor
  const quorum = 4; // Percentage if total supply of tokens needed to be approve proposals (1%)
  const votingDelay = 1; // How many blocks after proposal until voting becomes active
  const votingPeriod = 5; // How many blockst to allow voters to vote
  const governor = await new MyGovernor__factory(deployer).deploy(
    token.address,
    timelock.address,
    quorum,
    votingPeriod,
    votingDelay
  );
  await governor.deployed();
  console.log("Governor Deployed");

  // Setup governance contracts
  const proposerRole = await timelock.PROPOSER_ROLE();
  const executorRole = await timelock.EXECUTOR_ROLE();
  const adminRole = await timelock.TIMELOCK_ADMIN_ROLE();
  // Only governor can propose to the timelock
  const proposerTx = await timelock.grantRole(proposerRole, governor.address);
  await proposerTx.wait(1);
  // Everyone can excecute
  const executorTx = await timelock.grantRole(
    executorRole,
    "0x0000000000000000000000000000000000000000"
  );
  await executorTx.wait(1);
  // No one owns the timeLock, not even deployer
  const revokeTx = await timelock.revokeRole(adminRole, deployer.address);
  await revokeTx.wait(1);
  console.log("Roles setup done");

  // Deploy Box
  const box = await new Box__factory(deployer).deploy();
  await box.deployed();
  // Set timelock as the owner of the box
  const transferOwnershipTx = await box.transferOwnership(timelock.address);
  await transferOwnershipTx.wait(1);
  console.log("Box Deployed");

  fs.writeFileSync(
    constants.addressFile,
    JSON.stringify({
      Token: token.address,
      Timelock: timelock.address,
      Governor: governor.address,
      Box: box.address,
    })
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
// eslint-disable-next-line node/no-extraneous-import
import { ethers } from "hardhat";
import { MyGovernor__factory, Treasury__factory } from "../typechain";
import moveBlocks from "../utils/moveBlocks";
import moveTime from "../utils/moveTime";
import constants from "./constants";
import fs from "fs";
import { excecuteProposal, queueProposal } from "./api/proposal";

async function main() {
  // eslint-disable-next-line no-unused-vars
  const [deployer, voter1, voter2, voter3, voter4, voter5, payee] =
    await ethers.getSigners();

  // File that stores the addresses deployed in the last deployed (should only be used for testing porposes)
  const addresses = JSON.parse(fs.readFileSync(constants.addressFile, "utf8"));
  // Access the deployed contracts and proposal
  const governor = await new MyGovernor__factory(deployer).attach(
    addresses.Governor
  );
  const treasury = await new Treasury__factory(deployer).attach(
    addresses.Treasury
  );
  const { proposalId, encodedFunction, proposalDescription } =
    addresses.Proposal;

  // Queue the approved proposal
  await queueProposal(proposalDescription, encodedFunction, {
    governor,
    treasury,
  });
  await moveTime(constants.minDelay + 1);
  await moveBlocks(1);
  console.log("Queued the proposal");
  console.log(`Current Proposal State: ${await governor.state(proposalId)}`);

  // Excecuting the proposal
  await excecuteProposal(proposalDescription, encodedFunction, {
    governor,
    treasury,
  });
  console.log("Executed the proposal");
  console.log(`Current Proposal State: ${await governor.state(proposalId)}`);

  console.log(
    `Treasury balance: ${ethers.utils.formatEther(
      await ethers.provider.getBalance(treasury.address)
    )} ETH`
  );

  console.log(
    `Benefactor balance: ${ethers.utils.formatEther(
      await ethers.provider.getBalance(payee.address)
    )} ETH`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

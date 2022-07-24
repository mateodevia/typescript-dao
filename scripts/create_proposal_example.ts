// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
// eslint-disable-next-line node/no-extraneous-import
import { ethers } from "hardhat";
import { MyGovernor__factory, Treasury__factory } from "../typechain";
import moveBlocks from "../utils/moveBlocks";
import constants from "./constants";
import fs from "fs";
import { proposeReleaseFundsToPayee } from "./api/proposal";

async function main() {
  // eslint-disable-next-line no-unused-vars
  const [deployer, voter1, voter2, voter3, voter4, voter5, payee] =
    await ethers.getSigners();

  // File that stores the addresses deployed in the last deployed (should only be used for testing porposes)
  const addresses = JSON.parse(fs.readFileSync(constants.addressFile, "utf8"));

  // Access the deployed contracts
  const governor = await new MyGovernor__factory(deployer).attach(
    addresses.Governor
  );
  const treasury = await new Treasury__factory(deployer).attach(
    addresses.Treasury
  );

  // Create a proposal
  const proposalDescription = "Description";
  const { proposalId, encodedFunction } = await proposeReleaseFundsToPayee(
    deployer,
    payee,
    50,
    proposalDescription,
    {
      treasury,
      governor,
    }
  );
  console.log("Created Proposal");
  await moveBlocks(constants.votingDelay + 1);
  console.log(`Current Proposal State: ${await governor.state(proposalId)}`);

  // Persist proposalId to be used in other scripts (for testing purposes only)
  addresses.Proposal = { proposalId, encodedFunction, proposalDescription };
  fs.writeFileSync(constants.addressFile, JSON.stringify(addresses));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

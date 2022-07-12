// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
// eslint-disable-next-line node/no-extraneous-import
import { ethers } from "hardhat";
import {
  MyGovernor,
  MyGovernor__factory,
  Treasury,
  Treasury__factory,
} from "../typechain";
import moveBlocks from "../utils/moveBlocks";
import constants from "./constants";
import fs from "fs";
// eslint-disable-next-line node/no-extraneous-import
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

/**
 * @param payee Wallet that will receive the released funds
 * @param amount Amount of treasury funds to be released
 * @param proposalDescription Description of the proposal
 * @param contracts Addresses of the contracts to use
 * @param contracts.treasury The treasury contract
 * @param contracts.governor The governor contract
 * @returns The proposalId, and the encodedFunction of the created proposal
 */
export const proposeReleaseFundsToPayee = async (
  payee: SignerWithAddress,
  amount: number,
  proposalDescription: string,
  contracts: {
    treasury: Treasury;
    governor: MyGovernor;
  }
): Promise<{ proposalId: string; encodedFunction: string }> => {
  // Encode the function and argments to propose
  const encodedFunction = contracts.treasury.interface.encodeFunctionData(
    "releaseFunds",
    [payee.address, ethers.utils.parseEther(amount.toString())]
  );

  // Make the proposal
  const proposeTx = await contracts.governor.propose(
    [contracts.treasury.address],
    [0],
    [encodedFunction],
    proposalDescription
  );

  // Retrieve proposal id
  const proposeReceipt = await proposeTx.wait(1);
  return {
    proposalId: proposeReceipt.events![0].args!.proposalId,
    encodedFunction,
  };
};

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

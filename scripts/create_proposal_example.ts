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
 * @returns The proposalId of the created proposal
 */
export const proposeReleaseFundsToPayee = async (
  payee: SignerWithAddress,
  amount: number,
  proposalDescription: string,
  contracts: {
    treasury: Treasury;
    governor: MyGovernor;
  }
): Promise<string> => {
  // Encode the function and argments to propose
  const encodedFunctionCall = contracts.treasury.interface.encodeFunctionData(
    "releaseFunds",
    [payee.address, ethers.utils.parseEther(amount.toString())]
  );

  // Make the proposal
  const proposeTx = await contracts.governor.propose(
    [contracts.treasury.address],
    [0],
    [encodedFunctionCall],
    proposalDescription
  );

  // Retrieve proposal id
  const proposeReceipt = await proposeTx.wait(1);
  return proposeReceipt.events![0].args!.proposalId;
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
  const proposalId = await proposeReleaseFundsToPayee(
    payee,
    50,
    "Description",
    {
      treasury,
      governor,
    }
  );
  console.log("Created Proposal");
  await moveBlocks(constants.votingDelay + 1);
  console.log(`Current Proposal State: ${await governor.state(proposalId)}`);

  // // Voting
  // // 1 = for, 0 = against, 2 = abstain
  // const vote1 = await governor.connect(voter1).castVote(proposalId, 1);
  // await vote1.wait(1);
  // const vote2 = await governor.connect(voter2).castVote(proposalId, 1);
  // await vote2.wait(1);
  // const vote3 = await governor.connect(voter3).castVote(proposalId, 1);
  // await vote3.wait(1);
  // const vote4 = await governor.connect(voter4).castVote(proposalId, 0);
  // await vote4.wait(1);
  // const vote5 = await governor.connect(voter5).castVote(proposalId, 2);
  // await vote5.wait(1);
  // console.log("Voted for the proposal");
  // await moveBlocks(votingPeriod + 1);
  // const { againstVotes, forVotes, abstainVotes } = await governor.proposalVotes(
  //   proposalId
  // );
  // console.log({
  //   againstVotes: ethers.utils.formatEther(againstVotes),
  //   forVotes: ethers.utils.formatEther(forVotes),
  //   abstainVotes: ethers.utils.formatEther(abstainVotes),
  // });
  // console.log(`Current Proposal State: ${await governor.state(proposalId)}`);

  // // Queue the approved proposal
  // const queueTx = await governor.queue(
  //   [treasury.address],
  //   [0],
  //   [encodedFunctionCall],
  //   ethers.utils.id(proposalDescription)
  // );
  // await queueTx.wait(1);
  // await moveTime(minDelay + 1);
  // await moveBlocks(1);
  // console.log("Queued the proposal");
  // console.log(`Current Proposal State: ${await governor.state(proposalId)}`);

  // // Excecuting the proposal
  // const excecuteTx = await governor.execute(
  //   [treasury.address],
  //   [0],
  //   [encodedFunctionCall],
  //   ethers.utils.id(proposalDescription)
  // );
  // await excecuteTx.wait(1);
  // console.log("Executed the proposal");
  // console.log(`Current Proposal State: ${await governor.state(proposalId)}`);

  // console.log(
  //   `Treasury balance: ${ethers.utils.formatEther(
  //     await ethers.provider.getBalance(treasury.address)
  //   )} ETH`
  // );

  // console.log(
  //   `Benefactor balance: ${ethers.utils.formatEther(
  //     await ethers.provider.getBalance(payee.address)
  //   )} ETH`
  // );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

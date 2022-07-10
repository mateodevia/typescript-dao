// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";
import { Box__factory, MyGovernor__factory } from "../typechain";
import * as fs from "fs";
import moveBlocks from "../utils/moveBlocks";
import moveTime from "../utils/moveTime";
import constants from "./constants";

async function main() {
  // eslint-disable-next-line no-unused-vars
  const [deployer] = await ethers.getSigners();

  // File that stores the addresses deployed in the last deployed (should only be used for testing porposes)
  const addresses = JSON.parse(fs.readFileSync(constants.addressFile, "utf8"));
  console.log(addresses);

  // Access the deployed contracts
  const governor = await new MyGovernor__factory(deployer).attach(
    addresses.Governor
  );
  const box = await new Box__factory(deployer).attach(addresses.Box);

  // Create a proposal
  const encodedFunctionCall = box.interface.encodeFunctionData("store", [10]);
  const proposalDescription = "Description";
  const proposeTx = await governor.propose(
    [box.address],
    [0],
    [encodedFunctionCall],
    proposalDescription
  );
  const proposeReceipt = await proposeTx.wait(1);
  const proposalId = proposeReceipt.events![0].args!.proposalId;
  console.log("Created Proposal");
  await moveBlocks(constants.votingDelay + 1);
  console.log(`Current Proposal State: ${await governor.state(proposalId)}`);

  // Voting
  // 1 = for, 0 = against, 2 = abstain
  const vote1 = await governor.castVote(proposalId, 1);
  await vote1.wait(1);
  console.log("Voted for the proposal");
  await moveBlocks(constants.votingPeriod + 1);
  const { againstVotes, forVotes, abstainVotes } = await governor.proposalVotes(
    proposalId
  );
  console.log({
    againstVotes: ethers.utils.formatEther(againstVotes),
    forVotes: ethers.utils.formatEther(forVotes),
    abstainVotes: ethers.utils.formatEther(abstainVotes),
  });
  console.log(`Current Proposal State: ${await governor.state(proposalId)}`);

  // Queue the approved proposal
  const queueTx = await governor.queue(
    [box.address],
    [0],
    [encodedFunctionCall],
    ethers.utils.id(proposalDescription)
  );
  await queueTx.wait(1);
  await moveTime(constants.minDelay + 1);
  await moveBlocks(1);
  console.log("Queued the proposal");
  console.log(`Current Proposal State: ${await governor.state(proposalId)}`);

  // Excecuting the proposal
  const excecuteTx = await governor.execute(
    [box.address],
    [0],
    [encodedFunctionCall],
    ethers.utils.id(proposalDescription)
  );
  await excecuteTx.wait(1);
  console.log(`Current Proposal State: ${await governor.state(proposalId)}`);

  const boxNewValue = await box.retrieve();
  console.log("Updated value", boxNewValue.toString());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

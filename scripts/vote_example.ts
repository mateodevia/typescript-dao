// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
// eslint-disable-next-line node/no-extraneous-import
import { ethers } from "hardhat";
import { MyGovernor__factory } from "../typechain";
import moveBlocks from "../utils/moveBlocks";
import constants from "./constants";
import fs from "fs";
import { voteForProposal } from "./api/proposal";

async function main() {
  // eslint-disable-next-line no-unused-vars
  const [deployer, voter1, voter2, voter3, voter4, voter5] =
    await ethers.getSigners();

  // File that stores the addresses deployed in the last deployed (should only be used for testing porposes)
  const addresses = JSON.parse(fs.readFileSync(constants.addressFile, "utf8"));
  // Access the deployed contracts and proposal
  const governor = await new MyGovernor__factory(deployer).attach(
    addresses.Governor
  );
  const proposalId = addresses.Proposal.proposalId;

  // Voting
  // 1 = for, 0 = against, 2 = abstain
  await voteForProposal(voter1, proposalId, 1, { governor });
  await voteForProposal(voter2, proposalId, 1, { governor });
  await voteForProposal(voter3, proposalId, 1, { governor });
  await voteForProposal(voter4, proposalId, 0, { governor });
  await voteForProposal(voter5, proposalId, 2, { governor });
  console.log("Voted for the proposal");

  // Move blocks so that voting period is over
  await moveBlocks(constants.votingPeriod + 1);

  //   Log the voting results
  const { againstVotes, forVotes, abstainVotes } = await governor.proposalVotes(
    proposalId
  );
  console.log({
    againstVotes: ethers.utils.formatEther(againstVotes),
    forVotes: ethers.utils.formatEther(forVotes),
    abstainVotes: ethers.utils.formatEther(abstainVotes),
  });
  console.log(`Current Proposal State: ${await governor.state(proposalId)}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

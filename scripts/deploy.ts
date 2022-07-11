// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
// eslint-disable-next-line node/no-extraneous-import
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import {
  Token__factory,
  TimeLock__factory,
  MyGovernor__factory,
  Treasury__factory,
} from "../typechain";
import moveBlocks from "../utils/moveBlocks";
import moveTime from "../utils/moveTime";

/**
 *
 * @param {number} tokenSupply Amount of tokens (stocks) available to distribute voting power
 * @param {number} treasuryInitialSupply Initial investment for the treasury in ETH
 * @param {Object} participants Addresses of the DAO participants
 * @param {SignerWithAddress} participants.deployer Signer that will deploy the contracts
 * @param {SignerWithAddress[]} participants.investors Array of Signers with voting power
 * @param {Object} votingConfig Voting process parameters
 * @param {number} votingConfig.minDelay How long do we have to wait until we can excecute after
 * @param {number} votingConfig.quorum Percentage of total supply of tokens needed to be approve proposals (1 = 1%)
 * @param {number} votingConfig.votingDelay How many blocks after proposal until voting becomes active
 * @param {number} votingConfig.votingPeriod How many blocks to allow voters to vote
 */
export const deploy = async (
  tokenSupply: number,
  treasuryInitialSupply: number,
  participants: {
    deployer: SignerWithAddress;
    investors: SignerWithAddress[];
  },
  votingConfig: {
    minDelay: number;
    quorum: number;
    votingDelay: number;
    votingPeriod: number;
  }
) => {
  // Deploy the token with a total supply of 1000 Tokens
  const supply = ethers.utils.parseEther(tokenSupply.toString());
  const token = await new Token__factory(participants.deployer).deploy(supply);
  await token.deployed();

  // Divide the total token supply (stocks) in the amount of initial investors
  const amount = ethers.utils.parseEther(
    ((tokenSupply - 500) / participants.investors.length).toString()
  );

  // Give 20% of the tokens to each voter
  await Promise.all([
    ...participants.investors.map((investor) =>
      token.transfer(investor.address, amount)
    ),
  ]);

  // Each voter should delagate its voting power (represented by their tokens)
  // In this case each voter delagates to itself
  await Promise.all([
    ...participants.investors.map((investor) =>
      token.connect(investor).delegate(investor.address)
    ),
  ]);

  // Deploy time lock
  const timeLock = await new TimeLock__factory(participants.deployer).deploy(
    votingConfig.minDelay,
    [],
    []
  );
  await timeLock.deployed();

  // Deploy Governor
  const governor = await new MyGovernor__factory(participants.deployer).deploy(
    token.address,
    timeLock.address,
    votingConfig.quorum,
    votingConfig.votingPeriod,
    votingConfig.votingDelay
  );
  await governor.deployed();

  // Setup governance contracts
  const proposerRole = await timeLock.PROPOSER_ROLE();
  const executorRole = await timeLock.EXECUTOR_ROLE();
  const adminRole = await timeLock.TIMELOCK_ADMIN_ROLE();
  // Only governor can propose to the timelock
  const proposerTx = await timeLock.grantRole(proposerRole, governor.address);
  await proposerTx.wait(1);
  // Everyone can excecute
  const executorTx = await timeLock.grantRole(
    executorRole,
    "0x0000000000000000000000000000000000000000"
  );
  await executorTx.wait(1);
  // No one owns the timeLock, not even deployer
  const revokeTx = await timeLock.revokeRole(
    adminRole,
    participants.deployer.address
  );
  await revokeTx.wait(1);

  // Deploy Treasury with initial funds
  const treasury = await new Treasury__factory(participants.deployer).deploy({
    value: ethers.utils.parseEther(treasuryInitialSupply.toString()),
  });
  await treasury.deployed();
  // Set timelock as the owner of the box
  const transferOwnershipTx = await treasury.transferOwnership(
    timeLock.address
  );
  await transferOwnershipTx.wait(1);
  return { token, timeLock, governor, treasury };
};

async function main() {
  const [deployer, voter1, voter2, voter3, voter4, voter5, payee] =
    await ethers.getSigners();

  // Config
  const minDelay = 1;
  const quorum = 5;
  const votingDelay = 0;
  const votingPeriod = 10;

  // Deploy contracts
  const { governor, treasury } = await deploy(
    1000,
    50,
    { deployer, investors: [voter1, voter2, voter3, voter4, voter5] },
    {
      minDelay,
      quorum,
      votingDelay,
      votingPeriod,
    }
  );
  console.log("Contracts deployed");

  // Create a proposal
  const encodedFunctionCall = treasury.interface.encodeFunctionData(
    "releaseFunds",
    [payee.address, ethers.utils.parseEther("50")]
  );
  const proposalDescription = "Description";
  const proposeTx = await governor.propose(
    [treasury.address],
    [0],
    [encodedFunctionCall],
    proposalDescription
  );
  const proposeReceipt = await proposeTx.wait(1);
  const proposalId = proposeReceipt.events![0].args!.proposalId;
  console.log("Created Proposal");
  await moveBlocks(votingDelay + 1);
  console.log(`Current Proposal State: ${await governor.state(proposalId)}`);

  // Voting
  // 1 = for, 0 = against, 2 = abstain
  const vote1 = await governor.connect(voter1).castVote(proposalId, 1);
  await vote1.wait(1);
  const vote2 = await governor.connect(voter2).castVote(proposalId, 1);
  await vote2.wait(1);
  const vote3 = await governor.connect(voter3).castVote(proposalId, 1);
  await vote3.wait(1);
  const vote4 = await governor.connect(voter4).castVote(proposalId, 0);
  await vote4.wait(1);
  const vote5 = await governor.connect(voter5).castVote(proposalId, 2);
  await vote5.wait(1);
  console.log("Voted for the proposal");
  await moveBlocks(votingPeriod + 1);
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
    [treasury.address],
    [0],
    [encodedFunctionCall],
    ethers.utils.id(proposalDescription)
  );
  await queueTx.wait(1);
  await moveTime(minDelay + 1);
  await moveBlocks(1);
  console.log("Queued the proposal");
  console.log(`Current Proposal State: ${await governor.state(proposalId)}`);

  // Excecuting the proposal
  const excecuteTx = await governor.execute(
    [treasury.address],
    [0],
    [encodedFunctionCall],
    ethers.utils.id(proposalDescription)
  );
  await excecuteTx.wait(1);
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

// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";
import {
  Token__factory,
  TimeLock__factory,
  MyGovernor__factory,
  Treasury__factory,
} from "../typechain";
import moveBlocks from "../utils/moveBlocks";
import moveTime from "../utils/moveTime";

async function main() {
  // eslint-disable-next-line no-unused-vars
  const [deployer, voter1, voter2, voter3, voter4, voter5, payee] =
    await ethers.getSigners();

  // Deploy the token with a total supply of 1000 Tokens
  const supply = ethers.utils.parseEther("1000");
  const token = await new Token__factory(deployer).deploy(supply);
  await token.deployed();
  console.log("Token deployed");

  // Give 50 tokens to each voter
  const amount = ethers.utils.parseEther("50");
  await token.transfer(voter1.address, amount);
  await token.transfer(voter2.address, amount);
  await token.transfer(voter3.address, amount);
  await token.transfer(voter4.address, amount);
  await token.transfer(voter5.address, amount);

  // Each voter should delagate its voting power (represented by their tokens)
  // In this case each voter delagates to itself
  await token.connect(voter1).delegate(voter1.address);
  await token.connect(voter2).delegate(voter2.address);
  await token.connect(voter3).delegate(voter3.address);
  await token.connect(voter4).delegate(voter4.address);
  await token.connect(voter5).delegate(voter5.address);

  // Deploy time lock
  const minDelay = 1; // How long do we have to wait until we can excecute after
  const timeLock = await new TimeLock__factory(deployer).deploy(
    minDelay,
    [],
    []
  );
  await timeLock.deployed();
  console.log("Timelock deployed");

  // Deploy Governor
  const quorum = 5; // Percentage of total supply of tokens needed to be approve proposals (1%)
  const votingDelay = 0; // How many blocks after proposal until voting becomes active
  const votingPeriod = 10; // How many blockst to allow voters to vote
  const governor = await new MyGovernor__factory(deployer).deploy(
    token.address,
    timeLock.address,
    quorum,
    votingPeriod,
    votingDelay
  );
  await governor.deployed();
  console.log("Governor Deployed");

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
  const revokeTx = await timeLock.revokeRole(adminRole, deployer.address);
  await revokeTx.wait(1);
  console.log("Roles setup done");

  // Deploy Treasury with initial funds of 50 Tokens
  const treasury = await new Treasury__factory(deployer).deploy({
    value: ethers.utils.parseEther("50"),
  });
  await treasury.deployed();
  // Set timelock as the owner of the box
  const transferOwnershipTx = await treasury.transferOwnership(
    timeLock.address
  );
  await transferOwnershipTx.wait(1);
  console.log("Treasury Deployed");
  console.log(
    `Treasury balance: ${ethers.utils.formatEther(
      await ethers.provider.getBalance(treasury.address)
    )} ETH`
  );

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

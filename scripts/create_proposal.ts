// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers, network } from "hardhat";
import {
  Governance__factory,
  TimeLock__factory,
  Token__factory,
} from "../typechain";

async function moveBlocks(amount: number) {
  console.log("Moving blocks...");
  for (let index = 0; index < amount; index++) {
    await network.provider.request({
      method: "evm_mine",
      params: [],
    });
  }
  console.log(`Moved ${amount} blocks`);
}

export async function moveTime(amount: number) {
  console.log("Moving blocks...");
  await network.provider.send("evm_increaseTime", [amount]);

  console.log(`Moved forward in time ${amount} seconds`);
}

async function main() {
  // eslint-disable-next-line no-unused-vars
  const [deployer, proposer, voter1, voter2, voter3, voter4, voter5] =
    await ethers.getSigners();

  // Create a token with supply of 1000 ETHs
  const name = "DApp University";
  const symbol = "DAPPU";
  const supply = ethers.utils.parseEther("1000");
  const token = await new Token__factory(deployer).deploy(name, symbol, supply);
  await token.deployed();

  const amount = ethers.utils.parseEther("5");
  await token.transfer(voter1.address, amount);
  await token.transfer(voter2.address, amount);
  await token.transfer(voter3.address, amount);
  await token.transfer(voter4.address, amount);
  await token.transfer(voter5.address, amount);

  await token.connect(voter1).delegate(voter1.address);
  await token.connect(voter2).delegate(voter2.address);
  await token.connect(voter3).delegate(voter3.address);
  await token.connect(voter4).delegate(voter4.address);
  await token.connect(voter5).delegate(voter5.address);

  console.log("Original balance", {
    voter1: ethers.utils.formatEther(await token.balanceOf(voter1.address)),
    voter2: ethers.utils.formatEther(await token.balanceOf(voter2.address)),
    voter3: ethers.utils.formatEther(await token.balanceOf(voter3.address)),
    voter4: ethers.utils.formatEther(await token.balanceOf(voter4.address)),
    voter5: ethers.utils.formatEther(await token.balanceOf(voter5.address)),
  });

  // Proposal to send 50 tokens to voter 5
  const transferCalldata = token.interface.encodeFunctionData("transfer", [
    voter5.address,
    amount,
  ]);

  const minDelay = 0; // How long do we have to wait until we can excecute after
  const timelock = await new TimeLock__factory(deployer).deploy(
    minDelay,
    [proposer.address],
    [deployer.address]
  );
  await timelock.deployed();

  const quorum = 1; // Percentage if total supply of tokens needed to be approve proposals (1%)
  const votingDelay = 0; // How many blocks after proposal until voting becomes active
  const votingPeriod = 5; // How many blockst to allow voters to vote
  const governance = await new Governance__factory(deployer).deploy(
    token.address,
    timelock.address,
    quorum,
    votingDelay,
    votingPeriod
  );
  await governance.deployed();

  console.log("Setting up contracts for roles...");

  const transferOwnershipTx = await token.transferOwnership(timelock.address);
  await transferOwnershipTx.wait(1);

  // would be great to use multicall here...
  const proposerRole = await timelock.PROPOSER_ROLE();
  const executorRole = await timelock.EXECUTOR_ROLE();
  // const adminRole = await timelock.TIMELOCK_ADMIN_ROLE();

  const proposerTx = await timelock.grantRole(proposerRole, governance.address);
  await proposerTx.wait(1);
  const executorTx = await timelock.grantRole(executorRole, governance.address);
  await executorTx.wait(1);
  // const revokeTx = await timelock.revokeRole(adminRole, deployer.address);
  // await revokeTx.wait(1);

  const proposalDescription = "My super proposal";
  const proposalTX = await governance
    .connect(voter1)
    .propose([token.address], [0], [transferCalldata], proposalDescription);
  const proposeReceipt = await proposalTX.wait(1);
  const proposalId = proposeReceipt.events![0].args!.proposalId;
  console.log(`Current Proposal State: ${await governance.state(proposalId)}`);
  const snapshot = await governance.proposalSnapshot(proposalId);
  console.log(`Proposal created on block ${snapshot.toString()}`);
  const deadline = await governance.proposalDeadline(proposalId);
  console.log(`Proposal deadline on block ${deadline.toString()}`);

  const blockNumber = proposalTX.blockNumber as number;
  console.log(`Current blocknumber: ${blockNumber}`);
  const quorumForProposal = await governance.quorum(blockNumber - 1);
  console.log(
    "number of votes rquired",
    ethers.utils.formatEther(quorumForProposal)
  );

  console.log("Casting votes...");
  // 1 = for, 0 = against, 2 = abstain
  const vote1 = await governance.connect(voter1).castVote(proposalId, 1);
  await vote1.wait(1);
  const vote2 = await governance.connect(voter2).castVote(proposalId, 1);
  await vote2.wait(1);
  const vote3 = await governance.connect(voter3).castVote(proposalId, 1);
  await vote3.wait(1);
  const vote4 = await governance.connect(voter4).castVote(proposalId, 1);
  await vote4.wait(1);
  const vote5 = await governance.connect(voter5).castVote(proposalId, 1);
  await vote5.wait(1);
  console.log(`Current Proposal State: ${await governance.state(proposalId)}`);

  // Move the clock
  await moveBlocks(votingPeriod + 1);

  const { againstVotes, forVotes, abstainVotes } =
    await governance.proposalVotes(proposalId);

  console.log({
    againstVotes: ethers.utils.formatEther(againstVotes),
    forVotes: ethers.utils.formatEther(forVotes),
    abstainVotes: ethers.utils.formatEther(abstainVotes),
  });
  console.log(`Current Proposal State: ${await governance.state(proposalId)}`);

  // Queue the approved proposal
  const queueTx = await governance
    .connect(deployer)
    .queue(
      [token.address],
      [0],
      [transferCalldata],
      ethers.utils.id(proposalDescription)
    );
  await queueTx.wait(1);

  await moveTime(minDelay + 1);
  await moveBlocks(1);
  console.log(`Current Proposal State: ${await governance.state(proposalId)}`);

  // const excecuteTx = await governance.execute(
  //   [token.address],
  //   [0],
  //   [transferCalldata],
  //   ethers.utils.id(proposalDescription)
  // );
  // await excecuteTx.wait(1);

  console.log("Final balance", {
    voter1: ethers.utils.formatEther(await token.balanceOf(voter1.address)),
    voter2: ethers.utils.formatEther(await token.balanceOf(voter2.address)),
    voter3: ethers.utils.formatEther(await token.balanceOf(voter3.address)),
    voter4: ethers.utils.formatEther(await token.balanceOf(voter4.address)),
    voter5: ethers.utils.formatEther(await token.balanceOf(voter5.address)),
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

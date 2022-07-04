// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";
import {
  Token__factory,
  TimeLock__factory,
  Governance__factory,
  Treasury__factory,
} from "../typechain";

async function main() {
  const [executor, proposer, voter1, voter2, voter3, voter4, voter5] =
    await ethers.getSigners();

  const name = "DApp University";
  const symbol = "DAPPU";
  const supply = ethers.utils.parseEther("1000");

  // Deploy token -----------------------------------------------------------------------------
  const token = await new Token__factory(executor).deploy(name, symbol, supply);
  await token.deployed();

  const amount = ethers.utils.parseEther("50");
  await token.transfer(voter1.address, amount, { from: executor.address });
  await token.transfer(voter2.address, amount, { from: executor.address });
  await token.transfer(voter3.address, amount, { from: executor.address });
  await token.transfer(voter4.address, amount, { from: executor.address });
  await token.transfer(voter5.address, amount, { from: executor.address });

  // Deploy timelock --------------------------------------------------------------------------
  const minDelay = 1; // How long do we have to wait until we can excecute after

  // In addition to passing minDelay, we also need to pass 2 arrays
  // The 1st array contains the addresses of those who are allowed to make a proposal
  // The 2nd array contains the addresses of those who are allowed to make excecutions
  const timelock = await new TimeLock__factory(executor).deploy(
    minDelay,
    [proposer.address],
    [executor.address]
  );
  await timelock.deployed();

  // Deploy Governance ------------------------------------------------------------------------
  const quorum = 5; // Percentage if total supply of tokens needed to be approve proposals (5%)
  const votingDelay = 0; // How many blocks after proposal until voting becomes active
  const votingPeriod = 5; // How many blockst to allow voters to vote

  const governance = await new Governance__factory(executor).deploy(
    token.address,
    timelock.address,
    quorum,
    votingDelay,
    votingPeriod
  );
  await governance.deployed();

  // Deploy Treasury -------------------------------------------------------------------------

  // Timelock contract will be the owner of the treasury contract
  // In the provided example, once the proposal is successful and executed,
  // timelock contract will be responsible for calling the function

  const funds = ethers.utils.parseEther("25");

  const treasury = await new Treasury__factory(executor).deploy(
    executor.address,
    { value: funds }
  );
  await treasury.deployed();

  await treasury.transferOwnership(timelock.address, {
    from: executor.address,
  });

  // Assign roles ----------------------------------------------------------------------------
  const proposerRole = await timelock.PROPOSER_ROLE();
  const excecutorRole = await timelock.EXECUTOR_ROLE();

  await timelock.grantRole(proposerRole, governance.address, {
    from: executor.address,
  });

  await timelock.grantRole(excecutorRole, governance.address, {
    from: executor.address,
  });

  // Create proposal ----------------------------------------------------------------------------
  // const amount2 = ethers.utils.parseEther("1000");

  await token.delegate(voter1.address, { from: executor.address });
  await token.delegate(voter2.address, { from: executor.address });
  await token.delegate(voter3.address, { from: executor.address });
  await token.delegate(voter4.address, { from: executor.address });
  await token.delegate(voter5.address, { from: executor.address });

  console.log(`Funds released? ${await treasury.isReleased()}`);

  console.log(
    `Funds inside of treasury: ${ethers.utils.formatEther(
      await treasury.totalFunds()
    )}`
  );

  // const encodedFunction = await treasury.releaseFunds().encodeABI();

  // const ABI = ["function releaseFunds() public onlyOwner"];
  // const iface = new ethers.utils.Interface(ABI);
  // const encodedFunction = iface.encodeFunctionData("releaseFunds", []);

  const encodedFunction = treasury.interface.encodeFunctionData("releaseFunds");

  const description = "Release Funds from Treasury";

  await governance.propose(
    [treasury.address],
    [0],
    [encodedFunction],
    description,
    { from: proposer.address }
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

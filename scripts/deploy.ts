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
import fs from "fs";
import constants from "./constants";

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
  const [deployer, voter1, voter2, voter3, voter4, voter5] =
    await ethers.getSigners();

  // Deploy contracts
  const { token, timeLock, governor, treasury } = await deploy(
    1000,
    50,
    { deployer, investors: [voter1, voter2, voter3, voter4, voter5] },
    {
      minDelay: constants.minDelay,
      quorum: constants.quorum,
      votingDelay: constants.votingDelay,
      votingPeriod: constants.votingPeriod,
    }
  );
  console.log("Contracts deployed");

  // Persist the deployed addresses on a .json file
  fs.writeFileSync(
    constants.addressFile,
    JSON.stringify({
      Token: token.address,
      Timelock: timeLock.address,
      Governor: governor.address,
      Treasury: treasury.address,
    })
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

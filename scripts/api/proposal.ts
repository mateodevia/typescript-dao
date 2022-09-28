import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { MyGovernor, Treasury } from "../../typechain";

/**
 * Creates a proposal to send a certain amount of ETH to a given wallet
 * @param payee Wallet that will receive the released funds
 * @param amount Amount of treasury funds to be released
 * @param proposalDescription Description of the proposal
 * @param contracts Addresses of the contracts to use
 * @param contracts.treasury The treasury contract
 * @param contracts.governor The governor contract
 * @returns The proposalId, and the encodedFunction of the created proposal
 */
export const proposeReleaseFundsToPayee = async (
  payee: string,
  amount: number,
  proposalDescription: string,
  contracts: {
    treasury: Treasury;
    governor: MyGovernor;
  }
): Promise<{ proposalId: BigNumber; encodedFunction: string }> => {
  // Encode the function and argments to propose
  const encodedFunction = contracts.treasury.interface.encodeFunctionData(
    "releaseFunds",
    [payee, ethers.utils.parseEther(amount.toString())]
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

/**
 * Creates a vote for a given proposal
 * @param voter Siner that will post the vote
 * @param proposalId Id of the proposal to vote for
 * @param vote 1 = for, 0 = against, 2 = abstain
 * @param contracts Addresses of the contracts to use
 * @param contracts.governor The governor contract
 */
export const voteForProposal = async (
  proposalId: BigNumber,
  vote: number,
  contracts: {
    governor: MyGovernor;
  }
): Promise<void> => {
  // Voting
  const vote1 = await contracts.governor.castVote(proposalId, vote);
  await vote1.wait(1);
};

/**
 * Queues a proposal that already passed the voting period
 * @param proposalDescription Description of the proposal to execute
 * @param encodedFunction Encoded function of the proposal to execute
 * @param contracts Addresses of the contracts to use
 * @param contracts.treasury The treasury contract
 * @param contracts.governor The governor contract
 */
export const queueProposal = async (
  proposalDescription: string,
  encodedFunction: string,
  contracts: {
    governor: MyGovernor;
    treasury: Treasury;
  }
): Promise<void> => {
  // Queue the approved proposal
  const queueTx = await contracts.governor.queue(
    [contracts.treasury.address],
    [0],
    [encodedFunction],
    ethers.utils.id(proposalDescription)
  );
  await queueTx.wait(1);
};

/**
 * Executes a queued proposal
 * @param proposalDescription Description of the proposal to execute
 * @param encodedFunction Encoded function of the proposal to execute
 * @param contracts Addresses of the contracts to use
 * @param contracts.treasury The treasury contract
 * @param contracts.governor The governor contract
 */
export const excecuteProposal = async (
  proposalDescription: string,
  encodedFunction: string,
  contracts: {
    governor: MyGovernor;
    treasury: Treasury;
  }
): Promise<void> => {
  // Excecuting the proposal
  const excecuteTx = await contracts.governor.execute(
    [contracts.treasury.address],
    [0],
    [encodedFunction],
    ethers.utils.id(proposalDescription)
  );
  await excecuteTx.wait(1);
};

import async from "async";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { MyGovernor, Treasury } from "../../typechain";
import { Proposal } from "./types";

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

/**
 * Retrives all the proposals available on the governor
 * @param contracts Addresses of the contracts to use
 * @param contracts.treasury The treasury contract
 * @param contracts.governor The governor contract
 * @returns {Proposal} List of proposals
 */
export const getProposals = async (contracts: {
  treasury: Treasury;
  governor: MyGovernor;
}): Promise<Proposal[]> => {
  // Query all ProposalCreated events
  const filters = await contracts.governor.filters.ProposalCreated();
  const logs = await contracts.governor.queryFilter(filters, 0, "latest");
  const events = logs.map((log) => contracts.governor.interface.parseLog(log));
  const proposals = await async.map(events, async (event: any) => {
    const [state, votes] = await Promise.all([
      await contracts.governor.state(event.args.proposalId),
      await contracts.governor.proposalVotes(event.args.proposalId),
    ]);
    let proposalParams;
    try {
      proposalParams = contracts.treasury.interface.decodeFunctionData(
        "releaseFunds",
        event.args.calldatas[0]
      );
    } catch (e) {
      proposalParams = {
        _payee: "Unparseadble proposal",
        _amount: "Unparseadble proposal",
      };
    }
    return {
      // Mirar por qué el proposalId no se está parseando bien a string
      id: event.args.proposalId.toString(),
      proposer: event.args.proposer,
      startBlock: event.args.startBlock.toNumber(),
      endBlock: event.args.endBlock.toNumber(),
      description: event.args.description,
      state,
      votes: {
        againstVotes: ethers.utils.formatEther(votes.againstVotes),
        forVotes: ethers.utils.formatEther(votes.forVotes),
        abstainVotes: ethers.utils.formatEther(votes.abstainVotes),
      },
      payee: proposalParams._payee,
      amount: ethers.utils.formatEther(proposalParams._amount),
    };
  });

  return proposals;
};

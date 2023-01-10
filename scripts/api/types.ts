/* eslint-disable no-unused-vars */
// eslint-disable-next-line node/no-unpublished-import

export enum ProposalStates {
  Pending = 0,
  Active = 1,
  Canceled = 2,
  Defeated = 3,
  Succeeded = 4,
  Queued = 5,
  Expired = 6,
  Executed = 7,
}

export enum VotingOptions {
  Against = 0,
  InFavor = 1,
  Abstain = 2,
}

export interface Proposal {
  id: string;
  proposer: string;
  startBlock: number;
  endBlock: number;
  description: string;
  state: ProposalStates;
  votes: {
    againstVotes: string;
    forVotes: string;
    abstainVotes: string;
  };
  payee: string;
  amount: string;
}

export interface Voter {
  address: string;
  tokens: string;
}

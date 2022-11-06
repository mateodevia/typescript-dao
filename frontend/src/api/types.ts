// eslint-disable-next-line node/no-unpublished-import
import { BigNumber } from "ethers";

/* eslint-disable no-unused-vars */
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
  startBlock: BigNumber;
  endBlock: BigNumber;
  description: string;
  state: ProposalStates;
  votes: {
    againstVotes: BigNumber;
    forVotes: BigNumber;
    abstainVotes: BigNumber;
  };
  payee: string;
  amount: BigNumber;
}

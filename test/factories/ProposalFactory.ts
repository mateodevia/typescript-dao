import { Proposal, ProposalStates } from "../../scripts/api/types";

/** Creates a default Proposal object */
export const ProposalFactory = (args: Partial<Proposal>): Proposal => {
  const defaultProposal: Proposal = {
    id: "",
    proposer: "",
    startBlock: 0,
    endBlock: 0,
    description: "",
    state: ProposalStates.Pending,
    votes: {
      againstVotes: "",
      forVotes: "",
      abstainVotes: "",
    },
    payee: "",
    amount: "",
  };
  const res = Object.assign(defaultProposal, args);
  return res;
};

import { ProposalStates, VotingOptions } from "../api/types";

export const statesColorsMap: Record<ProposalStates, string> = {
  [ProposalStates.Pending]: "#fcba03",
  [ProposalStates.Active]: "#0b03fc",
  [ProposalStates.Canceled]: "#ababab",
  [ProposalStates.Defeated]: "#d66400",
  [ProposalStates.Succeeded]: "#00d6ba",
  [ProposalStates.Queued]: "#a200ff",
  [ProposalStates.Expired]: "#00ffd5",
  [ProposalStates.Executed]: "#31d914",
};

export const stateNamesMap: Record<ProposalStates, string> = {
  [ProposalStates.Pending]: "PENDING",
  [ProposalStates.Active]: "ACTIVE",
  [ProposalStates.Canceled]: "CANCELED",
  [ProposalStates.Defeated]: "DEFEATED",
  [ProposalStates.Succeeded]: "SUCCEEDED",
  [ProposalStates.Queued]: "QUEUED",
  [ProposalStates.Expired]: "EXPIRED",
  [ProposalStates.Executed]: "EXCECUTED",
};

export const votingOptionsColorsMap: Record<VotingOptions, string> = {
  [VotingOptions.InFavor]: "#33cc33",
  [VotingOptions.Against]: "#cc0000",
  [VotingOptions.Abstain]: "#3d5a80",
};

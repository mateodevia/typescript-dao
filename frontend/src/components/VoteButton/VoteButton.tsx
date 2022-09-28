import { BigNumber } from "ethers";
import { voteForProposal } from "../../api/proposal";
import { IContracts } from "../../types/global-types";

interface VoteButtonProps {
  selectedAccount: string;
  proposalId: BigNumber | null;
  contracts: IContracts;
}

export function VoteButton(props: VoteButtonProps) {
  const vote = async () => {
    if (props.proposalId) {
      voteForProposal(props.proposalId, 1, props.contracts);
      console.log("Successfully voted for proposal", props.proposalId._hex);
    }
  };
  return <button onClick={vote}>Vote for proposal</button>;
}

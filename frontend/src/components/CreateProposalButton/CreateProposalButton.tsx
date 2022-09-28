import { BigNumber } from "ethers";
import { Dispatch, SetStateAction, useRef } from "react";
import { proposeReleaseFundsToPayee } from "../../api/proposal";
import { IContracts } from "../../types/global-types";

interface CreateProposalButtonProps {
  selectedAccount: string;
  setProposalId: Dispatch<SetStateAction<BigNumber | null>>;
  contracts: IContracts;
}

export function CreateProposalButton(props: CreateProposalButtonProps) {
  const proposalName = useRef<HTMLInputElement>(null);

  const createProposal = async () => {
    const { proposalId } = await proposeReleaseFundsToPayee(
      props.selectedAccount,
      100,
      proposalName.current?.value ?? "",
      props.contracts
    );
    props.setProposalId(proposalId);
  };
  return (
    <>
      <input type="text" ref={proposalName} />
      <button onClick={createProposal}>Create Proposal</button>
    </>
  );
}

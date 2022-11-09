import { BigNumber } from "ethers";
import React from "react";
import { Dispatch, SetStateAction, useRef } from "react";
import { proposeReleaseFundsToPayee } from "../../api/proposal";
import { EthersContext } from "../../App";
import { IContracts } from "../../types/global-types";

interface CreateProposalButtonProps {
  selectedAccount: string;
  setProposalId: Dispatch<SetStateAction<BigNumber | null>>;
}

export function CreateProposalButton(props: CreateProposalButtonProps) {
  const { contracts } = React.useContext(EthersContext);

  const proposalName = useRef<HTMLInputElement>(null);

  // Null safety if ethers context is not is not available
  if (!contracts) return <div></div>;

  const createProposal = async () => {
    const { proposalId } = await proposeReleaseFundsToPayee(
      props.selectedAccount,
      100,
      proposalName.current?.value ?? "",
      contracts
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

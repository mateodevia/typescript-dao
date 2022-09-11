import { ethers } from "ethers";

interface CreateProposalButtonProps {
  //  TODO: fix typings
  selectedAccount: any;
  contracts: {
    token: any;
    timeLock: any;
    governor: any;
    treasury: any;
  };
}

export function CreateProposalButton(props: CreateProposalButtonProps) {
  const createProposal = async () => {
    console.log("props", props);
    // Encode the function and argments to propose
    const encodedFunction =
      props.contracts.treasury.interface.encodeFunctionData("releaseFunds", [
        props.selectedAccount,
        ethers.utils.parseEther("10"),
      ]);
    console.log("encoded function");
    console.log(
      "args",
      [props.contracts.treasury.address],
      [0],
      [encodedFunction],
      "Hola"
    );

    // Make the proposal
    const proposeTx = await props.contracts.governor.propose(
      [props.contracts.treasury.address],
      [0],
      [encodedFunction],
      "Hola"
    );
    console.log("proposed");

    // Retrieve proposal id
    const proposeReceipt = await proposeTx.wait(1);
    console.log("proposalId", proposeReceipt.events![0].args!.proposalId);
    return {
      proposalId: proposeReceipt.events![0].args!.proposalId,
      encodedFunction,
    };
  };
  return <button onClick={createProposal}>Create Proposal</button>;
}

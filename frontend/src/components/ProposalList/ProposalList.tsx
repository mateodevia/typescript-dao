import { useEffect, useState } from "react";
import { getProposals } from "../../api/proposal";
import { Proposal } from "../../api/types";
import { AppDispatch, RootState } from "../../store";
import { useDispatch, useSelector } from "react-redux";
import { IContracts } from "../../types/global-types";
import { proposalUpdate } from "../../reducers/proposals";

interface ProposalListProps {
  contracts: IContracts;
}

export function ProposalList(props: ProposalListProps) {
  const proposals = useSelector((state: RootState) => state.proposals);

  const dispatch: AppDispatch = useDispatch();
  const fetchProposals = async () => {
    const proposals = await getProposals(props.contracts);
    dispatch(proposalUpdate(proposals));
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  return (
    <>
      {proposals.map((p, i) => (
        <div key={i}>{p.description}</div>
      ))}
    </>
  );
}

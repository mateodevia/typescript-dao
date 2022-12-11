import { useEffect } from "react";
import { getProposals } from "../../api/proposal";
import { AppDispatch, RootState } from "../../store";
import { useDispatch, useSelector } from "react-redux";
import { proposalUpdate } from "../../reducers/proposals";
import React from "react";
import { EthersContext } from "../../App";
import { ProposalDetail } from "./ProposalDetail/ProposalDetail";

export function ProposalList() {
  const { contracts, provider } = React.useContext(EthersContext);
  const proposals = useSelector((state: RootState) => state.proposals);
  const dispatch: AppDispatch = useDispatch();

  useEffect(() => {
    fetchProposals();
    suscribeToProposals();
  }, []);

  // Null safety if EthersContext is not is not available
  if (!contracts || !provider) return <div></div>;

  const fetchProposals = async () => {
    const proposals = await getProposals(contracts);
    dispatch(proposalUpdate(proposals));
  };

  const suscribeToProposals = async () => {
    const filters = await contracts.governor.filters.ProposalCreated();
    provider.on(filters, () => {
      fetchProposals();
    });
  };

  return (
    <>
      {proposals.map((p, i) => (
        <ProposalDetail key={i} proposal={p} />
      ))}
    </>
  );
}

import { useEffect, useState } from "react";
import { getProposals } from "../../api/proposal";
import { AppDispatch, RootState } from "../../store";
import { useDispatch, useSelector } from "react-redux";
import { proposalUpdate } from "../../reducers/proposals";
import React from "react";
import { EthersContext } from "../../App";
import { ProposalListItem } from "./ProposalListItem/ProposalListItem";
import { colors } from "../../styles/globals";
import Dialog from "@mui/material/Dialog";
import { ProposalDetail } from "./ProposalDetail/ProposalDetail";
import { getTreasuryBalance } from "../../api/treasury";
import { treasuryBalanceUpdate } from "../../reducers/treasuryBalance";

export function ProposalList() {
  const { contracts, provider } = React.useContext(EthersContext);

  const proposals = useSelector((state: RootState) => state.proposals);
  const dispatch: AppDispatch = useDispatch();

  const [proposalDialog, setProposalDialog] = useState<boolean>(false);
  const [selectedProposal, setSelectedProposal] = useState<number>(-1);

  useEffect(() => {
    fetchProposals();
    suscribeToProposals();
  }, []);

  // Null safety if EthersContext is not is not available
  if (!contracts || !provider) return <div></div>;

  const fetchProposals = async () => {
    const proposals = await getProposals(contracts);
    dispatch(proposalUpdate(proposals.reverse()));
  };

  const fetchTreasuryBalance = async () => {
    const balance = await getTreasuryBalance(provider, contracts);
    dispatch(treasuryBalanceUpdate(balance));
  };

  const suscribeToProposals = async () => {
    // When a vote is cast
    const voteCast = await contracts.governor.filters.VoteCast();
    provider.on(voteCast, () => {
      fetchProposals();
    });

    // When a proposal is created
    const proposalCreated = await contracts.governor.filters.ProposalCreated();
    provider.on(proposalCreated, () => {
      fetchProposals();
    });

    // When a proposal is enqueued
    const proposalQueued = await contracts.governor.filters.ProposalQueued();
    provider.on(proposalQueued, () => {
      fetchProposals();
    });

    // When a proposal is excecuted
    const ProposalExecuted =
      await contracts.governor.filters.ProposalExecuted();
    provider.on(ProposalExecuted, () => {
      fetchProposals();
      fetchTreasuryBalance();
    });

    // When a proposal is canceled
    const ProposalCanceled =
      await contracts.governor.filters.ProposalCanceled();
    provider.on(ProposalCanceled, () => {
      fetchProposals();
    });
  };

  const handleProposalSelected = (proposalIndex: number) => {
    setSelectedProposal(proposalIndex);
    setProposalDialog(true);
  };

  const handleProposalDialogClosed = () => {
    setSelectedProposal(-1);
    setProposalDialog(false);
  };

  return (
    <>
      <Dialog
        maxWidth={false}
        onClose={() => handleProposalDialogClosed()}
        open={proposalDialog}
      >
        <ProposalDetail proposal={proposals[selectedProposal]} />
      </Dialog>
      <h2 style={{ textAlign: "center", color: colors.primary }}>
        Checkout the existing proposals
      </h2>
      {proposals.map((p, i) => (
        <ProposalListItem
          key={i}
          index={i}
          proposal={p}
          handleProposalSelected={handleProposalSelected}
        />
      ))}
    </>
  );
}

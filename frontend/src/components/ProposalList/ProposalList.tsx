import { useEffect, useState } from "react";
import { getProposals } from "../../api/proposal";
import { Proposal } from "../../api/types";
import { IContracts } from "../../types/global-types";

interface ProposalListProps {
  contracts: IContracts;
}

export function ProposalList(props: ProposalListProps) {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const fetchProposals = async () => {
    const proposals = await getProposals(props.contracts);
    setProposals(proposals);
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

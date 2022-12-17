import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { votingOptionsColorsMap } from "../../../../types/constants";
import { Proposal, VotingOptions } from "../../../../api/types";

export function VotingResultsList(props: { proposal: Proposal }) {
  return (
    <BarChart
      width={500}
      height={300}
      data={[
        {
          name: "Votes",
          "In favor": Number(props.proposal.votes.forVotes),
          Against: Number(props.proposal.votes.againstVotes),
          Abstain: Number(props.proposal.votes.abstainVotes),
        },
      ]}
      margin={{
        top: 5,
        right: 30,
        left: 20,
        bottom: 5,
      }}
    >
      <Legend />
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Bar
        dataKey="In favor"
        fill={votingOptionsColorsMap[VotingOptions.InFavor]}
      />
      <Bar
        dataKey="Against"
        fill={votingOptionsColorsMap[VotingOptions.Against]}
      />
      <Bar
        dataKey="Abstain"
        fill={votingOptionsColorsMap[VotingOptions.Abstain]}
      />
    </BarChart>
  );
}

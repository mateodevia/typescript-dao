import { Proposal, ProposalStates, VotingOptions } from "../../../api/types";
import CardHeader from "@mui/material/CardHeader";
import Avatar from "@mui/material/Avatar";
import Identicon from "identicon.js";
import {
  stateNamesMap,
  statesColorsMap,
  votingOptionsColorsMap,
} from "../../../types/constants";
import { colors, globalButton } from "../../../styles/globals";
import Button from "@mui/material/Button";
import { voteForProposal } from "../../../api/proposal";
import React from "react";
import { EthersContext } from "../../../App";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { useSelector } from "react-redux";
import { RootState } from "../../../store";

export function ProposalDetail(props: { proposal: Proposal | null }) {
  const { contracts } = React.useContext(EthersContext);

  const voters = useSelector((state: RootState) => state.voters);
  const selectedAccount = useSelector(
    (state: RootState) => state.selectedAccount
  );

  if (!props.proposal || !contracts || !selectedAccount) return <div></div>;

  const handleVote = (vote: VotingOptions) => {
    if (props.proposal !== null) {
      voteForProposal(props.proposal.id, vote, contracts);
    }
  };

  return (
    <>
      <CardHeader
        avatar={
          <Avatar
            sx={{ width: 50, height: 50 }}
            src={`data:image/png;base64,${new Identicon(
              props.proposal.proposer,
              30
            ).toString()}`}
          ></Avatar>
        }
        title={
          <h2 style={{ color: colors.primary, marginBottom: 0, marginTop: 5 }}>
            {props.proposal.proposer}
          </h2>
        }
        subheader={`Proposed sending ${props.proposal.amount} ETH to ${props.proposal.payee}`}
      />
      <div style={{ padding: "0 20px" }}>
        <h4>
          This proposal is currently{" "}
          <span
            style={{
              backgroundColor: statesColorsMap[props.proposal.state],
              color: "white",
              padding: "3px 5px",
              borderRadius: "3px",
              fontWeight: "bold",
              margin: "0 5px",
            }}
          >
            {stateNamesMap[props.proposal.state]}
          </span>
        </h4>
        <h4>Proposal description</h4>
        <p>{props.proposal.description}</p>
        <h4>Votes</h4>
        <div
          style={{
            margin: "0 auto",
            width: "max-content",
            marginBottom: "20px",
          }}
        >
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
        </div>
        {voters.some(
          (v) => v.address.toLowerCase() === selectedAccount.toLowerCase()
        ) && props.proposal.state === ProposalStates.Pending ? (
          <div style={{ margin: "0 auto", width: "max-content" }}>
            <Button
              onClick={() => handleVote(VotingOptions.InFavor)}
              variant="contained"
              sx={{
                ...globalButton,
                backgroundColor: votingOptionsColorsMap[VotingOptions.InFavor],
                "&:hover": {
                  backgroundColor:
                    votingOptionsColorsMap[VotingOptions.InFavor],
                },
                marginBottom: "20px",
              }}
            >
              Vote in favor
            </Button>
            <Button
              onClick={() => handleVote(VotingOptions.Against)}
              variant="contained"
              sx={{
                ...globalButton,
                backgroundColor: votingOptionsColorsMap[VotingOptions.Against],
                "&:hover": {
                  backgroundColor:
                    votingOptionsColorsMap[VotingOptions.Against],
                },
                marginBottom: "20px",
              }}
            >
              Vote in againts
            </Button>
            <Button
              onClick={() => handleVote(VotingOptions.Abstain)}
              variant="contained"
              sx={{
                ...globalButton,
                backgroundColor: votingOptionsColorsMap[VotingOptions.Abstain],
                "&:hover": {
                  backgroundColor:
                    votingOptionsColorsMap[VotingOptions.Abstain],
                },
                marginBottom: "20px",
              }}
            >
              Abstain
            </Button>
          </div>
        ) : (
          <></>
        )}
      </div>
    </>
  );
}

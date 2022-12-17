import { Proposal } from "../../../api/types";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import Identicon from "identicon.js";
import { stateNamesMap, statesColorsMap } from "../../../types/constants";

export function ProposalListItem(props: {
  proposal: Proposal | null;
  index: number;
  handleProposalSelected: (proposalIndex: number) => void;
}) {
  if (!props.proposal) return <div></div>;
  return (
    <>
      <Card sx={{ m: 2, borderRadius: "10px" }}>
        <CardHeader
          avatar={
            <Avatar
              src={`data:image/png;base64,${new Identicon(
                props.proposal.proposer,
                30
              ).toString()}`}
            ></Avatar>
          }
          action={
            <IconButton
              aria-label="settings"
              onClick={() => props.handleProposalSelected(props.index)}
            >
              <MoreVertIcon />
            </IconButton>
          }
          title={`Send ${props.proposal.amount} ETH to ${props.proposal.payee}`}
          subheader={
            <div style={{ margin: "4px" }}>
              <span
                style={{
                  backgroundColor: statesColorsMap[props.proposal.state],
                  color: "white",
                  padding: "3px 5px",
                  borderRadius: "3px",
                  fontWeight: "bold",
                }}
              >
                {stateNamesMap[props.proposal.state]}
              </span>{" "}
            </div>
          }
        />
      </Card>
    </>
  );
}

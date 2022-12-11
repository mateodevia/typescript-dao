import { Proposal, ProposalStates } from "../../../api/types";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import Identicon from "identicon.js";

const statesColorsMap: Record<ProposalStates, string> = {
  [ProposalStates.Pending]: "#fcba03",
  [ProposalStates.Active]: "#0b03fc",
  [ProposalStates.Canceled]: "#ababab",
  [ProposalStates.Defeated]: "#d66400",
  [ProposalStates.Succeeded]: "#00d6ba",
  [ProposalStates.Queued]: "#a200ff",
  [ProposalStates.Expired]: "#00ffd5",
  [ProposalStates.Executed]: "#31d914",
};

const stateNamesMap: Record<ProposalStates, string> = {
  [ProposalStates.Pending]: "PENDING",
  [ProposalStates.Active]: "ACTIVE",
  [ProposalStates.Canceled]: "CANCELED",
  [ProposalStates.Defeated]: "DEFEATED",
  [ProposalStates.Succeeded]: "SUCCEEDED",
  [ProposalStates.Queued]: "QUEUED",
  [ProposalStates.Expired]: "EXPIRED",
  [ProposalStates.Executed]: "EXCECUTED",
};

export function ProposalListItem(props: { proposal: Proposal }) {
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
            <IconButton aria-label="settings">
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

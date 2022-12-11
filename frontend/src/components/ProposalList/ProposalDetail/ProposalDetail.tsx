import { Proposal } from "../../../api/types";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import Identicon from "identicon.js";

export function ProposalDetail(props: { proposal: Proposal }) {
  return (
    <>
      <Card sx={{ m: 2, borderRadius: 5 }}>
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
          title={props.proposal.description}
          subheader={`Send ${props.proposal.amount} to ${props.proposal.payee}`}
        />
      </Card>
    </>
  );
}

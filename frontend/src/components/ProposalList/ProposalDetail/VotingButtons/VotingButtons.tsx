import { votingOptionsColorsMap } from "../../../../types/constants";
import { VotingOptions } from "../../../../api/types";
import Button from "@mui/material/Button";
import { globalButton } from "../../../../styles/globals";

export function VotingButtons(props: {
  handleVote: (vote: VotingOptions) => void;
}) {
  return (
    <div style={{ margin: "0 auto", width: "max-content" }}>
      <Button
        onClick={() => props.handleVote(VotingOptions.InFavor)}
        variant="contained"
        sx={{
          ...globalButton,
          backgroundColor: votingOptionsColorsMap[VotingOptions.InFavor],
          "&:hover": {
            backgroundColor: votingOptionsColorsMap[VotingOptions.InFavor],
          },
          marginBottom: "20px",
        }}
      >
        Vote in favor
      </Button>
      <Button
        onClick={() => props.handleVote(VotingOptions.Against)}
        variant="contained"
        sx={{
          ...globalButton,
          backgroundColor: votingOptionsColorsMap[VotingOptions.Against],
          "&:hover": {
            backgroundColor: votingOptionsColorsMap[VotingOptions.Against],
          },
          marginBottom: "20px",
        }}
      >
        Vote in againts
      </Button>
      <Button
        onClick={() => props.handleVote(VotingOptions.Abstain)}
        variant="contained"
        sx={{
          ...globalButton,
          backgroundColor: votingOptionsColorsMap[VotingOptions.Abstain],
          "&:hover": {
            backgroundColor: votingOptionsColorsMap[VotingOptions.Abstain],
          },
          marginBottom: "20px",
        }}
      >
        Abstain
      </Button>
    </div>
  );
}

import { AccountCircle } from "@mui/icons-material";
import Button from "@mui/material/Button";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import { BigNumber } from "ethers";
import React from "react";
import { Dispatch, SetStateAction, useRef } from "react";
import { proposeReleaseFundsToPayee } from "../../../api/proposal";
import { EthersContext } from "../../../App";
import { accentButton } from "../../../styles/globals";

interface CreateProposalButtonProps {
  selectedAccount: string;
  setProposalId: Dispatch<SetStateAction<BigNumber | null>>;
}

export function CreateProposalInput(props: CreateProposalButtonProps) {
  const { contracts } = React.useContext(EthersContext);

  const proposalName = useRef<HTMLInputElement>(null);

  // Null safety if ethers context is not is not available
  if (!contracts) return <div></div>;

  const createProposal = async () => {
    const { proposalId } = await proposeReleaseFundsToPayee(
      props.selectedAccount,
      100,
      proposalName.current?.value ?? "",
      contracts
    );
    props.setProposalId(proposalId);
  };
  return (
    <>
      <div
        style={{
          backgroundColor: "white",
          width: "100%",
          borderRadius: "10px",
          height: "min-content",
          display: "flex",
        }}
      >
        <TextField
          ref={proposalName}
          label="Who´s receiving the money?"
          variant="standard"
          color="warning"
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <AccountCircle />
              </InputAdornment>
            ),
          }}
          sx={{
            width: "calc(100% - 270px)",
            margin: "4px 16px",
            padding: "4px",
          }}
        />
        <TextField
          prefix="Ξ"
          label="How many ethers?"
          variant="standard"
          type="number"
          color="warning"
          size="small"
          InputProps={{
            startAdornment: <InputAdornment position="start">Ξ</InputAdornment>,
          }}
          sx={{
            margin: "4px 16px",
            padding: "4px",
          }}
        />
        <Button onClick={createProposal} variant="contained" sx={accentButton}>
          Propose
        </Button>
      </div>
    </>
  );
}
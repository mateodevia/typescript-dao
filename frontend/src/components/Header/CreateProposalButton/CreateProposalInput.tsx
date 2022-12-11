import { AccountCircle } from "@mui/icons-material";
import Button from "@mui/material/Button";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import { BigNumber } from "ethers";
import React from "react";
import { Dispatch, SetStateAction, useRef } from "react";
import { useSelector } from "react-redux";
import { proposeReleaseFundsToPayee } from "../../../api/proposal";
import { EthersContext } from "../../../App";
import { RootState } from "../../../store";
import { accentButton } from "../../../styles/globals";

export function CreateProposalInput() {
  const { contracts } = React.useContext(EthersContext);

  const selectedAccount = useSelector(
    (state: RootState) => state.selectedAccount
  );

  const proposalName = useRef<HTMLInputElement>(null);

  // Null safety if ethers context is not is not available
  if (!contracts || !selectedAccount) return <div></div>;

  const createProposal = async () => {
    const { proposalId } = await proposeReleaseFundsToPayee(
      selectedAccount,
      100,
      proposalName.current?.value ?? "",
      contracts
    );
    console.log("Created proposal", proposalId);
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
          inputRef={proposalName}
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

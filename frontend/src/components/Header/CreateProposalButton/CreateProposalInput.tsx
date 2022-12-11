import { AccountCircle } from "@mui/icons-material";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import React from "react";
import { useSelector } from "react-redux";
import { EthersContext } from "../../../App";
import { RootState } from "../../../store";
import { accentButton, colors } from "../../../styles/globals";
import { useForm } from "react-hook-form";
import { proposeReleaseFundsToPayee } from "../../../api/proposal";

interface CreateProposalForm {
  proposalPayee: string;
  proposalAmount: number;
}

export function CreateProposalInput() {
  const { contracts } = React.useContext(EthersContext);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<CreateProposalForm>({
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const { ref: payeeRef, ...payeeProps } = register("proposalPayee", {
    required: true,
    pattern: /^0x[a-fA-F0-9]{40}$/g,
  });
  const { ref: amountRef, ...amountProps } = register("proposalAmount", {
    required: true,
  });

  const selectedAccount = useSelector(
    (state: RootState) => state.selectedAccount
  );

  // Null safety if ethers context is not is not available
  if (!contracts || !selectedAccount) return <div></div>;

  const createProposal = async (formData: CreateProposalForm) => {
    // const { proposalId } = await proposeReleaseFundsToPayee(
    //   formData.proposalPayee,
    //   formData.proposalAmount,
    //   "ooo",
    //   contracts
    // );
    // console.log("Created proposal", proposalId);
  };
  return (
    <div
      style={{
        backgroundColor: colors.primary,
        position: "sticky",
        top: 0,
        width: "calc(100% - 20px)",
        zIndex: 1,
        padding: "10px",
      }}
    >
      <Container maxWidth="md">
        <form
          style={{
            backgroundColor: "white",
            width: "100%",
            borderRadius: "10px",
            height: "min-content",
            display: "flex",
          }}
        >
          <TextField
            label="Who´s receiving the money?"
            variant="standard"
            color="warning"
            size="small"
            inputRef={payeeRef}
            {...payeeProps}
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
            helperText={!!errors.proposalPayee ? "invalid address" : undefined}
            error={!!errors.proposalPayee}
          />
          <TextField
            inputRef={amountRef}
            {...amountProps}
            prefix="Ξ"
            label="How many ethers?"
            variant="standard"
            type="number"
            color="warning"
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">Ξ</InputAdornment>
              ),
            }}
            sx={{
              margin: "4px 16px",
              padding: "4px",
            }}
            helperText={!!errors.proposalAmount ? "invalid address" : undefined}
            error={!!errors.proposalAmount}
          />
          <Button
            onClick={handleSubmit(createProposal)}
            variant="contained"
            sx={accentButton}
            disabled={!isValid}
          >
            Propose
          </Button>
        </form>
      </Container>
    </div>
  );
}

import { AccountCircle } from "@mui/icons-material";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import React, { useState } from "react";
import { EthersContext } from "../../../App";
import { accentButton, colors } from "../../../styles/globals";
import { useForm } from "react-hook-form";
import Dialog from "@mui/material/Dialog";
import { CreateProposalDialog } from "./CreateProposalDialog/CreateProposalDIalog";
import { RootState } from "../../../store";
import { useSelector } from "react-redux";

interface CreateProposalForm {
  proposalPayee: string;
  proposalAmount: number;
}

export function CreateProposalInput() {
  const { contracts } = React.useContext(EthersContext);

  const treasuryBalance = useSelector(
    (state: RootState) => state.treasuryBalance
  );

  const [createDialog, setCreateDialog] = useState<boolean>(false);
  const [payee, setPayee] = useState<string | null>(null);
  const [amount, setAmount] = useState<number | null>(null);

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
    min: 0,
    max: Number(treasuryBalance),
  });

  // Null safety if ethers context is not is not available
  if (!contracts) return <div></div>;

  const createProposal = async (formData: CreateProposalForm) => {
    setAmount(formData.proposalAmount);
    setPayee(formData.proposalPayee);
    setCreateDialog(true);
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
      <Dialog
        maxWidth={false}
        onClose={() => setCreateDialog(false)}
        open={createDialog}
      >
        <CreateProposalDialog
          payee={payee}
          amount={amount}
          onSuccess={() => setCreateDialog(false)}
        />
      </Dialog>
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
            helperText={!!errors.proposalAmount ? "invalid amount" : undefined}
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

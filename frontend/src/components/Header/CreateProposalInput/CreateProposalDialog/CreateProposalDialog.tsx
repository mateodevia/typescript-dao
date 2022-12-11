import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import TextField from "@mui/material/TextField";
import React from "react";
import { proposeReleaseFundsToPayee } from "../../../../api/proposal";
import { EthersContext } from "../../../../App";
import { useForm } from "react-hook-form";
import { accentButton, colors } from "../../../../styles/globals";

interface CreateProposalDialogForm {
  proposalDescription: string;
}

export function CreateProposalDialog(props: {
  payee: string | null;
  amount: number | null;
  onSuccess: () => void;
}) {
  const { contracts } = React.useContext(EthersContext);

  const {
    register,
    handleSubmit,
    formState: { isValid },
  } = useForm<CreateProposalDialogForm>({
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const { ref: descriptionRef, ...descriptionProps } = register(
    "proposalDescription",
    {
      required: true,
    }
  );

  if (!contracts || !props.payee || !props.amount) return <div></div>;

  const createProposal = async (formData: CreateProposalDialogForm) => {
    const { proposalId } = await proposeReleaseFundsToPayee(
      props.payee!,
      props.amount!,
      formData.proposalDescription,
      contracts
    );
    console.log("Created proposal", proposalId);
    props.onSuccess();
  };

  return (
    <>
      <Container
        maxWidth="lg"
        sx={{
          textAlign: "center",
        }}
      >
        <h3
          style={{
            color: colors.primary,
            textAlign: "center",
          }}
        >
          {"You are proposing to send"}{" "}
          <span style={{ color: colors.accent }}>{`${props.amount} ETH `}</span>
          {"to address"} <br />
          <span style={{ color: colors.accent }}>{props.payee}</span>
        </h3>

        <form>
          <TextField
            inputRef={descriptionRef}
            {...descriptionProps}
            label="Why we should accept your proposal? How will the funds be used?"
            variant="filled"
            multiline
            rows={5}
            color="warning"
            sx={{
              margin: "20px 0",
              width: "50vw",
            }}
          />
          <br />
          <Button
            onClick={handleSubmit(createProposal)}
            variant="contained"
            disabled={!isValid}
            sx={{
              ...accentButton,
              marginBottom: "20px",
            }}
          >
            Propose
          </Button>
        </form>
      </Container>
    </>
  );
}

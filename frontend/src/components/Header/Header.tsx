import React, { useState } from "react";
import Container from "@mui/material/Container";
import TextField from "@mui/material/TextField";
import { CreateProposalInput } from "./CreateProposalButton/CreateProposalInput";
import { EthersContext } from "../../App";
import { BigNumber, ethers } from "ethers";
import { accentButton, colors } from "../../styles/globals";
import Button from "@mui/material/Button";

export function Header() {
  const { provider } = React.useContext(EthersContext);

  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [proposalId, setProposalId] = useState<BigNumber | null>(null);

  const connectToWallet = async () => {
    if (provider) {
      const [account] = await provider.send("eth_requestAccounts", []);
      setSelectedAccount(account);
      console.log("Connecetd to wallet", account);
    } else console.error("Trying to connect to wallet before initialization");
  };

  const renderContent = () => {
    if (selectedAccount !== null) {
      return (
        <>
          <CreateProposalInput
            selectedAccount={selectedAccount}
            setProposalId={setProposalId}
          />
        </>
      );
    } else {
      return (
        <Button onClick={connectToWallet} variant="contained" sx={accentButton}>
          Connect wallet
        </Button>
      );
    }
  };
  return (
    <>
      <Container
        maxWidth="md"
        sx={{
          color: "white",
          height: "100%",
          textAlign: "center",
          paddingTop: "20vh",
        }}
      >
        <h1 style={{ marginBottom: "10px" }}>
          Get your first{" "}
          <span style={{ color: colors.accent }}>DAO proposal</span> done!
        </h1>
        <h3 style={{ marginBottom: "30px", marginTop: "0px" }}>
          We have 1,000,000 ETH available
        </h3>
        {renderContent()}
      </Container>
    </>
  );
}

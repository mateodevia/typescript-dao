import React, { useEffect, useState } from "react";
import Container from "@mui/material/Container";
import TextField from "@mui/material/TextField";
import { CreateProposalInput } from "./CreateProposalInput/CreateProposalInput";
import { EthersContext } from "../../App";
import { BigNumber, ethers } from "ethers";
import { accentButton, colors } from "../../styles/globals";
import Button from "@mui/material/Button";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../store";
import { selectedAccountUpdate } from "../../reducers/selectedAccount";
import { getTreasuryBalance } from "../../api/treasury";

export function Header() {
  const { contracts, provider } = React.useContext(EthersContext);

  const [treasuryBalance, setTreasuryBalance] = useState<string | null>(null);

  const selectedAccount = useSelector(
    (state: RootState) => state.selectedAccount
  );
  const dispatch: AppDispatch = useDispatch();

  useEffect(() => {
    fetchTreasuryBalance();
  }, []);

  // Null safety if EthersContext is not is not available
  if (!contracts || !provider) return <div></div>;

  const fetchTreasuryBalance = async () => {
    const balance = await getTreasuryBalance(provider, contracts);
    setTreasuryBalance(balance);
  };

  const connectToWallet = async () => {
    const [account] = await provider.send("eth_requestAccounts", []);
    dispatch(selectedAccountUpdate(account));
    console.log("Connecetd to wallet", account);
  };

  const renderContent = () => {
    if (selectedAccount !== null) {
      return <CreateProposalInput />;
    } else {
      return (
        <Container
          maxWidth="md"
          sx={{
            textAlign: "center",
          }}
        >
          <Button
            onClick={connectToWallet}
            variant="contained"
            sx={accentButton}
          >
            Connect wallet
          </Button>
        </Container>
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
        {treasuryBalance ? (
          <h3 style={{ marginBottom: "20px", marginTop: "0px" }}>
            We have {treasuryBalance} ETH available
          </h3>
        ) : (
          <></>
        )}
      </Container>
      {renderContent()}
    </>
  );
}

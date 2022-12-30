import React, { useEffect } from "react";
import Container from "@mui/material/Container";
import { CreateProposalInput } from "./CreateProposalInput/CreateProposalInput";
import { EthersContext } from "../../App";
import { accentButton, colors } from "../../styles/globals";
import Button from "@mui/material/Button";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../store";
import { selectedAccountUpdate } from "../../reducers/selectedAccount";
import { getTreasuryBalance } from "../../api/treasury";
import { treasuryBalanceUpdate } from "../../reducers/treasuryBalance";

export function Header() {
  const { contracts, provider } = React.useContext(EthersContext);

  const selectedAccount = useSelector(
    (state: RootState) => state.selectedAccount
  );
  const treasuryBalance = useSelector(
    (state: RootState) => state.treasuryBalance
  );
  const dispatch: AppDispatch = useDispatch();

  useEffect(() => {
    fetchTreasuryBalance();
  }, []);

  // Null safety if EthersContext is not is not available
  if (!contracts || !provider) return <div></div>;

  const fetchTreasuryBalance = async () => {
    const balance = await getTreasuryBalance(provider, contracts);
    dispatch(treasuryBalanceUpdate(balance));
  };

  const connectToWallet = async () => {
    const [account] = await provider.send("eth_requestAccounts", []);
    dispatch(selectedAccountUpdate(account));
    console.log("Connected to wallet", account);
  };

  const renderContent = () => {
    if (selectedAccount !== null) {
      if (Number(treasuryBalance) > 0) {
        return <CreateProposalInput />;
      } else {
        return (
          <Container
            maxWidth="md"
            sx={{
              textAlign: "center",
            }}
          >
            <h3 style={{ color: "white" }}>
              Oops! The treasure has now remaining funds. Checkout the proposals
              that where executed below.
            </h3>
          </Container>
        );
      }
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
          We currently have{" "}
          <span style={{ color: colors.accent }}>
            {treasuryBalance ?? 0} ETH
          </span>{" "}
          available!
        </h1>
        <h3 style={{ margin: "0px" }}>
          What do you propose we do with this money?
        </h3>
        <p
          style={{
            fontWeight: "lighter",
            marginTop: "8px",
            marginBottom: "15px",
            fontSize: "14px",
          }}
        >
          Learn more about this proyect{" "}
          <a
            href="https://github.com/mateodevia/typescript-dao"
            style={{ color: colors.accent, fontWeight: "initial" }}
          >
            here
          </a>
        </p>
      </Container>
      {renderContent()}
    </>
  );
}

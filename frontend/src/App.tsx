import React, { useEffect, useState } from "react";
import TokenArtifact from "./contracts/Token.json";
import TimeLockArtifact from "./contracts/Treasury.json";
import GovernorArtifact from "./contracts/MyGovernor.json";
import TreasuryArtifact from "./contracts/Treasury.json";
import contractAddress from "./contracts/contract-address.json";
import { IContracts } from "./types/global-types";
import { MyGovernor, TimeLock, Token, Treasury } from "./typechain";
import { ProposalList } from "./components/ProposalList/ProposalList";
import { Header } from "./components/Header/Header";
import { ethers } from "ethers";
import { accentButton, colors } from "./styles/globals";
import Container from "@mui/material/Container";
import Button from "@mui/material/Button";

export const EthersContext = React.createContext<{
  contracts: IContracts | null;
  provider: ethers.providers.Web3Provider | null;
}>({
  contracts: null,
  provider: null,
});

function App() {
  const [provider, setProvider] =
    useState<ethers.providers.Web3Provider | null>(null);
  const [contracts, setContracts] = useState<IContracts | null>(null);

  const initialize = async () => {
    const _provider = new ethers.providers.Web3Provider(window.ethereum);
    await _provider.getNetwork();

    const tokenContract = new ethers.Contract(
      contractAddress.Token,
      TokenArtifact.abi,
      _provider.getSigner(0)
    );

    const timeLockContract = new ethers.Contract(
      contractAddress.Timelock,
      TimeLockArtifact.abi,
      _provider.getSigner(0)
    );

    const governorContract = new ethers.Contract(
      contractAddress.Governor,
      GovernorArtifact.abi,
      _provider.getSigner(0)
    );

    const treasuryContract = new ethers.Contract(
      contractAddress.Treasury,
      TreasuryArtifact.abi,
      _provider.getSigner(0)
    );

    setProvider(_provider);
    setContracts({
      token: tokenContract as Token,
      timeLock: timeLockContract as TimeLock,
      governor: governorContract as MyGovernor,
      treasury: treasuryContract as Treasury,
    });
  };

  useEffect(() => {
    initialize();
  }, []);

  return (
    <>
      <div
        style={{
          width: "100vw",
          height: "90vh",
          backgroundColor: colors.primary,
          position: "absolute",
          zIndex: "-1",
        }}
      ></div>
      <div>
        {provider ? (
          <EthersContext.Provider
            value={{
              provider,
              contracts,
            }}
          >
            <div>
              <Header />
              {/* <VoteButton
            selectedAccount={selectedAccount}
            proposalId={proposalId}
            contracts={contracts}
          /> */}
              <ProposalList />
            </div>
          </EthersContext.Provider>
        ) : (
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
              Please download{" "}
              <span style={{ color: colors.accent }}> metamask</span> to use
              this awesome DAO
            </h1>
            <Button
              href="https://metamask.io/download/"
              variant="contained"
              sx={accentButton}
            >
              Download now
            </Button>
          </Container>
        )}
      </div>
    </>
  );
}

export default App;

import React, { useEffect, useState } from "react";
import logo from "./logo.svg";
import "./App.css";
import { ethers } from "ethers";
import TokenArtifact from "./contracts/Token.json";
import TimeLockArtifact from "./contracts/Treasury.json";
import GovernorArtifact from "./contracts/MyGovernor.json";
import TreasuryArtifact from "./contracts/Treasury.json";
import contractAddress from "./contracts/contract-address.json";
import { CreateProposalButton } from "./components/CreateProposalButton/CreateProposalButton";

function App() {
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [provider, setProvider] =
    useState<ethers.providers.Web3Provider | null>(null);
  const [token, setToken] = useState<ethers.Contract | null>(null);
  const [timeLock, setTimeLock] = useState<ethers.Contract | null>(null);
  const [governor, setGovernor] = useState<ethers.Contract | null>(null);
  const [treasury, setTreasury] = useState<ethers.Contract | null>(null);

  const initialize = async () => {
    const _provider = new ethers.providers.Web3Provider(window.ethereum);
    setProvider(_provider);
    const { chainId } = await _provider.getNetwork();
    console.log("chainId", chainId);

    const tokenContract = new ethers.Contract(
      contractAddress.Token,
      TokenArtifact.abi,
      _provider.getSigner(0)
    );
    setToken(tokenContract);

    const timeLockContract = new ethers.Contract(
      contractAddress.Timelock,
      TimeLockArtifact.abi,
      _provider.getSigner(0)
    );
    setTimeLock(timeLockContract);

    const governorContract = new ethers.Contract(
      contractAddress.Governor,
      GovernorArtifact.abi,
      _provider.getSigner(0)
    );
    setGovernor(governorContract);

    const treasuryContract = new ethers.Contract(
      contractAddress.Treasury,
      TreasuryArtifact.abi,
      _provider.getSigner(0)
    );
    setTreasury(treasuryContract);
  };

  const connectToWallet = async () => {
    if (provider) {
      const [account] = await provider.send("eth_requestAccounts", []);
      setSelectedAccount(account);
      console.log("Connecetd to wallet", account);
    } else console.error("Trying to connect to wallet before initialization");
  };

  useEffect(() => {
    initialize();
  }, []);

  const renderContent = () => {
    if (
      selectedAccount !== null &&
      token !== null &&
      timeLock !== null &&
      governor !== null &&
      treasury !== null
    ) {
      return (
        <CreateProposalButton
          selectedAccount={selectedAccount}
          contracts={{
            token,
            timeLock,
            governor,
            treasury,
          }}
        />
      );
    } else {
      return <button onClick={connectToWallet}>Connect wallet</button>;
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        {provider ? (
          <div>{renderContent()}</div>
        ) : (
          <h1>Please download metamask</h1>
        )}
      </header>
    </div>
  );
}

export default App;

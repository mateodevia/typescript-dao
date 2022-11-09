import React, { useEffect, useState } from "react";
import { BigNumber, ethers } from "ethers";
import TokenArtifact from "./contracts/Token.json";
import TimeLockArtifact from "./contracts/Treasury.json";
import GovernorArtifact from "./contracts/MyGovernor.json";
import TreasuryArtifact from "./contracts/Treasury.json";
import contractAddress from "./contracts/contract-address.json";
import { CreateProposalButton } from "./components/CreateProposalButton/CreateProposalButton";
import { VoteButton } from "./components/VoteButton/VoteButton";
import { IContracts } from "./types/global-types";
import { MyGovernor, TimeLock, Token, Treasury } from "./typechain";
import { ProposalList } from "./components/ProposalList/ProposalList";

export const EthersContext = React.createContext<{
  contracts: IContracts | null;
  provider: ethers.providers.Web3Provider | null;
}>({
  contracts: null,
  provider: null,
});

function App() {
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [provider, setProvider] =
    useState<ethers.providers.Web3Provider | null>(null);
  const [contracts, setContracts] = useState<IContracts | null>(null);
  const [proposalId, setProposalId] = useState<BigNumber | null>(null);

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
    if (selectedAccount !== null) {
      return (
        <React.Fragment>
          <CreateProposalButton
            selectedAccount={selectedAccount}
            setProposalId={setProposalId}
          />
          {/* <VoteButton
            selectedAccount={selectedAccount}
            proposalId={proposalId}
            contracts={contracts}
          /> */}
          <ProposalList />
        </React.Fragment>
      );
    } else {
      return <button onClick={connectToWallet}>Connect wallet</button>;
    }
  };

  return (
    <div>
      {provider ? (
        <EthersContext.Provider
          value={{
            provider,
            contracts,
          }}
        >
          <div>{renderContent()}</div>
        </EthersContext.Provider>
      ) : (
        <h1>Please download metamask</h1>
      )}
    </div>
  );
}

export default App;

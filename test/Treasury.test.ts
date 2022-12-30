import { MyGovernor, Treasury } from "../typechain";
import { deployFixture } from "./utils";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { getTreasuryBalance } from "../scripts/api/treasury";
import { expect } from "chai";
import {
  excecuteProposal,
  proposeReleaseFundsToPayee,
  queueProposal,
  voteForProposal,
} from "../scripts/api/proposal";
import { ethers } from "hardhat";
import moveBlocks from "../utils/moveBlocks";
import { VotingOptions } from "../scripts/api/types";
import moveTime from "../utils/moveTime";
import { ProposalFactory } from "./factories/ProposalFactory";

describe("Treasury Contract", () => {
  const tokenSupply = 1000;
  const treasurySupply = 50;
  const minDelay = 20;
  const quorum = 5;
  const votingDelay = 5;
  const votingPeriod = 10;
  let treasury: Treasury;
  let governor: MyGovernor;

  const fixture = async () =>
    deployFixture({
      tokenSupply,
      treasurySupply,
      minDelay,
      quorum,
      votingDelay,
      votingPeriod,
    });

  beforeEach(async () => {
    ({ treasury, governor } = await loadFixture(fixture));
  });

  it("When consulting the treasury balance as soon as it was deployed, then it should return the treasury supply", async () => {
    // ARRANGE

    // ACT
    const res = await getTreasuryBalance(ethers.provider, { treasury });

    // ASSERT
    expect(res).to.be.equal(`${treasurySupply}.0`);
  });

  it("When consulting the treasury after a proposal is excecuted, then it should return the treasury supply updated", async () => {
    // ARRANGE
    const [deployer, voter1, , , , , otherAddress] = await ethers.getSigners();
    // Create and execute a proposal
    const proposalAmount = 10;
    const excecutedDescription = "Should be excecuted";
    const excecutedProposal = await proposeReleaseFundsToPayee(
      otherAddress.address,
      proposalAmount,
      excecutedDescription,
      {
        treasury: treasury.connect(voter1),
        governor: governor.connect(voter1),
      }
    );
    await moveBlocks(votingDelay);
    await voteForProposal(
      excecutedProposal.proposalId.toString(),
      VotingOptions.InFavor,
      {
        governor: governor.connect(voter1),
      }
    );
    await moveBlocks(votingPeriod);
    await queueProposal(
      ProposalFactory({
        description: excecutedDescription,
        payee: otherAddress.address,
        amount: "10",
      }),
      {
        governor: governor.connect(voter1),
        treasury: treasury.connect(voter1),
      }
    );
    await moveTime(minDelay + 1);
    await moveBlocks(1);
    await excecuteProposal(
      ProposalFactory({
        description: excecutedDescription,
        payee: otherAddress.address,
        amount: "10",
      }),
      {
        governor: governor.connect(deployer),
        treasury: treasury.connect(deployer),
      }
    );

    // ACT
    const res = await getTreasuryBalance(ethers.provider, { treasury });

    // ASSERT
    expect(res).to.be.equal(`${treasurySupply - proposalAmount}.0`);
  });
});

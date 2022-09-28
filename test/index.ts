/* eslint-disable no-unused-vars */
import { ethers } from "hardhat";
import { expect } from "chai";
import { deploy } from "../scripts/deployment";
import { loadFixture } from "ethereum-waffle";
import {
  excecuteProposal,
  proposeReleaseFundsToPayee,
  queueProposal,
  voteForProposal,
} from "../scripts/api/proposal";
import { ProposalStates, VotingOptions } from "../utils/types";
import moveTime from "../utils/moveTime";
import moveBlocks from "../utils/moveBlocks";
import Chance from "chance";

const chance = new Chance();

describe("When deploying the smart contracts", function () {
  const tokenSupply = 1000;
  const treasurySupply = 50;
  const minDelay = 1;
  const quorum = 5;
  const votingDelay = 1;
  const votingPeriod = 10;

  it("Should deploy the 4 contracts with the appropiate set up", async function () {
    // ARRANGE
    const [deployer, voter1, voter2, voter3, voter4, voter5] =
      await ethers.getSigners();

    // ACT
    const { token, timeLock, governor, treasury } = await deploy(
      tokenSupply,
      treasurySupply,
      { deployer, investors: [voter1, voter2, voter3, voter4, voter5] },
      {
        minDelay,
        quorum,
        votingDelay,
        votingPeriod,
      }
    );

    // ASSERT
    // All the contracts should have been deployed
    expect(token).to.not.be.undefined;
    expect(timeLock).to.not.be.undefined;
    expect(governor).to.not.be.undefined;
    expect(treasury).to.not.be.undefined;

    // Token
    // There should be a total of 1000 tokens
    expect(await token.totalSupply()).to.be.equal(
      ethers.utils.parseEther(tokenSupply.toString())
    );
    // Each voter should have 20% of the tokens
    const amountPerVoter = ethers.utils.parseEther(
      (tokenSupply / 5).toString()
    );
    expect(await token.balanceOf(voter1.address)).to.be.equal(amountPerVoter);
    expect(await token.balanceOf(voter2.address)).to.be.equal(amountPerVoter);
    expect(await token.balanceOf(voter3.address)).to.be.equal(amountPerVoter);
    expect(await token.balanceOf(voter4.address)).to.be.equal(amountPerVoter);
    expect(await token.balanceOf(voter5.address)).to.be.equal(amountPerVoter);

    // TimeLock
    // The deployer address should not own the timeLock contract
    const deployerIsAdmin = await timeLock.hasRole(
      await timeLock.TIMELOCK_ADMIN_ROLE(),
      deployer.address
    );
    expect(deployerIsAdmin).to.be.equal(false);

    // Governor
    // The governor should be able to make proposals
    const governorIsProposer = await timeLock.hasRole(
      await timeLock.PROPOSER_ROLE(),
      governor.address
    );
    expect(governorIsProposer).to.be.equal(true);

    // Treasury
    // The treasury contract should have 50 ETH that comes from the deployer
    expect(await ethers.provider.getBalance(treasury.address)).to.be.equal(
      ethers.utils.parseEther(treasurySupply.toString())
    );
    const deployerBalance = Number(
      ethers.utils.formatEther(
        await ethers.provider.getBalance(deployer.address)
      )
    );
    /** Aprox 9950 ETH */
    const expectedDeployerBalance = Number(
      ethers.utils.formatEther(ethers.utils.parseEther("9950"))
    );
    expect(deployerBalance).to.be.closeTo(expectedDeployerBalance, 1);

    // The treasury contract should be owned by the timelock contract
    expect(await treasury.owner()).to.be.equal(timeLock.address);
  });
});

describe("Token Contract", () => {
  const tokenSupply = 1000;
  const treasurySupply = 50;
  const minDelay = 1;
  const quorum = 5;
  const votingDelay = 1;
  const votingPeriod = 10;
  const deployFixture = async () => {
    const [deployer, voter1, voter2, voter3, voter4, voter5] =
      await ethers.getSigners();
    return await deploy(
      tokenSupply,
      treasurySupply,
      { deployer, investors: [voter1, voter2, voter3, voter4, voter5] },
      {
        minDelay,
        quorum,
        votingDelay,
        votingPeriod,
      }
    );
  };

  describe("When transfering tokens from one address to another", () => {
    it("Should remove tokens from the sender address and add them to the recipient address", async () => {
      // ARRANGE
      const [deployer, voter1, voter2] = await ethers.getSigners();
      const { token } = await loadFixture(deployFixture);
      const senderOriginalBalance = Number(
        ethers.utils.formatEther(await token.balanceOf(voter1.address))
      );
      const recipientOriginalBalance = Number(
        ethers.utils.formatEther(await token.balanceOf(voter2.address))
      );

      // ACT
      // Send 10 tokens from voter1 to voter2
      await token
        .connect(voter1)
        .transfer(voter2.address, ethers.utils.parseEther("10"));

      // ASSERT
      const senderFinalBalance = Number(
        ethers.utils.formatEther(await token.balanceOf(voter1.address))
      );
      const recipientFinalBalance = Number(
        ethers.utils.formatEther(await token.balanceOf(voter2.address))
      );
      expect(senderFinalBalance).to.equal(senderOriginalBalance - 10);
      expect(recipientFinalBalance).to.equal(recipientOriginalBalance + 10);
    });
    it("Should not allow to transfer more token than the ones owned by the sender", async () => {
      // ARRANGE
      const [deployer, voter1, voter2] = await ethers.getSigners();
      const { token } = await loadFixture(deployFixture);

      // ACT
      const transaction = token
        .connect(voter1)
        .transfer(voter2.address, ethers.utils.parseEther("500"));

      // ASSERT
      await expect(transaction).to.be.reverted;
    });
    it("Should store balance history", async () => {
      // ARRANGE
      const [deployer, voter1, voter2] = await ethers.getSigners();
      const { token } = await loadFixture(deployFixture);

      // ACT
      const promise = token
        .connect(voter1)
        .transfer(voter2.address, ethers.utils.parseEther("10"));

      // ASSERT
      const [originalBlock, originalBalance] = await token.checkpoints(
        voter2.address,
        0
      );
      const [finalBlock, finalBalance] = await token.checkpoints(
        voter2.address,
        1
      );
      expect(Number(ethers.utils.formatEther(originalBalance))).to.equal(200);
      expect(Number(ethers.utils.formatEther(finalBalance))).to.equal(210);
    });
  });
});

describe("TimeLock Contract", () => {
  const tokenSupply = 1000;
  const treasurySupply = 50;
  const minDelay = 1;
  const quorum = 5;
  const votingDelay = 1;
  const votingPeriod = 10;
  const deployFixture = async () => {
    const [deployer, voter1, voter2, voter3, voter4, voter5] =
      await ethers.getSigners();
    return await deploy(
      tokenSupply,
      treasurySupply,
      { deployer, investors: [voter1, voter2, voter3, voter4, voter5] },
      {
        minDelay,
        quorum,
        votingDelay,
        votingPeriod,
      }
    );
  };

  describe("When trying to grant a role to an addres", () => {
    it("Should not allow to grant proposer role", async () => {
      // ARRANGE
      const [deployer, voter1] = await ethers.getSigners();
      const { timeLock } = await loadFixture(deployFixture);
      const proposerRole = await timeLock.PROPOSER_ROLE();

      // ACT
      const transaction = timeLock.grantRole(proposerRole, voter1.address);

      // ASSERT
      expect(transaction).to.be.reverted;
    });
    it("Should not allow to grant executor role", async () => {
      // ARRANGE
      const [deployer, voter1] = await ethers.getSigners();
      const { timeLock } = await loadFixture(deployFixture);
      const excecutorRole = await timeLock.EXECUTOR_ROLE();

      // ACT
      const transaction = timeLock.grantRole(excecutorRole, voter1.address);

      // ASSERT
      expect(transaction).to.be.reverted;
    });
    it("Should not allow to grant admin role", async () => {
      // ARRANGE
      const [deployer, voter1] = await ethers.getSigners();
      const { timeLock } = await loadFixture(deployFixture);
      const adminRole = await timeLock.TIMELOCK_ADMIN_ROLE();

      // ACT
      const transaction = timeLock.grantRole(adminRole, voter1.address);

      // ASSERT
      expect(transaction).to.be.reverted;
    });
    it("Should not allow to grant admin role", async () => {
      // ARRANGE
      const [deployer, voter1] = await ethers.getSigners();
      const { timeLock } = await loadFixture(deployFixture);
      const cancellerRole = await timeLock.CANCELLER_ROLE();

      // ACT
      const transaction = timeLock.grantRole(cancellerRole, voter1.address);

      // ASSERT
      expect(transaction).to.be.reverted;
    });
    it("Should not allow to grant default admin role", async () => {
      // ARRANGE
      const [deployer, voter1] = await ethers.getSigners();
      const { timeLock } = await loadFixture(deployFixture);
      const defaultRole = await timeLock.DEFAULT_ADMIN_ROLE();

      // ACT
      const transaction = timeLock.grantRole(defaultRole, voter1.address);

      // ASSERT
      expect(transaction).to.be.reverted;
    });
  });
});

describe("Governor Contract", () => {
  const tokenSupply = 1000;
  const treasurySupply = 50;
  const minDelay = 20;
  const quorum = 5;
  const votingDelay = 5;
  const votingPeriod = 10;

  const deployFixture = async () => {
    const [deployer, voter1, voter2, voter3, voter4, voter5] =
      await ethers.getSigners();
    return await deploy(
      tokenSupply,
      treasurySupply,
      { deployer, investors: [voter1, voter2, voter3, voter4, voter5] },
      {
        minDelay,
        quorum,
        votingDelay,
        votingPeriod,
      }
    );
  };

  describe("When making a proposal", () => {
    it.only("Should allow anyone to create a proposal", async () => {
      // ARRANGE
      const [
        deployer,
        voter1,
        voter2,
        voter3,
        voter4,
        voter5,
        payee,
        otherAddress,
      ] = await ethers.getSigners();
      const { treasury, governor } = await loadFixture(deployFixture);

      // ACT
      const [res1, res2, res3] = await Promise.all([
        proposeReleaseFundsToPayee(payee.address, 10, chance.string(), {
          treasury: treasury.connect(deployer),
          governor: governor.connect(deployer),
        }),
        proposeReleaseFundsToPayee(payee.address, 10, chance.string(), {
          treasury: treasury.connect(voter1),
          governor: governor.connect(voter1),
        }),
        proposeReleaseFundsToPayee(payee.address, 10, chance.string(), {
          treasury: treasury.connect(otherAddress),
          governor: governor.connect(otherAddress),
        }),
      ]);

      // ASSERT
      expect(res1.proposalId).to.not.be.undefined;
      expect(res2.proposalId).to.not.be.undefined;
      expect(res3.proposalId).to.not.be.undefined;
    });
    it("Should wait for the votingDelay to be over before the proposal becomes active", async () => {
      // ARRANGE
      const [deployer, voter1, voter2] = await ethers.getSigners();
      const { treasury, governor } = await loadFixture(deployFixture);

      // ACT
      const { proposalId } = await proposeReleaseFundsToPayee(
        voter2.address,
        50,
        chance.string(),
        {
          treasury: treasury.connect(voter1),
          governor: governor.connect(voter1),
        }
      );

      // ASSERT
      const proposalInitialState = await governor.state(proposalId);
      expect(proposalInitialState).to.equal(ProposalStates.Pending);

      await moveBlocks(votingDelay + 1);

      const proposalFinalState = await governor.state(proposalId);
      expect(proposalFinalState).to.equal(ProposalStates.Active);
    });
    it("Should wait for the votingPeriod to be over before the proposal becomes defeated (if nobody voted for it)", async () => {
      // ARRANGE
      const [deployer, voter1, voter2] = await ethers.getSigners();
      const { treasury, governor } = await loadFixture(deployFixture);

      // ACT
      const { proposalId } = await proposeReleaseFundsToPayee(
        voter2.address,
        50,
        chance.string(),
        {
          treasury: treasury.connect(voter1),
          governor: governor.connect(voter1),
        }
      );
      await moveBlocks(votingDelay + votingPeriod + 1);

      // ASSERT
      const proposalFinalState = await governor.state(proposalId);
      expect(proposalFinalState).to.equal(ProposalStates.Defeated);
    });
  });

  describe("When voting for a proposal", () => {
    it("Should not allow voting before the voting period", async () => {
      // ARRANGE
      const [deployer, voter1, voter2] = await ethers.getSigners();
      const { treasury, governor } = await loadFixture(deployFixture);
      const { proposalId } = await proposeReleaseFundsToPayee(
        voter2.address,
        50,
        chance.string(),
        {
          treasury: treasury.connect(voter1),
          governor: governor.connect(voter1),
        }
      );

      // ACT
      const transaction = voteForProposal(proposalId, 1, {
        governor: governor.connect(voter1),
      });

      // ASSERT
      await expect(transaction).to.be.reverted;
    });
    it("Should not allow voting after the voting period", async () => {
      // ARRANGE
      const [deployer, voter1, voter2] = await ethers.getSigners();
      const { treasury, governor } = await loadFixture(deployFixture);
      const { proposalId } = await proposeReleaseFundsToPayee(
        voter2.address,
        50,
        chance.string(),
        {
          treasury: treasury.connect(voter1),
          governor: governor.connect(voter1),
        }
      );
      await moveBlocks(votingDelay + votingPeriod + 1);

      // ACT
      const transaction = voteForProposal(proposalId, 1, {
        governor: governor.connect(voter1),
      });

      // ASSERT
      await expect(transaction).to.be.reverted;
    });
    describe("When all voters have the same amount of tokens (voting power)", () => {
      it("When the mayority of votes are in favor of the proposal, the proposal should be successful", async () => {
        // ARRANGE
        const [deployer, voter1, voter2, voter3, voter4, voter5] =
          await ethers.getSigners();
        const { treasury, governor } = await loadFixture(deployFixture);
        const { proposalId } = await proposeReleaseFundsToPayee(
          voter2.address,
          50,
          chance.string(),
          {
            treasury: treasury.connect(voter1),
            governor: governor.connect(voter1),
          }
        );
        await moveBlocks(votingDelay);

        // ACT
        await voteForProposal(proposalId, VotingOptions.InFavor, {
          governor: governor.connect(voter1),
        });
        await voteForProposal(proposalId, VotingOptions.InFavor, {
          governor: governor.connect(voter2),
        });
        await voteForProposal(proposalId, VotingOptions.InFavor, {
          governor: governor.connect(voter3),
        });
        await voteForProposal(proposalId, VotingOptions.InFavor, {
          governor: governor.connect(voter4),
        });
        await voteForProposal(proposalId, VotingOptions.Against, {
          governor: governor.connect(voter5),
        });
        await moveBlocks(votingPeriod);

        // ASSERT
        const proposalFinalState = await governor.state(proposalId);
        expect(proposalFinalState).to.equal(ProposalStates.Succeeded);
      });
      it("When the mayority of votes are againts of the proposal, the proposal should be defeated", async () => {
        // ARRANGE
        const [deployer, voter1, voter2, voter3, voter4, voter5] =
          await ethers.getSigners();
        const { treasury, governor } = await loadFixture(deployFixture);
        const { proposalId } = await proposeReleaseFundsToPayee(
          voter2.address,
          50,
          chance.string(),
          {
            treasury: treasury.connect(voter1),
            governor: governor.connect(voter1),
          }
        );
        await moveBlocks(votingDelay);

        // ACT
        await voteForProposal(proposalId, VotingOptions.Against, {
          governor: governor.connect(voter1),
        });
        await voteForProposal(proposalId, VotingOptions.Against, {
          governor: governor.connect(voter2),
        });
        await voteForProposal(proposalId, VotingOptions.Against, {
          governor: governor.connect(voter3),
        });
        await voteForProposal(proposalId, VotingOptions.Against, {
          governor: governor.connect(voter4),
        });
        await voteForProposal(proposalId, VotingOptions.InFavor, {
          governor: governor.connect(voter5),
        });
        await moveBlocks(votingPeriod);

        // ASSERT
        const proposalFinalState = await governor.state(proposalId);
        expect(proposalFinalState).to.equal(ProposalStates.Defeated);
      });
      it("When the mayority of votes abstained, the proposal should be Defeated", async () => {
        // ARRANGE
        const [deployer, voter1, voter2, voter3, voter4, voter5] =
          await ethers.getSigners();
        const { treasury, governor } = await loadFixture(deployFixture);
        const { proposalId } = await proposeReleaseFundsToPayee(
          voter2.address,
          50,
          chance.string(),
          {
            treasury: treasury.connect(voter1),
            governor: governor.connect(voter1),
          }
        );
        await moveBlocks(votingDelay);

        // ACT
        await voteForProposal(proposalId, VotingOptions.Abstain, {
          governor: governor.connect(voter1),
        });
        await voteForProposal(proposalId, VotingOptions.Abstain, {
          governor: governor.connect(voter2),
        });
        await voteForProposal(proposalId, VotingOptions.Abstain, {
          governor: governor.connect(voter3),
        });
        await voteForProposal(proposalId, VotingOptions.Abstain, {
          governor: governor.connect(voter4),
        });
        await voteForProposal(proposalId, VotingOptions.Abstain, {
          governor: governor.connect(voter5),
        });
        await moveBlocks(votingPeriod);

        // ASSERT
        const proposalFinalState = await governor.state(proposalId);
        expect(proposalFinalState).to.equal(ProposalStates.Defeated);
      });
    });
    it("When someone has more tokens than the others, his/her vote should have more weight", async () => {
      // ARRANGE
      const [deployer, voter1, voter2, voter3, voter4, voter5] =
        await ethers.getSigners();
      const { treasury, governor, token } = await loadFixture(deployFixture);

      // Voter 1 sends 150 tokens to Voter 5 being left with only 50 tokens
      await token
        .connect(voter1)
        .approve(token.address, ethers.utils.parseEther("150"));
      await token
        .connect(voter1)
        .transfer(voter5.address, ethers.utils.parseEther("150"));

      // Voter 2 sends 150 tokens to Voter 5 being left with only 50 tokens
      await token
        .connect(voter2)
        .approve(token.address, ethers.utils.parseEther("150"));
      await token
        .connect(voter2)
        .transfer(voter5.address, ethers.utils.parseEther("150"));

      const { proposalId } = await proposeReleaseFundsToPayee(
        voter2.address,
        50,
        chance.string(),
        {
          treasury: treasury.connect(voter1),
          governor: governor.connect(voter1),
        }
      );
      await moveBlocks(votingDelay);

      // ACT
      await voteForProposal(proposalId, VotingOptions.InFavor, {
        governor: governor.connect(voter1),
      });
      await voteForProposal(proposalId, VotingOptions.InFavor, {
        governor: governor.connect(voter2),
      });
      await voteForProposal(proposalId, VotingOptions.Against, {
        governor: governor.connect(voter3),
      });
      await moveBlocks(votingPeriod);

      // ASSERT
      // Token distribution should be in favor of voter 5
      const tokenBalanceVoter1 = Number(
        ethers.utils.formatEther(await token.balanceOf(voter1.address))
      );
      const tokenBalanceVoter2 = Number(
        ethers.utils.formatEther(await token.balanceOf(voter2.address))
      );
      const tokenBalanceVoter5 = Number(
        ethers.utils.formatEther(await token.balanceOf(voter5.address))
      );
      expect(tokenBalanceVoter1).to.equal(50);
      expect(tokenBalanceVoter2).to.equal(50);
      expect(tokenBalanceVoter5).to.equal(500);

      // Voting results should be weighted according to token distribution
      const { againstVotes, forVotes } = await governor.proposalVotes(
        proposalId
      );
      expect(Number(ethers.utils.formatEther(againstVotes))).to.equal(500);
      expect(Number(ethers.utils.formatEther(forVotes))).to.equal(100);

      // Proposal should not pass because voter5 (voter with more voting power) voted against it
      const proposalFinalState = await governor.state(proposalId);
      expect(proposalFinalState).to.equal(ProposalStates.Defeated);
    });
    it("When there is not enough quorum, the proposal should be defeated", async () => {
      // ARRANGE
      const [deployer, voter1, voter2, voter3, voter4, voter5] =
        await ethers.getSigners();
      const { treasury, governor, token } = await loadFixture(deployFixture);

      // Voter 1 sends 190 tokens to Voter 5 being left with only 10 tokens
      await token
        .connect(voter1)
        .approve(token.address, ethers.utils.parseEther("190"));
      await token
        .connect(voter1)
        .transfer(voter5.address, ethers.utils.parseEther("190"));
      const { proposalId } = await proposeReleaseFundsToPayee(
        voter2.address,
        50,
        chance.string(),
        {
          treasury: treasury.connect(voter1),
          governor: governor.connect(voter1),
        }
      );
      await moveBlocks(votingDelay);

      // ACT
      await voteForProposal(proposalId, VotingOptions.InFavor, {
        governor: governor.connect(voter1),
      });
      await moveBlocks(votingPeriod);

      // ASSERT
      // Voter 1 should only have 10 tokens (less than 5% of the total supply)
      const tokenBalanceVoter1 = Number(
        ethers.utils.formatEther(await token.balanceOf(voter1.address))
      );
      expect(tokenBalanceVoter1).to.equal(10);

      // Voting results should be weighted according to token distribution
      const { forVotes } = await governor.proposalVotes(proposalId);
      expect(Number(ethers.utils.formatEther(forVotes))).to.equal(10);

      // Proposal should not pass because 10 votes is less than the minimum quorum needed (5% -> 50 votes)
      const proposalFinalState = await governor.state(proposalId);
      expect(proposalFinalState).to.equal(ProposalStates.Defeated);
    });
  });
  describe("When a proposal is successful", () => {
    it("Should allow anyone to queue the proposal", async () => {
      // ARRANGE
      const [deployer, voter1, voter2, voter3, voter4, voter5, otherAddress] =
        await ethers.getSigners();
      const { treasury, governor } = await loadFixture(deployFixture);

      // Create 3 different proposals
      const description1 = chance.string();
      const description2 = chance.string();
      const description3 = chance.string();
      const [proposal1, proposal2, proposal3] = await Promise.all([
        proposeReleaseFundsToPayee(otherAddress.address, 10, description1, {
          treasury: treasury.connect(voter1),
          governor: governor.connect(voter1),
        }),
        proposeReleaseFundsToPayee(otherAddress.address, 10, description2, {
          treasury: treasury.connect(voter1),
          governor: governor.connect(voter1),
        }),
        proposeReleaseFundsToPayee(otherAddress.address, 10, description3, {
          treasury: treasury.connect(voter1),
          governor: governor.connect(voter1),
        }),
      ]);
      // Make the 3 prposals successful
      await moveBlocks(votingDelay);
      await Promise.all([
        voteForProposal(proposal1.proposalId, VotingOptions.InFavor, {
          governor: governor.connect(voter1),
        }),
        voteForProposal(proposal2.proposalId, VotingOptions.InFavor, {
          governor: governor.connect(voter1),
        }),
        voteForProposal(proposal3.proposalId, VotingOptions.InFavor, {
          governor: governor.connect(voter1),
        }),
      ]);
      await moveBlocks(votingPeriod);

      // ACT
      await Promise.all([
        // Should allow deployer to enqueue a proposal
        queueProposal(description1, proposal1.encodedFunction, {
          governor: governor.connect(deployer),
          treasury: treasury.connect(deployer),
        }),
        // Should allow voter to enqueue a proposal
        queueProposal(description2, proposal2.encodedFunction, {
          governor: governor.connect(voter1),
          treasury: treasury.connect(voter1),
        }),
        // Should allow an address without tokens to enqueue a proposal
        queueProposal(description3, proposal3.encodedFunction, {
          governor: governor.connect(otherAddress),
          treasury: treasury.connect(otherAddress),
        }),
      ]);

      // ASSERT
      const prposal1State = await governor.state(proposal1.proposalId);
      expect(prposal1State).to.equal(ProposalStates.Queued);

      const prposal2State = await governor.state(proposal1.proposalId);
      expect(prposal2State).to.equal(ProposalStates.Queued);

      const prposal3State = await governor.state(proposal1.proposalId);
      expect(prposal3State).to.equal(ProposalStates.Queued);
    });
    it("Should allow anyone to execute the proposal", async () => {
      // ARRANGE
      const [deployer, voter1, voter2, voter3, voter4, voter5, otherAddress] =
        await ethers.getSigners();
      const { treasury, governor } = await loadFixture(deployFixture);

      // Create 3 different proposals
      const description1 = chance.string();
      const description2 = chance.string();
      const description3 = chance.string();
      const [proposal1, proposal2, proposal3] = await Promise.all([
        proposeReleaseFundsToPayee(otherAddress.address, 10, description1, {
          treasury: treasury.connect(voter1),
          governor: governor.connect(voter1),
        }),
        proposeReleaseFundsToPayee(otherAddress.address, 10, description2, {
          treasury: treasury.connect(voter1),
          governor: governor.connect(voter1),
        }),
        proposeReleaseFundsToPayee(otherAddress.address, 10, description3, {
          treasury: treasury.connect(voter1),
          governor: governor.connect(voter1),
        }),
      ]);
      // Make the 3 prposals successful
      await moveBlocks(votingDelay);
      await Promise.all([
        voteForProposal(proposal1.proposalId, VotingOptions.InFavor, {
          governor: governor.connect(voter1),
        }),
        voteForProposal(proposal2.proposalId, VotingOptions.InFavor, {
          governor: governor.connect(voter1),
        }),
        voteForProposal(proposal3.proposalId, VotingOptions.InFavor, {
          governor: governor.connect(voter1),
        }),
      ]);
      await moveBlocks(votingPeriod);

      // Enqueue the proposals
      await Promise.all([
        // Should allow deployer to enqueue a proposal
        queueProposal(description1, proposal1.encodedFunction, {
          governor: governor.connect(deployer),
          treasury: treasury.connect(deployer),
        }),
        // Should allow voter to enqueue a proposal
        queueProposal(description2, proposal2.encodedFunction, {
          governor: governor.connect(voter1),
          treasury: treasury.connect(voter1),
        }),
        // Should allow an address without tokens to enqueue a proposal
        queueProposal(description3, proposal3.encodedFunction, {
          governor: governor.connect(otherAddress),
          treasury: treasury.connect(otherAddress),
        }),
      ]);
      await moveTime(minDelay + 1);
      await moveBlocks(1);

      // ACT
      await Promise.all([
        excecuteProposal(description1, proposal1.encodedFunction, {
          governor: governor.connect(deployer),
          treasury: treasury.connect(deployer),
        }),
        excecuteProposal(description2, proposal2.encodedFunction, {
          governor: governor.connect(voter1),
          treasury: treasury.connect(voter1),
        }),
        excecuteProposal(description3, proposal3.encodedFunction, {
          governor: governor.connect(otherAddress),
          treasury: treasury.connect(otherAddress),
        }),
      ]);

      // ASSERT
      const prposal1State = await governor.state(proposal1.proposalId);
      expect(prposal1State).to.equal(ProposalStates.Executed);

      const prposal2State = await governor.state(proposal1.proposalId);
      expect(prposal2State).to.equal(ProposalStates.Executed);

      const prposal3State = await governor.state(proposal1.proposalId);
      expect(prposal3State).to.equal(ProposalStates.Executed);
    });
  });
});

/* eslint-disable no-unused-vars */
import { ethers } from "hardhat";
import { expect } from "chai";
import async from "async";
import { deploy } from "../scripts/deployment";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import {
  excecuteProposal,
  getProposals,
  proposeReleaseFundsToPayee,
  queueProposal,
  voteForProposal,
} from "../scripts/api/proposal";
import { ProposalStates, VotingOptions } from "../utils/types";
import moveTime from "../utils/moveTime";
import moveBlocks from "../utils/moveBlocks";
import Chance from "chance";
import { MyGovernor, Token, Treasury } from "../typechain";
import { deployFixture } from "./utils";
import { BigNumberish } from "ethers";

const chance = new Chance();

describe("Governor Contract", () => {
  const tokenSupply = 1000;
  const treasurySupply = 50;
  const minDelay = 20;
  const quorum = 5;
  const votingDelay = 5;
  const votingPeriod = 10;
  let token: Token;
  let governor: MyGovernor;
  let treasury: Treasury;

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
    ({ token, governor, treasury } = await loadFixture(fixture));
  });

  describe("When making a proposal", () => {
    it("Should allow anyone to create a proposal", async () => {
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
      it("When the mayority of votes abstained, the proposal should be defeated", async () => {
        // ARRANGE
        const [deployer, voter1, voter2, voter3, voter4, voter5] =
          await ethers.getSigners();
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
        governor: governor.connect(voter5),
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

  describe("When consulting active proposals", () => {
    /**
     * Creates 5 proposals in different states
     * @returns {{ excecutedProposal: string; votingProposal: string; pendingProposal: string; failedProposal: string }} Proposal Ids for each proposal
     * excecutedProposal -> a proposal that was successfully executed
     * votingProposal -> a proposal that is on votingPeriod
     * pendingProposal -> a proposal that is already approved, and it is waiting to be queued
     * queuedProposal -> a proposal that was queued, and it is waiting to be excecuted
     * failedProposal -> a proposal that was rejected
     */
    const setUpProposalsInVariousStates = async () => {
      const [deployer, voter1, voter2, voter3, voter4, voter5, otherAddress] =
        await ethers.getSigners();

      // Create and execute a proposal
      const excecutedDescription = "Should be excecuted";
      const excecutedProposal = await proposeReleaseFundsToPayee(
        otherAddress.address,
        10,
        excecutedDescription,
        {
          treasury: treasury.connect(voter1),
          governor: governor.connect(voter1),
        }
      );
      await moveBlocks(votingDelay);
      await voteForProposal(
        excecutedProposal.proposalId,
        VotingOptions.InFavor,
        {
          governor: governor.connect(voter1),
        }
      );
      await moveBlocks(votingPeriod);
      await queueProposal(
        excecutedDescription,
        excecutedProposal.encodedFunction,
        {
          governor: governor.connect(voter1),
          treasury: treasury.connect(voter1),
        }
      );
      await moveTime(minDelay + 1);
      await moveBlocks(1);
      await excecuteProposal(
        excecutedDescription,
        excecutedProposal.encodedFunction,
        {
          governor: governor.connect(deployer),
          treasury: treasury.connect(deployer),
        }
      );

      // Create and approve a proposal
      const approvedDescription = "Should be approved";
      const approvedProposal = await proposeReleaseFundsToPayee(
        otherAddress.address,
        10,
        approvedDescription,
        {
          treasury: treasury.connect(voter1),
          governor: governor.connect(voter1),
        }
      );
      await moveBlocks(votingDelay);
      await voteForProposal(
        approvedProposal.proposalId,
        VotingOptions.InFavor,
        {
          governor: governor.connect(voter1),
        }
      );
      await moveBlocks(votingPeriod);

      // Create, approve, and queue a proposal
      const queuedDescription = "Should be queued";
      const queuedProposal = await proposeReleaseFundsToPayee(
        otherAddress.address,
        10,
        queuedDescription,
        {
          treasury: treasury.connect(voter1),
          governor: governor.connect(voter1),
        }
      );
      await moveBlocks(votingDelay);
      await voteForProposal(queuedProposal.proposalId, VotingOptions.InFavor, {
        governor: governor.connect(voter1),
      });
      await moveBlocks(votingPeriod);
      await queueProposal(queuedDescription, queuedProposal.encodedFunction, {
        governor: governor.connect(voter1),
        treasury: treasury.connect(voter1),
      });

      // Create and vote against a proposal

      const failedDescription = "Should be defeated";
      const failedProposal = await proposeReleaseFundsToPayee(
        otherAddress.address,
        10,
        failedDescription,
        {
          treasury: treasury.connect(voter1),
          governor: governor.connect(voter1),
        }
      );
      await moveBlocks(votingDelay);
      await voteForProposal(failedProposal.proposalId, VotingOptions.Against, {
        governor: governor.connect(voter1),
      });
      await moveBlocks(votingPeriod);

      // Create a proposal and start its voting period
      const votingDescription = "Should be pending";
      const votingProposal = await proposeReleaseFundsToPayee(
        otherAddress.address,
        10,
        votingDescription,
        {
          treasury: treasury.connect(voter1),
          governor: governor.connect(voter1),
        }
      );
      await moveBlocks(votingDelay);

      return {
        excecutedProposal,
        approvedProposal,
        votingProposal,
        queuedProposal,
        failedProposal,
      };
    };

    it("Should return a list of proposals", async () => {
      // ARRANGE
      const [deployer, voter1, voter2, voter3, voter4, voter5, otherAddress] =
        await ethers.getSigners();
      const {
        excecutedProposal,
        approvedProposal,
        votingProposal,
        queuedProposal,
        failedProposal,
      } = await setUpProposalsInVariousStates();

      // ACT
      const proposals = await getProposals({
        treasury: treasury.connect(deployer),
        governor: governor.connect(deployer),
      });

      // ASSERT
      const excecuted = proposals.find(
        (proposal) => proposal.state === ProposalStates.Executed
      );
      expect(excecuted?.id).equals(excecutedProposal.proposalId);
      expect(excecuted?.proposer).equals(voter1.address);
      expect(excecuted?.description).equals("Should be excecuted");
      expect(excecuted?.payee).equals(otherAddress.address);
      expect(excecuted?.amount).equals(ethers.utils.parseEther("10"));

      const approved = proposals.find(
        (proposal) => proposal.state === ProposalStates.Succeeded
      );
      expect(approved?.id).equals(approvedProposal.proposalId);
      expect(approved?.proposer).equals(voter1.address);
      expect(approved?.description).equals("Should be approved");
      expect(approved?.payee).equals(otherAddress.address);
      expect(approved?.amount).equals(ethers.utils.parseEther("10"));

      const voting = proposals.find(
        (proposal) => proposal.state === ProposalStates.Pending
      );
      expect(voting?.id).equals(votingProposal.proposalId);
      expect(voting?.proposer).equals(voter1.address);
      expect(voting?.description).equals("Should be pending");
      expect(voting?.payee).equals(otherAddress.address);
      expect(voting?.amount).equals(ethers.utils.parseEther("10"));

      const queued = proposals.find(
        (proposal) => proposal.state === ProposalStates.Queued
      );
      expect(queued?.id).equals(queuedProposal.proposalId);
      expect(queued?.proposer).equals(voter1.address);
      expect(queued?.description).equals("Should be queued");
      expect(queued?.payee).equals(otherAddress.address);
      expect(queued?.amount).equals(ethers.utils.parseEther("10"));

      const failed = proposals.find(
        (proposal) => proposal.state === ProposalStates.Defeated
      );
      expect(failed?.id).equals(failedProposal.proposalId);
      expect(failed?.proposer).equals(voter1.address);
      expect(failed?.description).equals("Should be defeated");
      expect(failed?.payee).equals(otherAddress.address);
      expect(failed?.amount).equals(ethers.utils.parseEther("10"));
    });
  });
});

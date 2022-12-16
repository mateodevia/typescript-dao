/* eslint-disable no-unused-vars */
import { ethers } from "hardhat";
import { expect } from "chai";
import { deploy } from "../scripts/deployment";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import Chance from "chance";
import { Token } from "../typechain";
import { deployFixture } from "./utils";
import { getVoters } from "../scripts/api/voters";

const chance = new Chance();

describe("Token Contract", () => {
  const tokenSupply = 1000;
  const treasurySupply = 50;
  const minDelay = 1;
  const quorum = 5;
  const votingDelay = 1;
  const votingPeriod = 10;
  let token: Token;

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
    ({ token } = await loadFixture(fixture));
  });

  describe("When transfering tokens from one address to another", () => {
    it("Should remove tokens from the sender address and add them to the recipient address", async () => {
      // ARRANGE
      const [deployer, voter1, voter2] = await ethers.getSigners();
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

      // ACT
      const transaction = token
        .connect(voter1)
        .transfer(voter2.address, ethers.utils.parseEther("500"));

      // ASSERT
      await expect(transaction).to.be.reverted;
    });
    // TODO: fix this test
    it.skip("Should store balance history", async () => {
      // ARRANGE
      const [deployer, voter1, voter2] = await ethers.getSigners();

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
  describe("When queryng the share holders", () => {
    it.only("Should return all the addresses that hold tokens", async () => {
      // ARRANGE
      const signers = await ethers.getSigners();
      const voters = signers.slice(1, 6);

      // ACT
      const res = await getVoters({ token });

      // ASSERT
      voters.forEach((voter) => {
        const found = res.find((v) => v.address === voter.address);
        expect(found).to.not.be.undefined;
        expect(found!.address).to.be.equal(voter.address);
        expect(found!.tokens).to.be.equal("200.0");
      });
    });
  });
});

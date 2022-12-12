/* eslint-disable no-unused-vars */
import { ethers } from "hardhat";
import { expect } from "chai";
import { deploy } from "../scripts/deployment";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { TimeLock } from "../typechain";
import { deployFixture } from "./utils";

describe("TimeLock Contract", () => {
  const tokenSupply = 1000;
  const treasurySupply = 50;
  const minDelay = 1;
  const quorum = 5;
  const votingDelay = 1;
  const votingPeriod = 10;
  let timeLock: TimeLock;

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
    ({ timeLock } = await loadFixture(fixture));
  });

  describe("When trying to grant a role to an addres", () => {
    it("Should not allow to grant proposer role", async () => {
      // ARRANGE
      const [deployer, voter1] = await ethers.getSigners();
      const proposerRole = await timeLock.PROPOSER_ROLE();

      // ACT
      const transaction = timeLock.grantRole(proposerRole, voter1.address);

      // ASSERT
      expect(transaction).to.be.reverted;
    });
    it("Should not allow to grant executor role", async () => {
      // ARRANGE
      const [deployer, voter1] = await ethers.getSigners();
      const excecutorRole = await timeLock.EXECUTOR_ROLE();

      // ACT
      const transaction = timeLock.grantRole(excecutorRole, voter1.address);

      // ASSERT
      expect(transaction).to.be.reverted;
    });
    it("Should not allow to grant admin role", async () => {
      // ARRANGE
      const [deployer, voter1] = await ethers.getSigners();
      const adminRole = await timeLock.TIMELOCK_ADMIN_ROLE();

      // ACT
      const transaction = timeLock.grantRole(adminRole, voter1.address);

      // ASSERT
      expect(transaction).to.be.reverted;
    });
    it("Should not allow to grant admin role", async () => {
      // ARRANGE
      const [deployer, voter1] = await ethers.getSigners();
      const cancellerRole = await timeLock.CANCELLER_ROLE();

      // ACT
      const transaction = timeLock.grantRole(cancellerRole, voter1.address);

      // ASSERT
      expect(transaction).to.be.reverted;
    });
    it("Should not allow to grant default admin role", async () => {
      // ARRANGE
      const [deployer, voter1] = await ethers.getSigners();
      const defaultRole = await timeLock.DEFAULT_ADMIN_ROLE();

      // ACT
      const transaction = timeLock.grantRole(defaultRole, voter1.address);

      // ASSERT
      expect(transaction).to.be.reverted;
    });
  });
});

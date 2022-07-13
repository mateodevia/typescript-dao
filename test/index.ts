import { ethers } from "hardhat";
import { expect } from "chai";
import { deploy } from "../scripts/deploy";

describe("When deploying the smart contracts", function () {
  it("Should return the new greeting once it's changed", async function () {
    // ARRANGE
    const [deployer, voter1, voter2, voter3, voter4, voter5] =
      await ethers.getSigners();

    // ACT
    const { token, timeLock, governor, treasury } = await deploy(
      1000,
      50,
      { deployer, investors: [voter1, voter2, voter3, voter4, voter5] },
      {
        minDelay: 1,
        quorum: 5,
        votingDelay: 1,
        votingPeriod: 10,
      }
    );

    // ASSERT
    expect(token).to.not.be.undefined;
    expect(timeLock).to.not.be.undefined;
    expect(governor).to.not.be.undefined;
    expect(treasury).to.not.be.undefined;
  });
});

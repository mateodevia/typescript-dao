import { ethers } from "hardhat";
import { expect } from "chai";
import { deploy } from "../scripts/api/deployment";

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
    console.log(
      "Deployer balance",
      ethers.utils.formatEther(
        await ethers.provider.getBalance(deployer.address)
      )
    );

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

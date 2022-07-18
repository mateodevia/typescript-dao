import { ethers } from "hardhat";
import { expect } from "chai";
import { deploy } from "../scripts/api/deployment";
import { loadFixture } from "ethereum-waffle";

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

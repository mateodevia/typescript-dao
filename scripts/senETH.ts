import { ethers } from "hardhat";

async function main() {
  const [deployer, voter1, voter2, voter3, voter4, voter5] =
    await ethers.getSigners();

  await deployer.sendTransaction({
    to: voter1.address,
    value: ethers.utils.parseEther("0.02"),
  });

  await deployer.sendTransaction({
    to: voter2.address,
    value: ethers.utils.parseEther("0.02"),
  });

  await deployer.sendTransaction({
    to: voter3.address,
    value: ethers.utils.parseEther("0.02"),
  });

  await deployer.sendTransaction({
    to: voter4.address,
    value: ethers.utils.parseEther("0.02"),
  });

  await deployer.sendTransaction({
    to: voter5.address,
    value: ethers.utils.parseEther("0.02"),
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

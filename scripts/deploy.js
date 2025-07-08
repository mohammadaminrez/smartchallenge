// scripts/deploy.js
const { ethers, upgrades } = require("hardhat");

async function main() {
  const SmartChallenge = await ethers.getContractFactory("SmartChallengeUpgradeable");
  console.log("Deploying SmartChallenge proxy...");

  const contract = await upgrades.deployProxy(SmartChallenge, [], {
    initializer: "initialize",
  });

  await contract.waitForDeployment();

  console.log("SmartChallenge deployed to:", await contract.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

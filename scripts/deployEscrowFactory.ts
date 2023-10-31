import { ethers, upgrades } from "hardhat";

async function main() {
  console.log(".........Deploying RewardEscrowFactory ......... \n")
  let rewardContractFactory = await ethers.getContractFactory("RewardEscrowFactory");
  let escrowFactory =  await upgrades.deployProxy(rewardContractFactory);
  await escrowFactory.waitForDeployment();
  let escrowFactoryAddress = await escrowFactory.getAddress();

  let escrowFactoryImpl = await upgrades.erc1967.getImplementationAddress(escrowFactoryAddress)
  let escrowFactoryProxyAdmin = await upgrades.erc1967.getAdminAddress(escrowFactoryAddress)

  console.log(`.........RewardEscrowFactory deployed at ${escrowFactoryAddress} ......... \n`)
  console.log(`.........RewardEscrowFactory impl deployed at ${escrowFactoryImpl} ......... \n`)
  console.log(`.........RewardEscrowFactory proxy admin deployed at ${escrowFactoryProxyAdmin} ......... \n`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

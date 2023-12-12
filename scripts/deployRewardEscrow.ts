import { ethers, upgrades } from "hardhat";

async function main() {

  console.log(".........Deploying RewardEscrow ......... \n")
  let operator = process.env.OPERATOR
  let rewardContract = await ethers.getContractFactory("RewardEscrow");
  let escrow =  await upgrades.deployProxy(rewardContract, [operator]);
  await escrow.waitForDeployment();
  let escrowAddress = await escrow.getAddress();

  let escrowImpl = await upgrades.erc1967.getImplementationAddress(escrowAddress)
  let escrowProxyAdmin = await upgrades.erc1967.getAdminAddress(escrowAddress)

  console.log(`.........RewardEscrow deployed at ${escrowAddress} ......... \n`)
  console.log(`.........RewardEscrow impl deployed at ${escrowImpl} ......... \n`)
  console.log(`.........RewardEscrow proxy admin deployed at ${escrowProxyAdmin} ......... \n`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

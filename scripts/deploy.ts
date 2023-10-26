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

  //console.log("================ Initializing escroyFactory ================ ")
  // let escrowFactoryAddress = "0x44765874ba7683B5a3bFC79aEB648e125Bd9D9F7"
  // let escrowFactory = new ethers.Contract(escrowFactoryAddress, RewardEscrowFactory__factory.createInterface());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

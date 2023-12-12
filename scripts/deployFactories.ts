import { ethers, upgrades } from "hardhat";

async function main() {
    console.log(`.........Deploying Factories to ${(await ethers.provider.getNetwork()).name}......... \n`)
    console.log(`.........Using address ${(await ethers.getSigners())[0].address}; with balance : ${await ethers.provider.getBalance((await ethers.getSigners())[0].address) }......... \n`)
    await collectiveFactory()
}

async function escrowFactory() {
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

async function collectiveFactory() {
    console.log(".........Deploying CollectiveFactory ......... \n")
    let contractFactory = await ethers.getContractFactory("CollectiveFactory");
    let cFactory =  await contractFactory.deploy(ethers.getAddress((process.env.ENTRY_POINT_ADDRESS as string)));
    await cFactory.waitForDeployment();
    let cFactoryAddress = await cFactory.getAddress();
  
    console.log(`.........cFactory deployed at ${cFactoryAddress} ......... \n`)
}


// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

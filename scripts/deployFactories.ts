import { setBalance } from "@nomicfoundation/hardhat-network-helpers";
import { ethers, upgrades } from "hardhat";
import { Bytecode } from "hardhat/internal/hardhat-network/stack-traces/model";

async function main() {
    console.log("Deploying from account:", (await ethers.getSigners())[0].address);
    // deployEntryPoint()
    // await deployMockToken()
    await honeyPotFactory()
    // fundWallet("0x9c7604F988af59b3299778cB984eAbf65198031A")

    // console.log(`.........Deploying Factories to ${(await ethers.provider.getNetwork()).name}......... \n`)
    // console.log(`.........Using address ${(await ethers.getSigners())[0].address}; with balance : ${await ethers.provider.getBalance((await ethers.getSigners())[0].address) }......... \n`)

    // console.log(`.........Deploying Entrypoint......... \n`)
    // const entryPoint = deployEntryPoint()
    console.log(`.........Deploying CollectiveFactory......... \n`)
    await collectiveFactory(process.env.ENTRY_POINT_ADDRESS as string)
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

async function collectiveFactory(entryPoint: string) {
    console.log(".........Deploying CollectiveFactory ......... \n")
    let contractFactory = await ethers.getContractFactory("CollectiveFactory");
    //let cFactory =  await contractFactory.deploy(ethers.getAddress((process.env.ENTRY_POINT_ADDRESS as string)));
    let cFactory =  await contractFactory.connect((await ethers.getSigners())[2]).deploy(ethers.getAddress((entryPoint)));
    // const test = (await contractFactory.getDeployTransaction(ethers.getAddress((entryPoint)))).data
    // console.log("test >> ", test)
    await cFactory.waitForDeployment();
    let cFactoryAddress = await cFactory.getAddress();
  
    console.log(`.........cFactory deployed at ${cFactoryAddress} ......... \n`)
}

async function honeyPotFactory() {
    console.log(".........Deploying HoneyPotFactory ......... \n")
    let contractFactory = await ethers.getContractFactory("HoneyPotFactory");
    let hFactory =  await contractFactory.connect((await ethers.getSigners())[2]).deploy();
    await hFactory.waitForDeployment();
    let hFactoryAddress = await hFactory.getAddress();
  
    console.log(`.........hFactory deployed at ${hFactoryAddress} ......... \n`)
}

async function fundWallet(cwallet: string) {
   const tx = await (await ethers.getSigners())[0].sendTransaction({to: cwallet, value: ethers.parseEther("2.0")})
   tx.wait()
   console.log(`.........Funded wallet ${await ethers.provider.getBalance(cwallet)} with 5 ETH ......... \n`)
}


async function deployEntryPoint() : Promise<string> {
    // deploy entryPoint contract
    let entryPointFactory = await ethers.getContractFactory("EntryPoint");
    let entryPoint = await entryPointFactory.deploy();
    await entryPoint.waitForDeployment();
    console.log(`.........EntryPoint deployed at ${entryPoint.getAddress} ......... \n`)
    return entryPoint.getAddress();
}

// deploy mockTokenContract
async function deployMockToken() {
    
    let mockTokenFactory = await ethers.getContractFactory("MockTokenContract");
    let mockToken = await mockTokenFactory.deploy();
    await mockToken.waitForDeployment();
    console.log(`.........MockToken deployed at ${await mockToken.getAddress()} ......... \n`)
    return mockToken.getAddress();
}



// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

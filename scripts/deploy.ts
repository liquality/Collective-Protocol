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

  // Send funds to escrowFactory to deply sub-escrow for sender
  console.log("============== Deploying sub-escrow ================= \n")  
  let accounts = await ethers.getSigners()
  let mintContract = await ethers.deployContract("MockMintContract", accounts[1]);
  let txReceipt = await mintContract.sendVal(escrowFactoryAddress, {value: ethers.parseEther("0.0001")})
  console.log(`......... tx receipt => ${txReceipt} for subescrow creation for mintContract => ${await mintContract.getAddress()} ......... \n`)
  let subEscrow = await escrowFactory.getEscrow(await mintContract.getAddress());
  console.log(`......... sub-escrow at => ${subEscrow} ......... \n`)
  
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

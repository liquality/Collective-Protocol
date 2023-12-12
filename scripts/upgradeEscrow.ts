import { ethers, upgrades } from "hardhat";

async function main() {

  console.log(".........Upgrading RewardEscrow ......... \n")
  let upgradeContractAddress = "0x1Ec642AAF33bCc0232CD8DB1920767e2C11Ef022"
  let customEscrowFactory = await ethers.getContractFactory("CustomHoneyPotEscrow");
  let escrow =  await upgrades.upgradeProxy(upgradeContractAddress, customEscrowFactory)
  await escrow.waitForDeployment();
  let escrowAddress = await escrow.getAddress();

  let escrowImpl = await upgrades.erc1967.getImplementationAddress(escrowAddress)
  let escrowProxyAdmin = await upgrades.erc1967.getAdminAddress(escrowAddress)

  console.log(`.........RewardEscrow uphgraded at ${escrowAddress} ......... \n`)
  console.log(`.........New RewardEscrow impl deployed to ${escrowImpl} ......... \n`)
  console.log(`.........RewardEscrow proxy admin at ${escrowProxyAdmin} ......... \n`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

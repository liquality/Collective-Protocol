import { ethers, upgrades } from "hardhat";

async function main() {

    await getCWalletVerifyData()
}

async function getCollectiveVerifyData() {
    const initiator = 0xd5833B738C9ECDD12C06C78BedF16FA0788f0780
    const operator = 0x587cE1A413d47dd1B9C8a54C949016c147F18D19
    const cFactory = 0x6A4473b74c32B857848D2df5bA57e079f435cf43
    
    let contractFactory = await ethers.getContractFactory("Collective");
    console.log(" >> C Data >> ",contractFactory.interface.encodeFunctionData("initialize", [initiator, operator, cFactory]))
}

async function getCWalletVerifyData() {
    const collective = "0x0af73ad89fa9d1cdcf23f7f8faae6f0d0dc5243d"
    const operator = "0x587cE1A413d47dd1B9C8a54C949016c147F18D19"
    
    let contractFactory = await ethers.getContractFactory("CWallet");
    console.log(" >> C Wallet Data >> ",contractFactory.interface.encodeFunctionData("initialize", [collective, operator]))
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

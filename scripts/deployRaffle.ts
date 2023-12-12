
import { ethers } from "hardhat";
import { expect } from "chai";
import { Raffle__factory } from "../typechain-types/factories/contracts/customEscrow/Raffle__factory";

async function main() { 
    // deploy raffle
    console.log(`================== Deploying Raffle ===================== \n`)

    const VRFWrapperArbitrumMainnet = "0xf97f4df75117a78c1A5a0DBb814Af92458539FB4"
    const LinkTokenArbitrumMainnet = "0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39"

    const VRFWrapperMumbia = "0x99aFAf084eBA697E584501b8Ed2c0B37Dd136693"
    const LinkTokenMumbia = "0x326C977E6efc84E512bB9C30f76E30c160eD06FB"

    const VRFWrapperSepolia = "0xab18414CD93297B0d12ac29E63Ca20f515b3DB46"
    const LinkTokenSepolia = "0x779877A7B0D9E8603169DdbD7836e478b4624789"

    // const raffleFactory = await ethers.getContractFactory("Raffle")
    // const raffle = await raffleFactory.deploy(LinkTokenMumbia, VRFWrapperMumbia)
    // await raffle.waitForDeployment()

    const raffle = Raffle__factory.connect("0x6c7a179747A2D01967040DEB51Fa2774EC55F481", 
    (await ethers.getSigners())[0]) // 0x29592E6cB36B19751693D6F5970B746EB577151b(Sepolia)

    const raffleAddress = await raffle.getAddress()
    console.log(`================== Raffle deployed to ${raffleAddress} =====================`)

    // const tx1 = await raffle.enterRaffle(["0x905b4B2BE48160E5dC946CeB2dCa9Ce8DF5dDBe8","0xd5833B738C9ECDD12C06C78BedF16FA0788f0780"])
    // tx1.wait()
    console.log(`================== Raffle participants ${ ( await raffle.getParticipants())} =====================`)
    
    // setTimeout(async () => {
    //     const tx2 = await raffle.startDraw(180000)
    //     tx2.wait()
    // }, 10000);
    const tx2 = await raffle.startDraw(180000)
    tx2.wait()

    console.log(`================== Raffle winner ${ await raffle.raffleWinner()} =====================`)
   
    console.log(`================== Sending prize ${ await ethers.provider.getBalance(raffleAddress)} =====================`)
    
    // setTimeout(async () => {
   
    //     await raffle.sendPrize()

    //     console.log(`================== Raffle proze sent =====================`)
    
    // }, 10000);
    
}



// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
  
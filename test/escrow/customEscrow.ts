// import {
//     time,
//     loadFixture,
//   } from "@nomicfoundation/hardhat-toolbox/network-helpers";
//   import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
//   import { expect } from "chai";
//   import { ethers, upgrades } from "hardhat";
//   import {CustomHoneyPotEscrow__factory} from "../../typechain-types/factories/contracts/customEscrow/CustomHoneyPotEscrow__factory"
  

//     describe("CustomcustomRewardEscrow", function () {
//         async function deployCustomEscrow() {
//             const accounts = await ethers.getSigners()
//             const operator = accounts[1]
//             const topContributor = accounts[2]
//             const raffleWinner = accounts[3]

//             const escrowFactory = await ethers.getContractFactory("CustomHoneyPotEscrow")
//             const customRewardEscrow = await upgrades.deployProxy(escrowFactory, [operator.address])
//             customRewardEscrow.waitForDeployment()
//             const customRewardEscrowAddress = await customRewardEscrow.getAddress()

//             const rewardValue = ethers.parseEther("0.5")
//             const tokenContract = await ethers.deployContract("MockTokenContract", accounts[1]);
//             await tokenContract.sendVal(customRewardEscrowAddress, {value: rewardValue})

//             return {customRewardEscrowAddress, customRewardEscrow, accounts, operator, topContributor, raffleWinner, tokenContract, rewardValue}

//         }

//         //test sendReward
//         it("Should fail to send reward, if top contributor not set", async function () {
//             const { customRewardEscrowAddress, accounts, operator } = await loadFixture(deployCustomEscrow)
//             // Instantiate custom escrow
//             let customRewardEscrow = new ethers.Contract(customRewardEscrowAddress, CustomHoneyPotEscrow__factory.abi, operator)
//             await expect(customRewardEscrow.sendReward()).to.be.revertedWithCustomError(customRewardEscrow, "TopContributorNotSet()")
//         });
//         //test setTopContributor
//         it("Should not set top contributor, if not operator ", async function () {
//             const { customRewardEscrowAddress, accounts, topContributor, customRewardEscrow } = await loadFixture(deployCustomEscrow)
//             // Instantiate sub-reward escrow
//             await expect(customRewardEscrow.setTopContributor(topContributor)).to.be.revertedWithCustomError(customRewardEscrow, "UnAuthorizedOperator()")
//         });
//         it("Should set top contributor", async function () {
//             const { customRewardEscrowAddress, accounts, topContributor, operator } = await loadFixture(deployCustomEscrow)
//             // Instantiate sub-reward escrow
//             let customRewardEscrow = new ethers.Contract(customRewardEscrowAddress, CustomHoneyPotEscrow__factory.abi, operator)
//             await expect(customRewardEscrow.setTopContributor(topContributor.address)).to.emit(customRewardEscrow, "TopContributorSet")
//             expect(await customRewardEscrow.getTopContributor()).to.be.equal(topContributor.address)
//         });
//         it("Should fail to send reward, if raffle winner not set", async function () {
//             const { customRewardEscrowAddress, topContributor, operator } = await loadFixture(deployCustomEscrow)

//             let customRewardEscrow = new ethers.Contract(customRewardEscrowAddress, CustomHoneyPotEscrow__factory.abi, operator)
//             await customRewardEscrow.setTopContributor(topContributor.address)
//             await expect(customRewardEscrow.sendReward()).to.be.revertedWithCustomError(customRewardEscrow, "RaffleWinnerNotSet()")
//         });
//         it("Should send 50% reward to topeContributor, and raffle winner, and contract balance should be zero", async function () {
//             const { customRewardEscrowAddress, topContributor, raffleWinner, operator, rewardValue } = await loadFixture(deployCustomEscrow)
//             // Instantiate sub-reward escrow & set topContributor

//             let customRewardEscrow = new ethers.Contract(customRewardEscrowAddress, CustomHoneyPotEscrow__factory.abi, operator)
//             await customRewardEscrow.setTopContributor(topContributor.address)
//             await customRewardEscrow.setRaffleWinner(raffleWinner.address)

//             let contributorBal = await ethers.provider.getBalance(topContributor.address)
//             let raffleWinnerBal = await ethers.provider.getBalance(raffleWinner.address)
//             let topContributorReward =  rewardValue / 2n
            
//             let raffleReward = rewardValue - topContributorReward

//             await expect (customRewardEscrow.sendReward()).to.emit(customRewardEscrow, "RewardSent")
//             expect(ethers.provider.getBalance(customRewardEscrowAddress)).to.be.empty
//             expect(await ethers.provider.getBalance(topContributor.address)).to.be.equals(topContributorReward+contributorBal)
//             expect(await ethers.provider.getBalance(topContributor.address)).to.be.equals(raffleReward+raffleWinnerBal)
//         });
//     });
  
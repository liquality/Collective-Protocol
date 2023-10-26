import {
    time,
    loadFixture,
  } from "@nomicfoundation/hardhat-toolbox/network-helpers";
  import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
  import { expect } from "chai";
  import { ethers, upgrades } from "hardhat";
  import {RewardEscrow__factory} from "../typechain-types/factories/contracts/escrow/RewardEscrow__factory"
  
  describe("RewardEscrowFactory", function () {
    // We define a fixture to reuse the same setup in every test.
    // We use loadFixture to run this setup once, snapshot that state,
    // and reset Hardhat Network to that snapshot in every test.
    async function deployRewardEscrowFactory() {

        let accounts = await ethers.getSigners()

        // Deploy rewardEscrowFactory
        let rewardContractFactory = await ethers.getContractFactory("RewardEscrowFactory");
        let escrowFactory =  await upgrades.deployProxy(rewardContractFactory);
        await escrowFactory.waitForDeployment();
        let escrowFactoryAddress = await escrowFactory.getAddress();
        
        // Deploy moc mint contract
        let mintContract = await ethers.deployContract("MockMintContract", accounts[1]);

        // Deploys sub-reward escrow
        let rewardValue = ethers.parseEther("0.005")
        let operator = accounts[0]
        let topContributor = accounts[2].address
        await mintContract.sendVal(escrowFactoryAddress, {value: rewardValue})
        let rewardEscrowAddress = await escrowFactory.getEscrow(await mintContract.getAddress());
            
        return { escrowFactory, escrowFactoryAddress, mintContract, rewardEscrowAddress, rewardValue, topContributor, operator,accounts };
    }
    
    it("Should deploy a sub reward escrow, if no escrow exist for sender", async function () {
        
        const { escrowFactory, escrowFactoryAddress, accounts } = await loadFixture(deployRewardEscrowFactory)

        let mintContract = await ethers.deployContract("MockMintContract", accounts[1]);

        await mintContract.sendVal(escrowFactoryAddress, {value: ethers.parseEther("0.0001")})
        let subEscrowAddress = await escrowFactory.getEscrow(await mintContract.getAddress());
        let subEscrowImpl = await escrowFactory.getEscrowImplementation(subEscrowAddress);
        let subEscrowProxyAdmin  = await escrowFactory.getEscrowProxyAdmin(subEscrowAddress);

        let subEscrow = new ethers.Contract(subEscrowAddress, RewardEscrow__factory.abi, accounts[1])

        expect(await subEscrow.getOwnerContract()).to.be.equals(await mintContract.getAddress()) // expect ownercontract to be set

        expect(subEscrowAddress).to.not.be.empty // Expect to be set
        expect(subEscrowImpl).to.not.be.empty // Expect to be set
        expect(subEscrowProxyAdmin).to.not.be.empty  // Expect to be set
        expect(await ethers.provider.getBalance(subEscrowAddress)).to.be.equal(ethers.parseEther("0.0001"))
    });

    it("Should not deploy a sub reward escrow, if escrow already exist for sender", async function () {
    
        const { escrowFactory, escrowFactoryAddress, mintContract } = await loadFixture(deployRewardEscrowFactory)
        // Deploys sub-escrow
        await mintContract.sendVal(escrowFactoryAddress, {value: ethers.parseEther("0.0001")})
        let subEscrow = await escrowFactory.getEscrow(await mintContract.getAddress());
        // Should not deploy sub-escrow
        await mintContract.sendVal(escrowFactoryAddress, {value: ethers.parseEther("0.0002")})
        let subEscrow2 = await escrowFactory.getEscrow(await mintContract.getAddress());
        expect(subEscrow).to.be.equal(subEscrow2)
    });

    it("Should upgrade given sub-reward escrow to new implementation", async function () {
    
        const { escrowFactory, escrowFactoryAddress, mintContract } = await loadFixture(deployRewardEscrowFactory)

        await mintContract.sendVal(escrowFactoryAddress, {value: ethers.parseEther("0.0001")})
        let subEscrow = await escrowFactory.getEscrow(await mintContract.getAddress());
        let oldImplementation = await escrowFactory.getEscrowImplementation(subEscrow);
        // deploy new implementation
        let newImpl = await (await ethers.deployContract("RewardEscrow")).getAddress()
        // Upgrade subEscrow
        await escrowFactory.upgradeEscrowFor(mintContract, newImpl, "0x")
        // New contract values           
        let subEscrow2 = await escrowFactory.getEscrow(await mintContract.getAddress());
        let currentImplementation = await escrowFactory.getEscrowImplementation(subEscrow)

        expect(currentImplementation).to.not.be.equals(oldImplementation)
        expect(currentImplementation).to.be.equals(newImpl)
        expect(subEscrow).to.be.equals(subEscrow2) // proxy address should not change

    });

    describe("RewardEscrow", function () {
        //test sendReward
        it("Should fail to send reward, if top contributor not set", async function () {
            const { rewardEscrowAddress, accounts } = await loadFixture(deployRewardEscrowFactory)
            // Instantiate sub-reward escrow
            let subEscrow = new ethers.Contract(rewardEscrowAddress, RewardEscrow__factory.abi, accounts[1])
            await expect(subEscrow.sendReward()).to.be.revertedWithCustomError(subEscrow, "TopContributorNotSet()")
        });
        //test setTopContributor
        it("Should not set top contributor, if not operator ", async function () {
            const { rewardEscrowAddress, accounts, topContributor } = await loadFixture(deployRewardEscrowFactory)
            // Instantiate sub-reward escrow
            let subEscrow = new ethers.Contract(rewardEscrowAddress, RewardEscrow__factory.abi, accounts[1])
            await expect(subEscrow.setTopContributor(topContributor)).to.be.revertedWithCustomError(subEscrow, "UnAuthorizedOperator()")
        });
        it("Should set top contributor", async function () {
            const { rewardEscrowAddress, accounts, topContributor, operator } = await loadFixture(deployRewardEscrowFactory)
            // Instantiate sub-reward escrow
            let subEscrow = new ethers.Contract(rewardEscrowAddress, RewardEscrow__factory.abi, operator)
            await expect(subEscrow.setTopContributor(topContributor)).to.emit(subEscrow, "TopContributorSet")
            expect(await subEscrow.getTopContributor()).to.be.equal(topContributor)
        });
        it("Should empty all value in the contract to send reward", async function () {
            const { rewardEscrowAddress, accounts, rewardValue, operator, topContributor } = await loadFixture(deployRewardEscrowFactory)
            // Instantiate sub-reward escrow & set topContributor
            let subEscrow = new ethers.Contract(rewardEscrowAddress, RewardEscrow__factory.abi, operator)
            await subEscrow.setTopContributor(topContributor)
            let contributorBal = await ethers.provider.getBalance(topContributor)

            await expect (subEscrow.sendReward()).to.emit(subEscrow, "RewardSent")
            expect(ethers.provider.getBalance(rewardEscrowAddress)).to.be.empty
            expect(await ethers.provider.getBalance(topContributor)).to.be.equals(rewardValue+contributorBal)
        });
    });
  
});
  
// Write test for ../core/Collective.sol
import { ethers, upgrades } from "hardhat";
import { expect } from "chai";
import { Collective__factory } from "../typechain-types/factories/contracts/core/Collective__factory";
import { CWallet__factory } from "../typechain-types/factories/contracts/core/CWallet__factory";
import {Pool__factory} from "../typechain-types/factories/contracts/core/Pool__factory";
// import { CWallet } from "../typechain/CWallet";
import {loadFixture} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import * as crypto from "crypto";
import * as web3 from "web3";



describe("Collective", function () {
    // Create fixture to deploy collective
    async function deployCollective() {
        const accounts = await ethers.getSigners()
        const initiator = accounts[1]
        const operator = accounts[2]
        const salt = ethers.randomBytes(32);

        let contractFactory = await ethers.getContractFactory("CollectiveFactory");
        let cFactory =  await contractFactory.deploy(ethers.getAddress((process.env.ENTRY_POINT_ADDRESS as string)));
        await cFactory.waitForDeployment();
        const tx = await cFactory.createCollective(ethers.getAddress(initiator.address), ethers.getAddress(operator.address), ethers.toBigInt(salt));
        await tx.wait();
        const cFactoryAddress = await cFactory.getAddress();
        let cWalletAddress, cAddress;
        const logs = await ethers.provider.getLogs({blockHash: tx.blockHash as string})

        for (const log of logs) {
            
            if (log.address === await cFactory.getAddress() && 
            log.topics[0] === cFactory.interface.getEvent("CollectiveCreated").topicHash && log.transactionHash === tx.hash) { 
                const parsedLog = cFactory.interface.parseLog({
                    topics: log.topics.slice(),
                    data: log.data
                });
                if (parsedLog) {
                    cWalletAddress = parsedLog.args.cWallet;
                    cAddress = parsedLog.args.collective;
                }
            }
        }
        const collective = Collective__factory.connect(cAddress, accounts[0])
        const cWallet = CWallet__factory.connect(cWalletAddress, accounts[0])
        // console.log("Collective deployed at ", cWalletAddress, " cAddress >> " ,cAddress);

        // deploy MockTokenContract
        const tokenContract = await ethers.deployContract("MockTokenContract", accounts[1]); 
        await tokenContract.waitForDeployment();

        // deploy Mock HoneyPot
        const honeyPotFactory = await ethers.getContractFactory("HoneyPot");
        const honeyPotContract = await upgrades.deployProxy(honeyPotFactory, [accounts[0].address,operator.address]);

        return {initiator, operator, salt, accounts, cWalletAddress, cAddress, collective, cWallet, cFactoryAddress, tokenContract, honeyPotContract}

    }
    
    // Test that collective is deployed
    it("Should deploy Collective and collective wallet", async function () {
        const {initiator, operator, salt, accounts, cAddress, cWalletAddress,  collective, cWallet} = await loadFixture(deployCollective)
        expect(await collective.cWallet()).to.equal(cWalletAddress)
        expect(await collective.initiator()).to.equal(initiator.address)
        expect(await collective.operator()).to.equal(operator.address)
        expect(await cWallet.collective()).to.equal(cAddress)
        expect(await cWallet.operator()).to.equal(operator.address)
        expect(await cWallet.collective()).to.equal(cAddress)
    });
    // Test that collective wallet can be upgraded
    it("Should upgrade collective wallet", async function () {
        const {initiator, operator, salt, accounts, cAddress, cWalletAddress,  collective, cWallet} = await loadFixture(deployCollective)
        const newOpeartor = accounts[3].address
        
        const newCImpl = await (await ethers.getContractFactory("NewCWallet")).deploy(ethers.getAddress(process.env.ENTRY_POINT_ADDRESS as string))
        newCImpl.waitForDeployment()
        const newCWallet = CWallet__factory.connect(cWalletAddress, accounts[2])
        const upgTx = await newCWallet.upgradeToAndCall(await newCImpl.getAddress(), newCImpl.interface.encodeFunctionData("initialize", [cAddress, newOpeartor]))
        await upgTx.wait()
        expect(await cWallet.operator()).to.equal(newOpeartor)
    });
    // Test that collective can be upgraded
    it("Should upgrade collective", async function () {
        const {initiator, cFactoryAddress, salt, accounts, cAddress, cWalletAddress,  collective, cWallet} = await loadFixture(deployCollective)
        const newOpeartor = accounts[3].address
        const newCImpl = await (await ethers.getContractFactory("NewCollective")).deploy()
        newCImpl.waitForDeployment()
        const newCollective = Collective__factory.connect(cAddress, accounts[2])
        const upgTx = await newCollective.upgradeToAndCall(await newCImpl.getAddress(), newCImpl.interface.encodeFunctionData("initialize", [initiator.address, newOpeartor, cFactoryAddress]))
        upgTx.wait()

        expect(await collective.operator()).to.equal(newOpeartor)
    });
    
    // Test that collective can create pool
    it("Should create pool", async function () {
        const {initiator, cFactoryAddress, salt, accounts, cAddress, cWalletAddress,  collective, cWallet, tokenContract, honeyPotContract} = await loadFixture(deployCollective)
        // add member to collective
        const collectiveFactory = ethers.getContractFactory("CollectiveFactory")
        const newMember = accounts[5]

        const inviteId = crypto.randomBytes(16);
        const codeHash = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(["bytes16"], [inviteId]));
        // const ethSignedMessageHash = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(["string", "bytes32"], ["\x19Ethereum Signed Message:\n32", codeHash]));
        // Sign the message hash
        const inviteSig = await initiator.signMessage(ethers.toUtf8Bytes(codeHash));

        const tx = await collective.connect(newMember).joinCollective(inviteSig, inviteId)
        await tx.wait()
        const poolTx = await collective.connect(accounts[5]).createPool(await tokenContract.getAddress(), await honeyPotContract.getAddress())
        await poolTx.wait()
        let poolAddress;
        const logs = await ethers.provider.getLogs({blockHash: poolTx.blockHash as string})

        for (const log of logs) {
            
            if (log.address === await collective.getAddress() && 
            log.topics[0] === collective.interface.getEvent("PoolAdded").topicHash && log.transactionHash === poolTx.hash) { 
                const parsedLog = collective.interface.parseLog({
                    topics: log.topics.slice(),
                    data: log.data
                });
                if (parsedLog) {
                    poolAddress = parsedLog.args.pool;
                }
            }
        }
        const pool = Pool__factory.connect(poolAddress, accounts[0])
        expect(await pool.collective()).to.equal(cAddress)
        expect(await pool.poolInitiator()).to.equal(accounts[5].address)
        expect(await pool.tokenContract()).to.equal(await tokenContract.getAddress())
    });

    // Test record mint on pool
    it("Should record mint on pool", async function () {
        const {initiator, cFactoryAddress, salt, accounts, cAddress, cWalletAddress,  collective, cWallet, tokenContract, honeyPotContract} = await loadFixture(deployCollective)
        // add member to collective
        const collectiveFactory = ethers.getContractFactory("CollectiveFactory")
        const newMember = accounts[5]

        const inviteId = crypto.randomBytes(16);
        const codeHash = ethers.keccak256(new ethers.AbiCoder().encode(["bytes16"], [inviteId]));
        // const ethSignedMessageHash = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(["string", "bytes32"], ["\x19Ethereum Signed Message:\n32", codeHash]));
        // Sign the message hash
        const inviteSig = await initiator.signMessage(ethers.toUtf8Bytes(codeHash));

        const tx = await collective.connect(newMember).joinCollective(inviteSig, inviteId)
        await tx.wait()
        const poolTx = await collective.connect(accounts[5]).createPool(await tokenContract.getAddress(), await honeyPotContract.getAddress())
        await poolTx.wait()
        let poolAddress;
        const logs = await ethers.provider.getLogs({blockHash: poolTx.blockHash as string})

        for (const log of logs) {
            
            if (log.address === await collective.getAddress() && 
            log.topics[0] === collective.interface.getEvent("PoolAdded").topicHash && log.transactionHash === poolTx.hash) { 
                const parsedLog = collective.interface.parseLog({
                    topics: log.topics.slice(),
                    data: log.data
                });
                if (parsedLog) {
                    poolAddress = parsedLog.args.pool;
                }
            }
        }
        const pool = Pool__factory.connect(poolAddress, accounts[0])
        const mintTx = await pool.recordMint(ethers.utils.parseEther("100"))
        await mintTx.wait()
        expect(await pool.totalMint()).to.equal(ethers.utils.parseEther("100"))
    });

});

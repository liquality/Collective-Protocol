// Write test for ../core/Collective.sol
import { ethers, upgrades } from "hardhat";
import { expect } from "chai";
import { Collective__factory } from "../typechain-types/factories/contracts/core/Collective__factory";
import { CWallet__factory } from "../typechain-types/factories/contracts/core/CWallet__factory";
import {Pool__factory} from "../typechain-types/factories/contracts/core/Pool__factory";
import {loadFixture} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import * as ethers5 from "ethers5";
import { AddressZero } from "@ethersproject/constants";



describe("Collective", function () {
    // Create fixture to deploy collective
    async function deployCollective() {
        const accounts = await ethers.getSigners()
        const initiator = accounts[1]
        const operator = accounts[2]
        const entryPoint = accounts[3]
        const salt = ethers.randomBytes(32);

        let contractFactory = await ethers.getContractFactory("CollectiveFactory");
        let cFactory =  await contractFactory.deploy(ethers.getAddress((entryPoint.address)));
        await cFactory.waitForDeployment();
        const c = await cFactory.getCollective(ethers.getAddress(initiator.address), ethers.getAddress(operator.address), ethers.toBigInt(salt))
        console.log("getCollective ",c)
        console.log("getCWallet ",await cFactory.getCWallet(ethers.getAddress(initiator.address), ethers.getAddress(operator.address), ethers.toBigInt(salt)))
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

        return {initiator, operator, salt, accounts, cWalletAddress, cAddress, collective, cWallet, cFactoryAddress, tokenContract, honeyPotContract, entryPoint}

    }
    
    // Test that collective is deployed
    it("Should deploy Collective and collective wallet", async function () {
        const {initiator, operator, cAddress, cWalletAddress,  collective, cWallet} = await loadFixture(deployCollective)
        expect(await collective.cWallet()).to.equal(cWalletAddress)
        expect(await collective.initiator()).to.equal(initiator.address)
        expect(await collective.operator()).to.equal(operator.address)
        expect(await cWallet.collective()).to.equal(cAddress)
        expect(await cWallet.operator()).to.equal(operator.address)
        expect(await cWallet.collective()).to.equal(cAddress)
    });
    // Test that collective wallet can be upgraded
    it("Should upgrade collective wallet", async function () {
        const {accounts, cAddress, cWalletAddress,  entryPoint, cWallet} = await loadFixture(deployCollective)
        const newOpeartor = accounts[4].address
        
        const newCImpl = await (await ethers.getContractFactory("NewCWallet")).deploy(ethers.getAddress(entryPoint.address))
        newCImpl.waitForDeployment()
        const newCWallet = CWallet__factory.connect(cWalletAddress, accounts[2])
        const upgTx = await newCWallet.upgradeToAndCall(await newCImpl.getAddress(), newCImpl.interface.encodeFunctionData("initialize", [cAddress, newOpeartor]))
        await upgTx.wait()
        expect(await cWallet.operator()).to.equal(newOpeartor)
    });
    // Test that collective can be upgraded
    it("Should upgrade collective", async function () {
        const {initiator, cFactoryAddress, accounts, cAddress, collective} = await loadFixture(deployCollective)
        const newOpeartor = accounts[4].address
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
        const inviteId = ethers.randomBytes(16);
        console.log("inviteId >> ", inviteId.toString())

        // Hash the inviteId
        let messageHash = ethers5.utils.solidityKeccak256(
            ["bytes16"],
            [inviteId]
        );
        // Sign the inviteID hash to get the inviteSig from the initiator
        let messageHashBinary = ethers5.utils.arrayify(messageHash);
        let inviteSig = await initiator.signMessage(messageHashBinary);
        console.log("inviteSig >> ", inviteSig)

        const tx = await collective.connect(newMember).joinCollective(inviteSig, inviteId)
        await tx.wait()
        const poolTx = await collective.connect(accounts[5]).createPools([await tokenContract.getAddress()], [await honeyPotContract.getAddress()])
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
    // it("Should record mint on pool", async function () {
    //     const {initiator, cFactoryAddress, salt, accounts, cAddress, cWalletAddress,  collective, cWallet, tokenContract, honeyPotContract} = await loadFixture(deployCollective)
    //     // add member to collective
    //     const collectiveFactory = ethers.getContractFactory("CollectiveFactory")
    //     const newMember = accounts[5]

    //     const inviteId = crypto.randomBytes(16);
    //     const codeHash = ethers.keccak256(new ethers.AbiCoder().encode(["bytes16"], [inviteId]));
    //     // const ethSignedMessageHash = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(["string", "bytes32"], ["\x19Ethereum Signed Message:\n32", codeHash]));
    //     // Sign the message hash
    //     const inviteSig = await initiator.signMessage(ethers.toUtf8Bytes(codeHash));

    //     const tx = await collective.connect(newMember).joinCollective(inviteSig, inviteId)
    //     await tx.wait()
    //     const poolTx = await collective.connect(accounts[5]).createPool(await tokenContract.getAddress(), await honeyPotContract.getAddress())
    //     await poolTx.wait()
    //     let poolAddress;
    //     const logs = await ethers.provider.getLogs({blockHash: poolTx.blockHash as string})

    //     for (const log of logs) {
            
    //         if (log.address === await collective.getAddress() && 
    //         log.topics[0] === collective.interface.getEvent("PoolAdded").topicHash && log.transactionHash === poolTx.hash) { 
    //             const parsedLog = collective.interface.parseLog({
    //                 topics: log.topics.slice(),
    //                 data: log.data
    //             });
    //             if (parsedLog) {
    //                 poolAddress = parsedLog.args.pool;
    //             }
    //         }
    //     }
    //     const pool = Pool__factory.connect(poolAddress, accounts[0])
    //     const mintTx = await pool.recordMint(ethers.utils.parseEther("100"))
    //     await mintTx.wait()
    //     expect(await pool.totalMint()).to.equal(ethers.utils.parseEther("100"))
    // });
    describe("Collective AA Wallet", function () {
        it("Should validate userOps", async function () {
            const {cWallet, entryPoint, collective} = await loadFixture(deployCollective)
            // add member to collective
            const cWalletactory = ethers.getContractFactory("CWallet")
            const userOps = {
                callData: "0xb61d27f6000000000000000000000000e3d0718c03c52fa96f5354e07210f0cfafb117b50000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000c4c1079ea6000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000001000000000000000000000000905b4b2be48160e5dc946ceb2dca9ce8df5ddbe80000000000000000000000000000000000000000000000000000000000000001000000000000000000000000d5833b738c9ecdd12c06c78bedf16fa0788f078000000000000000000000000000000000000000000000000000000000",
                callGasLimit: "35634",
                initCode: "0x3df940dfc08b9f797c2eb99164320a5cf9be6c78ce094f8a000000000000000000000000587ce1a413d47dd1b9c8a54c949016c147f18d19000000000000000000000000627306090abab3a6e1400e9345bc60c78a8bef57000000000000000000000000000000000000000000000000000000000001d316",
                maxFeePerGas: "2250000000",
                maxPriorityFeePerGas: "1500000000",
                nonce: "0x0000000000000000000000000000000000129910e9be1baf0000000000000000",
                paymasterAndData: "0x00000f79b7faf42eebadba19acc07cd08af44789000000000000000000000000587ce1a413d47dd1b9c8a54c949016c147f18d190000000000000000000000000000000000000000000000000000000065796aa20000000000000000000000000000000000000000000000000000000065796976000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000410b3c7f37b80256d4e734d40a9c5bbeffa6b27685bed8ba6cce2a5fe25510c1296def35105792166f8f43160c117ba14f226d7d98e980835acc9b832bef27fea61c00000000000000000000000000000000000000000000000000000000000000",
                preVerificationGas: "89808",
                sender: "0x278ae7c9B3079D3456630F3A17fB73A84cE3d61c",
                signature: "0x9ab7040559abe0c01b7904862089a8aa1f82bf57f360b988637b0b0668431ed34b3df10d74efc52acf81a78fdd35b34de0c2311ea4e9299e4e1f8383265acafc1b",
                verificationGasLimit: "743629"
            }
            const tx = await cWallet.connect(entryPoint).validateUserOp(userOps, "0xa532b3e12ab625cc66f4315a5b32a4a9b32ef9ca73304002fde8596b7389ece3",0)
            await tx.wait()
            const logs = await ethers.provider.getLogs({blockHash: tx.blockHash as string})
            let signerGot = ""
            for (const log of logs) {

                if (log.address === await cWallet.getAddress() && 
                log.topics[0] === cWallet.interface.getEvent("NewSigner").topicHash && log.transactionHash === tx.hash) { 
                    const parsedLog = cWallet.interface.parseLog({
                        topics: log.topics.slice(),
                        data: log.data
                    });
                    if (parsedLog) {
                        signerGot = parsedLog.args.signer;
                        console.log("signer >> ", signerGot)
                    }
                }
            }
            expect(signerGot).to.equal("0x587cE1A413d47dd1B9C8a54C949016c147F18D19")
        });

        it("Should pass signer address from cWallet execute to collective", async function () {
            const {cWallet, entryPoint, collective, accounts, initiator} = await loadFixture(deployCollective)
            const cWalletactory = ethers.getContractFactory("CWallet")

            // Prepare joinCallective calldata
            const newMember = accounts[5]
            const inviteId = ethers.randomBytes(16);
            // Hash the inviteId
            let messageHash = ethers5.utils.solidityKeccak256(
                ["bytes16"],
                [inviteId]
            );
            // Sign the inviteID hash to get the inviteSig from the initiator
            let messageHashBinary = ethers5.utils.arrayify(messageHash);
            let inviteSig = await initiator.signMessage(messageHashBinary);
            const joinCollectiveCallData = collective.interface.encodeFunctionData("joinCollective", [inviteSig, inviteId])

            // Validate userOps, to populate currentSigner with newMember
            let newMemberSig = await newMember.signMessage(messageHashBinary);
            const userOps = {
                callData: "0xb61d27f6000000000000000000000000e3d0718c03c52fa96f5354e07210f0cfafb117b50000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000c4c1079ea6000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000001000000000000000000000000905b4b2be48160e5dc946ceb2dca9ce8df5ddbe80000000000000000000000000000000000000000000000000000000000000001000000000000000000000000d5833b738c9ecdd12c06c78bedf16fa0788f078000000000000000000000000000000000000000000000000000000000",
                callGasLimit: "35634",
                initCode: "0x3df940dfc08b9f797c2eb99164320a5cf9be6c78ce094f8a000000000000000000000000587ce1a413d47dd1b9c8a54c949016c147f18d19000000000000000000000000627306090abab3a6e1400e9345bc60c78a8bef57000000000000000000000000000000000000000000000000000000000001d316",
                maxFeePerGas: "2250000000",
                maxPriorityFeePerGas: "1500000000",
                nonce: "0x0000000000000000000000000000000000129910e9be1baf0000000000000000",
                paymasterAndData: "0x00000f79b7faf42eebadba19acc07cd08af44789000000000000000000000000587ce1a413d47dd1b9c8a54c949016c147f18d190000000000000000000000000000000000000000000000000000000065796aa20000000000000000000000000000000000000000000000000000000065796976000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000410b3c7f37b80256d4e734d40a9c5bbeffa6b27685bed8ba6cce2a5fe25510c1296def35105792166f8f43160c117ba14f226d7d98e980835acc9b832bef27fea61c00000000000000000000000000000000000000000000000000000000000000",
                preVerificationGas: "89808",
                sender: "0x278ae7c9B3079D3456630F3A17fB73A84cE3d61c",
                signature: newMemberSig,
                verificationGasLimit: "743629"
            }
            const txValidateUserOpsForNewMember = await cWallet.connect(entryPoint).validateUserOp(userOps, messageHash,0)
            await txValidateUserOpsForNewMember.wait()

            // add member to collective
            const tx = await cWallet.connect(entryPoint).execute(await collective.getAddress(), 0, joinCollectiveCallData)
            await tx.wait()
            // If all went well, newMember will be added to collective
            expect(await collective.members(newMember.address)).to.equal(true)
        });

        it("Should pass signer address from cWallet batchExecute to collective", async function () {
            const {cWallet, entryPoint, collective, accounts, initiator} = await loadFixture(deployCollective)
            const cWalletactory = ethers.getContractFactory("CWallet")

            // Prepare joinCallective calldata
            const newMember = accounts[5]
            const inviteId = ethers.randomBytes(16);
            // Hash the inviteId
            let messageHash = ethers5.utils.solidityKeccak256(
                ["bytes16"],
                [inviteId]
            );
            // Sign the inviteID hash to get the inviteSig from the initiator
            let messageHashBinary = ethers5.utils.arrayify(messageHash);
            let inviteSig = await initiator.signMessage(messageHashBinary);
            const joinCollectiveCallData = collective.interface.encodeFunctionData("joinCollective", [inviteSig, inviteId])

            // Validate userOps, to populate currentSigner with newMember
            let newMemberSig = await newMember.signMessage(messageHashBinary);
            const userOps = {
                callData: "0xb61d27f6000000000000000000000000e3d0718c03c52fa96f5354e07210f0cfafb117b50000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000c4c1079ea6000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000001000000000000000000000000905b4b2be48160e5dc946ceb2dca9ce8df5ddbe80000000000000000000000000000000000000000000000000000000000000001000000000000000000000000d5833b738c9ecdd12c06c78bedf16fa0788f078000000000000000000000000000000000000000000000000000000000",
                callGasLimit: "35634",
                initCode: "0x3df940dfc08b9f797c2eb99164320a5cf9be6c78ce094f8a000000000000000000000000587ce1a413d47dd1b9c8a54c949016c147f18d19000000000000000000000000627306090abab3a6e1400e9345bc60c78a8bef57000000000000000000000000000000000000000000000000000000000001d316",
                maxFeePerGas: "2250000000",
                maxPriorityFeePerGas: "1500000000",
                nonce: "0x0000000000000000000000000000000000129910e9be1baf0000000000000000",
                paymasterAndData: "0x00000f79b7faf42eebadba19acc07cd08af44789000000000000000000000000587ce1a413d47dd1b9c8a54c949016c147f18d190000000000000000000000000000000000000000000000000000000065796aa20000000000000000000000000000000000000000000000000000000065796976000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000410b3c7f37b80256d4e734d40a9c5bbeffa6b27685bed8ba6cce2a5fe25510c1296def35105792166f8f43160c117ba14f226d7d98e980835acc9b832bef27fea61c00000000000000000000000000000000000000000000000000000000000000",
                preVerificationGas: "89808",
                sender: "0x278ae7c9B3079D3456630F3A17fB73A84cE3d61c",
                signature: newMemberSig,
                verificationGasLimit: "743629"
            }
            const txValidateUserOpsForNewMember = await cWallet.connect(entryPoint).validateUserOp(userOps, messageHash,0)
            await txValidateUserOpsForNewMember.wait()

            // add member to collective
            const tx = await cWallet.connect(entryPoint).executeBatch([await collective.getAddress()], [], [joinCollectiveCallData])
            await tx.wait()

            // If all went well, newMember will be added to collective
            expect(await collective.members(newMember.address)).to.equal(true)
        });

        it("Should check for error", async function () {
            const {cWallet, entryPoint, collective} = await loadFixture(deployCollective)
            const mumbaiprovider = new ethers.JsonRpcProvider(process.env.MUMBAI_RPC)
            // const txHash = "0x57c501cda26e20dd2e148d471395e147bf5e9f0d5417b161beb6f803c8f7b209"
            // const logs = await mumbaiprovider.getLogs({blockHash: "0x91cafab11e3a64c262db70d51516f36cec14236d9da9ac0a370bae33c6326f69"})
            // mumbaiprovider.getRpcError()
            const abi = [{"inputs":[{"internalType":"uint256","name":"preOpGas","type":"uint256"},{"internalType":"uint256","name":"paid","type":"uint256"},{"internalType":"uint48","name":"validAfter","type":"uint48"},{"internalType":"uint48","name":"validUntil","type":"uint48"},
            {"internalType":"bool","name":"targetSuccess","type":"bool"},{"internalType":"bytes","name":"targetResult","type":"bytes"}],"name":"ExecutionResult","type":"error"},{"inputs":[{"internalType":"uint256","name":"opIndex","type":"uint256"},{"internalType":"string","name":"reason","type":"string"}],"name":"FailedOp","type":"error"},
            {"inputs":[{"internalType":"address","name":"sender","type":"address"}],"name":"SenderAddressResult","type":"error"},{"inputs":[{"internalType":"address","name":"aggregator","type":"address"}],"name":"SignatureValidationFailed","type":"error"},
            {"inputs":[{"components":[{"internalType":"uint256","name":"preOpGas","type":"uint256"},{"internalType":"uint256","name":"prefund","type":"uint256"},{"internalType":"bool","name":"sigFailed","type":"bool"},{"internalType":"uint48","name":"validAfter","type":"uint48"},
            {"internalType":"uint48","name":"validUntil","type":"uint48"},{"internalType":"bytes","name":"paymasterContext","type":"bytes"}],"internalType":"struct IEntryPoint.ReturnInfo","name":"returnInfo","type":"tuple"},{"components":[{"internalType":"uint256","name":"stake","type":"uint256"},
            {"internalType":"uint256","name":"unstakeDelaySec","type":"uint256"}],"internalType":"struct IStakeManager.StakeInfo","name":"senderInfo","type":"tuple"},{"components":[{"internalType":"uint256","name":"stake","type":"uint256"},{"internalType":"uint256","name":"unstakeDelaySec","type":"uint256"}
        ],"internalType":"struct IStakeManager.StakeInfo","name":"factoryInfo","type":"tuple"},{"components":[{"internalType":"uint256","name":"stake","type":"uint256"},{"internalType":"uint256","name":"unstakeDelaySec","type":"uint256"}],"internalType":"struct IStakeManager.StakeInfo","name":"paymasterInfo","type":"tuple"}]
        ,"name":"ValidationResult","type":"error"},{"inputs":[{"components":[{"internalType":"uint256","name":"preOpGas","type":"uint256"},{"internalType":"uint256","name":"prefund","type":"uint256"},{"internalType":"bool","name":"sigFailed","type":"bool"},{"internalType":"uint48","name":"validAfter","type":"uint48"},{"internalType":"uint48","name":"validUntil","type":"uint48"},{"internalType":"bytes","name":"paymasterContext","type":"bytes"}],"internalType":"struct IEntryPoint.ReturnInfo","name":"returnInfo","type":"tuple"},{"components":[{"internalType":"uint256","name":"stake","type":"uint256"},{"internalType":"uint256","name":"unstakeDelaySec","type":"uint256"}],"internalType":"struct IStakeManager.StakeInfo","name":"senderInfo","type":"tuple"},{"components":[{"internalType":"uint256","name":"stake","type":"uint256"},{"internalType":"uint256","name":"unstakeDelaySec","type":"uint256"}],"internalType":"struct IStakeManager.StakeInfo","name":"factoryInfo","type":"tuple"},{"components":[{"internalType":"uint256","name":"stake","type":"uint256"},{"internalType":"uint256","name":"unstakeDelaySec","type":"uint256"}],"internalType":"struct IStakeManager.StakeInfo","name":"paymasterInfo","type":"tuple"},{"components":[{"internalType":"address","name":"aggregator","type":"address"},{"components":[{"internalType":"uint256","name":"stake","type":"uint256"},{"internalType":"uint256","name":"unstakeDelaySec","type":"uint256"}],"internalType":"struct IStakeManager.StakeInfo","name":"stakeInfo","type":"tuple"}],"internalType":"struct IEntryPoint.AggregatorStakeInfo","name":"aggregatorInfo","type":"tuple"}],"name":"ValidationResultWithAggregation","type":"error"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"userOpHash","type":"bytes32"},{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":false,"internalType":"address","name":"factory","type":"address"},{"indexed":false,"internalType":"address","name":"paymaster","type":"address"}],"name":"AccountDeployed","type":"event"},{"anonymous":false,"inputs":[],"name":"BeforeExecution","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":false,"internalType":"uint256","name":"totalDeposit","type":"uint256"}],"name":"Deposited","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"aggregator","type":"address"}],"name":"SignatureAggregatorChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":false,"internalType":"uint256","name":"totalStaked","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"unstakeDelaySec","type":"uint256"}],"name":"StakeLocked","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":false,"internalType":"uint256","name":"withdrawTime","type":"uint256"}],"name":"StakeUnlocked","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":false,"internalType":"address","name":"withdrawAddress","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"StakeWithdrawn","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"userOpHash","type":"bytes32"},{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":true,"internalType":"address","name":"paymaster","type":"address"},{"indexed":false,"internalType":"uint256","name":"nonce","type":"uint256"},{"indexed":false,"internalType":"bool","name":"success","type":"bool"},{"indexed":false,"internalType":"uint256","name":"actualGasCost","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"actualGasUsed","type":"uint256"}],"name":"UserOperationEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"userOpHash","type":"bytes32"},{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":false,"internalType":"uint256","name":"nonce","type":"uint256"},{"indexed":false,"internalType":"bytes","name":"revertReason","type":"bytes"}],"name":"UserOperationRevertReason","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":false,"internalType":"address","name":"withdrawAddress","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"Withdrawn","type":"event"},{"inputs":[],"name":"SIG_VALIDATION_FAILED","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes","name":"initCode","type":"bytes"},{"internalType":"address","name":"sender","type":"address"},{"internalType":"bytes","name":"paymasterAndData","type":"bytes"}],"name":"_validateSenderAndPaymaster","outputs":[],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint32","name":"unstakeDelaySec","type":"uint32"}],"name":"addStake","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"depositTo","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"deposits","outputs":[{"internalType":"uint112","name":"deposit","type":"uint112"},{"internalType":"bool","name":"staked","type":"bool"},{"internalType":"uint112","name":"stake","type":"uint112"},{"internalType":"uint32","name":"unstakeDelaySec","type":"uint32"},{"internalType":"uint48","name":"withdrawTime","type":"uint48"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"getDepositInfo","outputs":[{"components":[{"internalType":"uint112","name":"deposit","type":"uint112"},{"internalType":"bool","name":"staked","type":"bool"},{"internalType":"uint112","name":"stake","type":"uint112"},{"internalType":"uint32","name":"unstakeDelaySec","type":"uint32"},{"internalType":"uint48","name":"withdrawTime","type":"uint48"}],"internalType":"struct IStakeManager.DepositInfo","name":"info","type":"tuple"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"sender","type":"address"},{"internalType":"uint192","name":"key","type":"uint192"}],"name":"getNonce","outputs":[{"internalType":"uint256","name":"nonce","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes","name":"initCode","type":"bytes"}],"name":"getSenderAddress","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"components":[{"internalType":"address","name":"sender","type":"address"},{"internalType":"uint256","name":"nonce","type":"uint256"},{"internalType":"bytes","name":"initCode","type":"bytes"},{"internalType":"bytes","name":"callData","type":"bytes"},{"internalType":"uint256","name":"callGasLimit","type":"uint256"},{"internalType":"uint256","name":"verificationGasLimit","type":"uint256"},{"internalType":"uint256","name":"preVerificationGas","type":"uint256"},{"internalType":"uint256","name":"maxFeePerGas","type":"uint256"},{"internalType":"uint256","name":"maxPriorityFeePerGas","type":"uint256"},{"internalType":"bytes","name":"paymasterAndData","type":"bytes"},{"internalType":"bytes","name":"signature","type":"bytes"}],"internalType":"struct UserOperation","name":"userOp","type":"tuple"}],"name":"getUserOpHash","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"components":[{"components":[{"internalType":"address","name":"sender","type":"address"},{"internalType":"uint256","name":"nonce","type":"uint256"},{"internalType":"bytes","name":"initCode","type":"bytes"},{"internalType":"bytes","name":"callData","type":"bytes"},{"internalType":"uint256","name":"callGasLimit","type":"uint256"},{"internalType":"uint256","name":"verificationGasLimit","type":"uint256"},{"internalType":"uint256","name":"preVerificationGas","type":"uint256"},{"internalType":"uint256","name":"maxFeePerGas","type":"uint256"},{"internalType":"uint256","name":"maxPriorityFeePerGas","type":"uint256"},{"internalType":"bytes","name":"paymasterAndData","type":"bytes"},{"internalType":"bytes","name":"signature","type":"bytes"}],"internalType":"struct UserOperation[]","name":"userOps","type":"tuple[]"},{"internalType":"contract IAggregator","name":"aggregator","type":"address"},{"internalType":"bytes","name":"signature","type":"bytes"}],"internalType":"struct IEntryPoint.UserOpsPerAggregator[]","name":"opsPerAggregator","type":"tuple[]"},{"internalType":"address payable","name":"beneficiary","type":"address"}],"name":"handleAggregatedOps","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"components":[{"internalType":"address","name":"sender","type":"address"},{"internalType":"uint256","name":"nonce","type":"uint256"},{"internalType":"bytes","name":"initCode","type":"bytes"},{"internalType":"bytes","name":"callData","type":"bytes"},{"internalType":"uint256","name":"callGasLimit","type":"uint256"},{"internalType":"uint256","name":"verificationGasLimit","type":"uint256"},{"internalType":"uint256","name":"preVerificationGas","type":"uint256"},{"internalType":"uint256","name":"maxFeePerGas","type":"uint256"},{"internalType":"uint256","name":"maxPriorityFeePerGas","type":"uint256"},{"internalType":"bytes","name":"paymasterAndData","type":"bytes"},{"internalType":"bytes","name":"signature","type":"bytes"}],"internalType":"struct UserOperation[]","name":"ops","type":"tuple[]"},{"internalType":"address payable","name":"beneficiary","type":"address"}],"name":"handleOps","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint192","name":"key","type":"uint192"}],"name":"incrementNonce","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes","name":"callData","type":"bytes"},{"components":[{"components":[{"internalType":"address","name":"sender","type":"address"},{"internalType":"uint256","name":"nonce","type":"uint256"},{"internalType":"uint256","name":"callGasLimit","type":"uint256"},{"internalType":"uint256","name":"verificationGasLimit","type":"uint256"},{"internalType":"uint256","name":"preVerificationGas","type":"uint256"},{"internalType":"address","name":"paymaster","type":"address"},{"internalType":"uint256","name":"maxFeePerGas","type":"uint256"},{"internalType":"uint256","name":"maxPriorityFeePerGas","type":"uint256"}],"internalType":"struct EntryPoint.MemoryUserOp","name":"mUserOp","type":"tuple"},{"internalType":"bytes32","name":"userOpHash","type":"bytes32"},{"internalType":"uint256","name":"prefund","type":"uint256"},{"internalType":"uint256","name":"contextOffset","type":"uint256"},{"internalType":"uint256","name":"preOpGas","type":"uint256"}],"internalType":"struct EntryPoint.UserOpInfo","name":"opInfo","type":"tuple"},{"internalType":"bytes","name":"context","type":"bytes"}],"name":"innerHandleOp","outputs":[{"internalType":"uint256","name":"actualGasCost","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"uint192","name":"","type":"uint192"}],"name":"nonceSequenceNumber","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"components":[{"internalType":"address","name":"sender","type":"address"},{"internalType":"uint256","name":"nonce","type":"uint256"},{"internalType":"bytes","name":"initCode","type":"bytes"},{"internalType":"bytes","name":"callData","type":"bytes"},{"internalType":"uint256","name":"callGasLimit","type":"uint256"},{"internalType":"uint256","name":"verificationGasLimit","type":"uint256"},{"internalType":"uint256","name":"preVerificationGas","type":"uint256"},{"internalType":"uint256","name":"maxFeePerGas","type":"uint256"},{"internalType":"uint256","name":"maxPriorityFeePerGas","type":"uint256"},{"internalType":"bytes","name":"paymasterAndData","type":"bytes"},{"internalType":"bytes","name":"signature","type":"bytes"}],"internalType":"struct UserOperation","name":"op","type":"tuple"},{"internalType":"address","name":"target","type":"address"},{"internalType":"bytes","name":"targetCallData","type":"bytes"}],"name":"simulateHandleOp","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"components":[{"internalType":"address","name":"sender","type":"address"},{"internalType":"uint256","name":"nonce","type":"uint256"},{"internalType":"bytes","name":"initCode","type":"bytes"},{"internalType":"bytes","name":"callData","type":"bytes"},{"internalType":"uint256","name":"callGasLimit","type":"uint256"},{"internalType":"uint256","name":"verificationGasLimit","type":"uint256"},{"internalType":"uint256","name":"preVerificationGas","type":"uint256"},{"internalType":"uint256","name":"maxFeePerGas","type":"uint256"},{"internalType":"uint256","name":"maxPriorityFeePerGas","type":"uint256"},{"internalType":"bytes","name":"paymasterAndData","type":"bytes"},{"internalType":"bytes","name":"signature","type":"bytes"}],"internalType":"struct UserOperation","name":"userOp","type":"tuple"}],"name":"simulateValidation","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"unlockStake","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address payable","name":"withdrawAddress","type":"address"}],"name":"withdrawStake","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address payable","name":"withdrawAddress","type":"address"},{"internalType":"uint256","name":"withdrawAmount","type":"uint256"}],"name":"withdrawTo","outputs":[],"stateMutability":"nonpayable","type":"function"},{"stateMutability":"payable","type":"receive"}]
            new ethers.Contract(entryPoint.address, abi, mumbaiprovider)

            // const receipt = await mumbaiprovider.getTransactionReceipt(txHash);
            // console.log("receipt >> ", receipt)

            // mumbaiprovider.getLogs

            // console.log("logs >> ", logs, " mumbai >> ", process.env.MUMBAI_RPC)
            for (const log of logs) {
                console.log("came to log >> ", log.address)
                // log.address === "0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789" && 
                if (log.address === "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789" && 
                 log.transactionHash === "0x57c501cda26e20dd2e148d471395e147bf5e9f0d5417b161beb6f803c8f7b209") { 
                    // const theError = collective.interface.getError(log.topics[0])
                    // console.log("theError >> ", theError)
                    // const theEvent = collective.interface.parseError(log.topics[0])
                    // console.log("theEvent >> ", theEvent)
                console.log("logs >> ", log.)
                }
            }
        });

    });

});

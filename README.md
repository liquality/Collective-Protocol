
<div align="center">
  <h1 style="color: blue;" ><u> 🤼 Collective protocol</u></h1>
</div>


Welcome to the Collective Protocol, this protocol provides a foundation for building applications that require collective decision-making and resource management, making it easier for communities to collaborate effectively and transparently in the decentralized ecosystem. 

A collective is a new onchain primitive that allows informal groups of people to act together onchain through their own individual wallets. This maintains the flexibility of individual decision making, while still allowing the group to benefit from their collective buying power

<br></br>

## Features 

### Dynamic Group Formation: 
Create and manage fluid and flexible collective groups.

### Collective Smart Wallets:
Utilize account abstracted smart contracts for managing collective funds with programmable capabilities.

### Modular Components: 
Incorporate various modules such as governance, conditional memberships, bonding curves, and more.

### Ephemeral Pools: 
Implement pools for specific projects or goals with a clear lifecycle.

### Decentralized Governance: 
Facilitate decentralized decision-making within groups with minimal and flexible governance structures.

### Integration Friendly: 
Designed to be compatible with various DeFi and other blockchain platforms.


<br></br>

## What Makes Collectives Different from DAOs

### Simplified Governance: 
Enjoy the benefits of collective action without the complexity of traditional DAO structures.

### Token-Free Operation: 
Operate without the need for native tokens, removing barriers to entry and participation.

### Focused on Practical Use: 
Designed for real-world applications and streamlined group collaboration.


<br></br>

## Use Cases

### Community Funds: 
Enable communities like online forums or social networks to establish wallets for supporting internal projects or initiatives, with member-driven fund allocation.

### Online Communities and Forums: 
Integrate with platforms like Reddit, Discord, or Telegram to allow community members to manage funds and support community-driven projects collectively.

### Group Competitions - PvP -> GvG
- Investing with friends
- Collective market making (e.g Uniswap pools for new coin)
- Running infra with large entry fee (e.g CowSwap solvers, Thorchain bond)
- DeFi rewards (e.g staking collectives)
- Honey pots (creator / collector alignment)

### Individuals borrowing from experts
- Funds
Influencer / follower pools

### group affiliate programs

<br></br>

## Experimentations

### Clash of Channels
Warpcast's first-ever multiplayer channel game! Active casters from 16 Warpcast channels answer daily questions to win a channel vs. channel knock-out clash. This game utilizes collectives for group tracking and reward distribution.
### How are channels able to act together to win?
- Liquality’s Clash-of-Channels turns every Warpcast channel into a collective, allowing channel members to work together onchain towards a common goal (in this case, win $10k), while still keeping individual flexibility to participate on their own terms. Read more <a href="https://liqualityio.notion.site/Clash-of-Channels-3f5d8dd5351a48549e5fc2f95f46d903?pvs=4" target="_blank" >here </a>

### Meme Amplifier Machine
Using our learnings from Clash of Channels, where we got ~2,000 casters from 16 FC channels to play as a collective for their channel, we created a tool to align community members’ incentive to spread the meme of their community. 
Here’s how it works:
1.  Casters input a meme and choose their community on our meme mint frame generator 
2. They cast their mint frame far and wide 
3. Revenue generated from mints is split 50/50 between the caster and the community’s treasury 
Read more about Meme amplifier <a href="meme-amplifier-machine.liquality.io" target="_blank" > here </a>


<br></br>

## Deployed Addresses:
```
  GOERLI {
      collectiveFactory: '0xdA23889B4D12dE56b5C1E118Ae63F099b03a9086',
      honeyPotFactory: '0xce3795B42857bE44cF8a384c8b50246FB7CaC691',
    
  },
  POLYGON {
      collectiveFactory: '0x9E4440EDFc8AebB30A5501F7a55EDe296BC2fb38',
      honeyPotFactory: '0xF99E8F24BAD50CE6b0098205adcD6cD01e66AC4F',
    
  },
  ARBITRUM {
    collectiveFactory: '0xCfC03cA81380338703860238d0d6caD552232877',
    honeyPotFactory: '0xc2b5189c3D5be89147780591A92a374c7d69D3D3',
   
  },
  BASE {
    collectiveFactory: '0xc2b5189c3D5be89147780591A92a374c7d69D3D3',
    honeyPotFactory: '0x6fF619e8856F737d58cAf03871Cb3637C6Ed3308',
   
  },
  OPTIMISM {
    collectiveFactory: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
    honeyPotFactory: '0x00F58322E0c66BFFb613DbC2D38b5275A0Fc7d2f',
   
  },
  ZORA {
    collectiveFactory: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
    honeyPotFactory: '0x00F58322E0c66BFFb613DbC2D38b5275A0Fc7d2f',
   
  },
  SEPOLIA {
    collectiveFactory: '0x6f8892FBeAc884Bd3674Eeeafc7A059B70A75430',
    honeyPotFactory: '0x00F58322E0c66BFFb613DbC2D38b5275A0Fc7d2f',
  }
  ```

<br></br>

# Contract Specification

The main implementation of the Collective protocol, includes the following contracts, as found in the core folder, under contracts :

#### Collective Contract: 
This contract is the main entry point for the Collective. It implements core collective functionalities and also includes a minimal AA (Account Abstraction) account.

#### CWallet Contract: 
The CWallet contract is an advanced wallet implementation with features such as single signer operations, support for account abstraction, whitelisted target addresses, and reward handling. It integrates with the Collective and EntryPoint contracts to provide flexible and secure wallet operations, and it is the gateway to external contract / protocol interaction for the collective, this is how the collective maintains a single identity.

#### HoneyPot: 
The HoneyPot contract is an upgradeable contract designed to handle reward distribution for any reward mechanism the collective chooses to run. It includes mechanisms for setting the top contributor / reward winner, receiving rewards, and sending rewards to the top contributor. The contract utilizes OpenZeppelin's upgradeable and security libraries to ensure safe and efficient operations.

#### Pool: 
The Pool smart contract is designed to manage contributions, rewards distribution, and fund withdrawals for a collective. The contract includes functionality for recording contributions, distributing rewards based on contributions, and managing the pool's state. It utilizes OpenZeppelin's Pausable and ReentrancyGuard for added security and flexibility.

#### And the main entry points for usage of the Collective protocol are as listed below :

- CollectiveFactory
- EscrowFactory
- HoneyPotFactory

These contracts are where to get started, if you're lookign to get started with the Collective Protocol

## Collective Factory
The CollectiveFactory contract is responsible for creating and deploying Collective and CWallet (Collective Wallet) contracts using the ERC1967 proxy pattern and the Create2 openzeppelin library. It provides functions to create and calculate the addresses of Collective and CWallet contracts based on the provided parameters.

### Usage
To use the CollectiveFactory contract, you need to deploy it first, passing the IEntryPoint contract address as a constructor argument. After deployment, developers can interact with the contract's functions to create and manage Collective and CWallet contracts.

Here's an example of how to create a Collective and CWallet contract using the CollectiveFactory:

```
Import the necessary contracts and interfaces
import "./CollectiveFactory.sol";

// Deploy the CollectiveFactory contract
CollectiveFactory collectiveFactory = new CollectiveFactory(entryPoint);

// Set the parameters for creating a Collective and CWallet
address initiator = ...; // Address of the initiator account
address operator = ...; // Address of the operator account, this is the person setting up the collective
uint256 salt = ...; // A unique salt value

// Create the Collective contract
collectiveFactory.createCollective(initiator, operator, salt);

// Get the address of the created Collective contract
address collectiveAddress = collectiveFactory.getCollective(initiator, operator, salt);

// Create the CWallet contract
address cWalletAddress = collectiveFactory.createWallet(initiator, operator, salt);
```

## EscrowFactory
This is the main factory contract that manages the deployment and upgrade of `HoneyPot` escrow contracts using Transparent Proxies.The HoneyPot contract represents the escrow logic. It needs to be initialized with the owner contract address and the factory owner address.

### Usage
```
const { ethers, upgrades } = require("hardhat");

async function main() {
  // Deploy EscrowFactory
  const EscrowFactory = await ethers.getContractFactory("EscrowFactory");
  const escrowFactory = await upgrades.deployProxy(EscrowFactory, [], { initializer: "initialize" });
  await escrowFactory.deployed();
  console.log("EscrowFactory deployed to:", escrowFactory.address);

  // Create an escrow by sending funds
  const [deployer] = await ethers.getSigners();
  const tx = await deployer.sendTransaction({
    to: escrowFactory.address,
    value: ethers.utils.parseEther("1.0"), // Amount to send
  });
  await tx.wait();
  console.log("Funds sent and escrow created.");

  // Retrieve escrow address
  const escrowAddress = await escrowFactory.getEscrow(deployer.address);
  console.log("Escrow Address:", escrowAddress);

  // Deploy new implementation
  const NewHoneyPot = await ethers.getContractFactory("NewHoneyPot");
  const newImplementation = await NewHoneyPot.deploy();
  await newImplementation.deployed();
  console.log("New implementation deployed to:", newImplementation.address);

  // Upgrade escrow to new implementation
  const data = newImplementation.interface.encodeFunctionData("initialize", [deployer.address, deployer.address]);
  await escrowFactory.upgradeEscrowFor(deployer.address, newImplementation.address, data);
  console.log("Escrow upgraded to new implementation.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

```

Replace <EscrowFactory_Address> with the actual deployed address of your EscrowFactory contract.

## HoneyPotFactory
The EscrowFactory contract is designed to create and manage escrow contracts. This factory contract uses upgradeable proxies to ensure that the escrow contracts can be upgraded in the future without losing state. This section provides an overview of the contract's functionality, structure, and how to interact with it.

### Usage
```
const { ethers } = require("hardhat");

async function main() {
  // Deploy HoneyPotFactory
  const HoneyPotFactory = await ethers.getContractFactory("HoneyPotFactory");
  const honeyPotFactory = await HoneyPotFactory.deploy();
  await honeyPotFactory.deployed();
  console.log("HoneyPotFactory deployed to:", honeyPotFactory.address);

  // Define operator and salt
  const operator = "0xYourOperatorAddress";
  const salt = ethers.utils.id("unique_salt_value");  // Use a unique salt value

  // Create HoneyPot
  const tx = await honeyPotFactory.createHoneyPot(operator, salt);
  await tx.wait();
  console.log("HoneyPot created.");

  // Retrieve HoneyPot address
  const honeyPotAddress = await honeyPotFactory.getHoneyPot(operator, salt);
  console.log("HoneyPot Address:", honeyPotAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

```

Replace <HoneyPotFactory_Address> and <operator_address> with the actual deployed address of your HoneyPotFactory contract and the operator address respectively. Use a unique salt value for each HoneyPot you create.
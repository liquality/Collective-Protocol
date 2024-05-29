
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


# Contract Specification

# Collective Factory
The CollectiveFactory contract is responsible for creating and deploying Collective and CWallet (Collective Wallet) contracts using the ERC1967 proxy pattern and the Create2 openzeppelin library. It provides functions to create and calculate the addresses of Collective and CWallet contracts based on the provided parameters.

### Function Definitions


### Usage
To use the CollectiveFactory contract, developers need to deploy it first, passing the IEntryPoint contract address as a constructor argument. After deployment, developers can interact with the contract's functions to create and manage Collective and CWallet contracts.
<br>
Here's an example of how to create a Collective and CWallet contract using the CollectiveFactory:

```// Import the necessary contracts and interfaces
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
address cWalletAddress = collectiveFactory.createWallet(initiator, operator, salt);```

## Collective Contract
This contract is the main entry point for the Collective. It implements core collective functionalities and also includes a minimal AA (Account Abstraction) account.

### Function Definitions
```initialize(address theInitiator, address theOperator, address theFactory)```
Initializes the contract with the following parameters:

```theInitiator```: The address of the initiator (creator) of the Collective.
```theOperator```: The address of the operator (manager) of the Collective.
```theFactory```: The address of the factory contract that created this Collective.

This function sets the initial values for operator, initiator, collectiveFactory, and adds the initiator as the first member of the Collective.

```setWallet(address theWallet)```
Sets the address of the Collective's wallet (cWallet) to the provided theWallet address. This function can only be called by the collectiveFactory contract.

```joinCollective(bytes calldata _inviteSig, bytes16 _inviteId)```
Allows a new member to join the Collective by providing a valid invitation signature (_inviteSig) and invitation ID (_inviteId). The function verifies the signature and the signer's membership before adding the new member to the Collective.

```leaveCollective()```
Allows a member to leave the Collective by removing their membership.

```removeMember(address _member)```
Allows the initiator to remove a member from the Collective.

```createPools(address[] calldata _tokenContracts, address[] calldata _honeyPots)```
Allows a member to create new pools by providing an array of token contract addresses (_tokenContracts) and an array of corresponding "honeyPot" addresses (_honeyPots). The function deploys a new Pool contract for each pair of token contract and honeyPot address, and whitelists the necessary addresses in the Collective's wallet.

```recordPoolMint(address _pool, address _participant, uint256 _tokenID, uint256 _quantity, uint256 _amountPaid)```
Records a mint event in the specified _pool for the given _participant, _tokenID, _quantity, and _amountPaid. This function can only be called by the Collective's wallet (cWallet).

```receivePoolReward(address _honeyPot)```
Receives a reward for the pool associated with the provided _honeyPot address. The function forwards the received ETH to the corresponding pool contract and emits a RewardForwarded event.

```renounceOperator()```
Allows the current operator to renounce their role as the operator of the Collective.

```whitelistTargets(address[] calldata _targets)```
Allows the operator to whitelist an array of target addresses in the Collective's wallet.

```blacklistTargets(address[] calldata _targets)```
Allows the operator to blacklist an array of target addresses in the Collective's wallet.
Internal Functions

```_requireFromMembers(address caller)```: 
Internal function to check if the caller is a member of the Collective.

```_requireFromInitiator()```: 
Internal function to check if the caller is the initiator of the Collective.

```_requireFromAuthorizedOperator()```: 
Internal function to check if the caller is the authorized operator of the Collective.

```getCaller(): ```
Internal function to retrieve the actual caller address, handling the case where the call is made through the Collective's wallet (cWallet).

```recoverSigner(bytes calldata _inviteSig, bytes16 _inviteId)```
Internal function to recover the signer address from the provided invitation signature (_inviteSig) and invitation ID (_inviteId).


## Collective Wallet
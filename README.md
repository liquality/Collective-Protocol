
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

# Contract Specification

## Collective Contract
This contract is the main entry point for the Collective. It implements core collective functionalities and also includes a minimal AA (Account Abstraction) account.

### Function Specifications
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
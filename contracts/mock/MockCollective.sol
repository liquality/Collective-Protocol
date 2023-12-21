// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;


/* solhint-disable avoid-low-level-calls */
/* solhint-disable no-inline-assembly */
/* solhint-disable reason-string */

import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

import "../extensions/AA/BaseAccount.sol";
import "../interfaces/AA/IEntryPoint.sol";
import "../interfaces/ICWallet.sol";
import "../interfaces/ICollective.sol";
import "../interfaces/IPool.sol";
import "../core/Pool.sol";


/**
  * @title Collective contract
  * @author Liquality
  * @notice This contract is the main entry point for the Collective
  * @dev This contract along with the core collective functionalities, also implements a minimal AA account
         this is sample minimal account has execute, eth handling methods, and a single signer that can send 
         requests through the entryPoint.
*/
contract NewCollective is ICollective, UUPSUpgradeable, Initializable {
    using MessageHashUtils for bytes32;
    using ECDSA for bytes32;
    /* ======================= STORAGE ====================== */

    /*  STORAGE: 
        VARIABLES - PRIVATE & INTERNAL  */
    uint8 constant internal version = 2;
    struct PoolData {
        address id;
        address tokenContract;
    }
    mapping(address => bool) public members; 
    mapping(address => PoolData) public pools; // Mapping of honeyPot addresses to pool
    mapping(bytes16 => bool) public inviteIds; // Mapping of inviteIds to bool
    // Contract specific information
    address internal collectiveFactory;
    address public initiator;
    address public operator;
    address public cWallet;



    /* ======================= METHODS ====================== */
    // Implement all methods from ICollective interface

    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev The _entryPoint member is immutable, to reduce gas consumption.  To upgrade EntryPoint,
     * a new implementation of Collective contract must be deployed with the new EntryPoint address, then upgrading
      * the implementation by calling `upgradeTo()`
     */
    function initialize(address theInitiator, address theOperator, address theFactory) public virtual reinitializer(version) {
        _initialize(theInitiator, theOperator, theFactory);
    }

    function _initialize(address theInitiator, address theOperator, address theFactory) internal virtual {
        operator = theOperator;
        initiator = theInitiator;
        collectiveFactory = theFactory;
        members[theInitiator] = true;
        emit NewMember(theInitiator);
        emit CollectiveInitialized(theInitiator, theOperator);
    }

    function setWallet(address theWallet) external {
        require(msg.sender == collectiveFactory, "Collective__setWallet: Not_Factory");
        cWallet = theWallet;
    }

    function _authorizeUpgrade(address newImplementation) internal view override {
        (newImplementation);
        _requireFromAuthorizedOperator();
    }

    /* --------------------------- WRITE METHODS ------------------------------- */


    // solhint-disable-next-line no-empty-blocks
    receive() external payable {}
    
    function joinCollective(bytes calldata _inviteSig, bytes16 _inviteId) external {
        address _newMember = getCaller();
        // Check if inviteId is valid
        if (inviteIds[_inviteId]) {
            revert Collective__NoValidInvite(_newMember, _inviteId);
        }
        // Check if the signature is valid and signed by an existing member
        address signer = recoverSigner(_inviteSig, _inviteId);
        if (!members[signer]) {
            revert Collective__NoValidInvite(_newMember, _inviteId);
        }
        // Join the collective
        members[_newMember] = true;
        emit NewMember(_newMember);
    }

    function leaveCollective() external {
        // get signer from calldata
        address _member = getCaller();
        members[_member] = false;
        emit MemberRemoved(_member);
    }

    function removeMember(address _member) external {
        _requireFromInitiator();
        members[_member] = false;
        emit MemberRemoved(_member);
    }

    function createPools(address[] calldata _tokenContracts, address[] calldata _honeyPots) external {
        _requireFromMembersOrWallet();
        if (_tokenContracts.length != _honeyPots.length) {
            revert Collective_MitMatchedLength(_tokenContracts.length, _honeyPots.length);
        } 
        for (uint i = 0; i < _tokenContracts.length; i++) {
            address _tokenContract = _tokenContracts[i];
            address _honeyPot = _honeyPots[i];

            address poolAddress = address(new Pool(_tokenContract, getCaller()));
            pools[_honeyPot] = PoolData(poolAddress, _tokenContract);
            address[] memory addressesToWhitelist = new address[](3);
            addressesToWhitelist[0] = poolAddress;
            addressesToWhitelist[1] = _tokenContract;
            addressesToWhitelist[2] = _honeyPot;
            ICWallet(cWallet).whitelistTargets(addressesToWhitelist);
            emit PoolAdded(poolAddress, _tokenContract, _honeyPot, getCaller());
        }
    }

    function receivePoolReward(address _honeyPot) external payable returns (bool) {
        if (pools[_honeyPot].id != address(0)) {
            revert Collective__PoolNotAdded(pools[_honeyPot].id);
        }
        address payable poolAddress = payable(pools[_honeyPot].id); 
        (bool success, ) = poolAddress.call{value: msg.value}("");
        if (!success) {
            revert Collective__PoolRewardNotSent(poolAddress, _honeyPot, msg.value);
        }
        // Pool(poolAddress).pause();
        emit RewardForwarded(pools[_honeyPot].id, _honeyPot, msg.value, pools[_honeyPot].tokenContract);
        return true;
    }

    function recordPoolMint(address _pool, address _participant, uint256 _tokenID, uint256 _quantity, uint256 _amountPaid)
    external {
        Pool(payable(_pool)).recordMint(_participant, _tokenID, _quantity, _amountPaid);
    }

    function renounceOperator() external {
        _requireFromAuthorizedOperator();
        delete operator;
        emit OperatorRenounced(msg.sender);
    }

    function whitelistTargets(address[] calldata _targets) external {
        _requireFromAuthorizedOperator();
        ICWallet(cWallet).whitelistTargets(_targets);
    }

    function blacklistTargets(address[] calldata _targets) external {
        _requireFromAuthorizedOperator();
        ICWallet(cWallet).blacklistTargets(_targets);
    }

    /* ------------------------------ READ METHODS ---------------------------- */

    function _requireFromMembersOrWallet() internal view {
        if (msg.sender == cWallet && !members[getCaller()]) {
            revert Collective__OnlyMember(msg.sender);
        }
        if (!members[msg.sender]) {
            revert Collective__OnlyMember(msg.sender);
        }
    }

    function _requireFromInitiator() internal view {
        if (getCaller() != initiator) {
            revert Collective__OnlyInitiator(msg.sender);
        }
    }

    function _requireFromAuthorizedOperator() internal view  {
        if (operator != msg.sender) {
            revert Collective__OnlyOperator(msg.sender);
        }
    }

    function getCaller() internal view returns (address) {
        address caller;
        if (msg.sender == cWallet) {
            bytes calldata data = msg.data;
            require(data.length >= 20, "Data is too short");
            // Extract the last 20 bytes from the data to decode the address
            bytes calldata last20Bytes = data[data.length - 20:];
            caller = abi.decode(last20Bytes, (address));
        } else {
            caller = msg.sender;
        }
        return caller;
    }

    function recoverSigner(bytes calldata _inviteSig, bytes16 _inviteId) internal pure returns (address) {
        // Create a hash of the data to be signed
        bytes32 hash = keccak256(abi.encodePacked(_inviteId));
        bytes32 ethSignedHash = hash.toEthSignedMessageHash();
        // Recover the signer from the signature
        return ethSignedHash.recover(_inviteSig);
    }

}
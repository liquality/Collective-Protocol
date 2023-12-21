// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;


import "../core/HoneyPot.sol";
import {ITransparentProxy, TransparentProxy} from "../external/TransparentProxy.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {ITransparentUpgradeableProxy} from "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
import "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";

contract EscrowFactory is Initializable, OwnableUpgradeable {

    error SendToEscrowFailed();

    event FundReceipt(address indexed sender, address indexed recipient);
    event EscrowDeployed(address indexed owner, address indexed escrow);
    event EscrowUpgraded(address indexed oldImplementation, address indexed newImplementation);

    mapping(address => address ) internal escrowProxies; //mint splitter address to sub escrow proxy
    mapping(address => address ) internal escrowImplementations; // Proxy to implementation address
    mapping(address => address ) internal proxyAdmins; // Proxy to proxy admin

    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public payable initializer {
        __Ownable_init(msg.sender);
    }


    receive() external payable {
        // Check if sending address already has escrow created
        address payable escrow = payable(escrowProxies[msg.sender]);
        if (escrow == address(0)) {
            escrow = payable(createSubEscrow(msg.sender));
        } else {
            // subEscrow exists, send funds to subEscrow
            (bool success, ) = escrow.call{value: msg.value}("");
            if (!success) {
                revert SendToEscrowFailed();
            }
        }
        emit FundReceipt(msg.sender, escrow);
    }

    function createSubEscrow(address _ownerContract) internal returns (address) {
        // Deploying escrow logic contract
        address implementation = address(new HoneyPot());

        // Escrow logic contract initializer data
        bytes4 initializeSignature = bytes4(keccak256("initialize(address,address)"));
        bytes memory data = abi.encodeWithSelector(initializeSignature, _ownerContract, owner());

        // Deploying Transparent proxy
        address escrowProxy = address(new TransparentProxy(
            address(implementation),
            address(this),
            data
        ));
        (bool success, ) = payable(escrowProxy).call{value: msg.value}("");
        if (!success) {
            revert SendToEscrowFailed();
        }

        escrowProxies[_ownerContract] = escrowProxy;
        escrowImplementations[escrowProxy] = implementation;
        proxyAdmins[escrowProxy] = ITransparentProxy(escrowProxy).getProxyAdmin();

        emit EscrowDeployed(_ownerContract, escrowProxy);
        return escrowProxy;
    }

    function upgradeEscrowFor(address _ownerContract, address newImplementation, bytes memory data) external onlyOwner {
        address escrowProxy = escrowProxies[_ownerContract];
        address proxyAdminAddress = proxyAdmins[escrowProxy];
        address oldImplementation = escrowImplementations[escrowProxy];

        ProxyAdmin(proxyAdminAddress).upgradeAndCall(ITransparentUpgradeableProxy(escrowProxy), newImplementation, data);
        escrowImplementations[escrowProxy] = newImplementation;
        emit EscrowUpgraded(oldImplementation, newImplementation);
    }

    function getEscrow(address _ownerContract) public view returns (address) {
        return escrowProxies[_ownerContract];
    }

    function getEscrowImplementation(address _escrow) public view returns(address) {
        return escrowImplementations[_escrow];
    }

    function getEscrowProxyAdmin(address _escrow) public view returns(address) {
        return proxyAdmins[_escrow];
    }                                            
}
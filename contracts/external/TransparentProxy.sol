// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {ITransparentUpgradeableProxy, TransparentUpgradeableProxy} from "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";

interface ITransparentProxy is ITransparentUpgradeableProxy {
    function getProxyAdmin() external returns(address);
}

contract TransparentProxy is  TransparentUpgradeableProxy {

    constructor(address _logic, address initialOwner, bytes memory _data) payable TransparentUpgradeableProxy(_logic, initialOwner, _data) {}

    function getProxyAdmin() public returns (address) {
        return _proxyAdmin();
    }
}
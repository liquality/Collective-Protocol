// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "../core/HoneyPot.sol";
import "@openzeppelin/contracts/utils/Create2.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract HoneyPotFactory {

    event HoneyPotCreated(address indexed honeyPot, address indexed operator);

    HoneyPot public immutable honeyPotImplementation;

    constructor() {
        honeyPotImplementation = new HoneyPot();
    }

    /**
     * create an account, and return its address.
     * returns the address even if the account is already deployed.
     */
    function createHoneyPot(address _operator, uint256 _salt) public returns (address) {
        address honeyPotAddr = getHoneyPot(_operator, _salt);
        uint codeSize = honeyPotAddr.code.length;

        if (codeSize <= 0) {
            HoneyPot honeyPot = HoneyPot(payable(new ERC1967Proxy{salt : bytes32(_salt)}(
                address(honeyPotImplementation),
                abi.encodeCall(HoneyPot.initialize, (_operator))
            )));
            honeyPotAddr = address(honeyPot);
            emit HoneyPotCreated(honeyPotAddr, _operator);

        }
        return honeyPotAddr;
    }

    /**
     * calculate the counterfactual address of the collective as it would be returned by createCollective()
     */
    function getHoneyPot(address _operator, uint256 _salt) public view returns (address) {
        return Create2.computeAddress(bytes32(_salt), keccak256(abi.encodePacked(
                type(ERC1967Proxy).creationCode,
                abi.encode(
                address(honeyPotImplementation),
                abi.encodeCall(HoneyPot.initialize, (_operator))
                )
        )));
    }

}
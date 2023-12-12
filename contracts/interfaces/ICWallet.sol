// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

interface ICWallet {

    // interface for whitelistTargets function in CWallet.sol
    function whitelistTargets(address[] calldata theTargets) external;
    // interface for removeWhitelist function in CWallet.sol
    function blacklistTargets(address[] calldata theTargets) external;
    // interface for withdrawNative function in CWallet.sol
    function withdrawNative(address payable recipient, uint256 amount) external;

}
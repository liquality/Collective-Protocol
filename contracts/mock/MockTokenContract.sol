// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "../external/I0xSplit.sol";


contract MockTokenContract {

    function sendVal(address recipient) external payable {
        (bool success, ) = recipient.call{value: msg.value}("");
        require(success, "failed to send");
    }

    // function forwardval(address splitter, address recipient, uint256 withdrawETH, ERC20[] calldata tokens) 
    // external {
    //     I0xSplit(splitter).withdraw(recipient);
    // }

    // function getThirdPartyBal(address _recipient) public view returns (uint256) {
    //     I0xSplit(splitter).getETHBalance(recipient);
    // }
                                                      
}
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;


contract MockMintContract {

    function sendVal(address recipient) external payable {
        (bool success, ) = recipient.call{value: msg.value}("");
        require(success, "failed to send");
    }
                                                      
}
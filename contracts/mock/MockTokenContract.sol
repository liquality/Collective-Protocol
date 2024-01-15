// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "hardhat/console.sol";

contract MockTokenContract is ERC721("MockTokenContract", "MTC") {
    uint256 tokenId = 0;

    // function sendVal(address recipient) external payable {
    //     (bool success, ) = recipient.call{value: msg.value}("");
    //     require(success, "failed to send");
    // }

    function mint(address recipient) external payable {
        console.log(" came to MockTokenContract.mint");
        require(msg.value > 0, "failed to send");
        tokenId += 1;
        _mint(recipient, tokenId);
        console.log(" minted");
    }

    function forwardval(address payable recipient) 
    external {
        (bool success, ) = recipient.call{value: address(this).balance}("");
        require(success, "failed to send");
    }

    // function getThirdPartyBal(address _recipient) public view returns (uint256) {
    //     I0xSplit(splitter).getETHBalance(recipient);
    // }
                                                      
}
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "hardhat/console.sol";

contract MockTokenContract is ERC721("MockTokenContract", "MTC") {

    // function sendVal(address recipient) external payable {
    //     (bool success, ) = recipient.call{value: msg.value}("");
    //     require(success, "failed to send");
    // }

    function mint(address recipient, uint256 tokenId) external payable {
        console.log(" came to MockTokenContract.mint");
        _mint(recipient, tokenId);
        console.log(" minted");
    }

    // function forwardval(address splitter, address recipient, uint256 withdrawETH, ERC20[] calldata tokens) 
    // external {
    //     I0xSplit(splitter).withdraw(recipient);
    // }

    // function getThirdPartyBal(address _recipient) public view returns (uint256) {
    //     I0xSplit(splitter).getETHBalance(recipient);
    // }
                                                      
}
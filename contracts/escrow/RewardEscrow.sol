// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

contract RewardEscrow is Initializable, ReentrancyGuardUpgradeable {

    address payable internal topContributor;
    address internal ownerContract;

    event RewardReceived(uint256 value);

    error TopContributorNotSet();
    error RewardFailedToSend(address);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    receive() external payable {
        emit RewardReceived(msg.value);
    }

    function initialize(address _ownerContract) public payable initializer {
        ownerContract = _ownerContract;
    }

    function sendReward() external nonReentrant {
        if(topContributor == address(0)) {
            revert TopContributorNotSet();
        }
        // TODO: Check if topContributor implements the "receiveGroupMintReward"
        (bool success, ) = topContributor.call{value: address(this).balance}("");
        if (!success) {
            revert RewardFailedToSend(topContributor);
        }
    }

    function setTopContributor(address payable _topContributor) external {
        topContributor = _topContributor;
    }

    function getTopContributor() public view returns (address) {
        return topContributor;
    }
}
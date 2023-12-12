// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract HoneyPot is Initializable, OwnableUpgradeable, ReentrancyGuardUpgradeable {

    address payable internal topContributor;
    address internal ownerContract;
    address internal operator;

    event RewardReceived(uint256 value);
    event TopContributorSet(address topContributor);
    event RewardSent(address topContributor, uint256 rewardValue);

    error TopContributorNotSet();
    error RewardFailedToSend(address, uint256);
    error UnAuthorizedOperator();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    receive() external payable {
        emit RewardReceived(msg.value);
    }

    modifier onlyOperator() {
        if (msg.sender != getOperator()) {
            revert UnAuthorizedOperator();
        }
        _;
    }

    function initialize(address _ownerContract, address _operator) public payable initializer {
        __Ownable_init(msg.sender);

        ownerContract = _ownerContract;
        operator = _operator;
    }

    function sendReward() external nonReentrant {
        if(topContributor == address(0)) {
            revert TopContributorNotSet();
        }
        // TODO: Check if topContributor implements the "receiveGroupMintReward"
        uint256 rewardValue = address(this).balance;
        (bool success, ) = topContributor.call{value: rewardValue}("");
        if (!success) {
            revert RewardFailedToSend(topContributor, rewardValue);
        }
        emit RewardSent(topContributor, rewardValue);
    }

    function setTopContributor(address payable _topContributor) external onlyOperator {
        topContributor = _topContributor;
        emit TopContributorSet(topContributor);
    }

    function getTopContributor() public view returns (address) {
        return topContributor;
    }

    function getOwnerContract() public view returns (address) {
        return ownerContract;
    }

    function getOperator() public view returns (address) {
        return operator;
    }
}
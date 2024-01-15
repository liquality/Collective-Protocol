// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";

contract HoneyPot is Initializable, UUPSUpgradeable, OwnableUpgradeable, ReentrancyGuardUpgradeable {

    address payable internal topContributor;
    address internal ownerContract;
    address internal operator;

    event RewardReceived(uint256 value);
    event TopContributorSet(address topContributor);
    event RewardSent(address topContributor, uint256 rewardValue);

    error HoneyPot__TopContributorNotSet();
    error HoneyPot__RewardFailedToSend(address, uint256);
    error HoneyPot__OnlyOperator(address caller);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    receive() external payable {
        emit RewardReceived(msg.value);
    }

    function initialize(address _operator) public payable initializer {
        __Ownable_init(msg.sender);
        operator = _operator;
    }

    function setTopContributor(address payable _topContributor) external {
        _requireFromAuthorizedOperator();
        topContributor = _topContributor;
        emit TopContributorSet(topContributor);
    }

    function sendReward() external nonReentrant {
        if(topContributor == address(0)) {
            revert HoneyPot__TopContributorNotSet();
        }
        uint256 rewardValue = address(this).balance;
        (bool success, ) = topContributor.call{value: rewardValue}("");
        if (!success) {
            revert HoneyPot__RewardFailedToSend(topContributor, rewardValue);
        }
        emit RewardSent(topContributor, rewardValue);
    }


    /* ------------------------------ READ METHODS ---------------------------- */
    function getTopContributor() public view returns (address) {
        return topContributor;
    }

    function getOperator() public view returns (address) {
        return operator;
    }

    function _requireFromAuthorizedOperator() internal view  {
        if (getOperator() != msg.sender)  {
            revert HoneyPot__OnlyOperator(msg.sender);
        }
        return;
    }

    function _authorizeUpgrade(address newImplementation) internal view override {
        (newImplementation);
        _requireFromAuthorizedOperator();
    }

}
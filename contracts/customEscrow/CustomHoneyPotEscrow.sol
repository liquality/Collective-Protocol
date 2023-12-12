// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

contract CustomHoneyPotEscrow is Initializable, ReentrancyGuardUpgradeable {

    address payable private topContributor;
    address private operator;
    address payable private raffleWinner;
    uint256 constant distribution = 2; // 50% distribution to topContributor and raffleWinner

    event RewardReceived(uint256 value);
    event TopContributorSet(address topContributor);
    event OperatorSet(address operator);
    event RewardSent(address topContributor, uint256 topContributorReward, address reffleWinner, uint256 reffleReward);
    event RaffleWinnerSet(address topContributor);

    error TopContributorNotSet();
    error RewardFailedToSend(address, uint256);
    error UnAuthorizedOperator();
    error RaffleWinnerNotSet();

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

    function initialize(address _operator) public payable initializer {
        operator = _operator;
        emit OperatorSet(_operator);
    }

    function sendReward() external nonReentrant {
        if(topContributor == address(0)) {
            revert TopContributorNotSet();
        }
        if(raffleWinner == address(0)) {
            revert RaffleWinnerNotSet();
        }
        // TODO: Check if topContributor implements the "receiveGroupMintReward"
        uint256 topContributorReward = address(this).balance / distribution;
        (bool success, ) = topContributor.call{value: topContributorReward}("");
        if (!success) {
            revert RewardFailedToSend(topContributor, topContributorReward);
        }
        uint256 reffleReward = address(this).balance - topContributorReward;
        (success, ) = raffleWinner.call{value: reffleReward}("");
        if (!success) {
            revert RewardFailedToSend(raffleWinner, reffleReward);
        }
        emit RewardSent(topContributor, topContributorReward, raffleWinner, reffleReward);
    }

    function setTopContributor(address payable _topContributor) external onlyOperator {
        topContributor = _topContributor;
        emit TopContributorSet(topContributor);
    }
    
    function setOperator(address _operator) external onlyOperator {
        operator = _operator;
        emit OperatorSet(_operator);
    }

    function setRaffleWinner(address payable _winner) external onlyOperator {
        raffleWinner = _winner;
        emit RaffleWinnerSet(_winner);
    }

    function getTopContributor() public view returns (address) {
        return topContributor;
    }

    function getOperator() public view returns (address) {
        return operator;
    }

    function getRaffleWinner() public view returns (address) {
        return raffleWinner;
    }
}
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IPool} from "../interfaces/IPool.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";

contract Pool is IPool, Pausable, ReentrancyGuard  {

/* ======================= STORAGE ====================== */
    struct Participant {
        address id;
        uint64 contribution;
        uint256 rewardAmount;
    }
    mapping(address => Participant) public participantData;
    
    address[] public participants;
    address immutable public  poolInitiator;
    address immutable public  collective;
    address immutable public  tokenContract;

    uint256 public poolReward;    // total reward amount to be distributed to pool participants
    uint128 public totalContributions;

    bool public isDistributed;    // flag to indicate if reward has been distributed
    bool public isRewardReceived; // flag to indicate if pool reward has been received



/* ======================= MODIFIERS ====================== */
    modifier onlyPoolInitiator() {
        require(msg.sender == poolInitiator, "Pool__Authorization:OnlyInitiator");
        _;
    }
    modifier onlyCollective() {
        require(msg.sender == collective, "Pool__Authorization:OnlyCollective");
        _;
    }

/* ======================= EXTERNAL METHODS ====================== */


    constructor(address _tokenContract, address _initiator) {
        tokenContract = _tokenContract;
        poolInitiator = _initiator;
        collective = msg.sender;
    }

    function pause() external onlyCollective {
        _pause();
    }

    function unpause() external onlyCollective {
        _unpause();
    }

    receive() external payable {
        if (msg.sender == collective) {
            isRewardReceived = true;
            emit RewardReceived(msg.sender, msg.value);
        }
        poolReward += uint128(msg.value);
    }

    // @inheritdoc IPool
    function recordMint(address _participant, uint256 _tokenID, uint256 _quantity, uint256 _amountPaid) 
    external onlyCollective whenNotPaused {
        console.log("!!! came to recordMint");
        participantData[_participant].contribution += uint64(_quantity);
        totalContributions += uint128(_quantity);

        if (participantData[_participant].id == address(0)) {
            participantData[_participant].id = _participant;
            participants.push(_participant);
        }

        emit NewMint(_participant, _tokenID, _quantity, _amountPaid);
        console.log("!!! done with recordMint");
    }

    // @inheritdoc IPool
    function distributeReward() external {
        if (isDistributed || !isRewardReceived || poolReward == 0) {
            revert Pool__NoRewardToDistribute();
        }
        uint256 rewardAmount = poolReward;
        for (uint256 i = 0; i < participants.length;) {
            Participant memory participant = participantData[participants[i]];
            participantData[participants[i]].rewardAmount = 
                (participant.contribution * rewardAmount) / totalContributions;
            emit RewardDistributed(participant.id, participant.rewardAmount);
            unchecked {
                i++;
            }
        }
    }

    // @inheritdoc IPool
    function withdrawReward(address _participant) external nonReentrant {
        if (participantData[_participant].id == address(0)) {
            revert Pool__ZeroParticipation(_participant);
        }
        if (participantData[_participant].rewardAmount == 0) {
            revert Pool__NotEnoughBalance(_participant, participantData[_participant].rewardAmount);
        }
        uint256 rewardAmount = participantData[_participant].rewardAmount;
        participantData[_participant].rewardAmount = 0;
        (bool success, ) = payable(_participant).call{value: rewardAmount}("");
        if (!success) {
            revert Pool__FailedToSendReward(_participant, rewardAmount);
        }
        emit RewardWithdrawn(_participant, rewardAmount);
    }

    // withdraw all funds from the pool to collective, and destroy the pool
    function withdrawNative() external onlyCollective {
        (bool success, ) = payable(collective).call{value: address(this).balance}("");
        if (!success) {
            revert Pool__FailedToWithdrawFunds(collective, address(0), address(this).balance);
        }
        emit WithrawnToCollective(collective, address(0), address(this).balance);
    }

    // withdraw all ERC20 tokens from the pool to collective
    function withdrawERC20(address _tokenContract) external onlyCollective {
        uint256 balance = IERC20(_tokenContract).balanceOf(address(this));
        bool success = IERC20(_tokenContract).transfer(collective, balance);
        if (!success) {
            revert Pool__FailedToWithdrawFunds(collective, _tokenContract, balance);
        }
        emit WithrawnToCollective(collective, _tokenContract, balance);
    }

/* ======================= READ ONLY METHODS ====================== */

    // @inheritdoc IPool
     function getParticipantsCount() public view returns (uint256) {
        return participants.length;
     }

    // @inheritdoc IPool
    function getPoolInfo() public view returns 
    (address _tokenContract, uint256 _rewardPercent, uint256 _totalMints) {
        return (tokenContract, poolReward, totalContributions);
    }

    // @inheritdoc IPool
    function isPoolActive() public view returns (bool) {
        return paused();
    }
       
}
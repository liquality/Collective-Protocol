// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import  "../external/ILinkTokenInterface.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFV2WrapperConsumerBase.sol";

contract Raffle is VRFV2WrapperConsumerBase {

    /* CONSTANTS */
    uint8 constant private VRF_REQUEST_NO_WORDS = 1;
    uint8 constant private VRF_REQUEST_N0_CONFIRMATIONS = 4;

    /* VARIABLES */
    address[] public participants;
    uint256 public randomResult;
    address public linkToken;
    mapping(address => bool) public entered;

    // Private variables
    address private admin;
    address payable private winner;
    uint256 private vrfRequestId;
    
    /* Errors */
    error FailedToSendPrize(address winner);

    /* MODIFIERS */
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    constructor(address _linkToken, address _vrfWrapper)
        VRFV2WrapperConsumerBase(_linkToken, _vrfWrapper)
    {
        admin = msg.sender;
        linkToken = _linkToken;
    }

    receive() external payable {}

    function enterRaffle(address[] calldata _participants) external onlyAdmin {
        require(_participants.length > 0, "Please enter valid addresses");
        for (uint256 i = 0; i < _participants.length; i++) {
            if (entered[_participants[i]]) {
                continue;
            }
            participants.push(_participants[i]);
            entered[_participants[i]] = true;
        }
    }

    function startDraw(uint32 _callbackGasLimit) external {
        require(participants.length > 0, "No participants");
        vrfRequestId = requestRandomness(_callbackGasLimit, VRF_REQUEST_N0_CONFIRMATIONS, VRF_REQUEST_NO_WORDS);
    }

    function fulfillRandomWords(uint256 _requestId, uint256[] memory _randomWords) internal override {
        require(vrfRequestId == _requestId, "Invalid request");
        randomResult = _randomWords[0] % participants.length;
        winner = payable(participants[randomResult]);
    }

    function sendPrize() external {
        require(winner != address(0), "No winner");
        (bool success, ) = winner.call{value: address(this).balance}("");
        if (!success) {
            revert FailedToSendPrize(winner);
        }
    }

       /**
     * Allow withdraw of Link tokens from the contract
     */
    function withdrawLink() public onlyAdmin {
        ILinkTokenInterface link = ILinkTokenInterface(linkToken);
        require(
            link.transfer(admin, link.balanceOf(address(this))),
            "Unable to transfer remaining LINK to admin"
        );
    }

    function raffleWinner() view public returns (address) {
        return winner;
    }
    
    function getParticipants() view public returns (address[] memory) {
        return participants;
    }
}

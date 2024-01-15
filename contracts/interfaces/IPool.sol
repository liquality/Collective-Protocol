// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

interface IPool {
    
    /* EVENTS */
    event NewMint(address indexed participant, uint256 indexed tokenID, uint256 quantity, uint256 indexed amountPaid);
    event RewardDistributed(address indexed participant, uint256 indexed amount);
    event RewardWithdrawn(address indexed participant, uint256 indexed amount);
    event RewardReceived(address indexed from, uint256 amount);
    event NewParticipant(address indexed participant);
    event WithrawnToCollective(address indexed to, address indexed token, uint256 indexed amount);

    /* ERRORS */
    error Pool__ZeroParticipation(address participant);
    error Pool__NoRewardToDistribute();
    error Pool__FailedToWithdrawFunds(address _recipient, address token, uint256 _amount);
    

    /* METHODS */

    /* ----WRITE METHODS---- */

    /// @notice Records a new mint against a participants, and recalculates contribution weight
    /// @dev This function is called by the collective AA wallet, when a mint is done on the NFT contract
    /// @param _participant The address of the participant
    /// @param _amountPaid The amount paid for the token minted
    /// @param _tokenID The token ID of the NFT minted
    /// @param _quantity The quantity of NFTs minted
    function recordMint(address _participant, uint256 _tokenID, uint256 _quantity, uint256 _amountPaid) external;

    /// @notice Distribute reward according to distribution mapping
    /// @dev This function is called by the collective AA wallet, when a reward is received from the NFT contract
    function distributeReward() external;

    /// @notice Withdraw reward from pool
    /// @dev This function is called by the participant, to withdraw their reward from the pool
    /// @param _participant The address of the participant
    function withdrawReward(address _participant) external;

    /* -----READ ONLY METHODS----- */

    /// @notice Get member count of pool
    /// @dev This function is called by the participant, to get the member count of the pool
    /// @return The member count of the pool
    function getParticipantsCount() external view returns (uint256);

    /// @notice Get pool info
    /// @dev This function is called by the participant, to get the pool info
    /// @return _tokenContract token contract, reward percent, and total mints of the pool
    /// 
    function getPoolInfo() external view returns
    (address _tokenContract, uint256 _reward, uint256 _rewardDistributed, uint256 _totalContributions, bool _isRewardReceived, bool _isDistributed);
}
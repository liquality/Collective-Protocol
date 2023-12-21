// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

/* solhint-disable avoid-low-level-calls */
/* solhint-disable no-inline-assembly */
/* solhint-disable reason-string */

import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";

import "../interfaces/AA/IEntryPoint.sol";
import "../interfaces/ICWallet.sol";
import "../interfaces/ICollective.sol";
import "../extensions/AA/BaseAccount.sol";
import "../extensions/AA/TokenCallbackHandler.sol";
import "hardhat/console.sol";

/**
  * minimal account.
  *  this is sample minimal account.
  *  has execute, eth handling methods
  *  has a single signer that can send requests through the entryPoint.
  */
contract CWallet is ICWallet, BaseAccount, TokenCallbackHandler, UUPSUpgradeable, Initializable {

    using MessageHashUtils for bytes32;
    using ECDSA for bytes32;
    
    /* ======================= EVENTS ====================== */
    event NewSigner(address indexed signer);
    event TargetsBlacklisted(address[] indexed target);
    event OperatorRenounced(address indexed operator);
    event TargetsWhitelisted(address[] indexed target);
    event RewardReceived(address indexed sender, uint256 indexed amount);
    event FundsWithdrawn(address indexed recipient, uint256 indexed amount);
    event CollectiveWalletInitialized(IEntryPoint indexed entryPoint, address indexed collective);


    /* ======================= Errors ====================== */
    error CWallet__OnlyOperator(address sender);
    error CWallet__OnlyEntrypoint(address sender);
    error CWallet__OnlyWhitelistedTargets(address target);
    error CWallet__FailedToReceiveReward(address sender, uint256 amount);
    error CWallet__FailedToWithdrawFunds(address recipient, uint256 amount);
    error CWallet__NotEnoughBalance(address signer, uint256 balance, uint256 amount);

    /* ======================= STORAGE ====================== */
    address private currentSigner; // Appended to the end of the calldata to collective
    address public collective;
    address public operator;
    mapping(address => bool) public whitelistedTargets;
    mapping(address => uint256) public balance; // mapping of member address to balance

    IEntryPoint private immutable _entryPoint;


    modifier onlyCollective() {
        _requireFromCollective();
        _;
    }

    constructor(IEntryPoint anEntryPoint) {
        _entryPoint = anEntryPoint;
        _disableInitializers();
    }

    /**
     * @dev The _entryPoint member is immutable, to reduce gas consumption.  To upgrade EntryPoint,
     * a new implementation of CWallet must be deployed with the new EntryPoint address, then upgrading
      * the implementation by calling `upgradeTo()`
     */
    function initialize(address theCollective, address theOperator) public virtual initializer {
        _initialize(theCollective, theOperator);
    }

    function _initialize(address theCollective, address theOperator) internal virtual {
        collective = theCollective;
        operator = theOperator;
        whitelistedTargets[theCollective] = true;
        emit CollectiveWalletInitialized(_entryPoint, theCollective);
    }


    // solhint-disable-next-line no-empty-blocks
    receive() external payable {
        if (whitelistedTargets[msg.sender]) {
            bool success = ICollective(collective).receivePoolReward{value : msg.value}(msg.sender);
            if (!success) {
                revert CWallet__FailedToReceiveReward(msg.sender, msg.value);
            }
            emit RewardReceived(msg.sender, msg.value);
        }
    }


    /**
     * execute a transaction (called directly from collective, or by entryPoint)
     */
    function execute(address dest, uint256 value, bytes calldata func) external {
        _requireFromEntryPoint();
        _requireToWhitelisted(dest);
        if (dest == collective) {
            // add signer to the end of the calldata for calls to collective
            bytes memory data = abi.encodePacked(func, currentSigner);
            _call(dest, value, data);
        } else {
            _call(dest, value, func);
        }
        currentSigner = address(0);
    }

    /**
     * execute a sequence of transactions
     * @dev to reduce gas consumption for trivial case (no value), use a zero-length array to mean zero value
     */
    function executeBatch(address[] calldata dest, uint256[] calldata value, bytes[] calldata func) external {
        console.log(" came to executeBatch");
        _requireFromEntryPoint();
        require(dest.length == func.length && (value.length == 0 || value.length == func.length), "wrong array lengths");
        if (value.length == 0) {
            for (uint256 i = 0; i < dest.length; i++) {
                _requireToWhitelisted(dest[i]);
                if (dest[i] == collective) {
                    // add signer to the end of the calldata for calls to collective
                    bytes memory data = abi.encodePacked(func[i], currentSigner);
                    console.log(" came to executeBatch collective");
                    _call(dest[i], 0, data);
                } else {
                    console.log("came to executeBatch not collective", dest[i]);
                    _call(dest[i], 0, func[i]);
                }
            }
        } else {
            for (uint256 i = 0; i < dest.length; i++) {
                _requireToWhitelisted(dest[i]);
                if (balance[currentSigner] < value[i]) {
                    revert CWallet__NotEnoughBalance(currentSigner, balance[currentSigner], value[i]);
                }
                if (dest[i] == collective) {
                    // add signer to the end of the calldata for calls to collective
                    bytes memory data = abi.encodePacked(func[i], currentSigner);
                    console.log(" came to executeBatch collective");
                    _call(dest[i], value[i], data);
                } else {
                    console.log(" came to executeBatch not collective > ", dest[i]);
                    _call(dest[i], value[i], func[i]);
                }
                balance[currentSigner] -= value[i];
            }
        }
        currentSigner = address(0);
    }

    function _call(address target, uint256 value, bytes memory data) internal {
        (bool success, bytes memory result) = target.call{value : value}(data);
        if (!success) {
                console.log(" failed to call >> ", target);
            assembly {
                revert(add(result, 32), mload(result))
            }
        }
    }

    /**
     * deposit more funds for this account in the entryPoint
     */
    function addDeposit() public payable {
        entryPoint().depositTo{value : msg.value}(address(this));
    }

    /**
     * withdraw value from the account's deposit
     * @param withdrawAddress target to send to
     * @param amount to withdraw
     */
    function withdrawDepositTo(address payable withdrawAddress, uint256 amount) public {
        _requireFromAuthorizedOperator();
        entryPoint().withdrawTo(withdrawAddress, amount);
    }

    function _authorizeUpgrade(address newImplementation) internal view override {
        (newImplementation);
        _requireFromAuthorizedOperator();
    }

    /// implement template method of BaseAccount
    function _validateSignature(UserOperation calldata userOp, bytes32 userOpHash)
    internal override virtual returns (uint256 validationData) {
        bytes32 hash = userOpHash.toEthSignedMessageHash();
        address signer = hash.recover(userOp.signature);
        currentSigner = signer;
        emit NewSigner(signer);
        return 0;
    }

    // withdraw from wallet
    function withdrawNative(address payable recipient, uint256 amount) external onlyCollective {
        (bool success, ) = recipient.call{value: amount}("");
        if (!success) {
            revert CWallet__FailedToWithdrawFunds(recipient, amount);
        }
        emit FundsWithdrawn(collective, amount);
    }

    // add deposit into
    function depositTo(address account) external payable {
        balance[account] += msg.value;
    }

    /*
     * @dev whitelist target address to be called by execute & executeBatch. Called by collective 
     * @param theTargets array of target addresses to whitelist
        */
    function whitelistTargets(address[] calldata theTargets) external onlyCollective {
        for (uint256 i = 0; i < theTargets.length; i++) {
            whitelistedTargets[theTargets[i]] = true;
        }
        emit TargetsWhitelisted(theTargets);
    }

    /*
     * @dev remove target from whitelisted addresses to be called by execute & executeBatch. Called by collective 
     * @param theTargets array of target addresses to remove
        */
    function blacklistTargets(address[] calldata theTargets) external onlyCollective {
        for (uint256 i = 0; i < theTargets.length; i++) {
            whitelistedTargets[theTargets[i]] = false;
        }
        emit TargetsBlacklisted(theTargets);
    }

    /* ======================= READ METHODS ====================== */

    /// @inheritdoc BaseAccount
    function entryPoint() public view virtual override returns (IEntryPoint) {
        return _entryPoint;
    }

    function _requireFromCollective() internal view {
        //directly from EOA collective, or through the account itself (which gets redirected through execute())
        require(msg.sender == collective, "Collective__OnlyCollective");
    }
    
    /**
     * check current account deposit in the entryPoint
     */
    function getDeposit() public view returns (uint256) {
        return entryPoint().balanceOf(address(this));
    }

    function _requireFromAuthorizedOperator() internal view  {
        if (operator != msg.sender) {
            revert CWallet__OnlyOperator(msg.sender);
        }
    }

    function _requireToWhitelisted(address dest) internal view  {
        if (!whitelistedTargets[dest]) {
            revert CWallet__OnlyWhitelistedTargets(dest);
        }
    }
}
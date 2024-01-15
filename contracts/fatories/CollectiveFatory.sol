// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "../interfaces/AA/IEntryPoint.sol";
import "../core/Collective.sol";
import "../core/CWallet.sol";
import "@openzeppelin/contracts/utils/Create2.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract CollectiveFactory {

    Collective public immutable collectiveImplementation;
    CWallet public immutable cWalletImplementation;

    constructor(IEntryPoint _entryPoint) {
        collectiveImplementation = new Collective();
        cWalletImplementation = new CWallet(_entryPoint);
    }

    /**
     * create an account, and return its address.
     * returns the address even if the account is already deployed.
     * Note that during UserOperation execution, this method is called only if the account is not deployed.
     * This method returns an existing account address so that entryPoint.getSenderAddress() would work even after account creation
     */
    function createWallet(address _initiator, address _operator, uint256 _salt) public returns (address) {
        address collective = getCollective(_initiator, _operator, _salt);
        address cWallet = getCWallet(collective, _operator, _salt);

        uint wCodeSize = cWallet.code.length;
        if (wCodeSize <= 0) {
            CWallet(payable(new ERC1967Proxy{salt : bytes32(_salt)}(
                address(cWalletImplementation),
                abi.encodeCall(CWallet.initialize, (collective, _operator, address(this)))
            )));
        }
        return cWallet;
    }

    /**
     * creates a collective, if no code exist at address.
     */
    function createCollective(address _initiator, address _operator, uint256 _salt) public {
        address collective = getCollective(_initiator, _operator, _salt);
        address cWallet = getCWallet(collective, _operator, _salt);

        uint cCodeSize = collective.code.length;

        if (cCodeSize <= 0) {
            Collective retC = Collective(payable(new ERC1967Proxy{salt : bytes32(_salt)}(
                address(collectiveImplementation),
                abi.encodeCall(Collective.initialize, (_initiator, _operator, address(this)))
            )));
            retC.setWallet(cWallet);
        }
    }

    /**
     * calculate the counterfactual address of the collective as it would be returned by createCollective()
     */
    function getCollective(address _initiator, address _operator, uint256 _salt) public view returns (address) {
        return Create2.computeAddress(bytes32(_salt), keccak256(abi.encodePacked(
                type(ERC1967Proxy).creationCode,
                abi.encode(
                    address(collectiveImplementation),
                    abi.encodeCall(Collective.initialize, (_initiator, _operator, address(this)))
                )
            )));
    }

    /**
     * calculate the counterfactual address of the collective wallet as it would be returned by createCollective()
     */
    function getCWallet(address _collective, address _operator, uint256 _salt) public view returns (address) {
        return Create2.computeAddress(bytes32(_salt), keccak256(abi.encodePacked(
                type(ERC1967Proxy).creationCode,
                abi.encode(
                    address(cWalletImplementation),
                    abi.encodeCall(CWallet.initialize, (_collective, _operator, address(this)))
                )
            )));
    }

}
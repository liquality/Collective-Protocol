// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.20;

import {ERC20} from '@rari-capital/solmate/src/tokens/ERC20.sol';

/**
 * @title ISplitMain
 * @author 0xSplits <will@0xSplits.xyz>
 */
interface I0xSplit {
  /**
   * FUNCTIONS
   */

  function withdraw(
    address account,
    uint256 withdrawETH,
    ERC20[] calldata tokens
  ) external;

    function getETHBalance(address account) external  returns (uint256);

}
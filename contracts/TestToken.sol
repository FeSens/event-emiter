//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestToken is ERC20 {

  constructor() ERC20("TestToken", "TTO") {
  }

  function mint(uint value) external {
    _mint(msg.sender, value);
  }
}
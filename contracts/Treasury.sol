// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Treasury is Ownable {
    uint256 public totalFunds;

    constructor() payable {
        totalFunds = msg.value;
    }

    function releaseFunds(address _payee, uint256 _amount) public onlyOwner {
        require(totalFunds >= _amount);
        payable(_payee).transfer(_amount);
    }
}

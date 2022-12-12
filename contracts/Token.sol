// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

contract Token is ERC20Votes {
    address[] private tokenHolders;

    constructor(uint256 _initialSupply)
        ERC20("Token", "T")
        ERC20Permit("Token")
    {
        _mint(msg.sender, _initialSupply);
    }

    // The functions below are overrides required by Solidity.

    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20Votes) {
        super._afterTokenTransfer(from, to, amount);
    }

    function _mint(address to, uint256 amount) internal override(ERC20Votes) {
        super._mint(to, amount);
    }

    function _burn(address account, uint256 amount)
        internal
        override(ERC20Votes)
    {
        super._burn(account, amount);
    }

    /**
     * Overrides the transfer function to keep tract of the addresses that have tokens
     */
    function transfer(address to, uint256 amount)
        public
        virtual
        override
        returns (bool)
    {
        // Make the transfer
        bool res = super.transfer(to, amount);

        // Update the tokenHolders

        /** The sender in which the to address is found in the tokenHolders array */
        uint256 senderIndex;
        /** Determines if the sender address was found in the tokenHolders array */
        bool senderWasFound = false;

        /** The index in which the to address is found in the tokenHolders array */
        uint256 receiverIndex;
        /** Determines if the to address was found in the tokenHolders array */
        bool receiverWasFound = false;

        // Look for the sender and the receiver in the tokenHolders array
        for (uint256 i = 0; i < tokenHolders.length; i++) {
            if (tokenHolders[i] == msg.sender) {
                senderIndex = i;
            }
            if (tokenHolders[i] == to) {
                receiverIndex = i;
                receiverWasFound = true;
            }
        }

        uint256 senderBalanceAfter = balanceOf(msg.sender);

        // If the sender has 0 tokens then it should be removed from the tokenHolders array
        if (senderWasFound && senderBalanceAfter == 0) {
            for (uint256 i = receiverIndex; i < tokenHolders.length - 1; i++) {
                tokenHolders[i] = tokenHolders[i + 1];
            }
            tokenHolders.pop();
        }

        // In the receiver was not found in the tokenHolders array, it should be added because has tokens now
        if (!receiverWasFound) {
            tokenHolders.push(to);
        }

        return res;
    }

    function getTokenHolders() public view returns (address[] memory) {
        return tokenHolders;
    }
}

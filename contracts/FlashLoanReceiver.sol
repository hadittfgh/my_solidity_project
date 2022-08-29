// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./FlashLoan.sol";
import "./Token.sol";

contract FlashLoanReceiver{
    
    FlashLoan private pool;
    address private owner;

    event LoamReceived(address tokenAddress, uint amount);

    modifier onlyOwner(){
        require(msg.sender == owner,"Only owner can excute flash loon");
        _;
    }

    constructor (address _poolAddress) {
        pool = FlashLoan(_poolAddress);
        owner = msg.sender;
    }

    function receiveTokens (address _tokenAddress, uint _amount) external {
        require(msg.sender == address(pool),"Pool must be do that");
        require(Token(_tokenAddress).balanceOf(address(this)) == _amount, "failed to receive loam");
        emit LoamReceived(_tokenAddress, _amount);

        require(Token(_tokenAddress).transfer(msg.sender, _amount), "Transfer of the tokens faild");
    }

    function executeFlashLoan (uint _amount) external onlyOwner{
        pool.flashLoan(_amount);
    }
}
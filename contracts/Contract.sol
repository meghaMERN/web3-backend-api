// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract MeghaToken {
    string public name = "Megha Token";
    string public symbol = "MGC";
    uint8 public decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    function main(address to, uint256 amount) public {
        require(msg.sender == owner, "only owner can mint");
        balanceOf[to] += amount;
        totalSupply += amount;
    }
}

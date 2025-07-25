// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MockRUSD {
    mapping(address => uint256) public balances;
    mapping(address => mapping(address => uint256)) public allowances;

    function setBalance(address user, uint256 amount) external {
        balances[user] = amount;
    }

    function balanceOf(address account) external view returns (uint256) {
        return balances[account];
    }

    function allowance(address owner, address spender) external view returns (uint256) {
        return allowances[owner][spender];
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowances[msg.sender][spender] = amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balances[from] >= amount, "Insufficient");
        balances[from] -= amount;
        balances[to] += amount;
        return true;
    }
}

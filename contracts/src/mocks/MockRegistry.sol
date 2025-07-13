// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MockRegistry {
    mapping(address => bool) public approved;

    function isProjectApproved(address project) external view returns (bool) {
        return approved[project];
    }

    function creditAmountIssued(address project) external view returns (uint256) {
        return 1_000_000;
    }

    function setApproved(address project, bool value) external {
        approved[project] = value;
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IBCO2 {
    function _setCertificateId(string memory certificateId) external;
    function balanceOf(address account, uint256 id) external view returns (uint256);
    function getTotalSupplyByTokenId(uint256 id) external view returns (uint256);
    function unit_tCO2_TOKEN_ID() external pure returns (uint256);
}
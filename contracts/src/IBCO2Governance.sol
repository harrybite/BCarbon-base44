// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IBCO2Governance {
    function checkAuthorizedVVBs(address _vvb) external view returns (bool);
    function getAuthorizedVVBs() external view returns(address[] memory);
    function getListedProjects() external view returns (address[] memory);
}
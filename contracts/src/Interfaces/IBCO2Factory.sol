// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IBCO2Factory {
    function createBCO2(
        string memory projectId,
        address proposer,
        address governance,
        address projectData,
        address bco2DAO,
        address RUSD,
        uint8 methodologyIndex,
        string memory location
    ) external returns (address);
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../BCO2.sol";
import "../Interfaces/IBCO2Factory.sol";

contract BCO2Factory is IBCO2Factory {

    function createBCO2(
        string memory projectId,
        address proposer,
        address governance,
        address projectData,
        address bco2DAO,
        address RUSD,
        uint8 methodologyIndex,
        string memory location
    ) external override returns (address) {
        try new BCO2(
            projectId,
            proposer,
            governance,
            projectData,
            bco2DAO,
            IERC20(RUSD),
            methodologyIndex,
            location
        ) returns (BCO2 deployed) {
            return address(deployed);
        } catch {
            revert("Failed to create BCO2 contract");
        }
    }
}
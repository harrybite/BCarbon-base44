// SPDX-License-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/Governance.sol";
import "../src/Registry/ProjectData.sol";
import "../src/Registry/ProjectManager.sol";
import "../src/Registry/ProjectFactory.sol";
import "../src/BCO2DAO.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address owner = vm.addr(deployerPrivateKey);
        console.log("Deployer:", owner);

        // Read RUSD token and VVB from .env
        address rusd = vm.envAddress("RUSD_BSC_TESTNET");
        address vvb = vm.envAddress("vvb");
        require(rusd != address(0), "Invalid RUSD address");
        require(vvb != address(0), "Invalid VVB address");

        // Read flag to determine whether to deploy new contracts or use existing ones
        bool useExisting = vm.envBool("USE_EXISTING_CONTRACTS");

        vm.startBroadcast(deployerPrivateKey);

        // Declare variables
        BCO2Governance governance;
        ProjectData projectData;
        BCO2DAO bco2DAO;
        ProjectManager projectManager;
        ProjectFactory projectFactory;

        if (useExisting) {
            // Use existing contract addresses
            address existingGovernance = vm.envAddress("EXISTING_GOVERNANCE");
            address existingProjectData = vm.envAddress("EXISTING_PROJECT_DATA");
            address existingBCO2DAO = vm.envAddress("EXISTING_BCO2DAO");
            address existingProjectManager = vm.envAddress("EXISTING_PROJECT_MANAGER");
            address existingProjectFactory = vm.envAddress("EXISTING_PROJECT_FACTORY");
            require(existingGovernance != address(0), "Invalid existing governance address");
            require(existingProjectData != address(0), "Invalid existing project data address");
            require(existingBCO2DAO != address(0), "Invalid existing BCO2DAO address");
            require(existingProjectManager != address(0), "Invalid existing project manager address");
            require(existingProjectFactory != address(0), "Invalid existing project factory address");

            governance = BCO2Governance(existingGovernance);
            projectData = ProjectData(existingProjectData);
            bco2DAO = BCO2DAO(existingBCO2DAO);
            projectManager = ProjectManager(existingProjectManager);
            projectFactory = ProjectFactory(existingProjectFactory);
        } else {
            // Deploy new contracts
            governance = new BCO2Governance(owner);
            projectData = new ProjectData(owner, address(governance));
            bco2DAO = new BCO2DAO(rusd, address(projectData), address(governance));
            projectManager = new ProjectManager(address(projectData), address(governance), owner);
            projectFactory = new ProjectFactory(
                address(projectData),
                address(projectManager),
                address(governance),
                address(bco2DAO),
                rusd,
                owner
            );
        }
        // Configure relationships
        governance.initialize(address(projectData), address(projectManager), address(bco2DAO));
        projectData.setManager(address(projectManager));
        projectData.setFactory(address(projectFactory));

        // Add VVB
        governance.addVVB(vvb);

        // Log deployed or used addresses
        console.log("Governance:", address(governance));
        console.log("ProjectData:", address(projectData));
        console.log("BCO2DAO:", address(bco2DAO));
        console.log("ProjectManager:", address(projectManager));
        console.log("ProjectFactory:", address(projectFactory));
        console.log("Using RUSD:", rusd);

        vm.stopBroadcast();
    }
}
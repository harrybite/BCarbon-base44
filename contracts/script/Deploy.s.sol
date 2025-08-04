// SPDX-License-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/Governance.sol";
import "../src/Registry/ProjectData.sol";
import "../src/Registry/ProjectManager.sol";
import "../src/Registry/BCO2Factory.sol";
import "../src/Registry/ProjectFactory.sol";
import "../src/BCO2DAO.sol";
import "../src/Marketplace.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address owner = vm.addr(deployerPrivateKey);
        console.log("Deployer:", owner);

        // Read RUSD token and VVB from .env
        address rusd = vm.envAddress("RUSD_BSC_TESTNET");
        address validator = vm.envAddress("validator");
        address verifier = vm.envAddress("verifier");
        require(rusd != address(0), "Invalid RUSD address");
        require(validator != address(0), "Invalid Validator address");
        require(verifier != address(0), "Invalid Verifier address");

        // Read flag to determine whether to deploy new contracts or use existing ones
        bool useExisting = vm.envBool("USE_EXISTING_CONTRACTS");

        vm.startBroadcast{gas: 8_000_000}(deployerPrivateKey);

        // Declare variables
        BCO2Governance governance;
        ProjectData projectData;
        BCO2DAO bco2DAO;
        BCO2Factory bco2Factory;
        ProjectManager projectManager;
        ProjectFactory projectFactory;
        BCO2Marketplace marketplace;

        if (useExisting) {
            // Use existing contract addresses
            // address existingGovernance = vm.envAddress("EXISTING_GOVERNANCE");
            // address existingProjectData = vm.envAddress("EXISTING_PROJECT_DATA");
            // address existingBCO2DAO = vm.envAddress("EXISTING_BCO2DAO");
            address existingBCO2Factory = vm.envAddress("EXISTING_BCO2Factory");
            // address existingProjectManager = vm.envAddress("EXISTING_PROJECT_MANAGER");
            // address existingProjectFactory = vm.envAddress("EXISTING_PROJECT_FACTORY");
            // require(existingGovernance != address(0), "Invalid existing governance address");
            // require(existingProjectData != address(0), "Invalid existing project data address");
            // require(existingBCO2DAO != address(0), "Invalid existing BCO2DAO address");
            require(existingBCO2Factory != address(0), "Invalid existing BCO2Factory address");
            // require(existingProjectManager != address(0), "Invalid existing project manager address");
            // require(existingProjectFactory != address(0), "Invalid existing project factory address");

            // governance = BCO2Governance(existingGovernance);
            // projectData = ProjectData(existingProjectData);
            // bco2DAO = BCO2DAO(existingBCO2DAO);
            bco2Factory = BCO2Factory(existingBCO2Factory);
            // projectManager = ProjectManager(existingProjectManager);
            // projectFactory = ProjectFactory(existingProjectFactory);

            // Deploy rest as fresh contracts
            governance = new BCO2Governance();
            projectData = new ProjectData(address(governance));
            bco2DAO = new BCO2DAO(rusd, address(projectData), address(governance));
            projectManager = new ProjectManager(address(projectData), address(governance));
            projectFactory = new ProjectFactory(
                address(projectData),
                address(projectManager),
                address(bco2Factory),
                address(governance),
                address(bco2DAO),
                rusd
            );
            marketplace = new BCO2Marketplace(address(rusd), address(projectData));
        } else {
            // Deploy new contracts
            governance = new BCO2Governance();
            projectData = new ProjectData(address(governance));
            bco2DAO = new BCO2DAO(rusd, address(projectData), address(governance));
            projectManager = new ProjectManager(address(projectData), address(governance));
            // Deploy BCO2Factory
            bco2Factory = new BCO2Factory();
            // Deploy ProjectFactory with BCO2Factory address
            projectFactory = new ProjectFactory(
                address(projectData),
                address(projectManager),
                address(bco2Factory),
                address(governance),
                address(bco2DAO),
                rusd
            );
            marketplace = new BCO2Marketplace(address(rusd), address(projectData));
        }

        console.log("Pre-Init: governance:", address(governance));
        console.log("Pre-Init: projectData:", address(projectData));
        console.log("Pre-Init: projectManager:", address(projectManager));
        console.log("Pre-Init: bco2DAO:", address(bco2DAO));
        // Configure relationships
        governance.initialize(address(projectData), address(projectManager), address(bco2DAO));
        projectData.setManager(address(projectManager));
        projectData.setFactory(address(projectFactory));
    

        // Add VVB
        governance.addValidator(validator);
        governance.addVerifier(verifier);

        // Log deployed or used addresses
        console.log("Governance:", address(governance));
        console.log("ProjectData:", address(projectData));
        console.log("BCO2DAO:", address(bco2DAO));
        console.log("ProjectManager:", address(projectManager));
        console.log("BCO2Factory:", address(bco2Factory));
        console.log("ProjectFactory:", address(projectFactory));
        console.log("Marketplace:", address(marketplace));
        console.log("Using RUSD:", rusd);

        vm.stopBroadcast();
    }
}
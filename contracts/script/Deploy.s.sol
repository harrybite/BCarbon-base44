// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/Governance.sol";
import "../src/Registry/ProjectData.sol";
import "../src/Registry/ProjectManager.sol";
import "../src/Registry/ProjectFactory.sol";

contract Deploy is Script {
    function run() external {
        // uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        // address owner = vm.addr(deployerPrivateKey);

        BCO2Governance governance;
        // ProjectData projectData;
        // ProjectManager projectManager;
        // ProjectFactory projectFactory;

        // Read RUSD token from .env
        // address rusd = vm.envAddress("RUSD_BSC_TESTNET");
        address vvb = vm.envAddress("vvb");

        vm.startBroadcast();

        // Deploy governance, data, manager & factory
        // BCO2Governance governance = new BCO2Governance(owner);
        // ProjectData projectData = new ProjectData(owner, address(governance));
        // ProjectManager projectManager = new ProjectManager(address(projectData), address(governance), owner);
        // ProjectFactory projectFactory = new ProjectFactory(
        //     address(projectData),
        //     address(projectManager),
        //     address(governance),
        //     rusd,
        //     owner
        // );

        // Use Existing governance, data, manager & factory
        governance = BCO2Governance(0xc84c3e85778b3A5ECEF69319615988F780A47488);
        // projectData = ProjectData(0x1204058F5EC282aC273C4Ac6ca854ebe3510ae58);
        // projectManager = ProjectManager(0xa74965d242028Af3d15bb43007e2dBAd75B7b7b8);
        // projectFactory = ProjectFactory(0xB5608BdBceE578AA743Ae421c5CB91c34Ed6B1B4);

        // Configure relationships
        // governance.initialize(address(projectData), address(projectManager));
        // projectData.setManager(address(projectManager));
        // projectData.setFactory(address(projectFactory));

        // Dummy VVB for now (replace with actual address)
        governance.addVVB(vvb);

        console.log("Governance:", address(governance));
        // console.log("ProjectData:", address(projectData));
        // console.log("ProjectManager:", address(projectManager));
        // console.log("ProjectFactory:", address(projectFactory));
        // console.log("Using existing RUSD:", rusd);

        vm.stopBroadcast();
    }
}

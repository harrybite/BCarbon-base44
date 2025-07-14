// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/BCO2.sol";
import "../src/mocks/MockRUSD.sol";
import "../src/Governance.sol";
import "../src/Registry/ProjectFactory.sol";
import "../src/Registry/ProjectData.sol";
import "../src/Registry/ProjectManager.sol";
import "../src/Marketplace.sol";

contract BCO2Test is Test {
    BCO2 bco2;
    MockRUSD rusd;
    BCO2Governance governance;
    ProjectData projectData;
    ProjectManager projectManager;
    ProjectFactory projectFactory;
    BCO2Marketplace marketplace;
    

    address user = address(1);
    address vvb = address(2);
    address owner = address(this);
    bytes32 public constant VINTAGE = keccak256("Vintage");

    function setUp() public {
        rusd = new MockRUSD();
        governance = new BCO2Governance(owner);
        projectData = new ProjectData(owner, address(governance));
        projectManager = new ProjectManager(
            address(projectData),
            address(governance),
            owner
        );
        projectFactory = new ProjectFactory(
            address(projectData),
            address(projectManager),
            address(governance),
            address(rusd),
            owner
        );
        marketplace = new BCO2Marketplace(
            address(rusd),
            owner
        );

        // bco2 = new BCO2(
        //     "MAAL-0001", // projectId
        //     owner, // initialOwner
        //     1 ether, // mintPrice
        //     true, // isPermanent
        //     100, // validity
        //     validVintage, // vintage
        //     address(governance), // governance
        //     address(projectData), // registry
        //     IERC20(address(rusd)), // RUSD token
        //     0, // methodologyId
        //     "Kenya" // location
        // );

        governance.initialize(address(projectData), address(projectManager));
        projectData.setManager(address(projectManager));
        projectData.setFactory(address(projectFactory));
        governance.addVVB(vvb);

        rusd.setBalance(user, 10000 ether);
        uint256 validVintage = 1752282049;
        vm.warp(validVintage + 1);

        vm.startPrank(user);
        bco2 = BCO2(
            projectFactory.createAndListProject(
                10000000000000000000,
                user,
                true,
                0,
                validVintage,
                0,
                "India",
                3000000,
                "Link to details"
            )
        );
        bco2.setTokenURI("ipfs://non-retired", "ipfs://retired");

        vm.warp(block.timestamp + 1800);
        vm.startPrank(vvb);
        governance.validateProject(address(bco2));
        governance.verifyProject(address(bco2));

        vm.startPrank(owner);
        governance.approveAndIssueCredits(address(bco2), 3000000);

        ProjectData.Project memory project = projectData.getProjectDetails(
            address(bco2)
        );

        console.log("Project ID:", project.projectId);
        console.log("Certificate ID:", project.certificateId);

        vm.startPrank(user);
        rusd.approve(address(bco2), 100 ether);
        bco2.mintWithRUSD(10); // Mint 10 tCO2 tokens

        marketplace.createListing(address(bco2), 1, 5, 10000000000000000000);
        (address seller,,,,, bool active) = marketplace.listings(0);
        console.log("Lising Details:", seller , active);

        vm.stopPrank();
    }

    function testMintAndList() public {
        // Assert initial balances
        assertEq(bco2.balanceOf(user, 1), 10);

        // Check listing details
        (address seller,,,,, bool active) = marketplace.listings(0);
        assertEq(seller, user);
        assertTrue(active);
    }
}

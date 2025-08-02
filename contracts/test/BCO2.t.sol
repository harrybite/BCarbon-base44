// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/BCO2.sol";
import "../src/mocks/MockRUSD.sol";
import "../src/Registry/ProjectFactory.sol";
import "../src/Registry/ProjectData.sol";
import "../src/Registry/ProjectManager.sol";
import "../src/Registry/BCO2Factory.sol";
import "../src/Governance.sol";
import "../src/BCO2DAO.sol";
import "../src/Marketplace.sol";

contract BCO2Test is Test {
    BCO2 bco2;
    MockRUSD rusd;
    BCO2Governance governance;
    BCO2DAO bco2DAO;
    ProjectData projectData;
    ProjectManager projectManager;
    BCO2Factory bco2Factory;
    ProjectFactory projectFactory;
    BCO2Marketplace marketplace;

    address user = address(1);
    address vvb = address(2);
    address issuer = address(3);
    address owner = address(this);
    bytes32 public constant VINTAGE = keccak256("Vintage");
    
    uint256 validVintage = 1609459200;

    function setUp() public {
        rusd = new MockRUSD();
        governance = new BCO2Governance();
        projectData = new ProjectData(address(governance));
        projectManager = new ProjectManager(
            address(projectData),
            address(governance)
        );
        bco2DAO = new BCO2DAO(address(rusd), address(projectData), address(governance));
        bco2Factory = new BCO2Factory();
        projectFactory = new ProjectFactory(
            address(projectData),
            address(projectManager),
            address(bco2Factory),
            address(governance),
            address(bco2DAO),
            address(rusd)
        );
        marketplace = new BCO2Marketplace(address(rusd), address(projectData));

        vm.warp(validVintage + 86400);

        console.log("=== Initialization and Setup ===");
        console.log("Governance address:", address(governance));
        console.log("Project Data address:", address(projectData));
        console.log("Project Manager address:", address(projectManager));
        console.log("BCO2 DAO address:", address(bco2DAO));
        console.log("BCO2 Factory Address:", address(bco2Factory));
        console.log("BCO2 Project Factory:", address(projectFactory));
        console.log("Marketplace address:", address(marketplace));
        
        // Initialize governance first
        governance.initialize(address(projectData), address(projectManager), address(bco2DAO));
        
        // Set up project data - CRITICAL: Make sure governance address is set correctly
        projectData.setManager(address(projectManager));
        projectData.setFactory(address(projectFactory));
        
        // Add VVB
        governance.addVVB(vvb);
        
        // Test if governance can access certificate ID generation
        // We need to create a project first
        rusd.setBalance(user, 10000 ether);
        
        vm.startPrank(issuer);
        bco2 = BCO2(
            projectFactory.createAndListProject{gas: 50000000}(
                1 ether,
                true,
                0,
                validVintage,
                0,
                "Kenya",
                1000000,
                "Test project details"
            )
        );
        vm.stopPrank();

        console.log("Non retired URI:", bco2.uri(bco2.unit_tCO2_TOKEN_ID()));
        console.log("Retired URI:", bco2.uri(bco2.unit_tCO2_RETIRED_TOKEN_ID()));

        vm.warp(block.timestamp + 1800);

        vm.startPrank(vvb);
        governance.validateProject(address(bco2));
        governance.verifyProject(address(bco2));
        vm.stopPrank();

        
        vm.startPrank(owner);
        console.log("approving and issuing credits");
        governance.approveAndIssueCredits{gas: 50000000}(address(bco2), 1000000);
        vm.stopPrank();

        ProjectData.Project memory project = projectData.getProjectDetails(address(bco2));
        console.log("validation status:", project.isValidated, project.isVerified);
        console.log("credits issued:", project.credits);
        console.log("CertificateId issued:", project.certificateId);

        // User minting
        vm.startPrank(user);
        console.log("Minting BCO2 token....");
        rusd.approve(address(bco2), type(uint256).max);
        bco2.mintWithRUSD(10);
        console.log("User BCO2 Balance:", bco2.balanceOf(user, 1));
        vm.stopPrank();

        console.log("=== Setup Completed ===");
    }

    function testRetireCredits_WithFullTraitAndCertificateChecks() public {
        uint256 userBalance = bco2.balanceOf(user, 1);
        console.log("User balance:", userBalance);
        require(userBalance >= 5, "Insufficient balance");

        bytes32 rawVintage = bco2.getTraitValue(1, VINTAGE);
        bytes32 rawPermanent = bco2.getTraitValue(1, keccak256("IsPermanent"));
        bytes32 rawValidity = bco2.getTraitValue(1, keccak256("validity"));

        uint256 storedVintage = uint256(rawVintage);
        
        assertLt(storedVintage, block.timestamp, "Vintage should have passed");
        assertEq(rawPermanent, bytes32("true"), "Token must be permanent");
        assertEq(uint256(rawValidity), 0, "Validity must be 0 for permanent token");

        vm.prank(user);
        bco2.retire(5);

        assertEq(bco2.balanceOf(user, 1), userBalance - 5, "Remaining credits incorrect");
        assertEq(bco2.balanceOf(user, 2), 5, "Retired credits incorrect");

        bytes32 certHash = bco2.getRetirementCertificate(user, 0);
        assertTrue(certHash != bytes32(0), "Certificate hash should not be empty");

        (bool isValid, uint256 retiredTonnes) = bco2.validateRetirementCertificate(user, 0, certHash);
        assertTrue(isValid, "Certificate hash should match");
        assertEq(retiredTonnes, 5 * bco2.tonnesPerToken(), "Retired tonnes mismatch");

        console.log("Retirement test passed successfully!");
    }
    function testWithdrawalRequestCreationAndApproval() public {
        // Check initial DAO balance (should already have RUSD from mintWithRUSD)
        console.log("DAO RUSD Balance before:", rusd.balanceOf(address(bco2DAO)));

        ProjectData.Project memory project = projectData.getProjectDetails(address(bco2));
        console.log("Project Owner:", project.proposer);
        console.log("Expected Issuer:", issuer);

        // assertEq(projectOwner == issuer, "Issuer and project owner are not the same");
        // Step 1: Issuer creates withdrawal request
        vm.startPrank(issuer);
        console.log("Issuer RUSD Balance before approval:", rusd.balanceOf(project.proposer));
        uint256 withdrawalRequestID = bco2DAO.requestWithdrawal(
            address(bco2),
            5000000000000000000,
            "link to proof of work"
        );
        console.log("Withdrawal Request ID:", withdrawalRequestID);
        vm.stopPrank();

        // Step 2: VVB approves request
        vm.startPrank(vvb);
        console.log("VVB is valid in Governance:", governance.checkAuthorizedVVBs(vvb));
        bco2DAO.vvbApproveWithdrawal(withdrawalRequestID);
        console.log("VVB Approval status:", bco2DAO.getVVBApproval(withdrawalRequestID, vvb));
        console.log("Is VVB Approved:", bco2DAO.isApprovedByVVB(withdrawalRequestID));
        vm.stopPrank();

        // Step 3: Holder votes on request
        vm.prank(user);
        bco2DAO.voteOnWithdrawal(withdrawalRequestID, true);
        console.log("Holder Approved:", bco2DAO.isHolderApproved(withdrawalRequestID));

        // Step 4: Governance makes final decision
        vm.prank(owner);
        governance.executeApprovalForWithdrawal(withdrawalRequestID, true, 5000000000000000000);

        // Final balance check
        console.log("Issuer RUSD Balance after approval:", rusd.balanceOf(project.proposer));
        console.log("DAO RUSD Balance after:", rusd.balanceOf(address(bco2DAO)));
    }
    function testMintAndList() public {
        console.log("=== Starting testMintAndList ===");
        vm.startPrank(user); // ← Switch sender to user

        // Assert initial balances
        assertEq(bco2.balanceOf(user, 1), 10);

        console.log("Approving bCO2 for listing");
        bco2.setApprovalForAll(address(marketplace), true);

        // Check listing details
        console.log("Listing BCO2 at Marketplace");
        marketplace.createListing(address(bco2), 1, 5, 10000000000000000000);
        (address seller, , , , , bool active) = marketplace.listings(0);
        console.log("Listing Details:", seller, active);
        vm.stopPrank();
        assertEq(seller, user);
        assertTrue(active);
        console.log("=== Finished testMintAndList ===");
    }
}
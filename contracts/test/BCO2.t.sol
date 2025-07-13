// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/BCO2/BCO2.sol";
import "../src/mocks/MockRUSD.sol";
import "../src/mocks/MockRegistry.sol";

contract BCO2Test is Test {
    BCO2 bco2;
    MockRUSD rusd;
    MockRegistry registry;
    address user = address(1);
    address owner = address(this);
    bytes32 public constant VINTAGE = keccak256("Vintage");

    function setUp() public {
        rusd = new MockRUSD();
        registry = new MockRegistry();

        rusd.setBalance(user, 1000 ether);
        uint256 validVintage = 1752282049;
        vm.warp(validVintage + 1);

        bco2 = new BCO2(
            "MAAL-0001", // projectId
            owner, // initialOwner
            1 ether, // mintPrice
            true, // isPermanent
            100, // validity
            validVintage, // vintage
            address(owner), // governance
            address(registry), // registry
            IERC20(address(rusd)), // RUSD token
            0, // methodologyId
            "Kenya" // location
        );

        bco2.setTokenURI("ipfs://non-retired", "ipfs://retired");

        vm.startPrank(user);
        rusd.approve(address(bco2), 100 ether);
        bco2.mintWithRUSD(10); // Mint 10 tCO2 tokens
        vm.stopPrank();
    }
    function testRetireCredits_WithFullTraitAndCertificateChecks() public {
        // Step 1: Check traits
        bytes32 rawVintage = bco2.getTraitValue(1, VINTAGE);
        bytes32 rawPermanent = bco2.getTraitValue(1, keccak256("IsPermanent"));
        bytes32 rawValidity = bco2.getTraitValue(1, keccak256("validity"));

        uint256 storedVintage = uint256(rawVintage);
        string memory isPermanent = string(abi.encodePacked(rawPermanent));
        uint256 validity = uint256(rawValidity);

        console.log("Stored Vintage (epoch):", storedVintage);
        console.log("Current block.timestamp:", block.timestamp);
        console.log("IsPermanent:", isPermanent);
        console.log("Validity (years):", validity);

        assertLt(storedVintage, block.timestamp, "Vintage should have passed");
        bytes32 expectedTrue = bytes32("true");
        assertEq(rawPermanent, expectedTrue, "Token must be permanent");
        assertEq(validity, 0, "Validity must be 0 for permanent token");

        // Step 2: Retire tokens
        vm.prank(user);
        bco2.retire(5);

        assertEq(bco2.balanceOf(user, 1), 5, "Remaining credits incorrect");
        assertEq(bco2.balanceOf(user, 2), 5, "Retired credits incorrect");

        // Step 3: Check RetirementCertificate storage
        bytes32 certHash = bco2.getRetirementCertificate(user, 0);
        assertTrue(
            certHash != bytes32(0),
            "Certificate hash should not be empty"
        );

        // Step 4: Validate certificate hash
        (bool isValid, uint256 retiredTonnes) = bco2
            .validateRetirementCertificate(user, 0, certHash);

        assertTrue(isValid, "Certificate hash should match");
        assertEq(
            retiredTonnes,
            5 * bco2.tonnesPerToken(),
            "Retired tonnes mismatch"
        );

        console.logBytes32(certHash);
        console.log("Retired Tonnes:", retiredTonnes);
    }
}

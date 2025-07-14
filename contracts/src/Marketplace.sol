// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract BCO2Marketplace is Ownable, ReentrancyGuard {

    IERC20 public rusd; // RUSD ERC20 token

    // Struct to represent a listing
    struct Listing {
        address seller;
        address tokenContract; // ERC1155 contract address (BCO2)
        uint256 tokenId; // Token ID representing tCO2 credits
        uint256 quantity; // Number of tokens listed
        uint256 pricePerUnit; // Price per token in RUSD
        bool active; // Whether the listing is active
    }

    // Mappings
    mapping(uint256 => Listing) public listings; // Mapping of listing ID to Listing
    mapping(address => uint256[]) public userListings; // Mapping of user to their listing IDs
    uint256 public listingCounter; // Counter for generating unique listing IDs
    uint256 public platformFees; // Accumulated platform fees in RUSD
    uint256 public constant FEE_PERCENTAGE = 50; // 0.5% fee (50 basis points)
    uint256 public constant FEE_DENOMINATOR = 10000; // Basis points denominator

    // Events
    event ListingCreated(
        uint256 indexed listingId,
        address indexed seller,
        address indexed tokenContract,
        uint256 tokenId,
        uint256 quantity,
        uint256 pricePerUnit
    );
    event ListingUpdated(
        uint256 indexed listingId,
        uint256 quantity,
        uint256 pricePerUnit
    );
    event ListingCancelled(uint256 indexed listingId);
    event Purchase(
        uint256 indexed listingId,
        address indexed buyer,
        uint256 quantity,
        uint256 totalPrice,
        uint256 platformFee
    );
    event FeesWithdrawn(address indexed owner, uint256 amount);

    // Custom errors
    error InvalidQuantity();
    error InvalidPrice();
    error ListingNotActive();
    error NotSeller();
    error InsufficientBalance();
    error InsufficientAllowance();
    error TransferFailed();
    error InvalidTokenContract();

    constructor(address _rusd, address initialOwner) Ownable(initialOwner) {
        if (_rusd == address(0)) revert InvalidTokenContract();
        rusd = IERC20(_rusd);
    }

    /// @notice Creates a new listing for ERC1155 carbon credit NFTs
    /// @param tokenContract The address of the ERC1155 token contract
    /// @param tokenId The token ID to list
    /// @param quantity The number of tokens to list
    /// @param pricePerUnit The price per token in RUSD
    function createListing(
        address tokenContract,
        uint256 tokenId,
        uint256 quantity,
        uint256 pricePerUnit
    ) external nonReentrant returns (uint256 listingId) {
        if (tokenContract == address(0)) revert InvalidTokenContract();
        if (quantity == 0) revert InvalidQuantity();
        if (pricePerUnit == 0) revert InvalidPrice();
        if (IERC1155(tokenContract).balanceOf(msg.sender, tokenId) < quantity)
            revert InsufficientBalance();
        if (!IERC1155(tokenContract).isApprovedForAll(msg.sender, address(this)))
            revert InsufficientBalance(); // Requires setApprovalForAll

        listingId = listingCounter++;
        listings[listingId] = Listing({
            seller: msg.sender,
            tokenContract: tokenContract,
            tokenId: tokenId,
            quantity: quantity,
            pricePerUnit: pricePerUnit,
            active: true
        });
        userListings[msg.sender].push(listingId);

        emit ListingCreated(listingId, msg.sender, tokenContract, tokenId, quantity, pricePerUnit);
    }

    /// @notice Updates an existing listing
    /// @param listingId The ID of the listing to update
    /// @param quantity The new quantity to list
    /// @param pricePerUnit The new price per token
    function updateListing(
        uint256 listingId,
        uint256 quantity,
        uint256 pricePerUnit
    ) external nonReentrant {
        Listing storage listing = listings[listingId];
        if (!listing.active) revert ListingNotActive();
        if (listing.seller != msg.sender) revert NotSeller();
        if (quantity == 0) revert InvalidQuantity();
        if (pricePerUnit == 0) revert InvalidPrice();
        if (IERC1155(listing.tokenContract).balanceOf(msg.sender, listing.tokenId) < quantity)
            revert InsufficientBalance();

        listing.quantity = quantity;
        listing.pricePerUnit = pricePerUnit;

        emit ListingUpdated(listingId, quantity, pricePerUnit);
    }

    /// @notice Cancels an existing listing
    /// @param listingId The ID of the listing to cancel
    function cancelListing(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        if (!listing.active) revert ListingNotActive();
        if (listing.seller != msg.sender) revert NotSeller();

        listing.active = false;
        // Remove from userListings
        uint256[] storage userListingIds = userListings[msg.sender];
        for (uint256 i = 0; i < userListingIds.length; i++) {
            if (userListingIds[i] == listingId) {
                userListingIds[i] = userListingIds[userListingIds.length - 1];
                userListingIds.pop();
                break;
            }
        }

        emit ListingCancelled(listingId);
    }

    /// @notice Purchases a specified quantity from a listing using RUSD
    /// @param listingId The ID of the listing
    /// @param quantity The number of tokens to purchase
    function purchase(uint256 listingId, uint256 quantity) external nonReentrant {
        Listing storage listing = listings[listingId];
        if (!listing.active) revert ListingNotActive();
        if (quantity == 0 || quantity > listing.quantity) revert InvalidQuantity();

        uint256 totalPrice = quantity * listing.pricePerUnit;
        uint256 fee = (totalPrice * FEE_PERCENTAGE) / FEE_DENOMINATOR;
        uint256 sellerAmount = totalPrice - fee;

        // Check RUSD balance and allowance
        if (rusd.balanceOf(msg.sender) < totalPrice) revert InsufficientBalance();
        if (rusd.allowance(msg.sender, address(this)) < totalPrice) revert InsufficientAllowance();

        // Transfer RUSD from buyer to contract
        bool success = rusd.transferFrom(msg.sender, address(this), totalPrice);
        if (!success) revert TransferFailed();

        // Transfer tokens to buyer
        IERC1155(listing.tokenContract).safeTransferFrom(
            listing.seller,
            msg.sender,
            listing.tokenId,
            quantity,
            ""
        );

        // Transfer RUSD to seller
        success = rusd.transfer(listing.seller, sellerAmount);
        if (!success) revert TransferFailed();

        // Update listing
        listing.quantity = listing.quantity - quantity;
        if (listing.quantity == 0) {
            listing.active = false;
            // Remove from userListings
            uint256[] storage userListingIds = userListings[listing.seller];
            for (uint256 i = 0; i < userListingIds.length; i++) {
                if (userListingIds[i] == listingId) {
                    userListingIds[i] = userListingIds[userListingIds.length - 1];
                    userListingIds.pop();
                    break;
                }
            }
        }

        // Accumulate platform fees
        platformFees = platformFees + fee;

        emit Purchase(listingId, msg.sender, quantity, totalPrice, fee);
    }

    /// @notice Withdraws accumulated platform fees
    function withdrawFees() external onlyOwner nonReentrant {
        uint256 amount = platformFees;
        platformFees = 0;
        bool success = rusd.transfer(owner(), amount);
        if (!success) revert TransferFailed();
        emit FeesWithdrawn(owner(), amount);
    }

    /// @notice Gets listing details
    /// @param listingId The ID of the listing
    /// @return The listing details
    function getListing(uint256 listingId) external view returns (Listing memory) {
        return listings[listingId];
    }

    /// @notice Gets all listings for a user
    /// @param user The address of the user
    /// @return Array of listing IDs
    function getUserListings(address user) external view returns (uint256[] memory) {
        return userListings[user];
    }
}
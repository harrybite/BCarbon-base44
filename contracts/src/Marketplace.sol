// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "./Registry/ProjectData.sol";

contract BCO2Marketplace is Ownable, ReentrancyGuard, IERC1155Receiver, ERC165 {
    ProjectData public projectData;

    IERC20 public rusd;

    struct Listing {
        address seller;
        address tokenContract;
        uint256 tokenId;
        uint256 quantity;
        uint256 pricePerUnit;
        bool active;
    }

    mapping(uint256 => Listing) public listings;
    mapping(address => uint256[]) public userListings;
    uint256 public listingCounter;
    uint256 public platformFeesEarned;
    uint256 public constant FEE_PERCENTAGE = 50;
    uint256 public constant FEE_DENOMINATOR = 10000;

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

    error InvalidQuantity();
    error InvalidPrice();
    error ListingNotActive();
    error NotSeller();
    error InsufficientBalance();
    error InsufficientAllowance();
    error TransferToSellerFailed();
    error TransferFromBuyerFailed();
    error TransferOfFeesFailed();
    error InvalidTokenContract();

    constructor(
        address _rusd,
        address _projectData
    ) Ownable(msg.sender) {
        if (_rusd == address(0)) revert InvalidTokenContract();
        rusd = IERC20(_rusd);
        projectData = ProjectData(_projectData);
    }

    function createListing(
        address tokenContract,
        uint256 tokenId,
        uint256 quantity,
        uint256 pricePerUnit
    ) external nonReentrant returns (uint256 listingId) {
        ProjectData.Project memory project = projectData.getProjectDetails(
            tokenContract
        );
        if (tokenContract == address(0)) revert InvalidTokenContract();
        if (tokenContract != project.projectContract)
            revert InvalidTokenContract();
        if (quantity == 0) revert InvalidQuantity();
        if (pricePerUnit == 0) revert InvalidPrice();
        if (IERC1155(tokenContract).balanceOf(msg.sender, tokenId) < quantity)
            revert InsufficientBalance();
        if (
            !IERC1155(tokenContract).isApprovedForAll(msg.sender, address(this))
        ) revert InsufficientBalance();

        ERC1155(tokenContract).safeTransferFrom(
            msg.sender,
            address(this),
            tokenId,
            quantity,
            ""
        );

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

        emit ListingCreated(
            listingId,
            msg.sender,
            tokenContract,
            tokenId,
            quantity,
            pricePerUnit
        );
    }

    function cancelListing(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        if (!listing.active) revert ListingNotActive();
        if (listing.seller != msg.sender) revert NotSeller();

        listing.active = false;
        uint256[] storage userListingIds = userListings[msg.sender];
        for (uint256 i = 0; i < userListingIds.length; i++) {
            if (userListingIds[i] == listingId) {
                userListingIds[i] = userListingIds[userListingIds.length - 1];
                userListingIds.pop();
                break;
            }
        }

        ERC1155(listing.tokenContract).safeTransferFrom(
            address(this),
            msg.sender,
            listing.tokenId,
            listing.quantity,
            ""
        );

        emit ListingCancelled(listingId);
    }

    function purchase(
        uint256 listingId,
        uint256 quantity
    ) external nonReentrant {
        Listing storage listing = listings[listingId];
        if (!listing.active) revert ListingNotActive();
        if (quantity == 0 || quantity > listing.quantity)
            revert InvalidQuantity();

        uint256 totalPrice = quantity * listing.pricePerUnit;
        uint256 fee = (totalPrice * FEE_PERCENTAGE) / FEE_DENOMINATOR;
        uint256 sellerAmount = totalPrice - fee;

        if (rusd.balanceOf(msg.sender) < totalPrice)
            revert InsufficientBalance();
        if (rusd.allowance(msg.sender, address(this)) < totalPrice)
            revert InsufficientAllowance();

        bool success = rusd.transferFrom(msg.sender, address(this), totalPrice);
        if (!success) revert TransferFromBuyerFailed();

        listing.quantity = listing.quantity - quantity;
        if (listing.quantity == 0) {
            listing.active = false;
            uint256[] storage userListingIds = userListings[listing.seller];
            for (uint256 i = 0; i < userListingIds.length; i++) {
                if (userListingIds[i] == listingId) {
                    userListingIds[i] = userListingIds[
                        userListingIds.length - 1
                    ];
                    userListingIds.pop();
                    break;
                }
            }
        }

        IERC1155(listing.tokenContract).safeTransferFrom(
            address(this),
            msg.sender,
            listing.tokenId,
            quantity,
            ""
        );

        success = rusd.transfer(listing.seller, sellerAmount);
        if (!success) revert TransferToSellerFailed();

        success = rusd.transfer(owner(), fee);
        if (!success) revert TransferOfFeesFailed();

        platformFeesEarned += fee;

        emit Purchase(listingId, msg.sender, quantity, totalPrice, fee);
    }

    function getListing(
        uint256 listingId
    ) external view returns (Listing memory) {
        return listings[listingId];
    }

    function getUserListings(
        address user
    ) external view returns (uint256[] memory) {
        return userListings[user];
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(IERC165, ERC165) returns (bool) {
        return
            interfaceId == type(IERC1155Receiver).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(
        address,
        address,
        uint256[] calldata,
        uint256[] calldata,
        bytes calldata
    ) external pure override returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }
}
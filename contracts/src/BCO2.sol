// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./MethodologyUtils.sol";

interface IERC7496 {
    event TraitUpdated(
        bytes32 indexed traitKey,
        uint256 tokenId,
        bytes32 traitValue
    );
    event TraitUpdatedList(bytes32 indexed traitKey, uint256[] tokenIds);

    function getTraitValue(uint256 tokenId, bytes32 traitKey)
        external
        view
        returns (bytes32);

    function getTraitValues(uint256 tokenId, bytes32[] calldata traitKeys)
        external
        view
        returns (bytes32[] memory);
}

interface ICarbonCreditRegistry {
    function isProjectApproved(address projectContract)
        external
        view
        returns (bool);

    function creditAmountIssued(address projectContract)
        external
        view
        returns (uint256);
}

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);

    function allowance(address owner, address spender)
        external
        view
        returns (uint256);

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool);
}

contract BCO2 is ERC1155, Ownable, IERC7496, ReentrancyGuard {
    struct RetirementCertificate {
        bytes32 certificateId;
        address owner;
        uint256 tonnesRetired;
        uint256 retireTimestamp;
    }

    string public constant name = "Blockchain Carbon Credit";
    string public constant symbol = "BCO\u2082";
    string public projectId;
    string public certificateId;
    string public location;
    MethodologyUtils.Methodology public methodology;

    address public governance;

    // Token IDs for carbon credits
    uint256 public constant unit_tCO2_TOKEN_ID = 1; // Represents 1 tCO2 - Active
    uint256 public constant unit_tCO2_RETIRED_TOKEN_ID = 2; // Represents 1 tCO2 - Retired
    uint8 public tonnesPerToken = 1; // Default: 1 token = 1 tCO2

    // Trait keys
    bytes32 public constant RETIREMENT_STATUS = keccak256("Retirement Status");
    bytes32 public constant IS_PERMANENT = keccak256("IsPermanent");
    bytes32 public constant VALIDITY = keccak256("validity");
    bytes32 public constant VINTAGE = keccak256("Vintage");
    bytes32 public constant METHODOLOGY = keccak256("Methodology");
    bytes32 public constant CATEGORY = keccak256("Category");
    bytes32 public constant VERSION = keccak256("Version");

    // Token for purchase of credits and treasury for collection
    IERC20 public RUSD;
    address public treasury;

    // Mappings
    mapping(uint256 => string) public tokenURIs; // URI per token ID
    mapping(uint256 => mapping(bytes32 => bytes32)) private _traits;
    mapping(address => uint256) public walletMinted; // Tracks total credits minted per wallet
    mapping(address => uint256) public walletRetired; // Tracks retired credits per wallet
    mapping(uint256 => uint256) public totalSupplyByTokenId; // Tracks supply per token ID
    mapping(address => RetirementCertificate[])
        public userRetirementCertificates;
    mapping(bytes32 => RetirementCertificate) public certificateById;
    uint256 public totalSupply; // Total credits minted
    uint256 public totalRetired; // Total credits retired
    uint256 public mintTimestamp; // Timestamp of first mint

    // Configurable parameters
    uint256 public maxPerWallet = 100_000;
    uint256 public mintPrice;
    bytes32 public defaultIsPermanent;
    bytes32 public defaultValidity;
    bytes32 public defaultVintage;
    bool public mintingActive = true;
    ICarbonCreditRegistry public registry; // ProjectData

    // Custom errors
    error InvalidVintage();
    error InvalidValidity();
    error InvalidTreasury();
    error MintingClosed();
    error ProjectNotApproved();
    error ExceedsCreditsIssued();
    error InvalidQuantity();
    error ExceedsMaxPerWallet();
    error InsufficientPayment();
    error TransferFailed();
    error TokenDoesNotExist();
    error InsufficientBalanceToRetire();
    error OnlyGovernance();
    error InvalidGovernanceAddress();
    error InvalidRegistryAddress();
    error AlreadyRetired();
    error VintageNotPassed();
    error ValidityExpired();
    error InvalidMaxPerWallet();
    error InvalidTokenId();
    error InvalidURI();
    error tokenURINotSet();
    error InvalidAddress();
    error InvalidMethodology();
    error InvalidLocation();

    // Events
    event CertificateIDUpdated(string certificateId);
    event MaxPerWalletUpdated(uint256 newMax);
    event TreasuryUpdated(address indexed newTreasury);
    event CreditsMinted(address indexed account, uint256 quantity);
    event CreditsRetired(address indexed account, uint256 quantity);
    event TokenURIUpdated(uint256 indexed tokenId, string uri);
    event MintingStopped();

    /// @notice Constructor to initialize the contract
    /// @param _projectId The project ID
    /// @param initialOwner The initial owner address
    /// @param _mintPrice The price to mint one credit
    /// @param _defaultIsPermanent Whether credits are permanent
    /// @param _defaultValidity The validity period in years
    /// @param _defaultVintage The vintage year
    /// @param _governance The registry contract address
    /// @param _rusd The RUSD token address
    /// @param _methodologyId the index id for methodology adopted
    /// @param _location of the project
    constructor(
        string memory _projectId,
        address initialOwner,
        uint256 _mintPrice,
        bool _defaultIsPermanent,
        uint256 _defaultValidity,
        uint256 _defaultVintage,
        address _governance,
        address _registry,
        IERC20 _rusd,
        uint8 _methodologyId,
        string memory _location
    ) ERC1155("") Ownable(initialOwner) {
        if (_defaultVintage == 0 || _defaultVintage < 946684800)
            revert InvalidVintage(); // Jan 1, 2000
        if (!_defaultIsPermanent && _defaultValidity == 0)
            revert InvalidValidity();
        if (_defaultValidity > 100) revert InvalidValidity(); // Max 100 years
        if (_registry == address(0)) revert InvalidRegistryAddress();
        if (_governance == address(0)) revert InvalidGovernanceAddress();
        if (address(_rusd) == address(0)) revert InvalidAddress();
        if (_methodologyId > uint8(type(MethodologyUtils.Methodology).max))
            revert InvalidMethodology();
        if (bytes(_location).length == 0) revert InvalidLocation();

        projectId = _projectId;
        mintPrice = _mintPrice;
        treasury = initialOwner;
        defaultIsPermanent = _defaultIsPermanent
            ? bytes32("true")
            : bytes32("false");
        defaultValidity = _defaultIsPermanent
            ? bytes32(uint256(0))
            : bytes32(_defaultValidity);
        defaultVintage = bytes32(_defaultVintage);
        registry = ICarbonCreditRegistry(_registry);
        governance = _governance;
        RUSD = IERC20(_rusd);
        methodology = MethodologyUtils.Methodology(_methodologyId);
        location = _location;

        // Initialize traits
        _initializeTraits(unit_tCO2_TOKEN_ID, bytes32("false"));
        _initializeTraits(unit_tCO2_RETIRED_TOKEN_ID, bytes32("true"));
    }

    /// @notice Initializes traits for a token ID
    function _initializeTraits(uint256 tokenId, bytes32 retirementStatus)
        private
    {
        _traits[tokenId][IS_PERMANENT] = defaultIsPermanent;
        _traits[tokenId][VALIDITY] = defaultValidity;
        _traits[tokenId][VINTAGE] = defaultVintage;
        _traits[tokenId][RETIREMENT_STATUS] = retirementStatus;
        _traits[tokenId][METHODOLOGY] = bytes32(
            bytes(MethodologyUtils.getName(methodology))
        );
        _traits[tokenId][CATEGORY] = bytes32(
            bytes(MethodologyUtils.getCategory(methodology))
        );
        _traits[tokenId][VERSION] = bytes32(
            bytes(MethodologyUtils.getVersion(methodology))
        );

        emit TraitUpdated(IS_PERMANENT, tokenId, defaultIsPermanent);
        emit TraitUpdated(VALIDITY, tokenId, defaultValidity);
        emit TraitUpdated(VINTAGE, tokenId, defaultVintage);
        emit TraitUpdated(RETIREMENT_STATUS, tokenId, retirementStatus);
        emit TraitUpdated(METHODOLOGY, tokenId, _traits[tokenId][METHODOLOGY]);
        emit TraitUpdated(CATEGORY, tokenId, _traits[tokenId][CATEGORY]);
        emit TraitUpdated(VERSION, tokenId, _traits[tokenId][VERSION]);
    }

    /// @notice Sets the URI for a specific token ID
    /// @param _nonRetiredURI The URI for non retired tokens
    /// @param _retiredURI The URI for retied tokens
    function setTokenURI(
        string memory _nonRetiredURI,
        string memory _retiredURI
    ) external onlyOwner {
        if (bytes(_nonRetiredURI).length == 0 || bytes(_retiredURI).length == 0)
            revert InvalidURI();
        // Set token URIs
        tokenURIs[unit_tCO2_TOKEN_ID] = _nonRetiredURI;
        tokenURIs[unit_tCO2_RETIRED_TOKEN_ID] = _retiredURI;
        emit TokenURIUpdated(unit_tCO2_TOKEN_ID, _nonRetiredURI);
        emit TokenURIUpdated(unit_tCO2_RETIRED_TOKEN_ID, _retiredURI);
    }

    /// @notice Returns the URI for a token ID
    /// @param tokenId The token ID
    /// @return The URI for the token
    function uri(uint256 tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        if (
            tokenId != unit_tCO2_TOKEN_ID &&
            tokenId != unit_tCO2_RETIRED_TOKEN_ID
        ) revert InvalidTokenId();
        return tokenURIs[tokenId];
    }

    /// @notice Updates the maximum credits per wallet
    /// @param newMax The new maximum
    function setMaxPerWallet(uint256 newMax) external onlyOwner {
        if (newMax == 0) revert InvalidMaxPerWallet();
        maxPerWallet = newMax;
        emit MaxPerWalletUpdated(newMax);
    }

    /// @notice Updates the treasury address
    /// @param _newTreasury The new treasury address
    function updateTreasury(address _newTreasury) external onlyOwner {
        if (_newTreasury == address(0)) revert InvalidTreasury();
        treasury = _newTreasury;
        emit TreasuryUpdated(_newTreasury);
    }

    /// @notice Updates the certificate ID (called by governance)
    /// @param _certificateId The new certificate ID
    function _setCertificateId(string memory _certificateId)
        external
        onlyGovernance
    {
        certificateId = _certificateId;
        emit CertificateIDUpdated(_certificateId);
    }

    /// @notice Stops minting
    function stopMinting() external onlyOwner {
        if (!mintingActive) revert MintingClosed();
        mintingActive = false;
        emit MintingStopped();
    }

    /// @notice Mints carbon credits with RUSD
    /// @param quantity The number of credits to mint
    function mintWithRUSD(uint256 quantity) external nonReentrant {
        if (!mintingActive) revert MintingClosed();
        if (!registry.isProjectApproved(address(this)))
            revert ProjectNotApproved();
        uint256 creditsIssued = registry.creditAmountIssued(address(this));
        if (creditsIssued == 0 || totalSupply + quantity > creditsIssued)
            revert ExceedsCreditsIssued();
        if (quantity == 0) revert InvalidQuantity();
        if (walletMinted[msg.sender] + quantity > maxPerWallet)
            revert ExceedsMaxPerWallet();
        uint256 payableAmount = mintPrice * quantity;
        if (RUSD.balanceOf(msg.sender) < payableAmount)
            revert InsufficientPayment();
        if (RUSD.allowance(msg.sender, address(this)) < payableAmount)
            revert InsufficientPayment();
        if (
            bytes(uri(unit_tCO2_TOKEN_ID)).length == 0 ||
            bytes(uri(unit_tCO2_RETIRED_TOKEN_ID)).length == 0
        ) revert tokenURINotSet();

        // Transfer RUSD to treasury
        bool success = RUSD.transferFrom(msg.sender, treasury, payableAmount);
        if (!success) revert TransferFailed();

        // Update mint timestamp on first mint
        if (totalSupply == 0) {
            mintTimestamp = block.timestamp;
        }

        // Mint tokens
        totalSupply += quantity;
        totalSupplyByTokenId[unit_tCO2_TOKEN_ID] += quantity;
        walletMinted[msg.sender] += quantity;
        _mint(msg.sender, unit_tCO2_TOKEN_ID, quantity, "");

        emit CreditsMinted(msg.sender, quantity);
    }

    /// @notice Retires a specified quantity of carbon credits
    /// @param quantity The number of credits to retire
    function retire(uint256 quantity) external nonReentrant {
        if (quantity == 0) revert InvalidQuantity();
        uint256 balance = balanceOf(msg.sender, unit_tCO2_TOKEN_ID);
        if (balance < quantity) revert InsufficientBalanceToRetire();
        if (block.timestamp < uint256(_traits[unit_tCO2_TOKEN_ID][VINTAGE]))
            revert VintageNotPassed();
        if (!isValid(unit_tCO2_TOKEN_ID)) revert ValidityExpired();

        // Transfer credits to retired token ID
        _burn(msg.sender, unit_tCO2_TOKEN_ID, quantity);

        uint256 retireTimestamp = block.timestamp;

        // Generate certificate ID
        bytes32 certId = keccak256(
            abi.encodePacked(msg.sender, quantity, retireTimestamp, projectId)
        );

        // Create and store retirement certificate
        RetirementCertificate memory cert = RetirementCertificate({
            certificateId: certId,
            owner: msg.sender,
            tonnesRetired: quantity * tonnesPerToken,
            retireTimestamp: retireTimestamp
        });
        userRetirementCertificates[msg.sender].push(cert);
        certificateById[certId] = cert;

        // Update retirement tracking
        totalSupplyByTokenId[unit_tCO2_TOKEN_ID] -= quantity;
        totalSupplyByTokenId[unit_tCO2_RETIRED_TOKEN_ID] += quantity;
        walletRetired[msg.sender] += quantity;
        totalRetired += quantity;

        _mint(msg.sender, unit_tCO2_RETIRED_TOKEN_ID, quantity, "");

        emit CreditsRetired(msg.sender, quantity);
    }

    /// @notice gets all retirement certificate counts for a user
    function getRetirementCertificateCount(address user)
        external
        view
        returns (uint256)
    {
        return userRetirementCertificates[user].length;
    }

    /// @notice Generates a retirement certificate hash for a specific certificate
    function getRetirementCertificate(address account, uint256 certificateIndex)
        external
        view
        returns (bytes32)
    {
        RetirementCertificate[] memory certs = userRetirementCertificates[
            account
        ];
        if (certificateIndex >= certs.length) return bytes32(0);
        RetirementCertificate memory cert = certs[certificateIndex];
        if (cert.tonnesRetired == 0) return bytes32(0);
        return
            keccak256(
                abi.encodePacked(
                    account,
                    cert.tonnesRetired,
                    cert.retireTimestamp,
                    projectId
                )
            );
    }

    /// @notice Validates a retirement certificate hash for regulatory compliance
    /// @param account The account to validate the certificate for
    /// @param certificateIndex The index of the certificate in the user's certificate array
    /// @param certificateHash The hash to validate
    /// @return isValidCert True if the provided hash matches the expected hash
    /// @return _tonnesRetired The total tonnes retired for the certificate
    function validateRetirementCertificate(
        address account,
        uint256 certificateIndex,
        bytes32 certificateHash
    ) external view returns (bool isValidCert, uint256 _tonnesRetired) {
        RetirementCertificate[] memory certs = userRetirementCertificates[
            account
        ];
        if (certificateIndex >= certs.length) {
            return (certificateHash == bytes32(0), 0);
        }
        RetirementCertificate memory cert = certs[certificateIndex];
        _tonnesRetired = cert.tonnesRetired;
        if (cert.tonnesRetired == 0) {
            return (certificateHash == bytes32(0), 0);
        }
        bytes32 expectedHash = keccak256(
            abi.encodePacked(
                account,
                cert.tonnesRetired,
                cert.retireTimestamp,
                projectId
            )
        );
        isValidCert = certificateHash == expectedHash;
        return (isValidCert, _tonnesRetired);
    }

    /// @notice Checks if a token ID is valid
    /// @param tokenId The token ID to check
    /// @return True if the token is valid
    function isValid(uint256 tokenId) public view returns (bool) {
        if (
            tokenId != unit_tCO2_TOKEN_ID &&
            tokenId != unit_tCO2_RETIRED_TOKEN_ID
        ) revert InvalidTokenId();
        if (_traits[tokenId][IS_PERMANENT] == bytes32(0))
            revert TokenDoesNotExist();
        if (_traits[tokenId][IS_PERMANENT] == bytes32("true")) {
            return true;
        }
        uint256 validityYears = uint256(_traits[tokenId][VALIDITY]);
        if (validityYears == 0) {
            return true;
        }
        uint256 validitySeconds = validityYears * 365 * 24 * 60 * 60;
        return block.timestamp <= mintTimestamp + validitySeconds;
    }

    /// @notice Gets the total supply for a specific token ID
    /// @param tokenId The token ID
    /// @return The total supply for the token ID
    function getTotalSupplyByTokenId(uint256 tokenId)
        external
        view
        returns (uint256)
    {
        if (
            tokenId != unit_tCO2_TOKEN_ID &&
            tokenId != unit_tCO2_RETIRED_TOKEN_ID
        ) revert InvalidTokenId();
        return totalSupplyByTokenId[tokenId];
    }

    /// @notice Gets the non-retired supply
    /// @return The non-retired supply
    function getNonRetiredSupply() external view returns (uint256) {
        return totalSupply - totalRetired;
    }

    /// @notice Gets the trait value for a token ID
    /// @param tokenId The token ID
    /// @param traitKey The trait key
    /// @return The trait value
    function getTraitValue(uint256 tokenId, bytes32 traitKey)
        external
        view
        override
        returns (bytes32)
    {
        if (
            tokenId != unit_tCO2_TOKEN_ID &&
            tokenId != unit_tCO2_RETIRED_TOKEN_ID
        ) revert InvalidTokenId();
        if (_traits[tokenId][IS_PERMANENT] == bytes32(0))
            revert TokenDoesNotExist();
        return _traits[tokenId][traitKey];
    }

    /// @notice Gets multiple trait values for a token ID
    /// @param tokenId The token ID
    /// @param traitKeys The trait keys
    /// @return The trait values
    function getTraitValues(uint256 tokenId, bytes32[] calldata traitKeys)
        external
        view
        override
        returns (bytes32[] memory)
    {
        if (
            tokenId != unit_tCO2_TOKEN_ID &&
            tokenId != unit_tCO2_RETIRED_TOKEN_ID
        ) revert InvalidTokenId();
        if (_traits[tokenId][IS_PERMANENT] == bytes32(0))
            revert TokenDoesNotExist();
        bytes32[] memory values = new bytes32[](traitKeys.length);
        for (uint256 i = 0; i < traitKeys.length && i < 10; i++) {
            // Limit to 10 traits for gas efficiency
            values[i] = _traits[tokenId][traitKeys[i]];
        }
        return values;
    }

    /// @notice Checks if the contract supports an interface
    /// @param interfaceId The interface ID
    /// @return True if the interface is supported
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override
        returns (bool)
    {
        return
            interfaceId == type(IERC7496).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    // Modifier to restrict access to governance contract
    modifier onlyGovernance() {
        if (msg.sender != governance) revert OnlyGovernance();
        _;
    }

    /// @notice Updates token balances with custom checks
    /// @param from The sender address
    /// @param to The recipient address
    /// @param ids The token IDs
    /// @param amounts The amounts
    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts
    ) internal virtual override {
        for (uint256 i = 0; i < ids.length; i++) {
            if (
                ids[i] != unit_tCO2_TOKEN_ID &&
                ids[i] != unit_tCO2_RETIRED_TOKEN_ID
            ) revert InvalidTokenId();
            if (_traits[ids[i]][IS_PERMANENT] == bytes32(0))
                revert TokenDoesNotExist();
            if (ids[i] == unit_tCO2_RETIRED_TOKEN_ID) {
                // Allow minting of retired tokens within retire function, but forbid burning & transfers
                if (from != address(0)) revert AlreadyRetired();
            }
            if (!isValid(ids[i])) revert ValidityExpired();
            if (block.timestamp < uint256(_traits[ids[i]][VINTAGE]))
                revert VintageNotPassed();
        }
        super._update(from, to, ids, amounts);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../MethodologyUtils.sol";

interface IProjectData {
    // --- Struct getters are not supported in interfaces, so only functions returning structs or arrays are declared

    // State variables (public getters)
    function manager() external view returns (address);
    function factory() external view returns (address);
    function governance() external view returns (address);

    function projectCounter() external view returns (uint256);
    function certificateCounter() external view returns (uint256);

    function isListed(address projectContract) external view returns (bool);
    function isApproved(address projectContract) external view returns (bool);

    function projects(address projectContract) external view 
        returns (
            address projectContract_,
            string memory projectId,
            string memory certificateId,
            MethodologyUtils.Methodology methodology,
            uint256 emissionReductions,
            string memory projectDetails,
            address proposer,
            uint256 listingTimestamp,
            uint256 vintageTimestamp,
            uint256 commentPeriodEnd,
            uint256 credits,
            bool isValidated,
            bool isVerified
        );

    function authorizedProjectOwners(address projectContract, address owner) external view returns (bool);
    function checkAuthorizedVVBs(address projectContract, address vvb) external returns(bool);
    function getAuthorizedVVBs(address projectAddress) external view returns (address[] memory);

    function userListedProjects(address user, uint256 index) external view returns (address);
    function listedProjects(uint256 index) external view returns (address);
    function approvedProjects(uint256 index) external view returns (address);

    // Methods
    function setManager(address _manager) external;
    function setFactory(address _factory) external;
    function updateGovernance(address _governance) external;

    function getNextBaseProjectId() external returns (string memory baseProjectId, uint256 id);
    function getNextBaseCertificateId(address projectContract)
        external
        returns (string memory baseCertificateId, uint256 id);

    function _registerProject(
        bool _isPresale,
        string calldata _projectId,
        address _projectContract,
        uint8 _methodologyIndex,
        uint256 _emissionReductions,
        string calldata _projectDetails,
        address _proposer
    ) external;

    function _setCommentDeadline(address _projectContract, uint256 _commentPeriod) external;
    function _setDefaultVintage(address _projectContract, uint256 _defaultVintage) external;
    function _addAuthorizedVVBs(address projectContract, address vvb) external;
    function _addComment(address projectContract, string calldata comment, address commenter) external;
    function _setValidationStatus(address projectContract, bool status) external;
    function _setVerificationStatus(address projectContract, bool status) external;
    function _finalApproval(address projectContract, uint256 amount, string calldata certificateId) external;
    function _approvePresale(address projectContract, uint256 presaleAmount) external;
    function _removeProject(address projectContract) external;

    // Views
    function getProjectDetails(address projectContract) external view returns (
        address projectContract_,
        string memory projectId,
        string memory certificateId,
        MethodologyUtils.Methodology methodology,
        uint256 emissionReductions,
        string memory projectDetails,
        address proposer,
        uint256 listingTimestamp,
        uint256 vintageTimestamp,
        uint256 commentPeriodEnd,
        uint256 credits,
        bool isValidated,
        bool isVerified
        // Comments array is complex, it is accessed by getProjectComments
        // So omit here or return pointer to comments length etc.
        // You may implement a separate view for comments array.
    );

    function getProjectComments(address projectContract)
        external 
        view
        returns (string[] memory comments, address[] memory commenters);

    function getPresaleStatus(address projectContract) external view returns (bool listed, uint256 amount);
    function isProjectApproved(address projectContract) external view returns (bool);
    function creditAmountIssued(address projectContract) external view returns (uint256);
    function getListedProjects() external view returns (address[] memory);
    function getApprovedProjects() external view returns (address[] memory);
    function getAuthorizedProjectOwners(address projectContract) external view returns (address[] memory owners);
}

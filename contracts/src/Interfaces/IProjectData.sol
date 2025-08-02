// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../MethodologyUtils.sol";

interface IProjectData {
    struct Project {
        address projectContract;
        string projectId;
        string certificateId;
        MethodologyUtils.Methodology methodology;
        uint256 emissionReductions;
        string projectDetails;
        address proposer;
        uint256 listingTimestamp;
        uint256 vintageTimestamp;
        uint256 commentPeriodEnd;
        uint256 credits;
        bool isValidated;
        bool isVerified;
    }

    function _registerProject(
        bool _isPresale,
        string memory _projectId,
        address _projectContract,
        uint8 _methodologyIndex,
        uint256 _emissionReductions,
        string memory _projectDetails,
        address _proposer,
        uint256 _vintageTimestamp,
        uint256 _commentPeriod
    ) external;

    function _addComment(
        address projectContract,
        string memory comment,
        address commenter
    ) external;

    function _setValidationStatus(address projectContract, bool status) external;

    function _setVerificationStatus(address projectContract, bool status) external;

     function _approvePresale(
        address projectContract,
        uint256 presaleAmount
    ) external;

    function _finalApproval(
        address projectContract,
        uint256 amount,
        string memory certificateId
    ) external;

    function _removeProject(address projectContract) external;

    function authorizedProjectOwners(address projectContract, address owner) external view returns (bool);

    function getProjectDetails(address projectContract) external view returns (Project memory);

    function getListedProjects() external view returns (address[] memory);

    function getPresaleStatus(address projectContract) external view returns (bool listed, uint256 amount);

    function getNextBaseProjectId() external returns (string memory, uint256);

    function getNextBaseCertificateId(address projectContract) external returns (string memory, uint256);

    function isListed(address projectContract) external view returns (bool);

    function isApproved(address projectContract) external view returns (bool);
}
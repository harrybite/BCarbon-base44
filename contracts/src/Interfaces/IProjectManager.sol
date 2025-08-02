// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IProjectManager {
    // Events
    event CommentPeriodUpdated(uint256 newPeriod);
    event GovernanceUpdated(address indexed newGovernance);
    event ProjectDataUpdated(address indexed newProjectData);

    // State variable getters
    function projectData() external view returns (address);
    function governance() external view returns (address);
    function commentPeriod() external view returns (uint256);

    // External/public functions
    function pause() external;
    function unpause() external;
    function setCommentPeriod(uint256 newPeriod) external;
    function updateGovernance(address newGovernance) external;
    function updateProjectData(address newProjectData) external;

    function submitComment(address projectContract, string calldata comment) external;
    function setValidationStatus(address projectContract) external;
    function setVerificationStatus(address projectContract) external;
    function issueCredits(address projectContract, uint256 amount, string calldata certificateId) external;
    function removeProject(address projectContract) external;
}

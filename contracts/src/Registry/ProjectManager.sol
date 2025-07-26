// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/Pausable.sol";
import "./ProjectData.sol";
import "../IBCO2Governance.sol";

contract ProjectManager is Ownable, Pausable, ReentrancyGuard {
    ProjectData public projectData;
    IBCO2Governance public governance;

    uint256 private constant MIN_COMMENT_PERIOD = 1 days;
    uint256 private constant MAX_COMMENT_PERIOD = 90 days;
    uint256 public commentPeriod = 90 days; // Default for testing

    // Events
    event CommentPeriodUpdated(uint256 newPeriod);
    event GovernanceUpdated(address indexed newGovernance);
    event ProjectDataUpdated(address indexed newProjectData);

    constructor(address _projectData, address _governance, address initialOwner) Ownable(initialOwner) {
        if (_projectData == address(0)) revert("Invalid ProjectData address");
        if (_governance == address(0)) revert("Invalid governance address");
        if (initialOwner == address(0)) revert("Invalid owner address");
        projectData = ProjectData(_projectData);
        governance = IBCO2Governance(_governance);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function setCommentPeriod(uint256 newPeriod) external onlyOwner {
        if (newPeriod < MIN_COMMENT_PERIOD || newPeriod > MAX_COMMENT_PERIOD) {
            revert("Invalid comment period");
        }
        commentPeriod = newPeriod;
        emit CommentPeriodUpdated(newPeriod);
    }

    function updateGovernance(address newGovernance) external onlyOwner {
        if (newGovernance == address(0)) revert("Invalid governance address");
        governance = IBCO2Governance(newGovernance);
        emit GovernanceUpdated(newGovernance);
    }

    function updateProjectData(address _newProjectData) external onlyOwner {
        if (_newProjectData == address(0)) revert("Invalid ProjectData address");
        projectData = ProjectData(_newProjectData);
        emit ProjectDataUpdated(_newProjectData);
    }

    function submitComment(address projectContract, string memory comment) external whenNotPaused nonReentrant {
        bool isVVB = governance.checkAuthorizedVVBs(msg.sender);
        bool isOwner = projectData.authorizedProjectOwners(projectContract, msg.sender);
        if (!isVVB && !isOwner) revert("Not authorized");
        projectData._addComment(projectContract, comment, msg.sender);
    }

    function setValidationStatus(address projectContract) external {
        if (msg.sender != address(governance)) revert("Only governance");
        projectData._setValidationStatus(projectContract, true);
    }

    function setVerificationStatus(address projectContract) external {
        if (msg.sender != address(governance)) revert("Only governance");
        projectData._setVerificationStatus(projectContract, true);
    }

    function issueCredits(address projectContract, uint256 amount, string memory certificateId) external {
        if (msg.sender != address(governance)) revert("Only governance");
        projectData._issueCredits(projectContract, amount, certificateId);
    }

    function removeProject(address projectContract) external {
        if (msg.sender != address(governance)) revert("Only governance");
        projectData._removeProject(projectContract);
    }
}
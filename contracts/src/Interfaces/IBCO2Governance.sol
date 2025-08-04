// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IBCO2Governance {
    // --- Manage Initialization and Admin ---
    function initialize(address _projectData, address _projectManager, address _bco2DAO) external;
    function updateProjectData(address _newProjectData) external;
    function updateProjectManager(address _newProjectManager) external;
    function updateBCO2DAO(address _newBCO2DAO) external;

    // --- Pausable ---
    function pause() external;
    function unpause() external;

    // --- Validator/Verifier Management ---
    function addValidator(address validator) external;
    function addVerifier(address verifier) external;
    function removeValidator(address validator) external;
    function removeVerifier(address verifier) external;
    function getAuthorizedValidators() external view returns(address[] memory);
    function getAuthorizedVerifiers() external view returns(address[] memory);
    function checkAuthorizedValidators(address _validator) external view returns (bool);
    function checkAuthorizedVerifiers(address _verifier) external view returns (bool);

    // --- Project Management ---
    function validateProject(address projectContract) external;
    function verifyProject(address projectContract) external;
    function approvePresaleAndIssuePresaleCredits(address projectContract, uint256 amount) external returns (bool);
    function approveAndIssueCredits(address projectContract, uint256 amount) external returns (bool);
    function rejectAndRemoveProject(address projectContract) external;

    // --- DAO Functions (forwarded to DAO) ---
    function extendVotingPeriod(uint256 requestID) external;
    function executeApprovalForWithdrawal(uint256 requestID, bool approve, uint256 approvedAmount) external;
    function setVotingDuration(uint256 newDuration) external;

    // --- Query/List ---
    function getListedProjects() external view returns (address[] memory);

    // --- State Variables (public) ---
    function projectData() external view returns (address);
    function projectManager() external view returns (address);
    function bco2DAO() external view returns (address);
    function owner() external view returns (address);

    function initialized() external view returns (bool);

    function authorizedValidatorCounter() external view returns (uint8);
    function authorizedVerifierCounter() external view returns (uint8);

    function listOfAuthorizedValidators(uint256) external view returns (address);
    function listOfAuthorizedVerifiers(uint256) external view returns (address);

    function authorizedValidators(address) external view returns (bool);
    function authorizedVerifiers(address) external view returns (bool);
    function totalCreditsIssued(address) external view returns (uint256);
}

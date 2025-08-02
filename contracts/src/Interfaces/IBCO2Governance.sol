// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IBCO2Governance {
    // Events
    event Initialized();
    event ProjectDataUpdated(address indexed newProjectData);
    event ProjectManagerUpdated(address indexed newProjectManager);
    event VVBAdded(address vvb);
    event VVBRemoved(address vvb);
    event ProjectValidated(address indexed projectContract, address vvb);
    event ProjectVerified(address indexed projectContract, address vvb);
    event CreditsIssued(address indexed projectContract, uint256 amount);
    event ProjectRemoved(address indexed projectContract);

    // State variable getters (public)
    function projectData() external view returns (address);
    function projectManager() external view returns (address);
    function bco2DAO() external view returns (address);
    function initialized() external view returns (bool);
    function authorizedVVBCounter() external view returns (uint8);
    function listOfAuthorizeVVBs(uint256 index) external view returns (address);

    // Mappings getters
    function authorizedVVBs(address vvb) external view returns (bool);
    function totalCreditsIssued(address projectContract) external view returns (uint256);

    // External / public functions
    function pause() external;
    function unpause() external;
    function initialize(address _projectData, address _projectManager, address _bco2DAO) external;
    function updateProjectData(address _newProjectData) external;
    function updateProjectManager(address _newProjectManager) external;
    function addVVB(address vvb) external;
    function removeVVB(address vvb) external;
    function validateProject(address projectContract) external;
    function verifyProject(address projectContract) external;
    function approveAndIssueCredits(address projectContract, uint256 amount) external returns (bool);
    function extendVotingPeriod(uint256 requestID) external;
    function executeApprovalForWithdrawal(uint256 requestID, bool approve, uint256 approvedAmount) external;
    function setVotingDuration(uint256 newDuration) external;
    function rejectAndRemoveProject(address projectContract) external;
    function getListedProjects() external view returns (address[] memory);
    function checkAuthorizedVVBs(address _vvb) external view returns (bool);
    function getAuthorizedVVBs() external view returns(address[] memory);
}

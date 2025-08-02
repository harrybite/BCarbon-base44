// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./Registry/ProjectData.sol";
import "./Interfaces/IProjectManager.sol";
import "./Interfaces/IBCO2DAO.sol";

interface IBCO2Certificate {
    function _setCertificateId(string memory _certificateId)
        external;
}

contract BCO2Governance is Ownable, Pausable {
    // State variables for split contracts
    ProjectData public projectData;
    IProjectManager public projectManager;
    IBCO2DAO public bco2DAO;

    bool public initialized;

    uint8 public authorizedVVBCounter;

    address[] public listOfAuthorizeVVBs;

    // Mappings
    mapping(address => bool) public authorizedVVBs;
    mapping(string => bool) private _usedCertificateIds;
    mapping(address => uint256) public totalCreditsIssued;

    // Custom errors
    error notInitialized();
    error InvalidVVBAddress();
    error VVBAlreadyAuthorized();
    error VVBNotAuthorized();
    error ProjectNotListed();
    error CommentPeriodNotEnded();
    error ProjectAlreadyValidated();
    error ProjectNotValidated();
    error ProjectAlreadyVerified();
    error InvalidCreditAmount();
    error EmptyCertificateId();
    error CertificateIdAlreadyUsed();
    error CreditsAlreadyIssued();
    error CannotRemoveProjectWithCredits();

    // Events
    event Initialized();
    event ProjectDataUpdated(address indexed newProjectData);
    event ProjectManagerUpdated(address indexed newProjectManager);
    event BCO2DAOUpdated(address indexed newBCO2DAO);
    event VVBAdded(address vvb);
    event VVBRemoved(address vvb);
    event ProjectValidated(address indexed projectContract, address vvb);
    event ProjectVerified(address indexed projectContract, address vvb);
    event CreditsIssued(address indexed projectContract, uint256 amount);
    event ProjectRemoved(address indexed projectContract);

    constructor() Ownable(msg.sender) {}

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function initialize(address _projectData, address _projectManager, address _bco2DAO) external onlyOwner {
        require(!initialized, "Already initialized");
        require(_projectData != address(0), "Invalid ProjectData address");
        require(_projectManager != address(0), "Invalid ProjectManager address");
        projectData = ProjectData(_projectData);
        projectManager = IProjectManager(_projectManager);
        bco2DAO = IBCO2DAO(_bco2DAO);
        initialized = true;
        emit Initialized();
    }

    function updateProjectData(address _newProjectData) external onlyOwner {
        require(_newProjectData != address(0), "Invalid ProjectData address");
        projectData = ProjectData(_newProjectData);
        emit ProjectDataUpdated(_newProjectData);
    }

    function updateProjectManager(address _newProjectManager) external onlyOwner {
        require(_newProjectManager != address(0), "Invalid ProjectManager address");
        projectManager = IProjectManager(_newProjectManager);
        emit ProjectManagerUpdated(_newProjectManager);
    }

    function updateBCO2DAO(address _newBCO2DAO) external onlyOwner {
        require(_newBCO2DAO != address(0), "Invalid BCO2DAO address");
        bco2DAO = IBCO2DAO(_newBCO2DAO);
        emit BCO2DAOUpdated(_newBCO2DAO);
    }

    function addVVB(address vvb) external onlyOwner {
        if (!initialized) revert notInitialized();
        if (vvb == address(0)) revert InvalidVVBAddress();
        if (authorizedVVBs[vvb]) revert VVBAlreadyAuthorized();
        authorizedVVBs[vvb] = true;
        listOfAuthorizeVVBs.push(vvb);
        authorizedVVBCounter++;
        emit VVBAdded(vvb);
    }

    function removeVVB(address vvb) external onlyOwner {
        if (!initialized) revert notInitialized();
        if (!authorizedVVBs[vvb]) revert VVBNotAuthorized();
        
        authorizedVVBs[vvb] = false;
        authorizedVVBCounter--;

        for (uint256 i = 0; i < listOfAuthorizeVVBs.length; i++) {
            if (listOfAuthorizeVVBs[i] == vvb) {
                listOfAuthorizeVVBs[i] = listOfAuthorizeVVBs[listOfAuthorizeVVBs.length - 1];
                listOfAuthorizeVVBs.pop();
                break;
            }
        }

        emit VVBRemoved(vvb);
    }

    function validateProject(address projectContract) external whenNotPaused {
        if (!initialized) revert notInitialized();
        if (!authorizedVVBs[msg.sender]) revert VVBNotAuthorized();
        projectManager.setValidationStatus(projectContract);
        emit ProjectValidated(projectContract, msg.sender);
    }

    function verifyProject(address projectContract) external whenNotPaused {
        if (!initialized) revert notInitialized();
        if (!authorizedVVBs[msg.sender]) revert VVBNotAuthorized();
        projectManager.setVerificationStatus(projectContract);
        emit ProjectVerified(projectContract, msg.sender);
    }

    function approveAndIssueCredits(
        address projectContract,
        uint256 amount
    ) external onlyOwner whenNotPaused returns (bool) {
        ProjectData.Project memory project = projectData.getProjectDetails(projectContract);
        if (!project.isVerified && !project.isValidated) revert ProjectNotValidated();
        if (project.credits != 0) revert CreditsAlreadyIssued();
        if (amount == 0 || amount > project.emissionReductions) revert InvalidCreditAmount();

        (string memory baseCertificateId, ) = projectData.getNextBaseCertificateId(projectContract);
        
        if (bytes(baseCertificateId).length == 0) revert EmptyCertificateId();
        if (_usedCertificateIds[baseCertificateId]) revert CertificateIdAlreadyUsed();
        IBCO2Certificate(projectContract)._setCertificateId(baseCertificateId);
        projectManager.issueCredits(projectContract, amount, baseCertificateId);

        _usedCertificateIds[baseCertificateId] = true;
        totalCreditsIssued[projectContract] = amount;

        emit CreditsIssued(projectContract, amount);

        return true;
    }

    function extendVotingPeriod(uint256 requestID) external onlyOwner {
        bco2DAO.extendVotingPeriod(requestID);
    }

    function executeApprovalForWithdrawal(uint256 requestID, bool approve, uint256 approvedAmount) external onlyOwner {
        bco2DAO.governanceDecision(requestID, approve, approvedAmount);
    }

    function setVotingDuration(uint256 newDuration) external onlyOwner {
        bco2DAO.setVotingDuration(newDuration);
    }

    function rejectAndRemoveProject(address projectContract) external onlyOwner {
        if (!initialized) revert notInitialized();
        ProjectData.Project memory project = projectData.getProjectDetails(projectContract);
        if (project.credits != 0) revert CannotRemoveProjectWithCredits();
        projectManager.removeProject(projectContract);
        emit ProjectRemoved(projectContract);
    }

    function getListedProjects() external view returns (address[] memory) {
        return projectData.getListedProjects();
    }

    function checkAuthorizedVVBs(address _vvb) external view returns (bool) {
        if (_vvb == address(0)) revert InvalidVVBAddress();
        return authorizedVVBs[_vvb];
    }

    function getAuthorizedVVBs() external view returns(address[] memory) {
        return listOfAuthorizeVVBs;
    }
}
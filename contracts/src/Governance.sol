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

    uint8 public authorizedValidatorCounter;
    uint8 public authorizedVerifierCounter;

    address[] public listOfAuthorizedValidators;
    address[] public listOfAuthorizedVerifiers;

    // Mappings
    mapping(address => bool) public authorizedValidators;
    mapping(address => bool) public authorizedVerifiers;
    mapping(string => bool) private _usedCertificateIds;
    mapping(address => uint256) public totalCreditsIssued;

    // Custom errors
    error notInitialized();
    error InvalidValidatorAddress();
    error InvalidVerifierAddress();
    error ValidatorAlreadyAuthorized();
    error VerifierAlreadyAuthorized();
    error ValidatorNotAuthorized();
    error VerifierNotAuthorized();
    error ProjectNotListed();
    error CommentPeriodNotEnded();
    error ProjectAlreadyValidated();
    error ProjectNotValidated();
    error ProjectAlreadyVerified();
    error ProjectNotVerified();
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
    event ValidatorAdded(address validator);
    event VerifierAdded(address verifier);
    event ValidatorRemoved(address validator);
    event VerifierRemoved(address verifier);
    event ProjectValidated(address indexed projectContract, address validator);
    event ProjectVerified(address indexed projectContract, address validator);
    event PresaleCreditsIssued(address indexed projectContract, uint256 amount);
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

    function addValidator(address validator) external onlyOwner {
        if (!initialized) revert notInitialized();
        if (validator == address(0)) revert InvalidValidatorAddress();
        if (authorizedValidators[validator]) revert ValidatorAlreadyAuthorized();
        authorizedValidators[validator] = true;
        listOfAuthorizedValidators.push(validator);
        authorizedValidatorCounter++;
        emit ValidatorAdded(validator);
    }

    function addVerifier(address verifier) external onlyOwner {
        if (!initialized) revert notInitialized();
        if (verifier == address(0)) revert InvalidVerifierAddress();
        if (authorizedVerifiers[verifier]) revert VerifierAlreadyAuthorized();
        authorizedVerifiers[verifier] = true;
        listOfAuthorizedVerifiers.push(verifier);
        authorizedVerifierCounter++;
        emit VerifierAdded(verifier);
    }

    function removeValidator(address validator) external onlyOwner {
        if (!initialized) revert notInitialized();
        if (!authorizedValidators[validator]) revert ValidatorNotAuthorized();
        
        authorizedValidators[validator] = false;
        authorizedValidatorCounter--;

        for (uint256 i = 0; i < listOfAuthorizedValidators.length; i++) {
            if (listOfAuthorizedValidators[i] == validator) {
                listOfAuthorizedValidators[i] = listOfAuthorizedValidators[listOfAuthorizedValidators.length - 1];
                listOfAuthorizedValidators.pop();
                break;
            }
        }

        emit ValidatorRemoved(validator);
    }

    function removeVerifier(address verifier) external onlyOwner {
        if (!initialized) revert notInitialized();
        if (!authorizedVerifiers[verifier]) revert VerifierNotAuthorized();
        
        authorizedVerifiers[verifier] = false;
        authorizedVerifierCounter--;

        for (uint256 i = 0; i < listOfAuthorizedVerifiers.length; i++) {
            if (listOfAuthorizedVerifiers[i] == verifier) {
                listOfAuthorizedVerifiers[i] = listOfAuthorizedVerifiers[listOfAuthorizedVerifiers.length - 1];
                listOfAuthorizedVerifiers.pop();
                break;
            }
        }

        emit VerifierRemoved(verifier);
    }

    function validateProject(address projectContract) external whenNotPaused {
        if (!initialized) revert notInitialized();
        if (!authorizedValidators[msg.sender]) revert ValidatorNotAuthorized();
        projectManager.setValidationStatus(projectContract);
        emit ProjectValidated(projectContract, msg.sender);
    }

    function verifyProject(address projectContract) external whenNotPaused {
        if (!initialized) revert notInitialized();
        if (!authorizedVerifiers[msg.sender]) revert VerifierNotAuthorized();
        projectManager.setVerificationStatus(projectContract);
        emit ProjectVerified(projectContract, msg.sender);
    }

    function approvePresaleAndIssuePresaleCredits(
        address projectContract,
        uint256 amount
    ) external onlyOwner whenNotPaused returns (bool) {
        ProjectData.Project memory project = projectData.getProjectDetails(projectContract);
        if (amount == 0 || amount > (project.emissionReductions / 2)) revert InvalidCreditAmount();

        projectManager.approvePresale(projectContract, amount);

        totalCreditsIssued[projectContract] += amount;

        emit PresaleCreditsIssued(projectContract, amount);

        return true;
    }

    function approveAndIssueCredits(
        address projectContract,
        uint256 amount
    ) external onlyOwner whenNotPaused returns (bool) {
        ProjectData.Project memory project = projectData.getProjectDetails(projectContract);
        if (!project.isValidated) revert ProjectNotValidated();
        if (!project.isVerified) revert ProjectNotVerified();
        if (amount == 0 || amount > project.emissionReductions) revert InvalidCreditAmount();

        (string memory baseCertificateId, ) = projectData.getNextBaseCertificateId(projectContract);
        
        if (bytes(baseCertificateId).length == 0) revert EmptyCertificateId();
        if (_usedCertificateIds[baseCertificateId]) revert CertificateIdAlreadyUsed();
        IBCO2Certificate(projectContract)._setCertificateId(baseCertificateId);
        projectManager.issueFinalApproval(projectContract, amount, baseCertificateId);

        _usedCertificateIds[baseCertificateId] = true;
        totalCreditsIssued[projectContract] += amount;

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

    function checkAuthorizedValidators(address _validator) external view returns (bool) {
        if (_validator == address(0)) revert InvalidValidatorAddress();
        return authorizedValidators[_validator];
    }

    function checkAuthorizedVerifiers(address _verifier) external view returns (bool) {
        if (_verifier == address(0)) revert InvalidVerifierAddress();
        return authorizedVerifiers[_verifier];
    }

    function getAuthorizedValidators() external view returns(address[] memory) {
        return listOfAuthorizedValidators;
    }

    function getAuthorizedVerifiers() external view returns(address[] memory) {
        return listOfAuthorizedVerifiers;
    }
}
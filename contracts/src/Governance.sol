// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Registry/ProjectManager.sol";

interface IBCO2 {
    function _setCertificateId(string memory certificateId) external;
}

interface IBCO2DAO {
    function extendVotingPeriod(uint256 requestId) external;
    function governanceDecision(uint256 requestId, bool approve, uint256 approvedAmount) external;
    function setVotingDuration(uint256 newDuration) external;
}

contract BCO2Governance is Ownable, Pausable {
    // State variables for split contracts
    ProjectData public projectData;
    ProjectManager public projectManager;

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
    event VVBAdded(address vvb);
    event VVBRemoved(address vvb);
    event ProjectValidated(address indexed projectContract, address vvb);
    event ProjectVerified(address indexed projectContract, address vvb);
    event CreditsIssued(address indexed projectContract, uint256 amount);
    event ProjectRemoved(address indexed projectContract);

    /// @notice Constructor to initialize the contract with the owner
    /// @param initialOwner The address of the initial owner
    constructor(address initialOwner) Ownable(initialOwner) {}

    /// @notice Pauses the contract, disabling governance actions
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Unpauses the contract, enabling governance actions
    function unpause() external onlyOwner {
        _unpause();
    }

    /// @notice Initializes the contract with ProjectData and ProjectManager addresses
    /// @param _projectData The address of the ProjectData contract
    /// @param _projectManager The address of the ProjectManager contract
    /// @param _bco2DAO The address of the BCO2 DAO contract
    function initialize(address _projectData, address _projectManager, address _bco2DAO) external onlyOwner {
        require(!initialized, "Already initialized");
        require(_projectData != address(0), "Invalid ProjectData address");
        require(_projectManager != address(0), "Invalid ProjectManager address");
        projectData = ProjectData(_projectData);
        projectManager = ProjectManager(_projectManager);
        bco2DAO = IBCO2DAO(_bco2DAO);
        initialized = true;
        emit Initialized();
    }

    /// @notice Updates the ProjectData address
    /// @param _newProjectData The new address of the ProjectData contract
    function updateProjectData(address _newProjectData) external onlyOwner {
        require(_newProjectData != address(0), "Invalid ProjectData address");
        projectData = ProjectData(_newProjectData);
        emit ProjectDataUpdated(_newProjectData);
    }

    /// @notice Updates the ProjectManager address
    /// @param _newProjectManager The new address of the ProjectManager contract
    function updateProjectManager(address _newProjectManager) external onlyOwner {
        require(_newProjectManager != address(0), "Invalid ProjectManager address");
        projectManager = ProjectManager(_newProjectManager);
        emit ProjectManagerUpdated(_newProjectManager);
    }

    /// @notice Adds an authorized VVB
    /// @param vvb The address of the VVB to add
    function addVVB(address vvb) external onlyOwner {
        if (!initialized) revert notInitialized();
        if (vvb == address(0)) revert InvalidVVBAddress();
        if (authorizedVVBs[vvb]) revert VVBAlreadyAuthorized();
        authorizedVVBs[vvb] = true;
        listOfAuthorizeVVBs.push(vvb);
        authorizedVVBCounter++;
        emit VVBAdded(vvb);
    }

    /// @notice Removes an authorized VVB
    /// @param vvb The address of the VVB to remove
    function removeVVB(address vvb) external onlyOwner {
        if (!initialized) revert notInitialized();
        if (!authorizedVVBs[vvb]) revert VVBNotAuthorized();
        
        authorizedVVBs[vvb] = false;
        authorizedVVBCounter--;

        // Remove from listOfAuthorizeVVBs
        for (uint256 i = 0; i < listOfAuthorizeVVBs.length; i++) {
            if (listOfAuthorizeVVBs[i] == vvb) {
                listOfAuthorizeVVBs[i] = listOfAuthorizeVVBs[listOfAuthorizeVVBs.length - 1];
                listOfAuthorizeVVBs.pop();
                break;
            }
        }

        emit VVBRemoved(vvb);
    }


    /// @notice Validates a project's design
    /// @param projectContract The address of the project contract
    function validateProject(address projectContract) external whenNotPaused {
        if (!initialized) revert notInitialized();
        if (!authorizedVVBs[msg.sender]) revert VVBNotAuthorized();
        projectManager.setValidationStatus(projectContract);
        emit ProjectValidated(projectContract, msg.sender);
    }

    /// @notice Verifies a project's emission reductions
    /// @param projectContract The address of the project contract
    function verifyProject(address projectContract) external whenNotPaused {
        if (!initialized) revert notInitialized();
        if (!authorizedVVBs[msg.sender]) revert VVBNotAuthorized();
        projectManager.setVerificationStatus(projectContract);
        emit ProjectVerified(projectContract, msg.sender);
    }

    /// @notice Approves a project and issues credits
    /// @param projectContract The address of the project contract
    /// @param amount The amount of credits to issue
    function approveAndIssueCredits(
        address projectContract,
        uint256 amount
    ) external onlyOwner whenNotPaused {
        ProjectData.Project memory project = projectData.getProjectDetails(projectContract);
        if (!project.isVerified || !project.isValidated) revert ProjectNotValidated();
        if (project.credits != 0) revert CreditsAlreadyIssued();
        if (amount == 0 || amount > project.emissionReductions) revert InvalidCreditAmount();

        // Generate certificate ID from ProjectData
        (string memory baseCertificateId, ) = projectData.getNextBaseCertificateId(projectContract);
        
        if (bytes(baseCertificateId).length == 0) revert EmptyCertificateId();
        if (_usedCertificateIds[baseCertificateId]) revert CertificateIdAlreadyUsed();

        _usedCertificateIds[baseCertificateId] = true;
        IBCO2(projectContract)._setCertificateId(baseCertificateId);
        projectManager.issueCredits(projectContract, amount, baseCertificateId);
        totalCreditsIssued[projectContract] = amount;

        emit CreditsIssued(projectContract, amount);
    }

    /// @notice Extends voting period on DAO contract for withdrawal requests
    /// @param requestID Request Id of the withdrawal
    function extendVotingPeriod(uint256 requestID) external onlyOwner {
        bco2DAO.extendVotingPeriod(requestID);
    }

    /// @notice Executes final decision of the Governance for withdrawal requests
    /// @param requestID Request Id of the withdrawal
    /// @param approve Decision of approval
    /// @param approvedAmount Amount of RUSD approved for withdrawal
    function executeApprovalForWithdrawal(uint256 requestID, bool approve, uint256 approvedAmount) external onlyOwner {
        bco2DAO.governanceDecision(requestID, approve, approvedAmount);
    }

    /// @notice Sets voting period for withdrawal requests in BCO2 DAO
    /// @param newDuration Duration of voting in seconds
    function setVotingDuration(uint256 newDuration) external onlyOwner {
        bco2DAO.setVotingDuration(newDuration);
    }

    /// @notice Rejects and removes a project
    /// @param projectContract The address of the project contract
    function rejectAndRemoveProject(address projectContract) external onlyOwner {
        if (!initialized) revert notInitialized();
        ProjectData.Project memory project = projectData.getProjectDetails(projectContract);
        if (project.credits != 0) revert CannotRemoveProjectWithCredits();
        projectManager.removeProject(projectContract);
        emit ProjectRemoved(projectContract);
    }

    /// @notice Gets all listed projects from ProjectData
    /// @return An array of listed project addresses
    function getListedProjects() external view returns (address[] memory) {
        return projectData.getListedProjects();
    }

    /// @notice Checks if an address is an authorized VVB
    /// @param _vvb The address to check
    /// @return True if the address is an authorized VVB
    function checkAuthorizedVVBs(address _vvb) external view returns (bool) {
        if (_vvb == address(0)) revert InvalidVVBAddress();
        return authorizedVVBs[_vvb];
    }

    function getAuthorizedVVBs() external view returns(address[] memory) {
        return listOfAuthorizeVVBs;
    }
}
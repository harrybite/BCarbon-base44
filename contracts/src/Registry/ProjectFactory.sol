// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ProjectManager.sol";

contract ProjectFactory is Ownable, Pausable, ReentrancyGuard {
    ProjectData public projectData;
    ProjectManager public projectManager;
    address public governance;
    IERC20 public RUSD;

    // Events
    event ProjectCreated(address indexed projectContract, address proposer);
    event RUSDUpdated(address indexed newRUSD);
    event ProjectDataUpdated(address indexed newProjectData);
    event ProjectManagerUpdated(address indexed newProjectManager);
    event GovernanceUpdated(address indexed newGovernance);

    constructor(
        address _projectData,
        address _projectManager,
        address _governance,
        address _RUSD,
        address initialOwner
    ) Ownable(initialOwner) {
        if (_projectData == address(0)) revert("Invalid ProjectData address");
        if (_projectManager == address(0)) revert("Invalid ProjectManager address");
        if (_governance == address(0)) revert ("Invalid Governance address");
        if (_RUSD == address(0)) revert("Invalid RUSD address");
        if (initialOwner == address(0)) revert("Invalid owner address");
        projectData = ProjectData(_projectData);
        projectManager = ProjectManager(_projectManager);
        governance = _governance;
        RUSD = IERC20(_RUSD);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function updateRUSD(address _newRUSD) external onlyOwner {
        if (_newRUSD == address(0)) revert("Invalid RUSD address");
        RUSD = IERC20(_newRUSD);
        emit RUSDUpdated(_newRUSD);
    }

    function updateProjectData(address _newProjectData) external onlyOwner {
        if (_newProjectData == address(0)) revert("Invalid ProjectData address");
        projectData = ProjectData(_newProjectData);
        emit ProjectDataUpdated(_newProjectData);
    }

    function updateGovernance(address _newGovernance) external onlyOwner {
        if (_newGovernance == address(0)) revert("Invalid ProjectData address");
        projectData = ProjectData(_newGovernance);
        emit GovernanceUpdated(_newGovernance);
    }

    function createAndListProject(
        uint256 mintPrice,
        address treasury,
        bool defaultIsPermanent,
        uint256 defaultValidity,
        uint256 defaultVintage,
        uint8 methodologyIndex,
        string memory location,
        uint256 emissionReductions,
        string memory projectDetails
    ) external whenNotPaused nonReentrant returns (address projectContract) {
        if (treasury == address(0)) revert("Invalid treasury address");
        if ((defaultIsPermanent && defaultValidity != 0) || (!defaultIsPermanent && defaultValidity == 0)) {
            revert("Invalid validity");
        }
        // if (defaultVintage == 0 || defaultVintage < block.timestamp + 90 days) {
        //     revert("Invalid vintage");
        // }
        if (emissionReductions == 0 || emissionReductions > 1_000_000_000) {
            revert("Invalid emission reductions");
        }
        if (methodologyIndex > 31) revert("Invalid methodology");
        if (bytes(projectDetails).length == 0) revert("Empty project details");

        (string memory baseId, ) = projectData.getNextBaseProjectId();

        try new BCO2(
            baseId,
            msg.sender,
            mintPrice,
            defaultIsPermanent,
            defaultValidity,
            defaultVintage,
            governance,
            address(projectData),
            RUSD,
            methodologyIndex,
            location
        ) returns (BCO2 deployed) {
            projectContract = address(deployed);
        } catch {
            revert("Failed to create BCO2 contract");
        }

        uint256 currentCommentPeriod = ProjectManager(projectManager).commentPeriod();

        projectData._registerProject(
            baseId,
            projectContract,
            methodologyIndex,
            emissionReductions,
            projectDetails,
            msg.sender,
            defaultVintage,
            currentCommentPeriod
        );

        emit ProjectCreated(projectContract, msg.sender);
        return projectContract;
    }
}
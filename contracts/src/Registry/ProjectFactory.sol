// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../Interfaces/IProjectData.sol";
import "../Interfaces/IProjectManager.sol";
import "../Interfaces/IBCO2Factory.sol";
import "../Interfaces/IBCO2Governance.sol";

interface IBCO2Config {
    function configParameters(
        uint256 _mintPrice,
        bool _defaultIsPermanent,
        uint256 _defaultValidity,
        uint256 _defaultVintage,
        string memory _nonRetiredURI,
        string memory _retiredURI
    ) external;
}

contract ProjectFactory is Ownable, Pausable, ReentrancyGuard {
    IProjectData public projectData;
    IProjectManager public projectManager;
    IBCO2Factory public bco2Factory;
    address public governance;
    address public bco2DAO;
    IERC20 public RUSD;

    // Events
    event ProjectCreated(address indexed projectContract, address proposer);
    event RUSDUpdated(address indexed newRUSD);
    event ProjectDataUpdated(address indexed newProjectData);
    event ProjectManagerUpdated(address indexed newProjectManager);
    event GovernanceUpdated(address indexed newGovernance);
    event BCO2FactoryUpdated(address indexed newBCO2Factory);

    constructor(
        address _projectData,
        address _projectManager,
        address _bco2Factory,
        address _governance,
        address _bco2DAO,
        address _RUSD
    ) Ownable(msg.sender) {
        if (_projectData == address(0)) revert("Invalid ProjectData address");
        if (_projectManager == address(0)) revert("Invalid ProjectManager address");
        if (_bco2Factory == address(0)) revert("Invalid BCO2Factory address");
        if (_governance == address(0)) revert("Invalid Governance address");
        if (_bco2DAO == address(0)) revert("Invalid DAO address");
        if (_RUSD == address(0)) revert("Invalid RUSD address");
        projectData = IProjectData(_projectData);
        projectManager = IProjectManager(_projectManager);
        bco2Factory = IBCO2Factory(_bco2Factory);
        governance = _governance;
        bco2DAO = _bco2DAO;
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
        projectData = IProjectData(_newProjectData);
        emit ProjectDataUpdated(_newProjectData);
    }

    function updateProjectManager(address _newProjectManager) external onlyOwner {
        if (_newProjectManager == address(0)) revert("Invalid ProjectManager address");
        projectManager = IProjectManager(_newProjectManager);
        emit ProjectManagerUpdated(_newProjectManager);
    }

    function updateGovernance(address _newGovernance) external onlyOwner {
        if (_newGovernance == address(0)) revert("Invalid Governance address");
        governance = _newGovernance;
        emit GovernanceUpdated(_newGovernance);
    }

    function updateBCO2Factory(address _newBCO2Factory) external onlyOwner {
        if (_newBCO2Factory == address(0)) revert("Invalid BCO2Factory address");
        bco2Factory = IBCO2Factory(_newBCO2Factory);
        emit BCO2FactoryUpdated(_newBCO2Factory);
    }

    function createAndListProject(
        uint256 mintPrice,
        bool isPresale,
        bool defaultIsPermanent,
        uint256 defaultValidity,
        uint256 defaultVintage,
        uint8 methodologyIndex,
        string memory location,
        uint256 emissionReductions,
        string memory projectDetails,
        address validator,
        address verifier
    ) external whenNotPaused nonReentrant returns (address projectContract) {
        if ((defaultIsPermanent && defaultValidity != 0) || (!defaultIsPermanent && defaultValidity == 0)) {
            revert("Invalid validity");
        }
        if (emissionReductions == 0 || emissionReductions > 1_000_000_000) {
            revert("Invalid emission reductions");
        }
        if (methodologyIndex > 31) revert("Invalid methodology");
        if (bytes(projectDetails).length == 0) revert("Empty project details");

        (string memory baseId, ) = projectData.getNextBaseProjectId();

        projectContract = bco2Factory.createBCO2(
            baseId,
            msg.sender,
            governance,
            address(projectData),
            bco2DAO,
            address(RUSD),
            methodologyIndex,
            location
        );

        uint256 currentCommentPeriod = projectManager.commentPeriod();

        projectData._registerProject(
            isPresale,
            baseId,
            projectContract,
            methodologyIndex,
            emissionReductions,
            projectDetails,
            msg.sender
        );

        projectData._setDefaultVintage(projectContract, defaultVintage);

        projectData._setCommentDeadline(projectContract, currentCommentPeriod);

        bool isValidator = IBCO2Governance(governance).checkAuthorizedValidators(validator);
        bool isVerifier = IBCO2Governance(governance).checkAuthorizedVerifiers(verifier);

        if(!isValidator) revert ("Validator is not approved by governance");
        if(!isVerifier) revert ("Verifier is not approved by governance");

        projectData._addAuthorizedVVBs(projectContract, validator);

        projectData._addAuthorizedVVBs(projectContract, verifier);

        IBCO2Config(projectContract).configParameters(
            mintPrice,
            defaultIsPermanent,
            defaultValidity,
            defaultVintage,
            "https://ipfs.io/ipfs/bafkreighdb436wagnvm7nnesxqcag72hkjgh62bwvc5r5tigctssn3tbw4?filename=1.json",
            "https://ipfs.io/ipfs/bafkreih7bu4stqoh76fb2unhzdj6ck5vm4vozmjgkox5q7lvftyknpsudi?filename=2.json"
        );

        emit ProjectCreated(projectContract, msg.sender);
        return projectContract;
    }
}
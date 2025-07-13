// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/Strings.sol";
import "../BCO2.sol";
import "./BokkyPooBahsDateTimeLibrary.sol";

contract ProjectData is Ownable {
    using MethodologyUtils for MethodologyUtils.Methodology;

    // Structs
    struct Comment {
        string comment;
        address commenter;
    }

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
        Comment[] comments;
        bool isValidated;
        bool isVerified;
    }

    // Mappings and arrays
    mapping(address => Project) public projects;
    mapping(address => bool) public isListed;
    mapping(address => bool) public isApproved;
    mapping(address => mapping(address => bool)) public authorizedProjectOwners;
    mapping(address => address[]) public userListedProjects;
    address[] public listedProjects;
    address[] public approvedProjects;
    uint256 public projectCounter;
    uint256 public certificateCounter;

    // Addresses of manager and factory
    address public manager;
    address public factory;
    address public governance;

    // Modifiers
    modifier onlyManager() {
        require(msg.sender == manager, "Only manager");
        _;
    }

    modifier onlyFactory() {
        require(msg.sender == factory, "Only factory");
        _;
    }

    modifier onlyGovernance() {
        require(msg.sender == governance, "Only governance");
        _;
    }

    // Events
    event ProjectListed(
        address indexed projectContract,
        address proposer,
        MethodologyUtils.Methodology methodology,
        uint256 emissionReductions
    );
    event CommentSubmitted(
        address indexed projectContract,
        string comment,
        address commenter
    );
    event ProjectValidated(address indexed projectContract);
    event ProjectVerified(address indexed projectContract);
    event CreditsIssued(
        address indexed projectContract,
        uint256 amount,
        string certificateId
    );
    event ProjectRemoved(address indexed projectContract);
    event ManagerUpdated(address indexed manager);
    event FactoryUpdated(address indexed factory);
    event GovernanceUpdated(address indexed governance);

    constructor(address initialOwner, address _governance)
        Ownable(initialOwner)
    {
        if (initialOwner == address(0)) revert("Invalid address");
        if (_governance == address(0)) revert("Invalid address");
        governance = _governance;
    }

    function setManager(address _manager) external onlyOwner {
        if (_manager == address(0) || _manager == manager) revert("Invalid address");
        manager = _manager;
        emit ManagerUpdated(_manager);
    }

    function setFactory(address _factory) external onlyOwner {
        if (_factory == address(0) || _factory == factory) revert("Invalid address");
        factory = _factory;
        emit FactoryUpdated(_factory);
    }

    function setGovernance(address _governance) external onlyOwner {
        if (_governance == address(0) || _governance == governance) revert("Invalid address");
        governance = _governance;
        emit GovernanceUpdated(_governance);
    }

    function _padUint(uint256 num, uint256 digits)
        internal
        pure
        returns (string memory)
    {
        string memory str = Strings.toString(num);
        uint256 len = bytes(str).length;
        if (len >= digits) return str;

        bytes memory padded = new bytes(digits);
        for (uint256 i = 0; i < digits - len; i++) {
            padded[i] = "0";
        }
        for (uint256 i = digits - len; i < digits; i++) {
            padded[i] = bytes(str)[i - (digits - len)];
        }
        return string(padded);
    }

    function _vintageYear(uint256 vintageTimestamp)
        internal
        pure
        returns (uint256)
    {
        (uint256 year, , ) = BokkyPooBahsDateTimeLibrary.timestampToDate(
            vintageTimestamp
        );
        return year;
    }

    function getNextBaseProjectId()
        external
        onlyFactory
        returns (string memory, uint256)
    {
        projectCounter += 1;
        string memory padded = _padUint(projectCounter, 4); // e.g., 0001
        string memory baseProjectId = string.concat("MAAL-", padded);
        return (baseProjectId, projectCounter);
    }

    function getNextBaseCertificateId(address projectContract) external onlyGovernance returns (string memory, uint256) {
        Project storage project = projects[projectContract];
        certificateCounter += 1;
        string memory padded = _padUint(certificateCounter, 6); // e.g., 000001
        uint256 vintageYear = _vintageYear(project.vintageTimestamp);
        string memory baseCertificateId = string.concat(
            project.projectId,
            "-",
            MethodologyUtils.getSymbol(project.methodology),
            "-",
            Strings.toString(vintageYear),
            "-",
            padded
        );
        return (baseCertificateId, certificateCounter);
    }

    function _registerProject(
        string memory _projectId,
        address _projectContract,
        uint8 _methodologyIndex,
        uint256 _emissionReductions,
        string memory _projectDetails,
        address _proposer,
        uint256 _vintageTimestamp,
        uint256 _commentPeriod
    ) external onlyFactory {
        if (_projectContract == address(0)) revert("Invalid project contract");
        if (_methodologyIndex > uint8(type(MethodologyUtils.Methodology).max))
            revert("Invalid methodology");
        if (_emissionReductions == 0 || _emissionReductions > 1_000_000_000)
            revert("Invalid emission reductions");
        if (bytes(_projectDetails).length == 0) revert("Empty project details");
        if (isListed[_projectContract]) revert("Project already listed");

        // string memory fullProjectId = string.concat(
        //     "MAAL-",
        //     Strings.toString(counter),
        //     "-",
        //     Strings.toString(_methodologyIndex)
        // );

        Project storage project = projects[_projectContract];
        project.projectContract = _projectContract;
        project.projectId = _projectId;
        project.methodology = MethodologyUtils.Methodology(_methodologyIndex);
        project.emissionReductions = _emissionReductions;
        project.projectDetails = _projectDetails;
        project.proposer = _proposer;
        project.listingTimestamp = block.timestamp;
        project.vintageTimestamp = _vintageTimestamp;
        project.commentPeriodEnd = block.timestamp + _commentPeriod;

        listedProjects.push(_projectContract);
        isListed[_projectContract] = true;
        authorizedProjectOwners[_projectContract][_proposer] = true;
        userListedProjects[_proposer].push(_projectContract);

        emit ProjectListed(
            _projectContract,
            _proposer,
            project.methodology,
            _emissionReductions
        );
    }

    function _addComment(
        address projectContract,
        string memory comment,
        address commenter
    ) external onlyManager {
        Project storage project = projects[projectContract];
        if (project.projectContract == address(0)) revert("Project not listed");
        if (block.timestamp > project.commentPeriodEnd)
            revert("Comment period ended");
        if (bytes(comment).length == 0) revert("Empty comment");

        project.comments.push(
            Comment({comment: comment, commenter: commenter})
        );
        emit CommentSubmitted(projectContract, comment, commenter);
    }

    function _setValidationStatus(address projectContract, bool status)
        external
        onlyManager
    {
        Project storage project = projects[projectContract];
        if (project.projectContract == address(0)) revert("Project not listed");
        if (project.isValidated && status) revert("Project already validated");
        project.isValidated = status;
        emit ProjectValidated(projectContract);
    }

    function _setVerificationStatus(address projectContract, bool status)
        external
        onlyManager
    {
        Project storage project = projects[projectContract];
        if (project.projectContract == address(0)) revert("Project not listed");
        if (!project.isValidated && status) revert("Project not validated");
        if (project.isVerified && status) revert("Project already verified");
        project.isVerified = status;
        emit ProjectVerified(projectContract);
    }

    function _issueCredits(
        address projectContract,
        uint256 amount,
        string memory certificateId
    ) external onlyManager {
        Project storage project = projects[projectContract];
        if (project.projectContract == address(0)) revert("Project not listed");
        if (!project.isVerified) revert("Project not verified");
        if (project.credits != 0 || isApproved[projectContract])
            revert("Credits already issued");
        if (bytes(certificateId).length == 0) revert("Empty certificate ID");
        if (amount == 0) revert("Invalid amount");

        project.credits = amount;
        project.certificateId = certificateId;
        isApproved[projectContract] = true;
        approvedProjects.push(projectContract);
        emit CreditsIssued(projectContract, amount, certificateId);
    }

    function _removeProject(address projectContract) external onlyManager {
        if (!isListed[projectContract]) revert("Project not listed");
        for (uint256 i = 0; i < listedProjects.length; i++) {
            if (listedProjects[i] == projectContract) {
                listedProjects[i] = listedProjects[listedProjects.length - 1];
                listedProjects.pop();
                break;
            }
        }
        isListed[projectContract] = false;
        if (isApproved[projectContract]) {
            for (uint256 i = 0; i < approvedProjects.length; i++) {
                if (approvedProjects[i] == projectContract) {
                    approvedProjects[i] = approvedProjects[
                        approvedProjects.length - 1
                    ];
                    approvedProjects.pop();
                    break;
                }
            }
            isApproved[projectContract] = false;
        }
        delete projects[projectContract];
        emit ProjectRemoved(projectContract);
    }

    // View functions
    function getProjectDetails(address projectContract)
        external
        view
        returns (Project memory)
    {
        Project storage project = projects[projectContract];
        if (project.projectContract == address(0)) revert("Project not listed");
        return project;
    }

    function getProjectComments(address projectContract)
        external
        view
        returns (Comment[] memory)
    {
        Project storage project = projects[projectContract];
        if (project.projectContract == address(0)) revert("Project not listed");
        return project.comments;
    }

    function isProjectApproved(address projectContract)
        external
        view
        returns (bool)
    {
        Project storage project = projects[projectContract];
        if (project.projectContract == address(0)) revert("Project not listed");
        return project.isVerified && project.credits != 0;
    }

    function creditAmountIssued(address projectContract)
        external
        view
        returns (uint256)
    {
        Project storage project = projects[projectContract];
        if (project.projectContract == address(0)) revert("Project not listed");
        return project.credits;
    }

    function getListedProjects() external view returns (address[] memory) {
        return listedProjects;
    }

    function getApprovedProjects() external view returns (address[] memory) {
        return approvedProjects;
    }

    function getAuthorizedProjectOwners(address projectContract)
        external
        view
        returns (address[] memory owners)
    {
        uint256 count = 0;
        address[] memory tempOwners = new address[](listedProjects.length);
        for (uint256 i = 0; i < listedProjects.length; i++) {
            if (authorizedProjectOwners[projectContract][listedProjects[i]]) {
                tempOwners[count] = listedProjects[i];
                count++;
            }
        }
        owners = new address[](count);
        for (uint256 i = 0; i < count; i++) {
            owners[i] = tempOwners[i];
        }
    }
}

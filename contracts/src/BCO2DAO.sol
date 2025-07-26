// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Governance.sol";


contract BCO2DAO is ReentrancyGuard {
    IERC20 public RUSD;
    ProjectData public projectData;
    BCO2Governance public governance;

    uint256 public totalLiquidity;

    struct WithdrawalRequest {
        uint256 requestId;
        address projectContract;
        address requester;
        uint256 amount;
        string proofOfWork;
        uint256 timestamp;
        uint256 votingEnd;
        bool isActive;
        uint256 holderVotesFor;
        uint256 holderVotesAgainst;
        mapping(address => bool) vvbApprovals;
        mapping(address => bool) hasVoted;
        bool governanceApproved;
        uint256 governanceApprovedAmount;
        bool governanceExtended;
        uint256 extendedVotingEnd;
    }

    mapping(uint256 => WithdrawalRequest) public withdrawalRequests;
    mapping(address => mapping(address => uint256[])) public withdrawalRequestIDsOfProposerForProject;
    mapping(address => uint256[]) public withdrawalRequestIDsOfProposer;
    mapping(address => uint256) public projectBalances; // RUSD balance per project
    mapping(address => uint256) public totalWithdrawnFromProject; // RUSD withdrawn from project
    uint256 public requestCounter;
    uint256 public votingDuration = 7 days;
    uint256 public constant EXTENSION_DURATION = 1 days;

    // Custom errors
    error InvalidProject();
    error ProjectNotApproved();
    error OnlyGovernance(address);
    error NotProjectOwner();
    error InvalidAmount();
    error RequestNotActive();
    error VotingPeriodEnded();
    error AlreadyVoted();
    error NotVVB();
    error GovernanceVetoRestricted();
    error ExtensionAlreadyUsed();
    error InvalidVotingDuration();
    error ExceedingTotalAllowedRequests(uint256);
    error TooManyActiveRequests(uint256);

    // Events
    event LiquidityAdded(address indexed project, address indexed provider, uint256 amount);
    event LiquidityRemoved(address indexed provider, uint256 amount);
    event WithdrawalRequested(uint256 indexed requestId, address indexed project, address requester, uint256 amount);
    event Voted(uint256 indexed requestId, address indexed voter, bool support, uint256 weight);
    event VVBApproved(uint256 indexed requestId, address indexed vvb);
    event GovernanceDecision(uint256 indexed requestId, bool approved, uint256 approvedAmount);
    event VotingExtended(uint256 indexed requestId, uint256 newVotingEnd);
    event WithdrawalProcessed(uint256 indexed requestId, address indexed project, uint256 amount);
    event VotingDurationUpdated(uint256 newDuration);

    constructor(address _RUSD, address _projectData, address _governance) {
        RUSD = IERC20(_RUSD);
        projectData = ProjectData(_projectData);
        governance = BCO2Governance(_governance);
    }

    // Modifier to restrict access to governance contract
    modifier onlyGovernance() {
        if (msg.sender != address(governance)) revert OnlyGovernance(address(governance));
        _;
    }

    // Called by BCO2.sol during mintWithRUSD to deposit RUSD for a project
    function depositRUSD(address projectContract, uint256 amount) external returns(bool) {
        if (!projectData.isListed(projectContract)) revert InvalidProject();
        bool success = RUSD.transferFrom(msg.sender, address(this), amount);
        require(success, "Transfer failed");
        projectBalances[projectContract] += amount;
        totalLiquidity += amount;
        emit LiquidityAdded(projectContract, msg.sender, amount);

        return true;
    }

    // Submit a withdrawal request
    function requestWithdrawal(address projectContract, uint256 amount, string calldata proofOfWork) external nonReentrant returns(uint256 _requestId){
        ProjectData.Project memory project = projectData.getProjectDetails(projectContract);
        if (!projectData.isApproved(projectContract)) revert ProjectNotApproved();
        if (msg.sender != project.proposer) revert NotProjectOwner(); // problematic when testing
        if (amount == 0 || amount > projectBalances[projectContract]) revert InvalidAmount();

        // Check total requests limit
        if (withdrawalRequestIDsOfProposerForProject[msg.sender][projectContract].length >= 25) {
            revert ExceedingTotalAllowedRequests(withdrawalRequestIDsOfProposerForProject[msg.sender][projectContract].length);
        }

        // Check active requests limit
        uint256 activeCount = 0;
        uint256[] memory requestIds = withdrawalRequestIDsOfProposerForProject[msg.sender][projectContract];
        for (uint256 i = 0; i < requestIds.length; i++) {
            if (withdrawalRequests[requestIds[i]].isActive) {
                activeCount++;
                if (activeCount >= 2) revert TooManyActiveRequests(activeCount);
            }
        }

        requestCounter++;
        WithdrawalRequest storage request = withdrawalRequests[requestCounter];
        request.requestId = requestCounter;
        request.projectContract = projectContract;
        request.requester = msg.sender;
        request.amount = amount;
        request.proofOfWork = proofOfWork;
        request.timestamp = block.timestamp;
        request.votingEnd = block.timestamp + votingDuration;
        request.isActive = true;

        withdrawalRequestIDsOfProposerForProject[msg.sender][projectContract].push(requestCounter);
        withdrawalRequestIDsOfProposer[msg.sender].push(requestCounter);

        emit WithdrawalRequested(requestCounter, projectContract, msg.sender, amount);

        return(requestCounter);
    }

    // Holders vote on a withdrawal request
    function voteOnWithdrawal(uint256 requestId, bool support) external nonReentrant {
        WithdrawalRequest storage request = withdrawalRequests[requestId];
        if (!request.isActive) revert RequestNotActive();
        if (block.timestamp > (request.governanceExtended ? request.extendedVotingEnd : request.votingEnd))
            revert VotingPeriodEnded();
        if (request.hasVoted[msg.sender]) revert AlreadyVoted();

        BCO2 bco2 = BCO2(request.projectContract);
        uint256 balance = bco2.balanceOf(msg.sender, bco2.unit_tCO2_TOKEN_ID());
        require(balance > 0, "No tokens held");

        request.hasVoted[msg.sender] = true;
        if (support) {
            request.holderVotesFor += balance;
        } else {
            request.holderVotesAgainst += balance;
        }

        emit Voted(requestId, msg.sender, support, balance);
    }

    // VVBs approve a withdrawal request
    function vvbApproveWithdrawal(uint256 requestId) external nonReentrant {
        if (!governance.checkAuthorizedVVBs(msg.sender)) revert NotVVB();

        WithdrawalRequest storage request = withdrawalRequests[requestId];
        if (!request.isActive) revert RequestNotActive();
        if (block.timestamp > (request.governanceExtended ? request.extendedVotingEnd : request.votingEnd))
            revert VotingPeriodEnded();
        if (request.vvbApprovals[msg.sender]) revert AlreadyVoted();

        request.vvbApprovals[msg.sender] = true;
        emit VVBApproved(requestId, msg.sender);
    }


    // Governance extends voting period once
    function extendVotingPeriod(uint256 requestId) external onlyGovernance {
        WithdrawalRequest storage request = withdrawalRequests[requestId];
        if (!request.isActive) revert RequestNotActive();
        if (request.governanceExtended) revert ExtensionAlreadyUsed();
        if (block.timestamp > request.votingEnd) revert VotingPeriodEnded();

        request.governanceExtended = true;
        request.extendedVotingEnd = block.timestamp + EXTENSION_DURATION;
        emit VotingExtended(requestId, request.extendedVotingEnd);
    }

    // Governance approves or rejects a withdrawal request
    function governanceDecision(uint256 requestId, bool approve, uint256 approvedAmount) external onlyGovernance nonReentrant {
        WithdrawalRequest storage request = withdrawalRequests[requestId];
        if (!request.isActive) revert RequestNotActive();
        if (approve && approvedAmount == 0) revert InvalidAmount();
        if (approve && approvedAmount > request.amount) revert InvalidAmount();

        // Check if holders and VVBs have approved
        bool holderApproved = isHolderApproved(requestId);
        bool vvbApproved = isApprovedByVVB(requestId);
        if (holderApproved && vvbApproved && !approve) revert GovernanceVetoRestricted();

        request.isActive = false;
        if (approve) {
            request.governanceApproved = true;
            request.governanceApprovedAmount = approvedAmount;
            _processWithdrawal(requestId, approvedAmount);
        }

        emit GovernanceDecision(requestId, approve, approvedAmount);
    }

    // Internal function to process withdrawal
    function _processWithdrawal(uint256 requestId, uint256 amount) internal {
        WithdrawalRequest storage request = withdrawalRequests[requestId];
        projectBalances[request.projectContract] -= amount;
        totalWithdrawnFromProject[request.projectContract] += amount;
        totalLiquidity -= amount;
        bool success = RUSD.transfer(request.requester, amount);
        require(success, "Transfer failed");
        emit WithdrawalProcessed(requestId, request.projectContract, amount);
    }

    // Check if holders have approved (50% weight based on token balance)
    function isHolderApproved(uint256 requestId) public view returns (bool) {
        WithdrawalRequest storage request = withdrawalRequests[requestId];
        BCO2 bco2 = BCO2(request.projectContract);
        uint256 totalSupply = bco2.getTotalSupplyByTokenId(bco2.unit_tCO2_TOKEN_ID());
        if (totalSupply == 0) return false;
        uint256 totalVotes = request.holderVotesFor + request.holderVotesAgainst;
        if (totalVotes == 0) return false;
        return (request.holderVotesFor * 100) / totalVotes >= 50;
    }

    // Check if VVBs have approved (at least one VVB approval required)
    function isApprovedByVVB(uint256 requestId) public view returns (bool) {
        address[] memory authorizedVVBs = governance.getAuthorizedVVBs();
        for (uint256 i = 0; i < authorizedVVBs.length; i++) {
            if (withdrawalRequests[requestId].vvbApprovals[authorizedVVBs[i]]) {
                return true;
            }
        }
        return false;
    }

    // Set voting duration
    function setVotingDuration(uint256 newDuration) external onlyGovernance {
        if (newDuration < 1 days || newDuration > 30 days) revert InvalidVotingDuration();
        votingDuration = newDuration;
        emit VotingDurationUpdated(newDuration);
    }

    // Getter functions
    function getProjectBalance(address projectContract) external view returns (uint256) {
        return projectBalances[projectContract];
    }

    function getWithdrawalRequest(uint256 requestId)
        external
        view
        returns (
            address projectContract,
            address requester,
            uint256 amount,
            string memory proofOfWork,
            uint256 timestamp,
            uint256 votingEnd,
            bool isActive,
            uint256 holderVotesFor,
            uint256 holderVotesAgainst,
            bool governanceApproved,
            uint256 governanceApprovedAmount,
            bool governanceExtended,
            uint256 extendedVotingEnd
        )
    {
        WithdrawalRequest storage request = withdrawalRequests[requestId];
        return (
            request.projectContract,
            request.requester,
            request.amount,
            request.proofOfWork,
            request.timestamp,
            request.votingEnd,
            request.isActive,
            request.holderVotesFor,
            request.holderVotesAgainst,
            request.governanceApproved,
            request.governanceApprovedAmount,
            request.governanceExtended,
            request.extendedVotingEnd
        );
    }

    function hasVoted(uint256 requestId, address voter) external view returns (bool) {
        return withdrawalRequests[requestId].hasVoted[voter];
    }

    function getVVBApproval(uint256 requestId, address vvb) external view returns (bool) {
        return withdrawalRequests[requestId].vvbApprovals[vvb];
    }


    function getTotalLiquidity() external view returns (uint256) {
        return totalLiquidity;
    }
}
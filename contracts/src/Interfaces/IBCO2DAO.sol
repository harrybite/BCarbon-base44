// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IBCO2DAO {
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

    // State variable getters
    function RUSD() external view returns (address);
    function projectData() external view returns (address);
    function governance() external view returns (address);
    function totalLiquidity() external view returns (uint256);
    function requestCounter() external view returns (uint256);
    function votingDuration() external view returns (uint256);

    // withdrawalRequests is a mapping(uint256 => WithdrawalRequest)
    // Since WithdrawalRequest contains mappings, exposing it directly is not feasible in an interface.
    // So you have getter functions returning parts of WithdrawalRequest below.

    // Mappings getters
    function withdrawalRequestIDsOfProposerForProject(address proposer, address projectContract) external view returns (uint256[] memory);
    function withdrawalRequestIDsOfProposer(address proposer) external view returns (uint256[] memory);
    function projectBalances(address projectContract) external view returns (uint256);
    function totalWithdrawnFromProject(address projectContract) external view returns (uint256);

    // External/Public functions
    function depositRUSD(address projectContract, uint256 amount) external returns (bool);
    function requestWithdrawal(address projectContract, uint256 amount, string calldata proofOfWork) external returns (uint256 requestId);
    function voteOnWithdrawal(uint256 requestId, bool support) external;
    function vvbApproveWithdrawal(uint256 requestId, bool support) external;
    function extendVotingPeriod(uint256 requestId) external;
    function governanceDecision(uint256 requestId, bool approve, uint256 approvedAmount) external;
    function setVotingDuration(uint256 newDuration) external;

    function getProjectBalance(address projectContract) external view returns (uint256);

    // Getters for detailed withdrawal request info
    function getWithdrawalRequestBasic(uint256 requestId) external view returns (
        address projectContract,
        address requester,
        uint256 amount,
        string memory proofOfWork
    );

    function getWithdrawalRequestStatus(uint256 requestId) external view returns (
        uint256 timestamp,
        uint256 votingEnd,
        bool isActive,
        uint256 holderVotesFor,
        uint256 holderVotesAgainst
    );

    function getWithdrawalRequestGovernance(uint256 requestId) external view returns (
        bool governanceApproved,
        uint256 governanceApprovedAmount,
        bool governanceExtended,
        uint256 extendedVotingEnd
    );

    function hasVoted(uint256 requestId, address voter) external view returns (bool);
    function getVVBApproval(uint256 requestId, address vvb) external view returns (bool);

    function getTotalLiquidity() external view returns (uint256);

    // View functions for approval checks
    function isHolderApproved(uint256 requestId) external view returns (bool);
    function isApprovedByVVB(uint256 requestId) external view returns (bool);
}

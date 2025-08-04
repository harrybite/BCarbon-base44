/* eslint-disable no-unused-vars */
/* eslint-disable no-constant-binary-expression */
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useContractInteraction } from '../contract/ContractInteraction';
import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { apihost, methodology } from '../contract/address';
import { useToast } from '../ui/use-toast';
import { useConnectWallet } from '@/context/walletcontext';
import { useActiveAccount } from 'thirdweb/react';
import WithdrawalModal from './WithdrawalModal';
import { 
  MapPin, 
  Calendar, 
  User, 
  FileText, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  DollarSign,
  TreePine,
  Eye,
  CreditCard
} from 'lucide-react';

const ProjectCard = ({ project }) => {
  const { 
    checkAuthorizedVVB,
    checkIsProjectOwner,
    checkIsOwner,
    requestWithdrawal,
    getProjectBalances,
    submitComment,
  } = useContractInteraction();

  const [details, setDetails] = useState({
    projectAddress: '',
    metadata: {},
    isApproved: false,
    creditAmount: 0,
    comments: [],
    offChainComments: [],
    methodology: '',
    projectContract: '',
    projectId: '',
    proposer: '',
    location: '',
    defaultVintage: '',
    defaultValidity: '',
    credits: 0,
    emissionReductions: 0,
    totalSupply: 0,
    projectMintPrice: 0,
    isValidated: false,
    isVerified: false,
    defaultIsPermanent: false,
    commentPeriodEnd: 0,
    projectDetails: '',
    // Withdrawal request related fields
    activeWithdrawalRequests: [],
    activeWithdrawalRequestsCount: 0,
    hasActiveWithdrawalRequests: false
  });
  
  const { walletAddress } = useConnectWallet();
  const [canComment, setCanComment] = useState(false);
  const [comment, setComment] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [isProjectOwner, setIsProjectOwner] = useState(false);
  const [reloadData, setReloadData] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [projectBalance, setProjectBalance] = useState('0');

  // Withdrawal modal states
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  
  const account = useActiveAccount();
  const { toast } = useToast();

  useEffect(() => {
    const fetchDetails = async () => {
      if (project) {
        setIsLoading(true);
        try {
          const projectdetails = await fetch(`${apihost}/project/getproject/${project}`);
          if (!projectdetails.ok) {
            console.error('Failed to fetch project details');
            return;
          }
          const projectData = await projectdetails.json();
          console.log("Project details:", projectData);
          setDetails({
            ...projectData.projectDetails,
            hasActiveWithdrawalRequests: projectData.hasActiveWithdrawalRequests || false,
            activeWithdrawalRequestsCount: projectData.activeWithdrawalRequestsCount || 0
          });

          setCanComment((await checkAuthorizedVVB()) || (await checkIsProjectOwner(project)));
          setIsOwner(await checkIsOwner()); // this is the gov contract owner
          setIsProjectOwner(projectData.projectDetails.proposer.toLowerCase() === walletAddress?.toLowerCase());
          
          // Fetch project balance if user is project owner
          if (projectData.projectDetails.proposer.toLowerCase() === walletAddress?.toLowerCase()) {
            try {
              const balance = await getProjectBalances(project);
              setProjectBalance(balance || '0');
            } catch (error) {
              console.error('Error fetching project balance:', error);
              setProjectBalance('0');
            }
          }
        } catch (error) {
          console.error('Error fetching project details:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    if (walletAddress) {
      fetchDetails();
    }
  }, [walletAddress, reloadData, project]);

  const handleComment = async () => {
    if (!comment) return;
    try {
      const receipt = await submitComment(details.projectContract, comment, account);
      if (receipt.status === 'success') {
        const response = await fetch(`${apihost}/vvb/make-comments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            projectContract: details.projectContract,
            comment: comment,
            user: walletAddress,
          }),
        });
        
        toast({
          title: "Comment Submitted",
          description: `Transaction successful!`,
          variant: "default",
        });
        setComment('');
        setReloadData(reloadData + 1);
      } else {
        toast({
          title: "Comment Failed",
          description: `Transaction failed!`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to submit comment: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleRequestWithdrawal = async (projectAddress, amount, proof) => {
    setIsRequesting(true);
    try {
      console.log("Requesting withdrawal for project:", projectAddress, "Amount:", amount, "Proof:", proof);
      const receipt = await requestWithdrawal(projectAddress, amount, proof, account);
      if (receipt?.status === 'success') {
        const data = fetch(`${apihost}/withdrawal/store-withdrawal-request`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            txhash: receipt.transactionHash,
          }),
        });
        if (data.ok) {
          console.log("Withdrawal request stored successfully");
        }
        toast({
          title: "Withdrawal Requested",
          description: `Successfully requested withdrawal of ${amount} RUSD`,
          variant: "default",
        });
        setShowWithdrawalModal(false);
        // Refresh project data to show the new withdrawal request status
        setReloadData(reloadData + 1);
      } else {
        console.error('Withdrawal request failed:', receipt);
        toast({
          title: "Withdrawal Failed",
          description: "Transaction failed. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Withdrawal request error:', error);
      toast({
        title: "Error",
        description: `Failed to request withdrawal: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsRequesting(false);
    }
  };

  const getStatusText = (details) => {
    if (details.isApproved) {
      return 'Approved';
    }
    if (!details.isValidated) {
      return 'Pending Validation';
    }
    if (!details.isVerified) {
      return 'Pending Verification';
    }
    if (details.isValidated && details.isVerified) {
      return 'Pending Approval';
    }
    return 'Pending';
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Pending Validation':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Pending Verification':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Pending Approval':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Approved':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'Pending Validation':
      case 'Pending Verification':
      case 'Pending Approval':
        return <Clock className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  // Convert epoch timestamp to readable date
  const formatVintageDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(Number(timestamp) * 1000).toLocaleDateString();
  };

  // Parse and format location string into multiple lines
  const formatLocations = (locationString) => {
    if (!locationString) return ['N/A'];
    const locations = locationString.split(', ').map(loc => {
      const match = loc.match(/Location (\d+) - \(([^,]+), ([^)]+)\)/);
      if (match) {
        return `Location ${match[1]}: (${match[2]}, ${match[3]})`;
      }
      return loc;
    });
    return locations.length > 0 ? locations : ['N/A'];
  };

  // Calculate approval progress percentage
  const getApprovalProgress = () => {
    if (Number(details.credits) === 0) return 0;
    const percentage = (Number(details.totalSupply) / Number(details.credits)) * 100;
    console.log("Approval progress percentage:", percentage);
    return Math.min(percentage, 100); // Cap at 100%
  };

  // Calculate funds raised percentage (assuming max funding goal)
  const getFundsRaisedAmount = () => {
    return Number(details.totalSupply) * Number(details.projectMintPrice);
  };

  if (isLoading) {
    return (
      <div className="border rounded-xl p-6 w-full md:min-w-[450px] animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 bg-gray-200 rounded w-32"></div>
          <div className="h-6 bg-gray-200 rounded w-24"></div>
        </div>
        <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex justify-between">
              <div className="h-4 bg-gray-200 rounded w-32"></div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>
          ))}
        </div>
        <div className="h-10 bg-gray-200 rounded w-full mt-6"></div>
      </div>
    );
  }

  const status = getStatusText(details);
  const approvalProgress = getApprovalProgress();
  const fundsRaised = getFundsRaisedAmount();
  const hasActiveWithdrawals = details.hasActiveWithdrawalRequests && details.activeWithdrawalRequestsCount > 0;

  return (
    <>
      <div className="border border-gray-200 rounded-xl p-6 w-full md:min-w-[450px] bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
        {/* Withdrawal Request Status Alert - Only show for project owner */}
        {isProjectOwner && hasActiveWithdrawals && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-amber-600" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">
                    Withdrawal Request Pending
                  </p>
                  <p className="text-xs text-amber-700">
                    {details.activeWithdrawalRequestsCount} active request{details.activeWithdrawalRequestsCount > 1 ? 's' : ''} awaiting approval
                  </p>
                </div>
              </div>
              <Link 
                to={`/ProjectDetails/${details.projectContract}?tab=withdrawals`}
                className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 px-3 py-1 rounded-full font-medium transition-colors duration-200 flex items-center space-x-1"
              >
                <Eye className="w-3 h-3" />
                <span>View Details</span>
              </Link>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <TreePine className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">{details.projectId}</h3>
          </div>
          <span className={`inline-flex items-center space-x-1 px-3 py-1 text-sm font-semibold rounded-full border ${getStatusBadgeColor(status)}`}>
            {getStatusIcon(status)}
            <span>{status}</span>
          </span>
        </div>

        {/* Project Description */}
        <p className="text-gray-600 mb-6 line-clamp-2">{details.projectDetails}</p>
        
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="text-2xl font-bold text-green-700">
              {details.credits ? Number(details.credits).toLocaleString() : '0'}
            </div>
            <div className="text-sm text-green-600">Approved Credits (tCO₂)</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-2xl font-bold text-blue-700">
              {Number(details.emissionReductions).toLocaleString()}
            </div>
            <div className="text-sm text-blue-600">Target Credits (tCO₂)</div>
          </div>
        </div>

        {/* Progress Bars */}
        <div className="space-y-4 mb-6">
          {/* Credits Approval Progress */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Credits Approval Progress</span>
              <span className="text-sm font-semibold text-gray-900">{approvalProgress.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  approvalProgress === 100 ? 'bg-green-500' : 
                  approvalProgress > 0 ? 'bg-blue-500' : 'bg-gray-300'
                }`}
                style={{ width: `${approvalProgress}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500">
              {details.isApproved 
                ? `${Number(details.credits).toLocaleString()} of ${Number(details.emissionReductions).toLocaleString()} tCO₂ approved`
                : 'Awaiting approval'
              }
            </div>
          </div>

          {/* Funds Raised */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Total RUSD Raised</span>
              <span className="text-sm font-semibold text-gray-900">{fundsRaised} RUSD</span>
            </div>
            {/* Project Balance for Owner */}
            {/* {isProjectOwner && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Available Balance</span>
                <span className="text-sm font-semibold text-green-700">{Number(projectBalance).toLocaleString()} RUSD</span>
              </div>
            )} */}
          </div>
        </div>

        {/* Project Details */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600 flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Methodology:
            </span>
            <span 
              className="text-sm font-semibold text-gray-900 text-right max-w-[200px] truncate cursor-help"
              title={methodology[Number(details.methodology)] || "Unknown"}
            >
              {methodology[Number(details.methodology)]?.length > 25 
                ? `${methodology[Number(details.methodology)].substring(0, 25)}...` 
                : methodology[Number(details.methodology)] || "Unknown"}
            </span>
          </div>
          
          <div className="flex items-start justify-between">
            <span className="text-sm font-medium text-gray-600 flex items-center">
              <MapPin className="w-4 h-4 mr-2" />
              Locations:
            </span>
            <div className="text-sm font-semibold text-gray-900 text-right max-w-[200px]">
              {formatLocations(details.location).map((loc, index) => (
                <p 
                  key={index} 
                  className="truncate cursor-help" 
                  title={loc}
                >
                  {loc.length > 25 ? `${loc.substring(0, 25)}...` : loc}
                </p>
              ))}
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600 flex items-center">
              <User className="w-4 h-4 mr-2" />
              Proposer:
            </span>
            <a
              href={`https://testnet.bscscan.com/address/${details.proposer}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-blue-600 hover:underline cursor-pointer"
              title={details.proposer || "N/A"}
            >
              {details.proposer ? `${details.proposer.slice(0, 6)}...${details.proposer.slice(-4)}` : "N/A"}
            </a>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600 flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Vintage:
            </span>
            <span className="text-sm font-semibold text-gray-900">{formatVintageDate(details.defaultVintage)}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Validity:
            </span>
            <span className="text-sm font-semibold text-gray-900">
              {details.defaultIsPermanent ? 'Permanent' : `${details.defaultValidity} years`}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 mb-4">
          {/* View Project Details Button */}
          <Link to={`/ProjectDetails/${details.projectContract}`}>
            <button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center space-x-2">
              <span>View Project Details</span>
              <TrendingUp className="w-4 h-4" />
            </button>
          </Link>

          {/* Request Withdrawal Button - Only for Project Owner and when no active requests */}
          {isProjectOwner && details.isApproved && !hasActiveWithdrawals && (
            <button 
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center space-x-2"
              onClick={() => setShowWithdrawalModal(true)}
            >
              <span>Request Withdrawal</span>
              <DollarSign className="w-4 h-4" />
            </button>
          )}

          {/* View Withdrawal Details Button - When there are active requests */}
          {isProjectOwner && hasActiveWithdrawals && (
            <Link to={`/ProjectDetails/${details.projectContract}?tab=withdrawals`}>
              <button className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center space-x-2 mt-3">
                <span>View Withdrawal Details</span>
                <Eye className="w-4 h-4" />
              </button>
            </Link>
          )}
        </div>

        {/* Comments Section */}
        {canComment && (
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-lg font-semibold mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-gray-600" />
              Comments
            </h4>
            
            {details.comments && details.comments.length > 0 ? (
              <div className="space-y-3 mb-4 max-h-40 overflow-y-auto">
                {details.comments.map((c, i) => (
                  <div key={i} className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
                    <div className="flex justify-between text-xs text-gray-500 mb-2">
                      <span className="font-medium flex items-center">
                        <User className="w-3 h-3 mr-1" />
                        {c.author && `${c.author.slice(0, 6)}...${c.author.slice(-4)}`}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800">{c.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic mb-4 text-sm">No comments yet</p>
            )}
            
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-3 py-3 border-0 resize-none focus:ring-0 focus:outline-none"
                rows="3"
                placeholder={
                  Date.now() / 1000 > Number(details.commentPeriodEnd)
                    ? "Comment period is over"
                    : "Add a comment..."
                }
                disabled={Date.now() / 1000 > Number(details.commentPeriodEnd)}
              />
              <div className="bg-gray-50 border-t border-gray-200 px-3 py-2 flex justify-end">
                <button
                  onClick={handleComment}
                  disabled={!comment || Date.now() / 1000 > Number(details.commentPeriodEnd)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    !comment || Date.now() / 1000 > Number(details.commentPeriodEnd)
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  Submit Comment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Withdrawal Modal */}
      <WithdrawalModal
        show={showWithdrawalModal}
        onClose={() => setShowWithdrawalModal(false)}
        onRequestWithdrawal={handleRequestWithdrawal}
        projectAddress={details.projectContract}
        projectBalance={projectBalance}
        isRequesting={isRequesting}
        projectId={details.projectId}
      />
    </>
  );
};

ProjectCard.propTypes = {
  project: PropTypes.string.isRequired,
};

export default ProjectCard;
/* eslint-disable no-unused-vars */
/* eslint-disable no-constant-binary-expression */
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useContractInteraction } from '../contract/ContractInteraction';
import { useParams, useNavigate } from 'react-router-dom';
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
  CreditCard,
  Star,
  Timer,
  Lock,
  LogIn,
  Building,
  Shield,
  Coins,
  Target,
  Activity
} from 'lucide-react';

const ProjectCard = ({ project, isAuthenticated = false }) => {
  const navigate = useNavigate();
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
    projectRUSDBalance: 0,
    projectDetails: '',
    // Presale related fields
    isPresale: false,
    presaleAmount: 0,
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

          // Only set authenticated-specific states if user is authenticated
          if (isAuthenticated && walletAddress) {
            setCanComment((await checkAuthorizedVVB()) || (await checkIsProjectOwner(project)));
            setIsOwner(await checkIsOwner());
            setIsProjectOwner(projectData.projectDetails.proposer.toLowerCase() === walletAddress?.toLowerCase());
          }
        } catch (error) {
          console.error('Error fetching project details:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    fetchDetails();
  }, [project, isAuthenticated, walletAddress, reloadData]);

  const handleComment = async () => {
    if (!comment || !isAuthenticated) return;
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
    if (!isAuthenticated) return;
    
    setIsRequesting(true);
    try {
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
    // Presale logic - HIGHEST PRIORITY
    if (details.isPresale) {
      if (Number(details.presaleAmount) === 0) {
        return 'Presale Pending Approval';
      }
      if (Number(details.presaleAmount) > 0) {
        return 'Presale Approved';
      }
    }
    
    // Regular project approval flow
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
      case 'Presale Approved':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Presale Pending Approval':
        return 'bg-amber-100 text-amber-800 border-amber-200';
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
      case 'Presale Approved':
        return <Star className="w-4 h-4" />;
      case 'Presale Pending Approval':
        return <Timer className="w-4 h-4" />;
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
    return Math.min(percentage, 100); // Cap at 100%
  };

  // Calculate funds raised percentage
  const getFundsRaisedAmount = () => {
    return Number(details.projectRUSDBalance);
  };

  // Calculate progress for both project types
  const getProjectProgress = () => {
    if (details.isPresale) {
      // For presale projects: show presale approval progress
      if (Number(details.presaleAmount) > 0) {
        const percentage = (Number(details.totalSupply) / (Number(details.credits))) * 100;
        return {
          percentage: Math.min(percentage, 100),
          label: 'Presale Minting Progress',
          current: Number(details.totalSupply).toLocaleString(),
          total: Number(Number(details.credits)).toLocaleString(),
          color: 'bg-purple-600'
        };
      } else {
        return {
          percentage: 0,
          label: 'Presale Pending Approval',
          current: '0',
          total: '0',
          color: 'bg-amber-500'
        };
      }
    } else {
      // For regular projects: show minting progress
      if (Number(details.credits) === 0) {
        return {
          percentage: 0,
          label: 'Pending Approval',
          current: '0',
          total: '0',
          color: 'bg-gray-400'
        };
      }
      const percentage = (Number(details.totalSupply) / Number(details.credits)) * 100;
      return {
        percentage: Math.min(percentage, 100),
        label: 'Minting Progress',
        current: Number(details.totalSupply).toLocaleString(),
        total: Number(details.credits).toLocaleString(),
        color: 'bg-green-600'
      };
    }
  };

  // Handle authentication required actions
  const handleAuthRequired = (action) => {
    toast({
      title: "Authentication Required",
      description: "Please login and connect your wallet to access project details.",
      variant: "default",
    });
    navigate("/login");
  };

  if (isLoading) {
    return (
      <div className="border rounded-xl p-6 w-full md:min-w-[450px] h-[600px] animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 bg-gray-200 rounded w-32"></div>
          <div className="h-6 bg-gray-200 rounded w-24"></div>
        </div>
        <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
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
    <div className={`border border-gray-200 rounded-xl p-6 w-full md:min-w-[450px] bg-white shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col ${!isAuthenticated ? 'relative' : ''}`}>
      
      {/* Authentication Overlay for Non-authenticated Users */}
      {!isAuthenticated && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-xl flex items-center justify-center z-10">
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Login Required</h3>
            <p className="text-sm text-gray-600 mb-4">
              Connect your wallet and login to view full project details and interact with this project.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <LogIn className="w-4 h-4" />
              <span>Login to Continue</span>
            </button>
          </div>
        </div>
      )}

      {/* Withdrawal Request Status Alert - Only at top for authenticated project owner */}
      {isAuthenticated && (isProjectOwner || isOwner) && hasActiveWithdrawals && (
        <div className="flex-shrink-0 mb-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-amber-600" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">
                    Withdrawal Pending
                  </p>
                  <p className="text-xs text-amber-700">
                    {details.activeWithdrawalRequestsCount} request{details.activeWithdrawalRequestsCount > 1 ? 's' : ''} awaiting approval
                  </p>
                </div>
              </div>
              <Link 
                to={`/ProjectDetails/${details.projectContract}?tab=withdrawals`}
                className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 px-3 py-1 rounded-full font-medium transition-colors duration-200 flex items-center space-x-1"
              >
                <Eye className="w-3 h-3" />
                <span>View</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Header Section - Compact design */}
      <div className="flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              details.isPresale 
                ? 'bg-gradient-to-br from-purple-500 to-purple-600' 
                : 'bg-gradient-to-br from-green-500 to-green-600'
            }`}>
              {details.isPresale ? (
                <Star className="w-5 h-5 text-white" />
              ) : (
                <TreePine className="w-5 h-5 text-white" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <h3 className="text-xl font-bold text-gray-900">{details.projectId}</h3>
               
                {/* Presale Badge - Inline with project title */}
                {details.isPresale && (
                  <div className="flex items-center space-x-1">
                    <span className="inline-flex items-center space-x-1 px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                      <Star className="w-3 h-3" />
                      <span>Presale</span>
                    </span>
                    {Number(details.presaleAmount) > 0 && (
                      <span className="text-xs text-purple-600 font-medium">
                        ({Number(details.presaleAmount).toLocaleString()} tCO₂)
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          <span className={`inline-flex items-center space-x-1 px-3 py-1 text-sm font-semibold rounded-full border ${getStatusBadgeColor(status)}`}>
            {getStatusIcon(status)}
            <span className="text-xs">{status}</span>
          </span>
        </div>

        {/* Project Description - Fixed height with line clamp */}
        <div className="h-12 mb-4">
          <p className="text-gray-600 line-clamp-2 text-sm leading-6">{details.projectDetails}</p>
        </div>
      </div>
      
      {/* Key Metrics Cards - Fixed height */}
      <div className="flex-shrink-0 mb-2">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="text-xl font-bold text-green-700">
              {details.credits ? Number(details.credits).toLocaleString() : '0'}
            </div>
            <div className="text-xs text-green-600">Approved Credits (tCO₂)</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-xl font-bold text-blue-700">
              {Number(details.emissionReductions).toLocaleString()}
            </div>
            <div className="text-xs text-blue-600">Target Credits (tCO₂)</div>
          </div>
        </div>
      </div>

      {/* Progress Bar Section - For both project types */}
      <div className="flex-shrink-0 mb-4">
        {(() => {
          const progress = getProjectProgress();
          return (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-600 flex items-center">
                  <Activity className="w-3 h-3 mr-2" />
                  {progress.label}:
                </span>
                <span className="text-xs font-semibold text-gray-900">
                  {progress.current} / {progress.total}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${progress.color}`}
                  style={{ width: `${progress.percentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-gray-500">
                  {details.isPresale 
                    ? (Number(details.presaleAmount) > 0 ? 'Presale Minting' : 'Pending Approval')
                    : 'Credits Minted'
                  }
                </span>
                <span className="text-xs font-medium text-gray-700">
                  {progress.percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Project Details Section - Flexible height with consistent structure */}
      <div className="flex-grow mb-4">
        <div className="space-y-2.5">
          {/* Row 1: Contract & Proposer (for authenticated only) OR spacer */}
          {isAuthenticated ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-600 flex items-center">
                  <Building className="w-3 h-3 mr-2" />
                  Contract:
                </span>
                <span className="text-xs font-semibold text-gray-900 font-mono">
                  {`${details.projectContract.slice(0, 6)}...${details.projectContract.slice(-4)}`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-600 flex items-center">
                  <User className="w-3 h-3 mr-2" />
                  Proposer:
                </span>
                <span className="text-xs font-semibold text-gray-900 font-mono">
                  {`${details.proposer.slice(0, 6)}...${details.proposer.slice(-4)}`}
                </span>
              </div>
            </>
          ) : (
            <div className="h-12"></div> // Spacer for non-authenticated users
          )}

          {/* Row 2: Methodology (always visible) */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-600 flex items-center">
              <FileText className="w-3 h-3 mr-2" />
              Methodology:
            </span>
            <span 
              className="text-xs font-semibold text-gray-900 text-right max-w-[180px] truncate cursor-help"
              title={isAuthenticated ? (methodology[Number(details.methodology)] || "Unknown") : "Login to view"}
            >
              {isAuthenticated 
                ? (methodology[Number(details.methodology)]?.length > 20 
                  ? `${methodology[Number(details.methodology)].substring(0, 20)}...` 
                  : methodology[Number(details.methodology)] || "Unknown")
                : "***"
              }
            </span>
          </div>

          {/* Row 3: Location (for authenticated only) OR spacer */}
          {isAuthenticated ? (
            <div className="flex items-start justify-between">
              <span className="text-xs font-medium text-gray-600 flex items-center">
                <MapPin className="w-3 h-3 mr-2" />
                Location:
              </span>
              <div className="text-right max-w-[180px]">
                {formatLocations(details.location).slice(0, 1).map((loc, i) => (
                  <div key={i} className="text-xs font-semibold text-gray-900 truncate">
                    {loc}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-5"></div> // Spacer for non-authenticated users
          )}
          
          {/* Row 4: Vintage (always visible) */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-600 flex items-center">
              <Calendar className="w-3 h-3 mr-2" />
              Vintage:
            </span>
            <span className="text-xs font-semibold text-gray-900">
              {isAuthenticated ? formatVintageDate(details.defaultVintage) : "***"}
            </span>
          </div>
          
          {/* Row 5: Validity (always visible) */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-600 flex items-center">
              <TrendingUp className="w-3 h-3 mr-2" />
              Validity:
            </span>
            <span className="text-xs font-semibold text-gray-900">
              {isAuthenticated 
                ? (details.defaultIsPermanent ? 'Permanent' : `${details.defaultValidity} years`)
                : "***"
              }
            </span>
          </div>

          {/* Row 6: Mint Price (for authenticated with price only) OR spacer */}
          {isAuthenticated && Number(details.projectMintPrice) > 0 ? (
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-600 flex items-center">
                <Coins className="w-3 h-3 mr-2" />
                Mint Price:
              </span>
              <span className="text-xs font-semibold text-gray-900">
                {Number(details.projectMintPrice)} RUSD
              </span>
            </div>
          ) : (
            <div className="h-5"></div> // Spacer
          )}

          {/* Row 7: Project Balance (for authenticated project owner only) OR spacer */}
          {isAuthenticated && isProjectOwner ? (
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-600 flex items-center">
                <DollarSign className="w-3 h-3 mr-2" />
                Project Balance:
              </span>
              <span className="text-xs font-semibold text-gray-900">
                {Number(details.projectRUSDBalance).toLocaleString()} RUSD
              </span>
            </div>
          ) : (
            <div className="h-5"></div> // Spacer
          )}
          {isAuthenticated && isProjectOwner ? (
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-600 flex items-center">
                <DollarSign className="w-3 h-3 mr-2" />
                Total claimed by issuer:
              </span>
              <span className="text-xs font-semibold text-gray-900">
                {Number(details.totalClaimed).toLocaleString()} RUSD
              </span>
            </div>
          ) : (
            <div className="h-5"></div> // Spacer
          )}
        </div>
      </div>

      {/* Action Buttons Section - Side by side layout */}
      <div className="flex-shrink-0 mt-auto">
        <div className="flex space-x-3">
          {/* View Project Details Button */}
          {isAuthenticated ? (
            <Link to={`/ProjectDetails/${details.projectContract}`} className="flex-1">
              <button className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center space-x-2 text-white ${
                details.isPresale 
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
              }`}>
                <span className="text-sm">View Details</span>
                <TrendingUp className="w-4 h-4" />
              </button>
            </Link>
          ) : (
            <button 
              onClick={handleAuthRequired}
              className="flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center space-x-2 text-white bg-gray-500 hover:bg-gray-600"
            >
              <Lock className="w-4 h-4" />
              <span className="text-sm">Login Required</span>
            </button>
          )}

          {/* Request Withdrawal Button - Only for authenticated project owner */}
          {isAuthenticated && isProjectOwner && !hasActiveWithdrawals && Number(details.projectRUSDBalance) > 0 && (
            <button 
              className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center space-x-2"
              onClick={() => setShowWithdrawalModal(true)}
            >
              <span className="text-sm">Withdraw</span>
              <DollarSign className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Comments Section - Only for authenticated users with permission */}
      {isAuthenticated && canComment && (
        <div className="border-t border-gray-200 pt-4 mt-4 flex-shrink-0">
          <h4 className="text-sm font-semibold mb-3 flex items-center">
            <FileText className="w-4 h-4 mr-2 text-gray-600" />
            Comments
          </h4>
          
          {details.comments && details.comments.length > 0 ? (
            <div className="space-y-2 mb-3 max-h-32 overflow-y-auto">
              {details.comments.slice(0, 2).map((c, i) => (
                <div key={i} className="bg-gray-50 border border-gray-200 p-2 rounded-lg">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span className="font-medium flex items-center">
                      <User className="w-3 h-3 mr-1" />
                      {c.author && `${c.author.slice(0, 6)}...${c.author.slice(-4)}`}
                    </span>
                  </div>
                  <p className="text-xs text-gray-800 line-clamp-2">{c.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic mb-3 text-xs">No comments yet</p>
          )}
          
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-3 py-2 border-0 resize-none focus:ring-0 focus:outline-none text-sm"
              rows="2"
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
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  !comment || Date.now() / 1000 > Number(details.commentPeriodEnd)
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Withdrawal Modal - Only for authenticated users */}
    {isAuthenticated && (
      <WithdrawalModal
        show={showWithdrawalModal}
        onClose={() => setShowWithdrawalModal(false)}
        onRequestWithdrawal={handleRequestWithdrawal}
        projectAddress={details.projectContract}
        projectBalance={details.projectRUSDBalance}
        isRequesting={isRequesting}
        projectId={details.projectId}
      />
    )}
  </>
);;
};

ProjectCard.propTypes = {
  project: PropTypes.string.isRequired,
  isAuthenticated: PropTypes.bool,
};

export default ProjectCard;
import  { useState, useEffect } from 'react';
import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useContractInteraction } from "../../components/contract/ContractInteraction";
import { apihost, methodology } from "@/components/contract/address";
import { useToast } from "@/components/ui/use-toast";
import { useConnectWallet } from "@/context/walletcontext";
import { useActiveAccount } from "thirdweb/react";
import { jwtDecode } from "jwt-decode";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TreePine } from "lucide-react";

// Import components
import ProjectHeader from './components/ProjectHeader';
import ProjectOverview from './components/ProjectOverview';
import ProjectInfo from './components/ProjectInfo';
import RoleActions from './components/RoleActions';
import MintCreditsCard from './components/MintCreditsCard';
import RetireCreditsCard from './components/RetireCreditsCard';
import HoldersModal from './components/HoldersModal';
import ApproveModal from './components/ApproveModal';
import PresaleApproveModal from './components/PresaleApproveModal';
import CommentsSection from './components/CommentsSection';
import WithdrawalRequests from './components/WithdrawlRequest';

export default function ProjectDetails() {
  const { projectContract } = useParams();
  const {
    mintWithRUSD,
    retireCredits,
    getListedProjectDetails,
    getWalletMinted,
    getRUSDBalance,
    getWalletRetrides,
    getProjectBalances,
    getCurrentBalance,
    checkRUSDAllowance,
    approveRUSD,
    checkAuthorizedVVB,
    checkIsOwner,
    approveAndIssueCredits,
    approvePresaleAndIssuePresaleCredits,
    validateProject,
    verifyProject,
    submitComment,
    setGovernanceDecision,
    mintForIssuer,
  } = useContractInteraction();
  const { walletAddress } = useConnectWallet();
  const account = useActiveAccount();
  const { toast } = useToast();

  // Project state
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // User balances and credits
  const [rusdBalance, setRUSDBalance] = useState(0);
  const [retiredCredits, setRetiredCredits] = useState(0);
  const [mintedCredits, setMintedCredits] = useState(0);
  const [mintBalance, setMintBalance] = useState(0);
  const [retiredBalance, setRetiredBalance] = useState(0);
  const [mintNftImage, setMintNftImage] = useState("");
  const [retireNftImage, setRetireNftImage] = useState("");
  const [projectBalances, setProjectBalances] = useState("0");
  
  // Mint/Retire states
  const [mintAmount, setMintAmount] = useState("");
  const [retireAmount, setRetireAmount] = useState("");
  const [isMinting, setIsMinting] = useState(false);
  const [isRetiring, setIsRetiring] = useState(false);
  
  // Role states
  const [isOwner, setIsOwner] = useState(false);
  const [isVVB, setIsVVB] = useState(false);
  
  // Modal states
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showPresaleApproveModal, setShowPresaleApproveModal] = useState(false);
  const [showHoldersModal, setShowHoldersModal] = useState(false);
  const [creditAmount, setCreditAmount] = useState('');
  const [presaleCreditAmount, setPresaleCreditAmount] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [isPresaleApproving, setIsPresaleApproving] = useState(false);
  const [governancePresaleMintPrice, setGovernancePresaleMintPrice] = useState(0);
  
  // Comments state
  const [comment, setComment] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  
  // Holders modal states
  const [holders, setHolders] = useState([]);
  const [holdersLoading, setHoldersLoading] = useState(false);
  const [holdersCurrentPage, setHoldersCurrentPage] = useState(1);
  const [holdersTotalPages, setHoldersTotalPages] = useState(1);
  const [holdersTotalNFTs, setHoldersTotalNFTs] = useState(0);
  const [holdersPerPage, setHoldersPerPage] = useState(10);
  const [holdersHasNextPage, setHoldersHasNextPage] = useState(false);
  const [holdersHasPrevPage, setHoldersHasPrevPage] = useState(false);
  const [selectedTokenId, setSelectedTokenId] = useState("all");

  // Withdrawal requests state
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  const [withdrawalRequestsLoading, setWithdrawalRequestsLoading] = useState(false);

  const fallbackImage = "https://ibb.co/CpZ8x06y";

  // Get user info from token
  let userInfo = null;
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) {
    try {
      userInfo = jwtDecode(token);
    } catch (e) {
      console.error("Failed to decode token:", e);
      userInfo = null;
    }
  }

  // Load project data
  useEffect(() => {
    if (projectContract && walletAddress) {
      loadProject(projectContract);
    }
  }, [projectContract, walletAddress]);

  const loadProject = async (projectAddress) => {
    setIsLoading(true);
    try {
      const data = await getListedProjectDetails(projectAddress);
      setProject(data);

      // Fetch withdrawal requests
      try {
        setWithdrawalRequestsLoading(true);
        const withdrawalResponse = await fetch(`${apihost}/project/getprojectwithdrawalrequests/${projectAddress}?activeOnly=false`);
        if (withdrawalResponse.ok) {
          const withdrawalData = await withdrawalResponse.json();
          setWithdrawalRequests(withdrawalData.withdrawalRequests || []);
          data.projectRUSDBalance = withdrawalData.project.projectRUSDBalance || 0; 
          data.isPresale = withdrawalData.project.isPresale// Update project RUSD balance
          setProject(data);
        }
      } catch (error) {
        console.error("Error fetching withdrawal requests:", error);
        setWithdrawalRequests([]);
      } finally {
        setWithdrawalRequestsLoading(false);
      }

      // Load NFT images
      try {
        if (data.tokenUri) {
          const response = await fetch(data.tokenUri.replace('ipfs://', 'https://ipfs.io/ipfs/'));
          if (response.ok) {
            const metadata = await response.json();
            setMintNftImage(metadata.image || fallbackImage);
          } else {
            setMintNftImage(fallbackImage);
          }
        }
        if (data.retiredTokenUri) {
          const response = await fetch(data.retiredTokenUri.replace('ipfs://', 'https://ipfs.io/ipfs/'));
          if (response.ok) {
            const metadata = await response.json();
            setRetireNftImage(metadata.image || fallbackImage);
          } else {
            setRetireNftImage(fallbackImage);
          }
        }
      } catch (error) {
        console.error("Error fetching NFT metadata:", error);
      }

      // Load user balances
      const balance = await getRUSDBalance(walletAddress);
      setRUSDBalance(balance);
      const proBalance = await getProjectBalances(projectAddress);
      setProjectBalances(proBalance);
      const mintBalance = await getCurrentBalance(projectAddress, 1);
      const retiredBalance = await getCurrentBalance(projectAddress, 2);
      setMintBalance(mintBalance);
      setRetiredBalance(retiredBalance);
      const retired = await getWalletRetrides(projectAddress);
      setRetiredCredits(retired);
      const minted = await getWalletMinted(projectAddress);
      setMintedCredits(minted);
    } catch (error) {
      console.error("Error loading project:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load project details.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Check user roles
  useEffect(() => {
    if (project && walletAddress) {
      (async () => {
        try {
          const vvbStatus = await checkAuthorizedVVB(project.projectContract, walletAddress);
          setIsVVB(vvbStatus);
          const governanceOwner = await checkIsOwner();
          setIsOwner(governanceOwner);
        } catch {
          setIsVVB(false);
          setIsOwner(false);
        }
      })();
    }
  }, [project, walletAddress]);

  // Mint handler
  const handleMintETH = async () => {
    if (!mintAmount || parseFloat(mintAmount) <= 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a valid amount to mint",
      });
      return;
    }
    setIsMinting(true);

    const allowance = await checkRUSDAllowance(project.projectContract);
    if (BigInt(allowance) <= BigInt(0)) {
      try {
        const approveReceipt = await approveRUSD(project.projectContract, account);
        if (approveReceipt.status === "reverted") {
          toast({
            variant: "destructive",
            title: "Error",
            description: `RUSD approval failed`,
          });
          setIsMinting(false);
          return;
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: `RUSD approval failed: ${error.message}`,
        });
        setIsMinting(false);
        return;
      }
    }

    if (Number(rusdBalance) < Number(mintAmount)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Insufficient RUSD balance.`,
      });
      setIsMinting(false);
      return;
    }

    try {
      const tx = await mintWithRUSD(project.projectContract, parseInt(mintAmount), account);
      if (tx.status === "success") {
        const nftData = {
          projectContract: project.projectContract,
          owner: account.address,
          amount: mintAmount,
          tokenId: 1,
          image: mintNftImage || fallbackImage,
        };
        await fetch(`${apihost}/user/store-nft`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(nftData),
        });
        toast({
          variant: "default",
          title: "Success",
          description: `Minting successful!`,
        });
        setMintAmount("");
        setTimeout(() => loadProject(project.projectContract), 3000);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: `Minting failed: ${tx.error}`,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to mint: ${error.message}`,
      });
    } finally {
      setIsMinting(false);
    }
  };


  const handleMintForIssuer = async () => {
    if (!mintAmount || parseFloat(mintAmount) <= 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a valid amount to mint",
      });
      return;
    }
    setIsMinting(true);

    try {
      const tx = await mintForIssuer(project.projectContract, parseInt(mintAmount), account);
      if (tx.status === "success") {
        const nftData = {
          projectContract: project.projectContract,
          owner: account.address,
          amount: mintAmount,
          tokenId: 1,
          image: mintNftImage || fallbackImage,
        };
        await fetch(`${apihost}/user/store-nft`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(nftData),
        });
        toast({
          variant: "default",
          title: "Success",
          description: `Minting successful!`,
        });
        setMintAmount("");
        setTimeout(() => loadProject(project.projectContract), 3000);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: `Minting failed: ${tx.error}`,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to mint: ${error.message}`,
      });
    } finally {
      setIsMinting(false);
    }
  };
  // Retire handler
  const handleRetire = async () => {
    if (!retireAmount || parseFloat(retireAmount) <= 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a valid amount to retire",
      });
      return;
    }

    const allowedRetire = Number(mintedCredits) - Number(retiredCredits);
    if (parseInt(retireAmount) > allowedRetire) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `You cannot retire more than ${allowedRetire}`,
      });
      return;
    }

    setIsRetiring(true);
    try {
      const tx = await retireCredits(project.projectContract, parseInt(retireAmount), account);
      if (tx.status === "success") {
        const nftData = {
          projectContract: project.projectContract,
          owner: account.address,
          amount: retireAmount,
          tokenId: 2,
          image: retireNftImage || fallbackImage,
        };
        await fetch(`${apihost}/user/store-retired-nft`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(nftData),
        });
        toast({
          variant: "default",
          title: "Success",
          description: `Credits retired!`,
        });
        setTimeout(() => loadProject(project.projectContract), 3000);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: `Retirement failed: ${tx.error}`,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to retire: ${error.message}`,
      });
    } finally {
      setIsRetiring(false);
    }
  };

  const handleMaxRetire = () => {
    setRetireAmount(Number(mintedCredits) - Number(retiredCredits));
  };

  // Approval handlers
  const handleApprove = async () => {
    if (!creditAmount || parseFloat(creditAmount) <= 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a valid credit amount",
      });
      return;
    }

    setIsApproving(true);
    try {
      const tx = await approveAndIssueCredits(project.projectContract, Number(creditAmount), governancePresaleMintPrice, account);
      if (tx.status === "success") {
        await fetch(`${apihost}/project/updateprojectdetails/${project.projectContract}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
        });
        toast({
          variant: "default",
          title: "Success",
          description: "Credits approved and issued.",
        });
        setTimeout(() => loadProject(project.projectContract), 2000);
        setShowApproveModal(false);
        setCreditAmount('');
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: `Operation failed: ${tx.error}`,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to approve: ${error.message}`,
      });
    } finally {
      setIsApproving(false);
    }
  };

  const handlePresaleApprove = async () => {
    if (!presaleCreditAmount || parseFloat(presaleCreditAmount) <= 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a valid credit amount",
      });
      return;
    }

    const maxPresaleAmount = Math.floor(Number(project.emissionReductions) / 2);
    if (Number(presaleCreditAmount) > maxPresaleAmount) {
      toast({
        title: "Credit amount error",
        description: `Presale credit amount cannot exceed ${maxPresaleAmount} tCO₂ (50% of emission reductions).`,
        variant: "destructive",
      });
      return;
    }

    setIsPresaleApproving(true);
    try {

      const tx = await approvePresaleAndIssuePresaleCredits(project.projectContract, Number(presaleCreditAmount), governancePresaleMintPrice, account);
      if (tx.status === "success") {
        await fetch(`${apihost}/project/updateprojectdetails/${project.projectContract}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
        });
        toast({
          variant: "default",
          title: "Success",
          description: "Presale credits approved and issued successfully.",
        });
        setTimeout(() => loadProject(project.projectContract), 2000);
        setShowPresaleApproveModal(false);
        setPresaleCreditAmount('');
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: `Presale approval failed: ${tx.error}`,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to approve presale: ${error.message}`,
      });
    } finally {
      setIsPresaleApproving(false);
    }
  };

  // VVB handlers
  const handleValidate = async () => {
    try {
      const tx = await validateProject(project.projectContract, account);
      if (tx.status === "success") {
        await fetch(`${apihost}/vvb/validate-project/${project.projectContract}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        toast({
          variant: "default",
          title: "Success",
          description: "Project validated.",
        });
        setTimeout(() => loadProject(project.projectContract), 2000);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: `Validation failed: ${tx.error}`,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to validate: ${error.message}`,
      });
    }
  };

  const handleVerify = async () => {
    try {
      const tx = await verifyProject(project.projectContract, account);
      if (tx.status === "success") {
        await fetch(`${apihost}/vvb/verify-project/${project.projectContract}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        toast({
          variant: "default",
          title: "Success",
          description: "Project verified.",
        });
        setTimeout(() => loadProject(project.projectContract), 2000);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: `Verification failed: ${tx.error}`,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to verify: ${error.message}`,
      });
    }
  };

  // Comment handler
  const handleSubmitComment = async () => {
    if (!comment.trim()) return;
    setIsCommenting(true);
    try {
      const receipt = await submitComment(project.projectContract, comment, account);
      if (receipt.status === "success") {
        await fetch(`${apihost}/vvb/make-comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectContract: project.projectContract,
            comment: comment,
            user: walletAddress,
          }),
        });
        toast({
          variant: "default",
          title: "Comment Submitted",
          description: "Your comment has been submitted.",
        });
        setComment("");
        setTimeout(() => loadProject(project.projectContract), 2000);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to submit comment: ${error.message}`,
      });
    } finally {
      setIsCommenting(false);
    }
  };

  // Holders modal handlers
  const fetchHolders = async (page = 1, limit = 10, tokenId = "all") => {
    if (!projectContract) return;

    setHoldersLoading(true);
    try {
      const response = await fetch(`${apihost}/user/nftsholders/${projectContract}?page=${page}&limit=${limit}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenId: tokenId }),
      });

      const data = await response.json();
      if (data.status === 'success') {
        setHolders(data.nfts || []);
        if (data.pagination) {
          setHoldersTotalPages(data.pagination.totalPages);
          setHoldersTotalNFTs(data.pagination.totalNFTs);
          setHoldersHasNextPage(data.pagination.hasNextPage);
          setHoldersHasPrevPage(data.pagination.hasPrevPage);
          setHoldersCurrentPage(data.pagination.currentPage);
        }
      }
    } catch (error) {
      console.error('Error fetching holders:', error);
      setHolders([]);
    } finally {
      setHoldersLoading(false);
    }
  };

  const handleOpenHoldersModal = () => {
    setShowHoldersModal(true);
    setHoldersCurrentPage(1);
    setSelectedTokenId("all");
    fetchHolders(1, holdersPerPage, "all");
  };

  const handleHoldersPageChange = (newPage) => {
    if (newPage >= 1 && newPage <= holdersTotalPages) {
      setHoldersCurrentPage(newPage);
      fetchHolders(newPage, holdersPerPage, selectedTokenId);
    }
  };

  const handleHoldersLimitChange = (newLimit) => {
    setHoldersPerPage(parseInt(newLimit));
    setHoldersCurrentPage(1);
    fetchHolders(1, parseInt(newLimit), selectedTokenId);
  };

  const handleTokenIdFilterChange = (newTokenId) => {
    setSelectedTokenId(newTokenId);
    setHoldersCurrentPage(1);
    fetchHolders(1, holdersPerPage, newTokenId);
  };


  const handleGovernanceDecision = async (requestId, decision, amount = null) => {
    try {
      // Call the blockchain function

      console.log("Making governance decision:", { requestId, decision, amount, account });
      const tx = await setGovernanceDecision(requestId, amount ? Number(amount) : 0, decision,  account);
      if (tx.status === "success") {
        toast({
          variant: "default",
          title: "Success",
          description: `Request #${requestId} has been ${decision ? 'approved' : 'rejected'} successfully`,
        });
        return true;
      } else {
        throw new Error(tx.error || "Transaction failed");
      }
    } catch (error) {
      console.error("Error making governance decision:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to make governance decision: ${error.message}`,
      });
      return false;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid gap-4 sm:gap-6">
              <div className="h-64 bg-gray-200 rounded-xl"></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="h-48 bg-gray-200 rounded-xl"></div>
                <div className="h-48 bg-gray-200 rounded-xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not found state
  if (!project) {
    return (
      <div className="min-h-screen py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <TreePine className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Project Not Found</h2>
          <p className="text-gray-600 mb-6">The project you are looking for does not exist.</p>
          <Link to={createPageUrl("Projects")}>
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Projects
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const allowedRetire = Number(mintedCredits) - Number(retiredCredits);

  return (
    <div className="min-h-screen py-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link to={createPageUrl("Projects")}>
          <Button variant="outline" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Button>
        </Link>

        {/* Components */}
        <ProjectHeader 
          project={project} 
          projectBalances={projectBalances}
          onOpenHoldersModal={handleOpenHoldersModal} 
        />
        
        <ProjectOverview project={project} />
        
        <ProjectInfo project={project} methodology={methodology} />

        {/* Withdrawal Requests Section - Show for project owner */}
        {project && walletAddress && project.proposer && 
          (walletAddress.toLowerCase() === project.proposer.toLowerCase() || isOwner ) && (
            <WithdrawalRequests 
              withdrawalRequests={withdrawalRequests}
              isLoading={withdrawalRequestsLoading}
              projectContract={projectContract}
              project={project}
              isOwner={isOwner}
              onGovernanceDecision={handleGovernanceDecision}
            />
          )}
        
        <RoleActions 
          isOwner={isOwner}
          isVVB={isVVB}
          project={project}
          onOpenApproveModal={() => {
            setShowApproveModal(true);
            setCreditAmount(project.emissionReductions);
          }}
          onOpenPresaleApproveModal={() => {
            setShowPresaleApproveModal(true);
            setPresaleCreditAmount(Math.floor(project.emissionReductions / 2).toString());
          }}
          onValidate={handleValidate}
          onVerify={handleVerify}
        />

        {!isOwner && !isVVB && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
            <MintCreditsCard 
              project={project}
              mintAmount={mintAmount}
              setMintAmount={setMintAmount}
              handleMintETH={handleMintETH}
              handleMintForIssuer={handleMintForIssuer}
              isMinting={isMinting}
              mintNftImage={mintNftImage}
              fallbackImage={fallbackImage}
              mintedCredits={mintedCredits}
              mintBalance={mintBalance}
              rusdBalance={rusdBalance}
           
            />
            
            <RetireCreditsCard 
              project={project}
              retireAmount={retireAmount}
              setRetireAmount={setRetireAmount}
              handleRetire={handleRetire}
              handleMaxRetire={handleMaxRetire}
              isRetiring={isRetiring}
              allowedRetire={allowedRetire}
              retiredBalance={retiredBalance}
              retireNftImage={retireNftImage}
              fallbackImage={fallbackImage}
            />
          </div>
        )}

        {userInfo && userInfo.role !== "user" && (
          <CommentsSection 
            comments={project.comments}
            comment={comment}
            role={userInfo.role}
            setComment={setComment}
            isCommenting={isCommenting}
            handleSubmitComment={handleSubmitComment}
          />
        )}

        {/* Withdrawal Requests Section - Show for project owner */}
        

        {/* Modals */}
        {showHoldersModal && (
          <HoldersModal 
            onClose={() => setShowHoldersModal(false)}
            holders={holders}
            holdersLoading={holdersLoading}
            holdersCurrentPage={holdersCurrentPage}
            holdersTotalPages={holdersTotalPages}
            holdersTotalNFTs={holdersTotalNFTs}
            holdersPerPage={holdersPerPage}
            holdersHasNextPage={holdersHasNextPage}
            holdersHasPrevPage={holdersHasPrevPage}
            selectedTokenId={selectedTokenId}
            onPageChange={handleHoldersPageChange}
            onLimitChange={handleHoldersLimitChange}
            onTokenIdFilterChange={handleTokenIdFilterChange}
          />
        )}

        {showApproveModal && (
          <ApproveModal
            show={showApproveModal}
            onClose={() => {
              setShowApproveModal(false);
              setCreditAmount('');
            }}
            project={project}
            setGovernancePresaleMintPrice={setGovernancePresaleMintPrice}
            governancePresaleMintPrice={governancePresaleMintPrice}
            onApprove={handleApprove}
            creditAmount={creditAmount}
            setCreditAmount={setCreditAmount}
            isApproving={isApproving}
            maxCreditAmount={Number(project.emissionReductions)}
          />
        )}

        {showPresaleApproveModal && (
          <PresaleApproveModal
            show={showPresaleApproveModal}
            onClose={() => {
              setShowPresaleApproveModal(false);
              setPresaleCreditAmount('');
            }}
            setGovernancePresaleMintPrice={setGovernancePresaleMintPrice}
            governancePresaleMintPrice={governancePresaleMintPrice}
            onApprove={handlePresaleApprove}
            creditAmount={presaleCreditAmount}
            setCreditAmount={setPresaleCreditAmount}
            isApproving={isPresaleApproving}
            maxCreditAmount={Math.floor(Number(project.emissionReductions) / 2)}
            project={project}
          />
        )}
      </div>
    </div>
  );
}
/* eslint-disable no-constant-condition */
/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  TreePine,
  TrendingUp,
  Recycle,
  DockIcon,
  Calendar,
  CoinsIcon,
  LockOpen,
  Shield,
  Locate,
  User,
  IdCard,
  GitBranch,
  Coins,
  AlertCircle,
  CheckCircle2,
  DollarSign
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useContractInteraction } from "../components/contract/ContractInteraction";
import { apihost, methodology } from "@/components/contract/address";
import { useToast } from "@/components/ui/use-toast";
import { useConnectWallet } from "@/context/walletcontext";
import { useActiveAccount } from "thirdweb/react";
import { Textarea } from "@/components/ui/textarea";

export default function ProjectDetails() {
  const { projectContract } = useParams();
  const { 
    mintWithRUSD, 
    retireCredits,
    getListedProjectDetails,
    getWalletMinted, 
    getRUSDBalance,
    getWalletRetrides,
    getCurrentBalance,
    checkRUSDAllowance, 
    approveRUSD,
    checkAuthorizedVVB,
    checkIsOwner,
    approveAndIssueCredits,
    validateProject,
    verifyProject,
    submitComment,
  } = useContractInteraction();
  const { walletAddress } = useConnectWallet();
  const account = useActiveAccount()

  const [project, setProject] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [mintAmount, setMintAmount] = useState("");
  const [retireAmount, setRetireAmount] = useState("");
  const [isMinting, setIsMinting] = useState(false);
  const [isRetiring, setIsRetiring] = useState(false);
  const [rusdBalance, setRUSDBalance] = useState(0);
  const [retiredCredits, setRetiredCredits] = useState(0);
  const [mintedCredits, setMintedCredits] = useState(0);
  const [mintBalance, setMintBalance] = useState(0);
  const [retiredBalance, setRetiredBalance] = useState(0);
  const [mintNftImage, setMintNftImage] = useState("");
  const [retireNftImage, setRetireNftImage] = useState("");
  const [comment, setComment] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);

  // Add these states for role checks
  const [isOwner, setIsOwner] = useState(false);
  const [isVVB, setIsVVB] = useState(false);

  // Add states for approval modal
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [creditAmount, setCreditAmount] = useState('');
  const [isApproving, setIsApproving] = useState(false);

  const fallbackImage = "https://ibb.co/CpZ8x06y";

  const { toast } = useToast();

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


      try {
        // Token ID 1 for Mint
        const mintTokenUri = data.tokenUri;
        if (mintTokenUri) {
          const response = await fetch(mintTokenUri.replace('ipfs://', 'https://ipfs.io/ipfs/'));
          if (response.ok) {
            const metadata = await response.json();
            setMintNftImage(metadata.image || fallbackImage);
          } else {
            setRetireNftImage(fallbackImage);
          }
        }
        // Token ID 2 for Retire
        const retireTokenUri = data.retiredTokenUri;
        if (retireTokenUri) {
          const response = await fetch(retireTokenUri.replace('ipfs://', 'https://ipfs.io/ipfs/'));
          if (response.ok) {
            const metadata = await response.json();
            setRetireNftImage(metadata.image || fallbackImage);
          } else {
            setMintNftImage(fallbackImage);
          }
        }
      } catch (error) {
        console.error("Error fetching NFT metadata:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch NFT images.",
        });
      }

      const balance = await getRUSDBalance(walletAddress);
      setRUSDBalance(balance);
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

  // Handle approval with custom amount
  const handleApprove = async () => {
    if (!creditAmount || parseFloat(creditAmount) <= 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a valid credit amount",
      });
      return;
    }

    const emissionReductions = Number(project?.emissionReductions ?? 0);
    if (Number(creditAmount) > emissionReductions) {
      toast({
        title: "Credit amount error",
        description: "Credit amount must be less than or equal to emission reductions.",
        variant: "destructive",
      });
      return;
    }

    setIsApproving(true);
    try {
      const tx = await approveAndIssueCredits(project.projectContract, Number(creditAmount), account);
      if (tx.status === "success") {
        const data = await fetch(`${apihost}/gov/approve-project/${project.projectContract}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (data.ok) {
          const result = await data.json();
          console.log("Approval result:", result);
        }
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
        description: `Failed to approve and issue credits: ${error.message}`,
      });
    } finally {
      setIsApproving(false);
    }
  };

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
      console.log("Insufficient allowance, approving RUSD first...");
      try {
        const approveReceipt = await approveRUSD(project.projectContract, account);

        if (approveReceipt.status === "reverted") {
          toast({
            variant: "destructive",
            title: "Error",
            description: `RUSD approval failed ${approveReceipt}`,
          });
          setIsMinting(false);
          return;
        }
        console.log("RUSD approved successfully");
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
        description: `Insufficient RUSD balance. You have ${rusdBalance} RUSD, but trying to mint ${mintAmount} RUSD.`,
      });
      setIsMinting(false);
      return;
    }

    try {
      const tx = await mintWithRUSD(project.projectContract, parseInt(mintAmount), account);
      if (tx.status === "success") {
        // store nft in backend
        const nftData = {
          projectContract: project.projectContract,
          owner: account.address,
          amount: mintAmount,
          tokenId: 1, // Assuming tokenId 1 for mint
          image: mintNftImage || fallbackImage,
        };
        const response = await fetch(`${apihost}/user/store-nft`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(nftData),
        });
        if (response.ok) {
          const data = await response.json();
          console.log('NFT stored successfully:', data);
        }
        toast({
          variant: "default",
          title: "Success",
          description: `Minting initiated`,
        });
      }
      else {
        toast({
          variant: "destructive",
          title: "Error",
          description: `Minting failed: ${tx.error}`,
        });
      }

      setMintAmount("");
      setTimeout(() => loadProject(project.projectContract), 3000);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to mint with RUSD: ${error.message}`,
      });
      console.error("Minting error:", error);
    } finally {
      setIsMinting(false);
    }
  };

  const handleRetire = async () => {
    if (!retireAmount || parseFloat(retireAmount) <= 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a valid amount to retire",
      });
      return;
    }

    if (parseInt(retireAmount) > (Number(mintedCredits) - Number(retiredCredits))) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `You cannot retire more than ${(Number(mintedCredits) - Number(retiredCredits))}`,
      });
      return;
    }

    setIsRetiring(true);

    try {
      const tx = await retireCredits(project.projectContract, parseInt(retireAmount), account);
      if (tx.status === "success") {
        // store retired nft in backend
        const nftData = {
          projectContract: project.projectContract,
          owner: account.address,
          amount: retireAmount,
          tokenId: 2, // Assuming tokenId 2 for retire
          image: retireNftImage || fallbackImage,
        };
        const response = await fetch(`${apihost}/user/store-retired-nft`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(nftData),
        });
        if (response.ok) {
          const data = await response.json();
          console.log('Retired NFT stored successfully:', data);
        }
        toast({
          variant: "default",
          title: "Success",
          description: `Credits retired!`,
        });
        setTimeout(() => loadProject(project.projectContract), 3000);
      }
      else {
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
        description: `Failed to retire credits: ${error.message}`,
      });
    } finally {
      setIsRetiring(false);
    }
  };

  const handleMaxRetire = () => {
    setRetireAmount(Number(mintedCredits) - Number(retiredCredits));
  };
  const allowedRetire = Number(mintedCredits) - Number(retiredCredits);

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

  useEffect(() => {
    if (projectContract && walletAddress) {
      loadProject(projectContract);
    }
  }, [projectContract, walletAddress]);

  // Check roles after loading project
  useEffect(() => {
    if (project && walletAddress) {
  
      (async () => {
        try {
          const vvbStatus = await checkAuthorizedVVB(project.projectContract, walletAddress);
          console.log("VVB Status:", vvbStatus);
          setIsVVB(vvbStatus);

          const governanceOwner = await checkIsOwner();
          setIsOwner(governanceOwner);
        } catch {
          setIsVVB(false);
        }
      })();
    }
  }, [project, walletAddress]);

  // Comment submit handler
  const handleSubmitComment = async () => {
    if (!comment.trim()) return;
    setIsCommenting(true);
    try {
      await submitComment(project.projectContract, comment, account);
      toast({
        variant: "default",
        title: "Comment Submitted",
        description: "Your comment has been submitted.",
      });
      setComment("");
      setTimeout(() => loadProject(project.projectContract), 2000);
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

  return (
    <div className="min-h-screen py-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Link to={createPageUrl("Projects")}>
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Projects
            </Button>
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mb-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <TreePine className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {project.metadata?.name}
                </h1>
              </div>
            </div>
            <div className="mt-2 sm:mt-0 sm:ml-auto">
              {project.isApproved ? (
                <Badge className="px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-700 border-green-200">
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Approved
                </Badge>
              ) : (
                <Badge className="px-3 py-1 text-sm font-semibold rounded-full bg-yellow-100 text-yellow-700 border-yellow-200">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Pending Approval
                </Badge>
              )}
            </div>

            <div className="mt-2 sm:mt-0 sm:ml-auto">
             
                <Badge className="px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-700 border-green-200">
                  <DollarSign className="w-4 h-4 mr-1" />
                  Total RUSD Collected { Number(project.totalSupply) * Number(project.prokectMintPrice)}
                </Badge>
              
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid gap-4 sm:gap-6">
          {/* Project Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <span>Project Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-gray-900">
                    {project.credits ? Number(project.credits).toLocaleString() : '0'} tCO<sub>2</sub>
                  </div>
                  <div className="text-sm text-gray-600">Total Supply</div>
                </div>
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-green-700">
                    {project.totalSupply ? Number(project.totalSupply).toLocaleString() : '0'} tCO<sub>2</sub>
                  </div>
                  <div className="text-sm text-gray-600">Minted Supply</div>
                </div>
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-red-600">
                    {project.totalRetired ? Number(project.totalRetired).toLocaleString() : '0'} tCO<sub>2</sub>
                  </div>
                  <div className="text-sm text-gray-600">Total Retired</div>
                </div>
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-blue-600">
                    {project.prokectMintPrice ? `${project.prokectMintPrice} RUSD` : '0 RUSD'}
                  </div>
                  <div className="text-sm text-gray-600">Mint Price</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Project Details */}
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center">
                  <span className="font-medium text-gray-700 w-[140px] sm:w-[180px] flex items-center">
                    <IdCard className="w-4 h-4 text-gray-400 mr-2" />
                    Project ID:
                  </span>
                  <span className="font-semibold flex-grow text-right">{project.projectId}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium text-gray-700 w-[140px] sm:w-[180px] flex items-center">
                    <IdCard className="w-4 h-4 text-gray-400 mr-2" />
                    Certificate ID:
                  </span>
                  <span className="font-semibold flex-grow text-right">
                    {project.isApproved ? (project.certificateId === '' ? "..." : project.certificateId) : "To be issued after approval from governance"}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium text-gray-700 w-[140px] sm:w-[180px] flex items-center">
                    <User className="w-4 h-4 text-gray-400 mr-2" />
                    Owner address:
                  </span>
                  <span className="font-semibold flex-grow text-right">
                    <a
                      href={`https://testnet.bscscan.com/address/${project.proposer}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                      title={project.proposer}
                    >
                      {/* Show sliced address on small screens */}
                      <span className="block sm:hidden truncate">
                        {project.proposer
                          ? `${project.proposer.slice(0, 6)}...${project.proposer.slice(-4)}`
                          : "N/A"}
                      </span>

                      {/* Show full address on larger screens */}
                      <span className="hidden sm:inline">
                        {project.proposer || "N/A"}
                      </span>
                    </a>
                  </span>
                </div>

                <div className="flex items-start">
                  <span className="font-medium text-gray-700 w-[140px] sm:w-[180px] flex items-center">
                    <DockIcon className="w-4 h-4 text-gray-400 mr-2" />
                    Methodology:
                  </span>
                  <span className="font-semibold flex-grow text-right whitespace-pre-wrap">
                    {methodology[Number(project.methodology)] || "Unknown"}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium text-gray-700 w-[140px] sm:w-[180px] flex items-center">
                    <CoinsIcon className="w-4 h-4 text-gray-400 mr-2" />
                    Emission Reduction Goal:
                  </span>
                  <span className="font-semibold flex-grow text-right">{Number(project.emissionReductions)} tCO<sub>2</sub></span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium text-gray-700 w-[140px] sm:w-[200px] flex items-center">
                    <CoinsIcon className="w-4 h-4 text-gray-400 mr-2" />
                    Approved Credits tCO<sub>2</sub>
                  </span>
                  <span className="font-semibold flex-grow text-right">
                    {project.isValidated ? Number(project.credits) : "To be issued after approval from governance"}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium text-gray-700 w-[140px] sm:w-[180px] flex items-center">
                    <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                    Listing date:
                  </span>
                  <span className="font-semibold flex-grow text-right">
                    {new Date(Number(project.listingTimestamp) * 1000).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium text-gray-700 w-[140px] sm:w-[180px] flex items-center">
                    <LockOpen className="w-4 h-4 text-gray-400 mr-2" />
                    Permanent:
                  </span>
                  <span className="font-semibold flex-grow text-right">
                    <Badge variant={project.defaultIsPermanent ? "default" : "outline"}>
                      {project.defaultIsPermanent ? "Yes" : "No"}
                    </Badge>
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium text-gray-700 w-[140px] sm:w-[180px] flex items-center">
                    <GitBranch className="w-4 h-4 text-gray-400 mr-2" />
                    Project CA:
                  </span>
                  <span className="font-semibold flex-grow text-right">
                    <a
                      href={`https://testnet.bscscan.com/address/${project.projectContract}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                      title={project.projectContract}
                    >
                      {/* Sliced on small screens */}
                      <span className="block sm:hidden truncate">
                        {project.projectContract
                          ? `${project.projectContract.slice(0, 6)}...${project.projectContract.slice(-4)}`
                          : "N/A"}
                      </span>

                      {/* Full on medium+ screens */}
                      <span className="hidden sm:inline">
                        {project.projectContract || "N/A"}
                      </span>
                    </a>
                  </span>
                </div>

                {project.defaultVintage && (
                  <div className="flex items-center">
                    <span className="font-medium text-gray-700 w-[140px] sm:w-[180px] flex items-center">
                      <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                      Vintage Date:
                    </span>
                    <span className="font-semibold flex-grow text-right">
                      {new Date(Number(project.defaultVintage) * 1000).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {project.projectDetails && (
                  <div className="flex items-start">
                    <span className="font-medium text-gray-700 w-[140px] sm:w-[180px] flex items-center">
                      <AlertCircle className="w-4 h-4 text-gray-400 mr-2" />
                      Document Link:
                    </span>
                    <span className="font-semibold flex-grow text-right whitespace-pre-line">{project.projectDetails}</span>
                  </div>
                )}
                <div className="flex items-start">
                  <span className="font-medium text-gray-700 w-[140px] sm:w-[180px] flex items-start">
                    <Locate className="w-4 h-4 text-gray-400 mr-2" />
                    Locations:
                  </span>
                  <div className="font-semibold flex-grow text-right">
                    {formatLocations(project.location).map((loc, index) => (
                      <p key={index} className="truncate sm:truncate cursor-help" title={loc}>
                        {loc.length > 30 ? `${loc.substring(0, 30)}...` : loc}
                      </p>
                    ))}
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="font-medium text-gray-700 w-[140px] sm:w-[180px] flex items-center">
                    <CheckCircle2 className="w-4 h-4 text-gray-400 mr-2" />
                    Validity:
                  </span>
                  <span className="font-semibold flex-grow text-right">
                    {Number(project.defaultValidity) === 0 ? '100+ years' : `${Number(project.defaultValidity)} years`}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Role-based Actions */}
        <div className="mb-6 mt-3">
          {isOwner ? (
            <>
              <Button
                className="w-full bg-blue-700 hover:bg-blue-800 mb-4 mt-3"
                onClick={() => {
                  setShowApproveModal(true);
                  setCreditAmount('');
                }}
                disabled={!(project.isValidated && project.isVerified) || project.isApproved}
              >
                {project.isApproved ? 'Approved ' : 'Approve and Issue Credits' }
              </Button>
              {/* Show reason if disabled */}
              {!(project.isValidated && project.isVerified) && (
                <div className="text-sm text-gray-500 mb-2">
                  { !project.isValidated
                    ? "Approval is disabled: Project must be validated first."
                    : !project.isVerified
                      ? "Approval is disabled: Project must be verified after validation."
                      : null
                  }
                </div>
              )}
            </>
          ) : isVVB ? (
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="flex-1">
                <Button
                  className="bg-yellow-700 hover:bg-yellow-800 w-full"
                  onClick={async () => {
                    try {
                      const tx = await validateProject(project.projectContract, account);
                     
                      if (tx.status === "success") {
                        const data = await fetch(`${apihost}/vvb/validate-project/${project.projectContract}`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                        });
                        if (data.ok) {
                          const result = await data.json();
                          console.log("Validation result:", result);
                        }
                        
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
                        description: `Failed to validate project: ${error.message}`,
                      });
                    }
                  }}
                  disabled={project.isValidated}
                >
                  Validate
                </Button>
                {/* Show reason if disabled */}
                {project.isValidated && (
                  <div className="text-sm text-gray-500 mt-1">
                    Validation is already completed.
                  </div>
                )}
              </div>
              <div className="flex-1">
                <Button
                  className="bg-green-700 hover:bg-green-800 w-full"
                  onClick={async () => {
                    try {
                      const tx = await verifyProject(project.projectContract, account);
                      if (tx.status === "success") {
                        const data = await fetch(`${apihost}/vvb/verify-project/${(project.projectContract)}`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                        });
                        if (data.ok) {
                          const result = await data.json();
                          console.log("Verification result:", result);
                        }
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
                        description: `Failed to verify project: ${error.message}`,
                      });
                    }
                  }}
                  disabled={!project.isValidated || project.isVerified}
                >
                  Verify
                </Button>
                {/* Show reason if disabled */}
                {!project.isValidated && (
                  <div className="text-sm text-gray-500 mt-1">
                    Verification is disabled: Validation is pending.
                  </div>
                )}
                {project.isValidated && project.isVerified && (
                  <div className="text-sm text-gray-500 mt-1">
                    Verification is already completed.
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Show Mint and Retire section for users who are not owner or VVB
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* Mint Credits */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Coins className="w-5 h-5 text-green-600" />
                    <span>Mint Credits</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(!project.tokenUri || project.tokenUri === "" || typeof project.tokenUri === "undefined") ? (
                    <div className="text-center text-sm text-gray-500">
                      Minting is currently disabled. Awaiting to set token URI.
                    </div>
                  ) : (
                    <>
                      {mintNftImage && (
                        <div className="w-full bg-black flex items-center justify-center" style={{ height: "180px sm:220px" }}>
                          <img
                            src={mintNftImage || fallbackImage}
                            alt="Mint NFT"
                            className="object-contain h-full w-full"
                          />
                        </div>
                      )}
                      <div>
                        <Label htmlFor="mintAmount">Amount to Mint</Label>
                        <Input
                          id="mintAmount"
                          type="number"
                          step="1"
                          min="1"
                          placeholder="Enter amount"
                          value={mintAmount}
                          onChange={(e) => setMintAmount(e.target.value)}
                          disabled={!project.isApproved}
                        />
                      </div>
                      <Label htmlFor="mintAmount">Minted tCO<sub>2</sub>: {Number(mintedCredits)}</Label>
                      <br />
                      <Label htmlFor="mintAmount">Current Bal tCO<sub>2</sub>: {Number(mintBalance)}</Label>
                      <br />
                      <Label htmlFor="mintAmount">RUSD: {rusdBalance}</Label>
                      <Button
                        onClick={handleMintETH}
                        disabled={isMinting || !project.isApproved}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        {isMinting ? "Minting..." : "Mint with RUSD"}
                      </Button>
                      {!project.isApproved && (
                        <p className="text-sm text-gray-500">
                          Minting is currently disabled for this project. Project is awaiting approval.
                        </p>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Retire Credits */}
              <Card className={`${allowedRetire <= 0 ? "opacity-50 pointer-events-none" : ""}`}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Recycle className="w-5 h-5 text-orange-600" />
                    <span>Retire Credits</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(!project.tokenUri || project.tokenUri === "" || typeof project.tokenUri === "undefined") ? (
                    <div className="text-center text-sm text-gray-500">
                      Retiring is currently disabled. Project is awaiting approval.
                    </div>
                  ) : (
                    <>
                      {retireNftImage && (
                        <div className="w-full bg-black flex items-center justify-center" style={{ height: "180px sm:220px" }}>
                          <img
                            src={retireNftImage || fallbackImage}
                            alt="Retire NFT"
                            className="object-contain h-full w-full"
                          />
                        </div>
                      )}
                      <div>
                        <Label htmlFor="retireAmount">Amount to Retire</Label>
                        <div className="flex space-x-2">
                          <Input
                            id="retireAmount"
                            type="number"
                            step="1"
                            min="1"
                            placeholder="Enter amount"
                            value={retireAmount}
                            onChange={(e) => setRetireAmount(e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            className="px-3"
                            onClick={handleMaxRetire}
                          >
                            Max
                          </Button>
                        </div>
                      </div>
                      <Label htmlFor="mintAmount">Retired tCO<sub>2</sub>: {Number(retiredBalance)}</Label>
                      <br />
                      <Label htmlFor="mintAmount">Allowed retired tCO<sub>2</sub>: {allowedRetire}</Label>
                      <Button
                        onClick={handleRetire}
                        disabled={isRetiring || allowedRetire <= 0}
                        className="w-full bg-orange-600 hover:bg-orange-700"
                      >
                        {isRetiring ? "Retiring..." : "Retire Credits"}
                      </Button>
                      <p className="text-sm text-gray-500">
                        Retiring credits permanently removes them from circulation.
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Approval Modal */}
        {showApproveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-lg">
              <h2 className="text-xl font-bold mb-4">Enter Credit Amount to Approve</h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Credit Amount (Max: {Number(project.emissionReductions)} tCO₂)
                </label>
                <input
                  type="number"
                  min="1"
                  max={Number(project.emissionReductions)}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter credit amount"
                  value={creditAmount}
                  onChange={e => setCreditAmount(e.target.value)}
                  disabled={isApproving}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Available emission reductions: {Number(project.emissionReductions)} tCO₂
                </p>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 transition-colors"
                  onClick={() => {
                    setShowApproveModal(false);
                    setCreditAmount('');
                  }}
                  disabled={isApproving}
                >
                  Cancel
                </button>
                <button
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleApprove}
                  disabled={!creditAmount || isApproving || Number(creditAmount) <= 0 || Number(creditAmount) > Number(project.emissionReductions)}
                >
                  {isApproving ? "Approving..." : "Approve & Issue Credits"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Comment Section */}
        {/* <Card className="mt-8">
          <CardHeader>
            <CardTitle>Comments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment..."
                rows={3}
                disabled={isCommenting}
              />
              <Button
                className="mt-2"
                onClick={handleSubmitComment}
                disabled={isCommenting || !comment.trim()}
              >
                {isCommenting ? "Submitting..." : "Submit Comment"}
              </Button>
            </div>
       
            {project.comments && project.comments.length > 0 ? (
              <div className="space-y-3">
                {project.comments.map((c, i) => (
                  <div key={i} className="bg-gray-50 p-3 rounded">
                    <div className="flex justify-between text-sm text-gray-500 mb-1">
                      <span className="font-medium">
                        {c.commenter && `${c.commenter.slice(0, 6)}...${c.commenter.slice(-4)}`}
                      </span>
                      <span>
                        {c.timestamp
                          ? new Date(Number(c.timestamp) * 1000).toLocaleString()
                          : ""}
                      </span>
                    </div>
                    <p className="text-gray-800">{c.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No comments yet.</p>
            )}
          </CardContent>
        </Card> */}
      </div>
    </div>
  );
}
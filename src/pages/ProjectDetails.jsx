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
  CheckCircle2
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useContractInteraction } from "../components/contract/ContractInteraction";
import { methodology } from "@/components/contract/address";
import { set } from "date-fns";

export default function ProjectDetails() {

  const { projectContract } = useParams();
  const { userAddress, mintWithRUSD, retireCredits, 
    getListedProjectDetails,
     getWalletMinted, getRUSDBalance, 
     getWalletRetrides,
     checkRUSDAllowance, approveRUSD } = useContractInteraction();
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mintAmount, setMintAmount] = useState("");
  const [retireAmount, setRetireAmount] = useState("");
  const [isMinting, setIsMinting] = useState(false);
  const [isRetiring, setIsRetiring] = useState(false);
  const [error, setError] = useState();
  const [success, setSuccess] = useState("");
  const [rusdBalance, setRUSDBalance] = useState(0);
  const [retiredCredits, setRetiredCredits] = useState(0);
  const [mintedCredits, setMintedCredits] = useState(0);

  useEffect(() => {
    if (projectContract) {
      loadProject(projectContract);
    }
  }, [projectContract, userAddress,]);

  const loadProject = async (projectAddress) => {
    setIsLoading(true);
    try {
      const data = await getListedProjectDetails(projectAddress);
      setProject(data);
      const balance = await getRUSDBalance();
      setRUSDBalance(balance);

      // if user has minted tco2 token then only then he can retire token tco2
      // that is why we are checking the minted tco2 token
      const retired = await getWalletRetrides(projectAddress);
      setRetiredCredits(retired);
      const minted = await getWalletMinted(projectAddress);
      setMintedCredits(minted);
    } catch (error) {
      console.error("Error loading project:", error);
      // setError("Failed to load project details.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMintETH = async () => {
    if (!mintAmount || parseFloat(mintAmount) <= 0) {
      setError("Please enter a valid amount to mint");
      return;
    }
    setIsMinting(true);

    // First check if we have sufficient allowance
    const allowance = await checkRUSDAllowance(project.projectContract);
    if (BigInt(allowance) <= BigInt(0)) {
      console.log("Insufficient allowance, approving RUSD first...");
      const approveTx = await approveRUSD(project.projectContract);
      const approveReceipt = await approveTx.wait();
      if (approveReceipt.status !== 1) {
        alert("RUSD approval failed");
        return;
      }
      console.log("RUSD approved successfully");
    }

    // RUSD balance validation
    if (Number(rusdBalance) < Number(mintAmount)) {
      alert(`Insufficient RUSD balance. You have ${rusdBalance} RUSD, but trying to mint ${mintAmount} RUSD.`);
      setIsMinting(false);
      return;
    }
    
    try {
      const tx = await mintWithRUSD(project.projectContract, parseInt(mintAmount));
      const receipt = await tx.wait();
      setSuccess(`Minting initiated! Transaction: ${receipt.hash}`);
      setMintAmount("");
      setTimeout(() => loadProject(project.projectContract), 3000);
    } catch (error) {
      setError(`Failed to mint with ETH: ${error.message}`);
    } finally {
      setIsMinting(false);
    }
  };

  const handleRetire = async () => {
    if (!retireAmount || parseFloat(retireAmount) <= 0) {
      setError("Please enter a valid amount to retire");
      return;
    }

    if(parseInt(retireAmount) > (Number(mintedCredits) - Number(retiredCredits))){
      alert(`You cannot retire more than ${(Number(mintedCredits) - Number(retiredCredits))}`);
      return;
    }

    setIsRetiring(true);

    try {
      const tx = await retireCredits(project.projectContract, parseInt(retireAmount));
      const receipt = await tx.wait();
      setSuccess(`Credits retired! Transaction: ${receipt.hash}`);
      setTimeout(() => loadProject(project.projectContract), 3000);
    } catch (error) {
      setError(`Failed to retire credits: ${error.message}`);
    } finally {
      setIsRetiring(false);
    }
  };

  const handleMaxRetire = () => {
    setRetireAmount(Number(mintedCredits) - Number(retiredCredits));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid gap-6">
              <div className="h-64 bg-gray-200 rounded-xl"></div>
              <div className="grid md:grid-cols-2 gap-6">
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
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
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
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link to={createPageUrl("Projects")}>
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Projects
            </Button>
          </Link>

          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <TreePine className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {project.metadata?.name}
              </h1>
              <p className="text-gray-600">{project.certificateId}</p>
            </div>
            <div className="ml-auto">
              {project.isApproved ? (
                <Badge className="bg-green-100 text-green-700 border-green-200">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Approved
                </Badge>
              ) : (
                <Badge variant="outline" className="text-gray-600">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Pending
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50 mb-6">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        <div className="grid gap-6">
          {/* Project Overview */}
          {/* Project Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <span>Project Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {project.credits ? Number(project.credits).toLocaleString() : '0'} tCO<sub>2</sub>
                  </div>
                  <div className="text-sm text-gray-600">Total Supply</div>
                </div>

                 <div className="text-center">
                  <div className="text-2xl font-bold text-green-700">
                    {project.totalSupply ? Number(project.totalSupply).toLocaleString() : '0'} tCO<sub>2</sub>
                  </div>
                  <div className="text-sm text-gray-600">Minted Supply</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {project.totalRetired ? Number(project.totalRetired).toLocaleString() : '0'} tCO<sub>2</sub>
                  </div>
                  <div className="text-sm text-gray-600">Total Retired</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {project.prokectMintPrice ? `${project.prokectMintPrice} RUSD` : '0 RUSD'}
                  </div>
                  <div className="text-sm text-gray-600">Mint Price</div>
                </div>
                {/* <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {project.totalSupply && project.totalRetired
                      ? (
                        ((Number(project.totalSupply) - Number(project.totalRetired)) / Number(project.totalSupply) * 100)
                      ).toFixed(1)
                      : '0'
                    }%
                  </div>
                  <div className="text-sm text-gray-600">Available</div>
                </div> */}
              </div>
            </CardContent>
          </Card>

          {/* Project Details */}
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                {/* Methodology */}
                 <div className="flex items-center col-span-2">
                  <IdCard className="w-4 h-4 text-gray-400 mr-2" />
                  <dt className="text-sm text-gray-600 min-w-[90px]">Project ID:</dt>
                  <dd className="ml-2 font-medium">{project.projectId}</dd>
                </div>
                 <div className="flex items-center col-span-2">
                  <IdCard className="w-4 h-4 text-gray-400 mr-2" />
                  <dt className="text-sm text-gray-600 min-w-[90px]">Certificate ID:</dt>
                  <dd className="ml-2 font-medium">{project.certificateId}</dd>
                </div>
                 <div className="flex items-center col-span-2">
                  <User className="w-4 h-4 text-gray-400 mr-2" />
                  <dt className="text-sm text-gray-600 min-w-[90px]">Owner address</dt>
                  <dd className="ml-2 font-medium">{project.proposer}</dd>
                </div>
                <div className="flex items-center col-span-2">
                  <DockIcon className="w-4 h-4 text-gray-400 mr-2" />
                  <dt className="text-sm text-gray-600 min-w-[90px]">Methodology:</dt>
                  <dd className="ml-2 font-medium">{methodology[Number(project.methodology)]}</dd>
                </div>

                <div className="flex items-center col-span-2">
                  <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                  <dt className="text-sm text-gray-600 min-w-[90px]">Listing date</dt>
                  <dd className="ml-2 font-medium">
                      {new Date( Number(project.listingTimestamp) * 1000).toLocaleDateString()}
                  </dd>
                </div>
                 <div className="flex items-center col-span-2">
                  <CoinsIcon className="w-4 h-4 text-gray-400 mr-2" />
                  <dt className="text-sm text-gray-600 min-w-[90px]">Credits tCO<sub>2</sub></dt>
                  <dd className="ml-2 font-medium">{Number(project.credits)}</dd>
                </div>
                {/* Permanent */}
                <div className="flex items-center col-span-2">
                  <LockOpen className="w-4 h-4 text-gray-400 mr-2" />
                  <dt className="text-sm text-gray-600 min-w-[90px]">Permanent:</dt>
                  <dd className="ml-2">
                    <Badge variant={project.defaultIsPermanent ? "default" : "outline"}>
                      {project.defaultIsPermanent ? "Yes" : "No"}
                    </Badge>
                  </dd>
                </div>
                {/* Address */}
                <div className="flex items-center col-span-2">
                  <GitBranch className="w-4 h-4 text-gray-400 mr-2" />
                  <dt className="text-sm text-gray-600 min-w-[90px]">Address:</dt>
                  <dd className="ml-2 font-medium break-all">{project.projectContract}</dd>
                </div>
                {/* Vintage */}
                  {project.defaultVintage && (
                    <div className="flex items-center col-span-2">
                      <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                      <dt className="text-sm text-gray-600 min-w-[90px]">Vintage:</dt>
                      <dd className="ml-2 font-medium">
                        {new Date( Number(project.defaultVintage) * 1000).toLocaleDateString()}
                      </dd>
                    </div>
                  )}
                {/* Details */}
                {project.projectDetails && (
                  <div className="flex items-center col-span-2">
                    <AlertCircle className="w-4 h-4 text-gray-400 mr-2" />
                    <dt className="text-sm text-gray-600 min-w-[90px]">Details:</dt>
                    <dd className="ml-2 font-medium whitespace-pre-line">{project.projectDetails}</dd>
                  </div>
                )}
                {/* Location */}
                {(
                  <div className="flex items-center col-span-2">
                    <Locate className="w-4 h-4 text-gray-400 mr-2" />
                    <dt className="text-sm text-gray-600 min-w-[90px]">Location:</dt>
                    <dd className="ml-2 font-medium">{project.location}</dd>
                  </div>
                )}
                {/* Validity */}
                {(
                  <div className="flex items-center col-span-2">
                    <CheckCircle2 className="w-4 h-4 text-gray-400 mr-2" />
                    <dt className="text-sm text-gray-600 min-w-[90px]">Validity:</dt>
                    <dd className="ml-2 font-medium">{Number(project.defaultValidity) === 0 ? '100+ years' : Number(project.defaultValidity) }</dd>
                  </div>
                )}
                {/* Repository */}
                {/* {project.metadata?.repoLink && (
        <div className="flex items-center col-span-2">
          <ExternalLink className="w-4 h-4 text-gray-400 mr-2" />
          <dt className="text-sm text-gray-600 min-w-[90px]">Repository:</dt>
          <dd className="ml-2">
            <a
              href={project.metadata.repoLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              View Documentation
            </a>
          </dd>
        </div>
      )} */}
              </dl>
            </CardContent>
          </Card>

          {/* Actions */}
       <div className="grid md:grid-cols-2 gap-6">
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
          Minting is currently disabled. Project Token URI is not set.
        </div>
      ) : (
        <>
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
           <br/>
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
              Minting is currently disabled for this project
            </p>
          )}
        </>
      )}
    </CardContent>
  </Card>

  {/* Retire Credits */}
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center space-x-2">
        <Recycle className="w-5 h-5 text-orange-600" />
        <span>Retire Credits</span>
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      {(!project.tokenUri || project.tokenUri === "" || typeof project.tokenUri === "undefined") ? (
        <div className="text-center text-sm text-gray-500">
          Retiring is currently disabled. Project Token URI is not set.
        </div>
      ) : (
        <>
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
      onClick={() => handleMaxRetire()}
    >
      Max
    </Button>
  </div>
</div>
          <Label htmlFor="mintAmount">Redired tCO<sub>2</sub>: {Number(retiredCredits)}</Label>
          <br/>
          <Label htmlFor="mintAmount">Allowed retired tCO<sub>2</sub>: {(Number(mintedCredits) - Number(retiredCredits))}</Label>
          <Button
            onClick={handleRetire}
            disabled={isRetiring}
            className="w-full bg-orange-600 hover:bg-orange-700"
          >
            {isRetiring ? "Retiring..." : "Retire Credits"}
          </Button>
          <p className="text-sm text-gray-500">
            Retiring credits permanently removes them from circulation
          </p>
        </>
      )}
    </CardContent>
  </Card>
</div>
        </div>
      </div>
    </div>
  );
}
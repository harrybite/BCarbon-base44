import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Project } from "@/api/entities";
import { Transaction } from "@/api/entities"; // Added
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
  ExternalLink,
  Calendar,
  Shield,
  GitBranch,
  Coins,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { checkTransactionStatus } from "@/api/functions"; // Added

export default function ProjectDetails() {
  const location = useLocation();
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mintAmount, setMintAmount] = useState("");
  const [retireAmount, setRetireAmount] = useState("");
  const [isMinting, setIsMinting] = useState(false);
  const [isRetiring, setIsRetiring] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    if (id) {
      loadProject(id);
    }
  }, [location]);

  const loadProject = async (id) => {
    setIsLoading(true);
    try {
      const projects = await Project.filter({ id: id });
      if (projects.length > 0) {
        setProject(projects[0]);
      }
    } catch (error) {
      console.error("Error loading project:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createAndMonitorTransaction = async (type, amount) => {
    try {
        const fakeTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;
        // Assuming project.id is the project identifier
        // and project.treasury exists for minting to it.
        await Transaction.create({
            transactionHash: fakeTxHash,
            type: type,
            projectId: project.id, // Using project.id as per existing structure
            amount: parseFloat(amount),
            fromAddress: "0x...", // Wallet address placeholder
            toAddress: type === "retire" ? "0x0000000000000000000000000000000000000000" : project.treasury, // Assuming treasury exists
            status: "pending",
        });
        setSuccess(`Transaction submitted. Hash: ${fakeTxHash.substring(0,10)}...`);
        // Start monitoring
        checkTransactionStatus({ transactionHash: fakeTxHash });
    } catch (e) {
        console.error("Error creating and monitoring transaction:", e);
        setError("Failed to record transaction.");
        throw e; // Re-throw to propagate the error
    }
  };

  const handleMintETH = async () => {
    if (!mintAmount || parseFloat(mintAmount) <= 0) {
      setError("Please enter a valid amount to mint");
      return;
    }

    setIsMinting(true);
    setError("");
    setSuccess(""); // Clear previous success messages

    try {
      await createAndMonitorTransaction("mint", mintAmount);
      setMintAmount("");
      // Refresh project data after a short delay to reflect changes
      setTimeout(() => loadProject(project.id), 3000);
    } catch (error) {
      setError("Failed to mint with ETH. Please try again.");
    } finally {
      setIsMinting(false);
    }
  };

  const handleMintRUSD = async () => {
    if (!mintAmount || parseFloat(mintAmount) <= 0) {
      setError("Please enter a valid amount to mint");
      return;
    }

    setIsMinting(true);
    setError("");
    setSuccess(""); // Clear previous success messages

    try {
      await createAndMonitorTransaction("mint", mintAmount);
      setMintAmount("");
      setTimeout(() => loadProject(project.id), 3000);
    } catch (error) {
      setError("Failed to mint with RUSD. Please try again.");
    } finally {
      setIsMinting(false);
    }
  };

  const handleRetire = async () => {
    if (!retireAmount || parseFloat(retireAmount) <= 0) {
      setError("Please enter a valid amount to retire");
      return;
    }

    setIsRetiring(true);
    setError("");
    setSuccess(""); // Clear previous success messages

    try {
      await createAndMonitorTransaction("retire", retireAmount);
      setRetireAmount("");
      setTimeout(() => loadProject(project.id), 3000);
    } catch (error) {
      setError("Failed to retire credits. Please try again.");
    } finally {
      setIsRetiring(false);
    }
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
          <p className="text-gray-600 mb-6">The project you're looking for doesn't exist.</p>
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
                Project #{project.id}
              </h1>
              <p className="text-gray-600">{project.certificateId}</p>
            </div>
            <div className="ml-auto">
              {project.mintingActive ? (
                <Badge className="bg-green-100 text-green-700 border-green-200">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Active
                </Badge>
              ) : (
                <Badge variant="outline" className="text-gray-600">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Inactive
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
                    {project.totalSupply?.toLocaleString() || '0'}
                  </div>
                  <div className="text-sm text-gray-600">Total Supply</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {project.totalRetired?.toLocaleString() || '0'}
                  </div>
                  <div className="text-sm text-gray-600">Total Retired</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {project.mintPrice} ETH
                  </div>
                  <div className="text-sm text-gray-600">Mint Price</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {((project.totalSupply - project.totalRetired) / project.totalSupply * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Available</div>
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
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {project.methodology && (
                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Methodology:</span>
                      <span className="font-medium">{project.methodology}</span>
                    </div>
                  )}
                  
                  {project.batchNumber && (
                    <div className="flex items-center space-x-2">
                      <GitBranch className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Batch:</span>
                      <span className="font-medium">{project.batchNumber}</span>
                    </div>
                  )}
                  
                  {project.vintage && (
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Vintage:</span>
                      <span className="font-medium">{project.vintage}</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  {project.validity && (
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Validity:</span>
                      <span className="font-medium">{project.validity}</span>
                    </div>
                  )}
                  
                  {project.isPermanent !== undefined && (
                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Permanent:</span>
                      <Badge variant={project.isPermanent ? "default" : "outline"}>
                        {project.isPermanent ? "Yes" : "No"}
                      </Badge>
                    </div>
                  )}
                  
                  {project.repoLink && (
                    <div className="flex items-center space-x-2">
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Repository:</span>
                      <a 
                        href={project.repoLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        View Documentation
                      </a>
                    </div>
                  )}
                </div>
              </div>
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
                <div>
                  <Label htmlFor="mintAmount">Amount to Mint</Label>
                  <Input
                    id="mintAmount"
                    type="number"
                    step="0.01"
                    placeholder="Enter amount"
                    value={mintAmount}
                    onChange={(e) => setMintAmount(e.target.value)}
                    disabled={!project.mintingActive}
                  />
                </div>
                
                <div className="flex space-x-3">
                  <Button
                    onClick={handleMintETH}
                    disabled={isMinting || !project.mintingActive}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {isMinting ? "Minting..." : "Mint with ETH"}
                  </Button>
                  
                  <Button
                    onClick={handleMintRUSD}
                    disabled={isMinting || !project.mintingActive}
                    variant="outline"
                    className="flex-1"
                  >
                    {isMinting ? "Minting..." : "Mint with RUSD"}
                  </Button>
                </div>
                
                {!project.mintingActive && (
                  <p className="text-sm text-gray-500">
                    Minting is currently disabled for this project
                  </p>
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
                <div>
                  <Label htmlFor="retireAmount">Amount to Retire</Label>
                  <Input
                    id="retireAmount"
                    type="number"
                    step="0.01"
                    placeholder="Enter amount"
                    value={retireAmount}
                    onChange={(e) => setRetireAmount(e.target.value)}
                  />
                </div>
                
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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
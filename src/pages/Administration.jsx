import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Settings, Shield, AlertTriangle, RefreshCw, CheckSquare } from "lucide-react";

import GovernanceTab from "../components/admin/GovernanceTab";
import ProjectApproval from "../components/admin/ProjectApproval";
import { getContractOwner } from "@/api/functions";
import { syncAndFetchProjects } from "@/api/functions";
import { Project } from "@/api/entities";
import { useContractInteraction } from "../components/contract/ContractInteraction";

export default function Administration() {
  const [isOwner, setIsOwner] = useState(false);
  const [isVVB, setIsVVB] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [contractOwner, setContractOwner] = useState("");
  const [isCheckingOwnership, setIsCheckingOwnership] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const [projects, setProjects] = useState([]);
  
  const { 
    userAddress, 
    checkAuthorizedVVB, 
    approveAndIssueCredits, 
    rejectAndRemoveProject,
    validateProject,
    verifyProject
  } = useContractInteraction();

  const loadProjects = async () => {
    try {
        const projectData = await Project.list();
        setProjects(projectData);
    } catch (e) {
        console.error("Failed to load projects", e);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      setIsCheckingOwnership(true);
      try {
          const { data } = await getContractOwner();
          if (data && data.owner) {
            setContractOwner(data.owner);
            if (userAddress) {
                setWalletAddress(userAddress);
                const isOwner = userAddress.toLowerCase() === data.owner.toLowerCase();
                setIsOwner(isOwner);

                // Check if user is VVB
                const vvbStatus = await checkAuthorizedVVB(userAddress);
                setIsVVB(vvbStatus);

                if (isOwner || vvbStatus) {
                   await loadProjects();
                }
            }
          }
      } catch (error) {
          console.error("Failed to fetch contract owner:", error);
      } finally {
          setIsCheckingOwnership(false);
      }
    };
    
    if (userAddress) {
      initialize();
    }
  }, [userAddress]);

  const handleSyncProjects = async () => {
    setIsSyncing(true);
    setSyncMessage("");
    try {
        const { data } = await syncAndFetchProjects();
        setSyncMessage(`Sync successful! Found ${data.total} projects. Created: ${data.created}, Updated: ${data.synced}.`);
        await loadProjects();
    } catch(e) {
        setSyncMessage("Error: Failed to sync projects.");
        console.error(e);
    } finally {
        setIsSyncing(false);
    }
  };

  const handleApproveProject = async (projectId, creditAmount, certificateId) => {
    try {
      await approveAndIssueCredits(projectId, creditAmount, certificateId);
      await loadProjects();
    } catch (error) {
      console.error("Failed to approve project:", error);
    }
  };

  const handleRejectProject = async (projectId) => {
    try {
      await rejectAndRemoveProject(projectId);
      await loadProjects();
    } catch (error) {
      console.error("Failed to reject project:", error);
    }
  };

  const handleValidateProject = async (projectId) => {
    try {
      await validateProject(projectId);
      await loadProjects();
    } catch (error) {
      console.error("Failed to validate project:", error);
    }
  };

  const handleVerifyProject = async (projectId) => {
    try {
      await verifyProject(projectId);
      await loadProjects();
    } catch (error) {
      console.error("Failed to verify project:", error);
    }
  };

  const handleGovernanceAction = async (action, params) => {
    try {
      // Simulate governance action
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log(`Executing ${action} with params:`, params);
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to execute ${action}`);
    }
  };

  if (isCheckingOwnership) {
    return (
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Checking permissions...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isOwner && !isVVB) {
    return (
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-xl">Access Denied</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <Alert variant="destructive" className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  You don't have permission to access this page. Only the contract owner and authorized VVBs can access administration functions.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Your Address:</span>
                  <Badge variant="outline">{walletAddress ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}` : 'Not Connected'}</Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Contract Owner:</span>
                  <Badge className="bg-blue-100 text-blue-800">{contractOwner ? `${contractOwner.substring(0, 6)}...${contractOwner.substring(contractOwner.length - 4)}` : 'Loading...'}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Administration</h1>
              <p className="text-gray-600">Manage contracts and validate projects</p>
            </div>
            <div className="ml-auto flex space-x-2">
              {isOwner && (
                <Badge className="bg-green-100 text-green-700 border-green-200">
                  <Shield className="w-3 h-3 mr-1" />
                  Contract Owner
                </Badge>
              )}
              {isVVB && (
                <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                  <Shield className="w-3 h-3 mr-1" />
                  Authorized VVB
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        {isOwner && (
          <Card className="mb-6">
              <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                      <RefreshCw className="w-5 h-5 text-purple-600"/>
                      <span>Sync with Blockchain</span>
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                      Fetch the latest project list from the smart contract and update the local database.
                  </p>
              </CardHeader>
              <CardContent>
                  <div className="flex items-center space-x-4">
                      <Button onClick={handleSyncProjects} disabled={isSyncing}>
                          <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                          {isSyncing ? 'Syncing...' : 'Sync Projects'}
                      </Button>
                      {syncMessage && <p className="text-sm text-gray-600">{syncMessage}</p>}
                  </div>
              </CardContent>
          </Card>
        )}

        {/* Admin Tabs */}
        <Tabs defaultValue="approval" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="approval" className="flex items-center space-x-2">
              <CheckSquare className="w-4 h-4" />
              <span>Project {isVVB ? 'Validation' : 'Approval'}</span>
            </TabsTrigger>
            {isOwner && (
              <TabsTrigger value="governance" className="flex items-center space-x-2">
                <Settings className="w-4 h-4" />
                <span>Contract Governance</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="approval">
             <ProjectApproval 
               projects={projects} 
               onApprove={handleApproveProject} 
               onReject={handleRejectProject}
               onValidate={handleValidateProject}
               onVerify={handleVerifyProject}
               isVVB={isVVB}
               isOwner={isOwner}
             />
          </TabsContent>
          {isOwner && (
            <TabsContent value="governance">
              <GovernanceTab onExecuteGovernance={handleGovernanceAction} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
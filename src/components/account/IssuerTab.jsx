import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { List, Check, Clock, X, Eye, Plus, Wallet } from 'lucide-react';
import CreateProjectTab from '../admin/CreateProjectTab';
import { useContractInteraction } from '../contract/ContractInteraction';

const MyProjects = ({ userAddress, onRefresh }) => {
    const [projects, setProjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { getProjectStats, getProjectDetails } = useContractInteraction();

    useEffect(() => {
        if (userAddress) {
            loadMyProjects();
        }
    }, [userAddress]);

    const loadMyProjects = async () => {
        setIsLoading(true);
        try {
            // This would need to be implemented with a backend function that tracks user projects
            // For now using mock data - you'll need to store project creation events
            const mockProjects = [
                { 
                    address: '0x123...', 
                    certificateId: 'VCS-001', 
                    status: 2, // Approved
                    totalSupply: 1500,
                    totalRetired: 100,
                    mintPrice: '0.01'
                },
                { 
                    address: '0x456...', 
                    certificateId: 'VCS-002', 
                    status: 1, // Listed
                    totalSupply: 0,
                    totalRetired: 0,
                    mintPrice: '0.015'
                },
            ];
            setProjects(mockProjects);
        } catch (error) {
            console.error('Error loading projects:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            0: { icon: Clock, className: "bg-gray-100 text-gray-800", label: "Created" },
            1: { icon: Clock, className: "bg-yellow-100 text-yellow-800", label: "Listed" },
            2: { icon: Check, className: "bg-green-100 text-green-800", label: "Approved" },
            3: { icon: X, className: "bg-red-100 text-red-800", label: "Rejected" }
        };
        const { icon: Icon, className, label } = statusMap[status] || statusMap[0];
        return (
            <Badge className={className}>
                <Icon className="w-3 h-3 mr-1" />
                {label}
            </Badge>
        );
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>My Projects</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                        <p className="text-gray-600 mt-2">Loading your projects...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>My Projects</CardTitle>
                <p className="text-sm text-gray-600">Projects you have created and listed.</p>
            </CardHeader>
            <CardContent>
                {projects.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-600">No projects created yet.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {projects.map((project) => (
                            <div key={project.address} className="border p-4 rounded-lg flex items-center justify-between">
                                <div>
                                    <p className="font-semibold">{project.certificateId}</p>
                                    <p className="text-sm text-gray-500">{project.address}</p>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Mint Price: {project.mintPrice} ETH
                                    </p>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="text-right">
                                        <p className="text-sm text-gray-500">Supply / Retired</p>
                                        <p className="font-semibold">{project.totalSupply.toLocaleString()} / {project.totalRetired.toLocaleString()}</p>
                                    </div>
                                    {getStatusBadge(project.status)}
                                    <Button size="sm" variant="ghost">
                                        <Eye className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default function IssuerTab() {
    const [refreshKey, setRefreshKey] = useState(0);
    const { userAddress, createAndListProject, connectWallet } = useContractInteraction();

    const handleCreateProject = async (projectData) => {
        if (!userAddress) {
            throw new Error("Please connect your wallet first");
        }

        try {
            const receipt = await createAndListProject(projectData);
            
            // Refresh the projects list
            setRefreshKey(prev => prev + 1);
            
            return { success: true, receipt };
        } catch (error) {
            console.error("Error creating project:", error);
            throw error;
        }
    };

    const handleRefresh = () => {
        setRefreshKey(prev => prev + 1);
    };

    if (!userAddress) {
        return (
            <div className="space-y-6">
                <Alert>
                    <Wallet className="h-4 w-4" />
                    <AlertDescription>
                        Please connect your wallet to create and manage projects.
                    </AlertDescription>
                </Alert>
                <Button onClick={connectWallet} className="w-full">
                    <Wallet className="w-4 h-4 mr-2" />
                    Connect Wallet
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <CreateProjectTab onCreateProject={handleCreateProject} />
            <MyProjects userAddress={userAddress} onRefresh={handleRefresh} key={refreshKey} />
        </div>
    );
}
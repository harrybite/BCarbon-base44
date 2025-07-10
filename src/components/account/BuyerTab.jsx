import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Leaf, Recycle, ExternalLink, ShieldCheck, Wallet } from 'lucide-react';
import { useContractInteraction } from '../contract/ContractInteraction';

export default function BuyerTab() {
    const [holdings, setHoldings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { 
        userAddress, 
        getUserBalance, 
        getTokenURI, 
        retireCredits, 
        transferCredits,
        connectWallet 
    } = useContractInteraction();

    useEffect(() => {
        if (userAddress) {
            loadUserHoldings();
        } else {
            setIsLoading(false);
        }
    }, [userAddress]);

    const loadUserHoldings = async () => {
        setIsLoading(true);
        try {
            // This would need to be implemented with a backend function that tracks user holdings
            // You'd need to store mint/transfer events to know which projects a user has tokens for
            const mockHoldings = [
                {
                    projectAddress: '0x123...',
                    certificateId: 'VCS-001',
                    nonRetired: 500,
                    retired: 50,
                    metadata: {
                        name: 'Amazon Rainforest Conservation',
                        image: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=2070&auto=format&fit=crop',
                    }
                },
                {
                    projectAddress: '0xxyz...',
                    certificateId: 'VCS-008',
                    nonRetired: 1200,
                    retired: 200,
                    metadata: {
                        name: 'African Savanna Preservation',
                        image: 'https://images.unsplash.com/photo-1547471080-7cc2d5d88e93?q=80&w=1974&auto=format&fit=crop',
                    }
                }
            ];
            setHoldings(mockHoldings);
        } catch (error) {
            console.error('Error loading holdings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRetire = async (projectAddress, amount) => {
        try {
            await retireCredits(projectAddress, amount);
            await loadUserHoldings(); // Refresh holdings
        } catch (error) {
            console.error('Error retiring credits:', error);
        }
    };

    const handleTransfer = async (projectAddress, to, amount) => {
        try {
            await transferCredits(projectAddress, to, amount);
            await loadUserHoldings(); // Refresh holdings
        } catch (error) {
            console.error('Error transferring credits:', error);
        }
    };

    if (!userAddress) {
        return (
            <div className="space-y-6">
                <Alert>
                    <Wallet className="h-4 w-4" />
                    <AlertDescription>
                        Please connect your wallet to view your carbon credit holdings.
                    </AlertDescription>
                </Alert>
                <Button onClick={connectWallet} className="w-full">
                    <Wallet className="w-4 h-4 mr-2" />
                    Connect Wallet
                </Button>
            </div>
        );
    }

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>My Carbon Credit Holdings</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                        <p className="text-gray-600 mt-2">Loading your holdings...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>My Carbon Credit Holdings</CardTitle>
                <p className="text-sm text-gray-600">
                    Your minted, traded, and retired carbon credits across all projects.
                </p>
            </CardHeader>
            <CardContent>
                {holdings.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-600">No carbon credits owned yet.</p>
                        <p className="text-sm text-gray-500 mt-1">
                            Visit the Projects page to mint your first carbon credits.
                        </p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {holdings.map((holding) => (
                            <Card key={holding.projectAddress} className="overflow-hidden">
                                <img 
                                    src={holding.metadata.image} 
                                    alt={holding.metadata.name} 
                                    className="w-full h-40 object-cover"
                                />
                                <CardHeader>
                                    <CardTitle className="text-lg">{holding.metadata.name}</CardTitle>
                                    <p className="text-xs text-gray-500">{holding.certificateId}</p>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <Badge className="bg-green-100 text-green-800">
                                            <Leaf className="w-3 h-3 mr-1" />
                                            Available: {holding.nonRetired}
                                        </Badge>
                                        <Badge className="bg-blue-100 text-blue-800">
                                            <Recycle className="w-3 h-3 mr-1" />
                                            Retired: {holding.retired}
                                        </Badge>
                                    </div>
                                    
                                    <div className="flex space-x-2">
                                        <Button 
                                            size="sm" 
                                            variant="outline" 
                                            className="flex-1"
                                            onClick={() => handleRetire(holding.projectAddress, 10)}
                                            disabled={holding.nonRetired === 0}
                                        >
                                            <Recycle className="w-3 h-3 mr-1" />
                                            Retire
                                        </Button>
                                        <Button 
                                            size="sm" 
                                            variant="outline" 
                                            className="flex-1"
                                            disabled={holding.nonRetired === 0}
                                        >
                                            Transfer
                                        </Button>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button variant="ghost" size="sm" className="w-full">
                                        <ExternalLink className="w-4 h-4 mr-2"/>
                                        View Project Details
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
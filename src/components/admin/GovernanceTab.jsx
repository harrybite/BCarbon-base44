/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import { useContractInteraction } from '../contract/ContractInteraction';
import { useToast } from '../ui/use-toast';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';


const GovernanceTab = () => {
  const { pauseContract, unpauseContract, addVVB, removeVVB, isContractsInitised, checkIsOwner } = useContractInteraction();
  const [isOwner, setIsOwner] = useState(false);
  const [addVVBAddress, setAddVVBAddress] = useState("");
  const [removeVVBAddress, setRemoveVVBAddress] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const checkOwner = async () => {
      const ownerStatus = await checkIsOwner();
      setIsOwner(ownerStatus);
    };
    checkOwner();
  }, [isContractsInitised]);

  const handlePause = async () => {
    try {
      const tx = await pauseContract();
      const receipt = await tx.wait();
      if (receipt.status === 1) {
        toast({
          title: "Contract Paused",
          description: "Transaction successful!",
          variant: "success",
        });
      } else {
        toast({
          title: "Transaction Failed",
          description: "The transaction was not successful.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Pause failed: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleUnpause = async () => {
    try {
      const tx = await unpauseContract();
      const receipt = await tx.wait();
      if (receipt.status === 1) {
        toast({
          title: "Contract Unpaused",
          description: "Transaction successful!",
          variant: "success",
        });
      } else {
        toast({
          title: "Transaction Failed",
          description: "The transaction was not successful.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Unpause failed: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleAddVVB = async () => {
    if (!addVVBAddress) {
      toast({
        title: "Error",
        description: "Please enter a VVB address.",
        variant: "destructive",
      });
      return;
    }
    try {
      const tx = await addVVB(addVVBAddress);
      const receipt = await tx.wait();
      if (receipt.status === 1) {
        toast({
          title: "VVB Added",
          description: "VVB added successfully.",
          variant: "success",
        });
        setAddVVBAddress("");
      } else {
        toast({
          title: "Transaction Failed",
          description: "The transaction was not successful.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Add VVB failed: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleRemoveVVB = async () => {
    if (!removeVVBAddress) {
      toast({
        title: "Error",
        description: "Please enter a VVB address to remove.",
        variant: "destructive",
      });
      return;
    }
    try {
      const tx = await removeVVB(removeVVBAddress);
      const receipt = await tx.wait();
      if (receipt.status === 1) {
        toast({
          title: "VVB Removed",
          description: "VVB removed successfully.",
          variant: "success",
        });
        setRemoveVVBAddress("");
      } else {
        toast({
          title: "Transaction Failed",
          description: "The transaction was not successful.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Remove VVB failed: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  if (!isOwner)
    return <p>You are not authorized to access governance controls.</p>;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Governance Controls</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pause Contract Card */}
        <Card>
          <CardHeader>
            <CardTitle>Pause Contract</CardTitle>
          </CardHeader>
          <CardContent>
            <button onClick={handlePause} className="bg-red-500 text-white px-4 py-2 rounded w-full">
              Pause Contract
            </button>
          </CardContent>
        </Card>

        {/* Unpause Contract Card */}
        <Card>
          <CardHeader>
            <CardTitle>Unpause Contract</CardTitle>
          </CardHeader>
          <CardContent>
            <button onClick={handleUnpause} className="bg-green-500 text-white px-4 py-2 rounded w-full">
              Unpause Contract
            </button>
          </CardContent>
        </Card>

        {/* Add VVB Card */}
        <Card>
          <CardHeader>
            <CardTitle>Add VVB</CardTitle>
          </CardHeader>
          <CardContent>
            <input
              type="text"
              value={addVVBAddress}
              onChange={(e) => setAddVVBAddress(e.target.value)}
              placeholder="Enter VVB address"
              className="w-full border rounded px-2 py-1 mb-2"
            />
            <button onClick={handleAddVVB} className="bg-blue-500 text-white px-4 py-2 rounded w-full">
              Add VVB
            </button>
          </CardContent>
        </Card>

        {/* Remove VVB Card */}
        <Card>
          <CardHeader>
            <CardTitle>Remove VVB</CardTitle>
          </CardHeader>
          <CardContent>
            <input
              type="text"
              value={removeVVBAddress}
              onChange={(e) => setRemoveVVBAddress(e.target.value)}
              placeholder="Enter VVB address to remove"
              className="w-full border rounded px-2 py-1 mb-2"
            />
            <button onClick={handleRemoveVVB} className="bg-blue-500 text-white px-4 py-2 rounded w-full">
              Remove VVB
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GovernanceTab;
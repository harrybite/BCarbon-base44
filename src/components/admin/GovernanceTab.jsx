/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import { useContractInteraction } from '../contract/ContractInteraction';
import { useToast } from '../ui/use-toast';
// import { t } from 'framer-motion/dist/types.d-D0HXPxHm';

const GovernanceTab = () => {
  const { userAddress, pauseContract, unpauseContract, addVVB, removeVVB, updateRegistryAddress, checkIsOwner } = useContractInteraction();
  const [isOwner, setIsOwner] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkOwner = async () => {
      setIsOwner(await checkIsOwner());
    };
    checkOwner();
  }, [checkIsOwner]);

  const handlePause = async () => {
    try {
      const tx = await pauseContract();
      const receipt = await tx.wait();
      if (receipt.status === 1) {
        toast({
          title: "Contract Paused",
          description: `Transaction successful!`,
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
      alert(`Pause failed: ${error.message}`);
    }
  };

  const handleUnpause = async () => {
    try {
      const tx = await unpauseContract();
      const receipt = await tx.wait();
      if (receipt.status === 1) {
        toast({
          title: "Contract Unpaused",
          description: `Transaction successful!`,
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
      alert(`Unpause failed: ${error.message}`);
    }
  };

  const handleAddVVB = async () => {
    const vvbAddress = prompt('Enter VVB address:');
    if (vvbAddress) {
      try {
        const tx = await addVVB(vvbAddress);
        const receipt = await tx.wait();
        if (receipt.status === 1) {
          toast({
            title: "VVB Added",
            description: `VVB added successfully`,
            variant: "success",
          });
        } else {
          // alert(`Transaction failed!`);
          toast({
            title: "Transaction Failed",
            description: "The transaction was not successful.",
            variant: "destructive",
          });
        }
      } catch (error) {
        alert(`Add VVB failed: ${error.message}`);
      }
    }
  };

  const handleRemoveVVB = async () => {
    const vvbAddress = prompt('Enter VVB address to remove:');
    if (vvbAddress) {
      try {
        const tx = await removeVVB(vvbAddress);
        const receipt = await tx.wait();
        if (receipt.status === 1) {
          // alert(`VVB removed! Transaction: ${tx.hash}`);
          toast({
            title: "VVB Removed",
            description: `VVB removed successfully`,
            variant: "success",
          });
        } else {
          // alert(`Transaction failed!`);
          toast({
            title: "Transaction Failed",
            description: "The transaction was not successful.",
            variant: "destructive",
          });
        }
      } catch (error) {
        alert(`Remove VVB failed: ${error.message}`);
      }
    }
  };

  const handleUpdateRegistry = async () => {
    const newRegistryAddress = prompt('Enter new registry address:');
    if (newRegistryAddress) {
      try {
        const tx = await updateRegistryAddress(newRegistryAddress);
        const receipt = await tx.wait();
        if (receipt.status === 1) {
          alert(`Registry address updated! Transaction: ${tx.hash}`);
        } else {
          alert(`Transaction failed!`);
        }
      } catch (error) {
        alert(`Update registry failed: ${error.message}`);
      }
    }
  };

  if (!isOwner) return <p>You are not authorized to access governance controls.</p>;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Governance Controls</h2>
      <div className="space-y-4 gap-2">
        <button onClick={handlePause} className="bg-red-500 text-white px-4 py-2 rounded mr-2">
          Pause Contract
        </button>
        <button onClick={handleUnpause} className="bg-green-500 text-white px-4 py-2 rounded mr-2">
          Unpause Contract
        </button>
        <button onClick={handleAddVVB} className="bg-blue-500 text-white px-4 py-2 rounded mr-2">
          Add VVB
        </button>
        <button onClick={handleRemoveVVB} className="bg-blue-500 text-white px-4 py-2 rounded mr-2">
          Remove VVB
        </button>
        {/* <button onClick={handleUpdateRegistry} className="bg-blue-500 text-white px-4 py-2 rounded mr-2">
          Update Registry Address
        </button> */}
      </div>
    </div>
  );
};

export default GovernanceTab;